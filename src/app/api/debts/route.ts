import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const onlyWithDebt = searchParams.get("onlyWithDebt") === "true";

    // Müşteri bazlı borç hesaplaması
    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
      },
      include: {
        orders: {
          where: {
            isActive: true,
          },
          include: {
            payments: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Her müşteri için borç hesapla
    const customerDebts = customers.map((customer) => {
      const totalOrderAmount = customer.orders.reduce(
        (sum, order) => sum + order.totalPrice,
        0
      );

      const totalPaidAmount = customer.orders.reduce((sum, order) => {
        const orderPaid = order.payments.reduce(
          (paymentSum, payment) => paymentSum + payment.amount,
          0
        );
        return sum + orderPaid;
      }, 0);

      const remainingDebt = totalOrderAmount - totalPaidAmount;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isCompany: customer.isCompany,
        totalOrderAmount,
        totalPaidAmount,
        remainingDebt: Math.max(0, remainingDebt), // Negatif borçları 0 yap
        orderCount: customer.orders.length,
      };
    });

    // Toplam istatistikler (filtre uygulanmadan, tüm aktif müşteriler üzerinden)
    const customersWithDebtCount = customerDebts.filter(
      (customer) => customer.remainingDebt > 0
    ).length;

    const totalStats = {
      totalCustomers: customerDebts.length,
      customersWithDebt: customersWithDebtCount,
      totalDebt: customerDebts.reduce(
        (sum, customer) => sum + customer.remainingDebt,
        0
      ),
      totalOrderAmount: customerDebts.reduce(
        (sum, customer) => sum + customer.totalOrderAmount,
        0
      ),
      totalPaidAmount: customerDebts.reduce(
        (sum, customer) => sum + customer.totalPaidAmount,
        0
      ),
    };

    // Filtreleme (borç durumu + arama) ve sayfalama
    let filtered = customerDebts;

    if (onlyWithDebt) {
      filtered = filtered.filter((customer) => customer.remainingDebt > 0);
    }

    if (search && search.trim()) {
      const searchLower = search.trim().toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          (customer.email &&
            customer.email.toLowerCase().includes(searchLower)) ||
          (customer.phone && customer.phone.toLowerCase().includes(searchLower))
      );
    }

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const pagedCustomers = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        customers: pagedCustomers,
        pagination: {
          current: page,
          total: Math.max(1, Math.ceil(total / limit)),
          count: total,
          limit,
        },
        stats: totalStats,
      },
    });
  } catch (error) {
    console.error("Borç listesi getirme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Borç listesi getirilemedi",
      },
      { status: 500 }
    );
  }
}
