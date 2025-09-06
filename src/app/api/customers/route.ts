import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Müşteri Listesi
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isCompany: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Müşteriler getirilirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Müşteriler getirilemedi" },
      { status: 500 }
    );
  }
}
