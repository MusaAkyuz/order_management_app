const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updatePaidOrderStatuses() {
  try {
    console.log("=== ÖDEMESİ TAMAMLANAN SİPARİŞLERİ GÜNCELLEME ===");

    // Tüm siparişleri ödemeleri ile birlikte al
    const orders = await prisma.order.findMany({
      where: { isActive: true },
      include: {
        payments: {
          where: { isActive: true },
        },
        status: true,
      },
    });

    console.log(`Toplam ${orders.length} sipariş kontrol ediliyor...`);

    let updatedCount = 0;

    for (const order of orders) {
      const totalPaid = order.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      // Eğer ödemesi tamamlanmış ama durumu "Ücreti Ödendi" değilse güncelle
      if (totalPaid >= order.totalPrice && order.statusId !== 4) {
        await prisma.order.update({
          where: { id: order.id },
          data: { statusId: 4 },
        });

        console.log(
          `Sipariş ID ${order.id}: ${order.status.name} → Ücreti Ödendi (Toplam: ${order.totalPrice}, Ödenen: ${totalPaid})`
        );
        updatedCount++;
      }
    }

    console.log(`\n${updatedCount} sipariş durumu güncellendi.`);
  } catch (error) {
    console.error("Hata:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePaidOrderStatuses();
