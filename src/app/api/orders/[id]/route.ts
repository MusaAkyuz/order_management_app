import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Sipariş güncelleme için validation schema
const updateOrderSchema = z.object({
  customerId: z.number().min(1, "Müşteri seçimi zorunludur"),
  address: z.string(),
  description: z.string(),
  laborCost: z.number().min(0, "İşçilik maliyeti negatif olamaz"),
  deliveryFee: z.number().min(0, "Teslimat ücreti negatif olamaz"),
  taxRate: z
    .number()
    .min(0, "KDV oranı negatif olamaz")
    .max(100, "KDV oranı 100'den fazla olamaz"),
  discountType: z.enum(["percentage", "amount"]),
  discountValue: z.number().min(0, "İndirim değeri negatif olamaz"),
  orderItems: z
    .array(
      z
        .object({
          productId: z.number().min(0),
          quantity: z.number().min(1, "Miktar en az 1 olmalıdır"),
          price: z.number().min(0.01, "Fiyat 0'dan büyük olmalıdır"),
          isManual: z.boolean().optional(),
          manualName: z.string().optional(),
        })
        .refine(
          (data) => {
            // Manuel ürün ise productId 0 olabilir, ama manualName dolu olmalı
            if (data.isManual) {
              return data.manualName && data.manualName.trim().length > 0;
            }
            // Manuel değilse productId dolu olmalı
            return data.productId > 0;
          },
          {
            message: "Ürün seçimi veya manuel ürün adı zorunludur",
            path: ["productId"],
          }
        )
    )
    .min(1, "En az bir ürün eklemelisiniz"),
});

// GET - Tekil Sipariş
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        isActive: true,
      },
      include: {
        customer: true,
        status: true,
        orderItems: {
          include: {
            product: {
              include: {
                type: true,
              },
            },
          },
          where: { isActive: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Sipariş bulunamadı",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Sipariş getirme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Sipariş getirilemedi",
      },
      { status: 500 }
    );
  }
}

// PUT - Sipariş Güncelleme
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const order = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Mevcut siparişi ve kalemlerini getir
        const existingOrder = await tx.order.findUnique({
          where: { id: orderId, isActive: true },
          include: {
            orderItems: {
              where: { isActive: true },
            },
          },
        });

        if (!existingOrder) {
          throw new Error("Sipariş bulunamadı");
        }

        // Mevcut sipariş kalemlerinin stoklarını geri ekle
        for (const existingItem of existingOrder.orderItems) {
          if (existingItem.productId) {
            await tx.product.update({
              where: { id: existingItem.productId },
              data: {
                stock: {
                  increment: existingItem.quantity,
                },
              },
            });
          }
        }

        // Mevcut sipariş kalemlerini pasif yap
        await tx.orderItem.updateMany({
          where: { orderId, isActive: true },
          data: { isActive: false },
        });

        // Yeni sipariş kalemlerini oluştur ve stokları düş
        for (const item of validatedData.orderItems) {
          // Sipariş kalemini oluştur
          await tx.orderItem.create({
            data: {
              orderId,
              productId: item.productId || null,
              quantity: item.quantity,
              price: item.price,
              isManual: item.isManual || false,
              manualName: item.manualName || null,
              isActive: true,
            },
          });

          // Eğer manuel ürün değilse stoktan düş
          if (!item.isManual && item.productId && item.productId > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // Toplam fiyatı hesapla
        const itemsTotal = validatedData.orderItems.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );

        // KDV hesapla
        const taxAmount = (itemsTotal * validatedData.taxRate) / 100;

        // Ara toplam (Ürünler + KDV + İşçilik + Teslimat)
        const subtotal =
          itemsTotal +
          taxAmount +
          validatedData.laborCost +
          validatedData.deliveryFee;

        // İndirim hesapla
        let discountAmount = 0;
        if (validatedData.discountValue > 0) {
          if (validatedData.discountType === "percentage") {
            discountAmount = (subtotal * validatedData.discountValue) / 100;
          } else {
            discountAmount = validatedData.discountValue;
          }
        }

        // Net toplam
        const totalPrice = Math.max(0, subtotal - discountAmount);

        // Siparişi güncelle
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            customerId: validatedData.customerId,
            address: validatedData.address,
            description: validatedData.description,
            laborCost: validatedData.laborCost,
            deliveryFee: validatedData.deliveryFee,
            taxRate: validatedData.taxRate,
            discountType: validatedData.discountType,
            discountValue: validatedData.discountValue,
            totalPrice,
          },
          include: {
            customer: true,
            status: true,
            orderItems: {
              include: {
                product: {
                  include: {
                    type: true,
                  },
                },
              },
              where: { isActive: true },
            },
          },
        });

        // Transaction log ekle
        await tx.transaction.create({
          data: {
            action: "ORDER_UPDATED",
            description: `Sipariş güncellendi (ID: ${orderId})`,
            details: JSON.stringify({
              orderId,
              totalPrice,
              itemsCount: validatedData.orderItems.length,
            }),
            customerId: validatedData.customerId,
            orderId,
          },
        });

        return updatedOrder;
      }
    );

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Sipariş güncelleme hatası:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validasyon hatası",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Sipariş güncellenemedi",
      },
      { status: 500 }
    );
  }
}

// DELETE - Sipariş Silme (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);

    const order = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Mevcut siparişi kontrol et
        const existingOrder = await tx.order.findUnique({
          where: { id: orderId, isActive: true },
          include: {
            orderItems: {
              where: { isActive: true },
            },
            customer: true,
          },
        });

        if (!existingOrder) {
          throw new Error("Sipariş bulunamadı");
        }

        // Siparişi soft delete yap
        const deletedOrder = await tx.order.update({
          where: { id: orderId },
          data: { isActive: false },
        });

        // Sipariş kalemlerini de soft delete yap
        await tx.orderItem.updateMany({
          where: { orderId },
          data: { isActive: false },
        });

        // Stokları geri ekle (sadece manuel olmayan ürünler için)
        for (const item of existingOrder.orderItems) {
          // Sadece manuel olmayan ve productId'si olan ürünler için stok güncellemesi yap
          if (item.productId && !item.isManual) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }

        // Transaction log ekle
        await tx.transaction.create({
          data: {
            action: "ORDER_CANCELLED",
            description: `Sipariş iptal edildi (ID: ${orderId})`,
            details: JSON.stringify({
              orderId,
              totalPrice: existingOrder.totalPrice,
            }),
            customerId: existingOrder.customerId,
            orderId,
          },
        });

        return deletedOrder;
      }
    );

    return NextResponse.json({
      success: true,
      message: "Sipariş başarıyla iptal edildi",
    });
  } catch (error) {
    console.error("Sipariş silme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Sipariş silinemedi",
      },
      { status: 500 }
    );
  }
}
