import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET - Lookup verilerini getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    let whereClause: any = {
      isActive: true,
    };

    // Category filtresi
    if (category) {
      whereClause.category = category;
    }

    // Key filtresi
    if (key) {
      whereClause.key = key;
    }

    const lookupData = await prisma.lookupTable.findMany({
      where: whereClause,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Veri tipine göre değerleri dönüştür
    const processedData = lookupData.map((item) => ({
      ...item,
      processedValue: processValue(item.value, item.dataType),
    }));

    return NextResponse.json({
      success: true,
      data: processedData,
    });
  } catch (error) {
    console.error("Lookup data fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lookup verileri getirilirken hata oluştu",
      },
      { status: 500 }
    );
  }
}

// POST - Yeni lookup verisi ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, key, value, description, dataType = "STRING" } = body;

    // Validasyon
    if (!category || !key || value === undefined || value === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Category, key ve value alanları zorunludur",
        },
        { status: 400 }
      );
    }

    // Aynı category-key kombinasyonu var mı kontrol et
    const existing = await prisma.lookupTable.findUnique({
      where: {
        category_key: {
          category,
          key,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu category-key kombinasyonu zaten mevcut",
        },
        { status: 400 }
      );
    }

    const newLookupItem = await prisma.lookupTable.create({
      data: {
        category,
        key,
        value: String(value),
        description,
        dataType,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newLookupItem,
        processedValue: processValue(
          newLookupItem.value,
          newLookupItem.dataType
        ),
      },
    });
  } catch (error) {
    console.error("Lookup data creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lookup verisi eklenirken hata oluştu",
      },
      { status: 500 }
    );
  }
}

// Veri tipine göre değeri işle
function processValue(value: string, dataType: string) {
  switch (dataType) {
    case "NUMBER":
      return parseFloat(value);
    case "BOOLEAN":
      return value.toLowerCase() === "true";
    case "JSON":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}
