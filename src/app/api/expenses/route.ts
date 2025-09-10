import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const expenseSchema = z.object({
  expenseTypeId: z.number(),
  amount: z.number().positive("Tutar 0'dan büyük olmalıdır"),
  expenseDate: z.string().min(1, "Tarih seçilmelidir"),
  description: z.string().optional(),
  receiptNumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const expenseTypeId = searchParams.get("expenseTypeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Filtreleme koşulları
    const where: any = {
      isActive: true,
    };

    if (expenseTypeId) {
      where.expenseTypeId = parseInt(expenseTypeId);
    }

    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.expenseDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.expenseDate = {
        lte: new Date(endDate),
      };
    }

    // Giderleri getir
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          expenseType: true,
        },
        orderBy: {
          expenseDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    // Toplam istatistikler
    const totalAmount = await prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    // Tip bazında toplam
    const expensesByType = await prisma.expense.groupBy({
      by: ["expenseTypeId"],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Gider tiplerini getir
    const expenseTypesData = await prisma.expenseType.findMany({
      where: { isActive: true },
    });

    // Tip bazında toplamları zenginleştir
    const enrichedExpensesByType = expensesByType.map((item) => {
      const expenseType = expenseTypesData.find(
        (type) => type.id === item.expenseTypeId
      );
      return {
        ...item,
        expenseType,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          limit,
        },
        stats: {
          totalAmount: totalAmount._sum.amount || 0,
          totalCount: total,
          expensesByType: enrichedExpensesByType,
        },
      },
    });
  } catch (error) {
    console.error("Giderler getirme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Giderler getirilemedi",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        expenseTypeId: validatedData.expenseTypeId,
        amount: validatedData.amount,
        expenseDate: new Date(validatedData.expenseDate),
        description: validatedData.description || null,
        receiptNumber: validatedData.receiptNumber || null,
      },
      include: {
        expenseType: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: expense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gider oluşturma hatası:", error);

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
        error: "Gider oluşturulamadı",
      },
      { status: 500 }
    );
  }
}
