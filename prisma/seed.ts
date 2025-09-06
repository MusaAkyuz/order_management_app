import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Order Status seed data
  const orderStatuses = [
    {
      name: "Beklemede",
      description: "Sipariş onay bekliyor",
      color: "#FFD700", // Sarı
    },
    {
      name: "Teslim Edildi",
      description: "Sipariş başarıyla teslim edildi",
      color: "#28A745", // Yeşil
    },
    {
      name: "İptal Edildi",
      description: "Sipariş iptal edildi",
      color: "#DC3545", // Kırmızı
    },
  ];

  console.log("Order Status verileri ekleniyor...");
  for (const status of orderStatuses) {
    await prisma.orderStatus.upsert({
      where: { name: status.name },
      update: {},
      create: status,
    });
  }

  // Product Type seed data (opsiyonel)
  const productTypes = [
    {
      name: "Adet ile Satılan",
      description: "Adet bazında satılan ürünler (telefon, kitap, kalem vb.)",
    },
    {
      name: "Kilo ile Satılan",
      description: "Kilo bazında satılan ürünler (meyve, sebze, et vb.)",
    },
  ];

  console.log("Product Type verileri ekleniyor...");
  for (const type of productTypes) {
    await prisma.productType.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    });
  }

  console.log("Seed veriler başarıyla eklendi!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
