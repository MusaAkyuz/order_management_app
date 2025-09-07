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
  orderItems: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().positive(),
        price: z.number().positive(),
      })
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
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        });

        // Stok güncelle
        for (const item of validatedData.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
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
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
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
