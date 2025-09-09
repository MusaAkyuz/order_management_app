import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  paymentDate: z.string(), // ISO string - schema'da paymentDate olarak tanımlı
  amount: z.number().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const customerId = searchParams.get("customerId");

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (customerId) where.customerId = customerId;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: { order: true, customer: true },
    });

    return NextResponse.json({ success: true, data: payments });
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
    const payment = await prisma.payment.create({
      data: {
        orderId: parseInt(orderId),
        customerId: parseInt(customerId),
        paymentDate: new Date(paymentDate),
        amount,
      },
    });
    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error("Payment POST error:", error);
    return NextResponse.json(
      { success: false, error: "Ödeme kaydedilemedi" },
      { status: 500 }
    );
  }
}
