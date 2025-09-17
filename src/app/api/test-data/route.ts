import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Test müşteriler
    const customer1 = await prisma.customer.upsert({
      where: { email: "test1@example.com" },
      update: {},
      create: {
        name: "Test Müşteri 1",
        email: "test1@example.com",
        phone: "0532 123 45 67",
        address: "Test Adresi 1",
        isCompany: false,
      },
    });

    const customer2 = await prisma.customer.upsert({
      where: { email: "test2@example.com" },
      update: {},
      create: {
        name: "Test Şirket A.Ş.",
        email: "test2@example.com",
        phone: "0212 123 45 67",
        address: "Test Şirket Adresi",
        taxNumber: "1234567890",
        isCompany: true,
      },
    });

    // Test gider tipleri varsa al, yoksa oluştur
    let expenseTypes = await prisma.expenseType.findMany();
    if (expenseTypes.length === 0) {
      expenseTypes = await Promise.all([
        prisma.expenseType.create({
          data: {
            name: "Mazot/Benzin",
            description: "Yakıt giderleri",
            color: "#FF6B6B",
          },
        }),
        prisma.expenseType.create({
          data: {
            name: "İşçi maaşları",
            description: "Personel maaş giderleri",
            color: "#4ECDC4",
          },
        }),
        prisma.expenseType.create({
          data: {
            name: "Yeni malzeme tedariği",
            description: "Malzeme ve hammadde giderleri",
            color: "#45B7D1",
          },
        }),
      ]);
    }

    // Test sipariş durumları
    let orderStatuses = await prisma.orderStatus.findMany();
    if (orderStatuses.length === 0) {
      orderStatuses = await Promise.all([
        prisma.orderStatus.create({
          data: {
            name: "Beklemede",
            description: "Sipariş onay bekliyor",
            color: "#FFD700",
          },
        }),
        prisma.orderStatus.create({
          data: {
            name: "Teslim Edildi",
            description: "Sipariş başarıyla teslim edildi",
            color: "#28A745",
          },
        }),
      ]);
    }

    // Test ürün tipleri
    let productTypes = await prisma.productType.findMany();
    if (productTypes.length === 0) {
      productTypes = await Promise.all([
        prisma.productType.create({
          data: {
            name: "Adet ile Satılan",
            description: "Adet bazında satılan ürünler",
          },
        }),
      ]);
    }

    // Test ürünleri
    const product1 = await prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: "Test Ürün 1",
        currentPrice: 100,
        stock: 50,
        description: "Test ürünü 1",
        typeId: productTypes[0].id,
      },
    });

    const product2 = await prisma.product.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: "Test Ürün 2",
        currentPrice: 250,
        stock: 30,
        description: "Test ürünü 2",
        typeId: productTypes[0].id,
      },
    });

    // Test siparişleri (2025 yılına ait)
    const order1 = await prisma.order.create({
      data: {
        totalPrice: 500,
        laborCost: 50,
        deliveryFee: 25,
        customerId: customer1.id,
        statusId: orderStatuses[1].id,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      },
    });

    const order2 = await prisma.order.create({
      data: {
        totalPrice: 1200,
        laborCost: 100,
        deliveryFee: 30,
        customerId: customer2.id,
        statusId: orderStatuses[1].id,
        createdAt: new Date("2025-02-20"),
        updatedAt: new Date("2025-02-20"),
      },
    });

    const order3 = await prisma.order.create({
      data: {
        totalPrice: 750,
        laborCost: 75,
        deliveryFee: 25,
        customerId: customer1.id,
        statusId: orderStatuses[1].id,
        createdAt: new Date("2025-03-10"),
        updatedAt: new Date("2025-03-10"),
      },
    });

    const order4 = await prisma.order.create({
      data: {
        totalPrice: 950,
        laborCost: 90,
        deliveryFee: 35,
        customerId: customer2.id,
        statusId: orderStatuses[1].id,
        createdAt: new Date("2025-09-05"),
        updatedAt: new Date("2025-09-05"),
      },
    });

    // Test ödemeleri (2025 yılına ait)
    await Promise.all([
      prisma.payment.create({
        data: {
          amount: 500,
          paymentDate: new Date("2025-01-15"),
          description: "Test ödeme 1",
          orderId: order1.id,
          customerId: customer1.id,
        },
      }),
      prisma.payment.create({
        data: {
          amount: 600,
          paymentDate: new Date("2025-02-20"),
          description: "Test ödeme 2 - Kısmi",
          orderId: order2.id,
          customerId: customer2.id,
        },
      }),
      prisma.payment.create({
        data: {
          amount: 600,
          paymentDate: new Date("2025-02-25"),
          description: "Test ödeme 2 - Kalan",
          orderId: order2.id,
          customerId: customer2.id,
        },
      }),
      prisma.payment.create({
        data: {
          amount: 750,
          paymentDate: new Date("2025-03-10"),
          description: "Test ödeme 3",
          orderId: order3.id,
          customerId: customer1.id,
        },
      }),
      prisma.payment.create({
        data: {
          amount: 475,
          paymentDate: new Date("2025-09-05"),
          description: "Test ödeme 4 - Kısmi",
          orderId: order4.id,
          customerId: customer2.id,
        },
      }),
      prisma.payment.create({
        data: {
          amount: 475,
          paymentDate: new Date("2025-09-07"),
          description: "Test ödeme 4 - Kalan",
          orderId: order4.id,
          customerId: customer2.id,
        },
      }),
    ]);

    // Test giderleri (2025 yılına ait)
    await Promise.all([
      // Ocak giderleri
      prisma.expense.create({
        data: {
          amount: 250,
          expenseDate: new Date("2025-01-05"),
          description: "Ocak yakıt gideri",
          expenseTypeId: expenseTypes[0].id,
        },
      }),
      prisma.expense.create({
        data: {
          amount: 3000,
          expenseDate: new Date("2025-01-30"),
          description: "Ocak maaş gideri",
          expenseTypeId: expenseTypes[1].id,
        },
      }),
      // Şubat giderleri
      prisma.expense.create({
        data: {
          amount: 180,
          expenseDate: new Date("2025-02-08"),
          description: "Şubat yakıt gideri",
          expenseTypeId: expenseTypes[0].id,
        },
      }),
      prisma.expense.create({
        data: {
          amount: 3000,
          expenseDate: new Date("2025-02-28"),
          description: "Şubat maaş gideri",
          expenseTypeId: expenseTypes[1].id,
        },
      }),
      prisma.expense.create({
        data: {
          amount: 1500,
          expenseDate: new Date("2025-02-15"),
          description: "Malzeme alımı",
          expenseTypeId: expenseTypes[2].id,
        },
      }),
      // Mart giderleri
      prisma.expense.create({
        data: {
          amount: 220,
          expenseDate: new Date("2025-03-12"),
          description: "Mart yakıt gideri",
          expenseTypeId: expenseTypes[0].id,
        },
      }),
      prisma.expense.create({
        data: {
          amount: 3000,
          expenseDate: new Date("2025-03-31"),
          description: "Mart maaş gideri",
          expenseTypeId: expenseTypes[1].id,
        },
      }),
      // Eylül giderleri
      prisma.expense.create({
        data: {
          amount: 300,
          expenseDate: new Date("2025-09-03"),
          description: "Eylül yakıt gideri",
          expenseTypeId: expenseTypes[0].id,
        },
      }),
      prisma.expense.create({
        data: {
          amount: 3200,
          expenseDate: new Date("2025-09-30"),
          description: "Eylül maaş gideri",
          expenseTypeId: expenseTypes[1].id,
        },
      }),
      prisma.expense.create({
        data: {
          amount: 800,
          expenseDate: new Date("2025-09-15"),
          description: "Malzeme alımı",
          expenseTypeId: expenseTypes[2].id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Test verileri başarıyla eklendi!",
      data: {
        customers: 2,
        orders: 4,
        payments: 6,
        expenses: 10,
      },
    });
  } catch (error) {
    console.error("Test verileri ekleme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test verileri eklenemedi",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Test verilerini temizle
    await prisma.payment.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.expenseType.deleteMany({});
    await prisma.orderStatus.deleteMany({});
    await prisma.productType.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Tüm test verileri temizlendi!",
    });
  } catch (error) {
    console.error("Test verileri temizleme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test verileri temizlenemedi",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
