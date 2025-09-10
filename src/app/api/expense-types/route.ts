import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const expenseTypes = await prisma.expenseType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: expenseTypes,
    });
  } catch (error) {
    console.error("Gider tipleri getirme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gider tipleri getirilemedi",
      },
      { status: 500 }
    );
  }
}
