import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - ProductType Listesi
export async function GET() {
  try {
    const productTypes = await prisma.productType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: productTypes,
    });
  } catch (error) {
    console.error("Ürün tipleri getirilirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Ürün tipleri getirilemedi" },
      { status: 500 }
    );
  }
}
