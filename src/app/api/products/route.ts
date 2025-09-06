import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Ürün Listesi
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          gt: 0, // Stokta olan ürünler
        },
      },
      include: {
        type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Ürünler getirilirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Ürünler getirilemedi" },
      { status: 500 }
    );
  }
}
