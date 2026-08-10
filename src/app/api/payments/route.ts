import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  paymentDate: z.string(), // ISO string - schema'da paymentDate olarak tanımlı
  amount: z.number().positive(),
});

// GET - Ödeme Listesi
// Not: "page" veya "limit" parametresi gönderilmezse tüm eşleşen liste (eski
// davranış, PaymentModal'ın sipariş bazlı sorguları için) döner. Bu
// parametrelerden biri gönderilirse sayfalanmış { payments, pagination }
// şeklinde yanıt döner.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const customerId = searchParams.get("customerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const hasPagination = searchParams.has("page") || searchParams.has("limit");

    const where: any = {};
    if (orderId) where.orderId = parseInt(orderId);
    if (customerId) where.customerId = parseInt(customerId);
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.paymentDate.lte = endOfDay;
      }
    }

    if (!hasPagination) {
      const payments = await prisma.payment.findMany({
        where,
        orderBy: { paymentDate: "desc" },
        include: { order: true, customer: true },
      });

      return NextResponse.json({ success: true, data: payments });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paymentDate: "desc" },
        include: { order: true, customer: true },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Payment GET error:", error);
    return NextResponse.json(
      { success: false, error: "Ödemeler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = paymentSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: parse.error.issues },
        { status: 400 }
      );
    }
    const { orderId, customerId, paymentDate, amount } = parse.data;

    // Transaction ile ödeme ve durum güncellemesi
    const result = await prisma.$transaction(async (tx) => {
      // Ödemeyi oluştur
      const payment = await tx.payment.create({
        data: {
          orderId: parseInt(orderId),
          customerId: parseInt(customerId),
          paymentDate: new Date(paymentDate),
          amount,
        },
      });

      // Siparişin toplam tutarını ve mevcut ödemeleri al
      const order = await tx.order.findUnique({
        where: { id: parseInt(orderId) },
        include: {
          payments: {
            where: { isActive: true },
          },
        },
      });

      if (!order) {
        throw new Error("Sipariş bulunamadı");
      }

      // Toplam ödenen tutarı hesapla (yeni ödeme dahil)
      const totalPaid =
        order.payments.reduce((sum, p) => sum + p.amount, 0) + amount;

      // Eğer toplam tutar ödenmiş ise durumu "Ücreti Ödendi" (ID: 4) yap
      if (totalPaid >= order.totalPrice) {
        await tx.order.update({
          where: { id: parseInt(orderId) },
          data: { statusId: 4 }, // "Ücreti Ödendi" status ID
        });

        // Transaction log ekle
        await tx.transaction.create({
          data: {
            action: "ORDER_PAYMENT_COMPLETED",
            description: `Sipariş ödemesi tamamlandı (ID: ${orderId})`,
            details: JSON.stringify({
              orderId: parseInt(orderId),
              totalPrice: order.totalPrice,
              totalPaid: totalPaid,
              paymentAmount: amount,
            }),
            customerId: parseInt(customerId),
            orderId: parseInt(orderId),
          },
        });
      } else {
        // Kısmi ödeme log'u
        await tx.transaction.create({
          data: {
            action: "ORDER_PARTIAL_PAYMENT",
            description: `Kısmi ödeme yapıldı (ID: ${orderId})`,
            details: JSON.stringify({
              orderId: parseInt(orderId),
              totalPrice: order.totalPrice,
              totalPaid: totalPaid,
              paymentAmount: amount,
              remainingAmount: order.totalPrice - totalPaid,
            }),
            customerId: parseInt(customerId),
            orderId: parseInt(orderId),
          },
        });
      }

      return payment;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Payment POST error:", error);
    return NextResponse.json(
      { success: false, error: "Ödeme kaydedilemedi" },
      { status: 500 }
    );
  }
}
