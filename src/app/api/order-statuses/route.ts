import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET - Tüm Order Status'ları getir
export async function GET() {
  try {
    const orderStatuses = await prisma.orderStatus.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: orderStatuses,
    });
  } catch (error) {
    console.error("Order Status fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Order Status verileri getirilirken hata oluştu",
      },
      { status: 500 }
    );
  }
}
