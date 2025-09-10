import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
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

    // Sadece borcu olan müşterileri filtrele (isteğe bağlı)
    const customersWithDebt = customerDebts.filter(
      (customer) => customer.remainingDebt > 0
    );

    // Toplam istatistikler
    const totalStats = {
      totalCustomers: customerDebts.length,
      customersWithDebt: customersWithDebt.length,
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

    return NextResponse.json({
      success: true,
      data: {
        customers: customerDebts,
        customersWithDebt,
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
