import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Sipariş güncelleme için validation schema
const updateOrderSchema = z.object({
  statusId: z.number().optional(),
  laborCost: z.number().optional(),
  deliveryFee: z.number().optional(),
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
        // Mevcut siparişi kontrol et
        const existingOrder = await tx.order.findUnique({
          where: { id: orderId, isActive: true },
        });

        if (!existingOrder) {
          throw new Error("Sipariş bulunamadı");
        }

        // Yeni toplam fiyatı hesapla
        let newTotalPrice = existingOrder.totalPrice;
        if (
          validatedData.laborCost !== undefined ||
          validatedData.deliveryFee !== undefined
        ) {
          const orderItems = await tx.orderItem.findMany({
            where: { orderId, isActive: true },
          });

          const itemsTotal = orderItems.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
          );
          const laborCost = validatedData.laborCost ?? existingOrder.laborCost;
          const deliveryFee =
            validatedData.deliveryFee ?? existingOrder.deliveryFee;
          newTotalPrice = itemsTotal + laborCost + deliveryFee;
        }

        // Siparişi güncelle
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            ...validatedData,
            totalPrice: newTotalPrice,
          },
          include: {
            customer: true,
            status: true,
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });

        // Durum değişikliği logunu ekle
        if (
          validatedData.statusId &&
          validatedData.statusId !== existingOrder.statusId
        ) {
          const status = await tx.orderStatus.findUnique({
            where: { id: validatedData.statusId },
          });

          await tx.transaction.create({
            data: {
              action: "ORDER_STATUS_CHANGED",
              description: `Sipariş durumu "${status?.name}" olarak değiştirildi`,
              details: JSON.stringify({
                orderId,
                oldStatusId: existingOrder.statusId,
                newStatusId: validatedData.statusId,
              }),
              customerId: existingOrder.customerId,
              orderId,
            },
          });
        }

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
        error: "Sipariş güncellenemedi",
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
            orderItems: true,
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

        // Stokları geri ekle
        for (const item of existingOrder.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
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
