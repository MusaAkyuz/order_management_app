import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Sipariş oluşturma için validation schema
const createOrderSchema = z.object({
  customerId: z.number(),
  statusId: z.number().default(1), // Varsayılan: "Beklemede"
  address: z.string().optional(),
  description: z.string().optional(),
  laborCost: z.number().default(0),
  deliveryFee: z.number().default(0),
  taxRate: z.number().default(18),
  discountType: z.enum(["percentage", "amount"]).default("percentage"),
  discountValue: z.number().default(0),
  orderItems: z
    .array(
      z
        .object({
          productId: z.number().optional(),
          quantity: z.number().positive(),
          price: z.number().positive(),
          isManual: z.boolean().optional(),
          manualName: z.string().optional(),
        })
        .refine(
          (data) => {
            // Manuel ürün ise manualName dolu olmalı
            if (data.isManual) {
              return data.manualName && data.manualName.trim().length > 0;
            }
            // Manuel değilse productId dolu olmalı
            return data.productId && data.productId > 0;
          },
          {
            message: "Ürün seçimi veya manuel ürün adı zorunludur",
          }
        )
    )
    .min(1),
});

// POST - Sipariş Oluşturma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Toplam fiyatı hesapla
    const itemsTotal = validatedData.orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalPrice =
      itemsTotal + validatedData.laborCost + validatedData.deliveryFee;

    // Transaction ile sipariş oluştur
    const order = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Siparişi oluştur
        const newOrder = await tx.order.create({
          data: {
            customerId: validatedData.customerId,
            statusId: validatedData.statusId,
            address: validatedData.address || null,
            description: validatedData.description || null,
            totalPrice,
            laborCost: validatedData.laborCost,
            deliveryFee: validatedData.deliveryFee,
            taxRate: validatedData.taxRate,
            discountType: validatedData.discountType,
            discountValue: validatedData.discountValue,
          },
          include: {
            customer: true,
            status: true,
          },
        });

        // Sipariş kalemlerini oluştur
        await tx.orderItem.createMany({
          data: validatedData.orderItems.map((item) => ({
            orderId: newOrder.id,
            productId: item.isManual ? null : item.productId || null,
            quantity: item.quantity,
            price: item.price,
            isManual: item.isManual || false,
            manualName: item.isManual ? item.manualName || null : null,
          })) as any,
        });

        // Stok güncelle (sadece manuel olmayan ürünler için)
        for (const item of validatedData.orderItems) {
          if (!item.isManual && item.productId) {
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

        // Transaction log ekle
        await tx.transaction.create({
          data: {
            action: "ORDER_CREATED",
            description: `Yeni sipariş oluşturuldu (ID: ${newOrder.id})`,
            details: JSON.stringify({
              orderId: newOrder.id,
              totalPrice,
              itemCount: validatedData.orderItems.length,
            }),
            customerId: validatedData.customerId,
            orderId: newOrder.id,
          },
        });

        return newOrder;
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sipariş oluşturma hatası:", error);

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
        error: "Sipariş oluşturulamadı",
      },
      { status: 500 }
    );
  }
}

// GET - Siparişleri Listeleme
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const customerId = searchParams.get("customerId");
    const statusId = searchParams.get("statusId");

    const skip = (page - 1) * limit;

    // Filtreleme koşulları
    const where: any = {
      isActive: true,
    };

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (statusId) {
      where.statusId = parseInt(statusId);
    }

    // Siparişleri getir
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
          payments: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Kalan ödeme miktarını hesapla
    const ordersWithRemainingPayment = orders.map((order) => {
      const totalPaid = order.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      const remainingPayment = order.totalPrice - totalPaid;

      return {
        ...order,
        totalPaid,
        remainingPayment: Math.max(0, remainingPayment), // Negatif değerleri 0 yap
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        orders: ordersWithRemainingPayment,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Siparişleri getirme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Siparişler getirilemedi",
      },
      { status: 500 }
    );
  }
}
