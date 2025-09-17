import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );

    // Başlangıç ve bitiş tarihleri
    const startDate = new Date(year, 0, 1); // Yılın başı
    const endDate = new Date(year + 1, 0, 1); // Bir sonraki yılın başı

    // Prisma ORM ile tüm verileri alalım ve JavaScript'te işleyelim
    const allPayments = await prisma.payment.findMany({
      where: {
        isActive: true,
        paymentDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        paymentDate: true,
        amount: true,
      },
    });

    const allExpenses = await prisma.expense.findMany({
      where: {
        isActive: true,
        expenseDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        expenseDate: true,
        amount: true,
        expenseType: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    });

    // Aylık veri hesaplaması
    const monthlyData = [];
    const monthNames = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];

    // Her ay için hesaplama
    for (let month = 1; month <= 12; month++) {
      const monthPayments = allPayments.filter((payment) => {
        const paymentMonth = new Date(payment.paymentDate).getMonth() + 1;
        return paymentMonth === month;
      });

      const monthExpenses = allExpenses.filter((expense) => {
        const expenseMonth = new Date(expense.expenseDate).getMonth() + 1;
        return expenseMonth === month;
      });

      const totalRevenue = monthPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      const totalExpenses = monthExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const profit = totalRevenue - totalExpenses;

      monthlyData.push({
        month: monthNames[month - 1],
        monthNumber: month,
        totalRevenue,
        totalExpenses,
        profit,
        paymentCount: monthPayments.length,
        expenseCount: monthExpenses.length,
      });
    }

    // Günlük ödeme verileri - detaylı bilgilerle
    const detailedDailyPayments = await prisma.payment.findMany({
      where: {
        isActive: true,
        paymentDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        paymentDate: true,
        amount: true,
        description: true,
        order: {
          select: {
            id: true,
            totalPrice: true,
            description: true,
            customer: {
              select: {
                name: true,
                isCompany: true,
              },
            },
            status: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: "asc",
      },
    });

    // Günlük ödeme verileri - özet için
    const dailyPaymentsMap = new Map();
    allPayments.forEach((payment) => {
      const dateKey = payment.paymentDate.toISOString().split("T")[0];
      const month = new Date(payment.paymentDate).getMonth() + 1;

      if (!dailyPaymentsMap.has(dateKey)) {
        dailyPaymentsMap.set(dateKey, {
          paymentDate: dateKey,
          dailyTotal: 0,
          paymentCount: 0,
          month: month.toString(),
        });
      }

      const dayData = dailyPaymentsMap.get(dateKey);
      dayData.dailyTotal += payment.amount;
      dayData.paymentCount++;
    });

    const dailyPayments = Array.from(dailyPaymentsMap.values()).sort((a, b) =>
      a.paymentDate.localeCompare(b.paymentDate)
    );

    // Gider tipi bazında yıllık toplamlar
    const expenseTypeMap = new Map();
    allExpenses.forEach((expense) => {
      const typeName = expense.expenseType.name;
      const typeColor = expense.expenseType.color;

      if (!expenseTypeMap.has(typeName)) {
        expenseTypeMap.set(typeName, {
          expenseTypeName: typeName,
          expenseTypeColor: typeColor,
          totalAmount: 0,
          count: 0,
        });
      }

      const typeData = expenseTypeMap.get(typeName);
      typeData.totalAmount += expense.amount;
      typeData.count++;
    });

    const expenseTypeYearlyTotals = Array.from(expenseTypeMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    // Yıllık toplamlar
    const yearlyTotals = {
      totalRevenue: monthlyData.reduce(
        (sum, month) => sum + month.totalRevenue,
        0
      ),
      totalExpenses: monthlyData.reduce(
        (sum, month) => sum + month.totalExpenses,
        0
      ),
      totalProfit: monthlyData.reduce((sum, month) => sum + month.profit, 0),
      totalPayments: monthlyData.reduce(
        (sum, month) => sum + month.paymentCount,
        0
      ),
      totalExpenseEntries: monthlyData.reduce(
        (sum, month) => sum + month.expenseCount,
        0
      ),
      totalPaid: allPayments.reduce((sum, payment) => sum + payment.amount, 0),
    };

    // Gider tipi bazında aylık dağılım (boş olarak bırakıyoruz şimdilik)
    const expensesByType: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        year,
        monthlyData,
        yearlyTotals,
        expensesByType,
        dailyPayments,
        detailedDailyPayments,
        expenseTypeYearlyTotals,
      },
    });
  } catch (error) {
    console.error("Rapor verileri getirme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Rapor verileri getirilemedi",
      },
      { status: 500 }
    );
  }
}
