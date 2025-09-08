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
      name: "Ücreti Ödendi",
      description: "Sipariş ücreti ödendi",
      color: "#17A2B8", // Mavi
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

  // Lookup Table seed data
  const lookupData = [
    // KDV Oranları
    {
      category: "TAX_RATES",
      key: "VAT_18",
      value: "18",
      description: "KDV %18 oranı",
      dataType: "NUMBER",
    },
    {
      category: "TAX_RATES",
      key: "VAT_8",
      value: "8",
      description: "KDV %8 oranı",
      dataType: "NUMBER",
    },
    {
      category: "TAX_RATES",
      key: "VAT_1",
      value: "1",
      description: "KDV %1 oranı",
      dataType: "NUMBER",
    },
    {
      category: "TAX_RATES",
      key: "DEFAULT_VAT",
      value: "VAT_18",
      description: "Varsayılan KDV oranı",
      dataType: "STRING",
    },

    // Kazanç Marjları
    {
      category: "PROFIT_MARGINS",
      key: "DEFAULT_MARGIN",
      value: "25",
      description: "Varsayılan kazanç marjı (%)",
      dataType: "NUMBER",
    },
    {
      category: "PROFIT_MARGINS",
      key: "MINIMUM_MARGIN",
      value: "5",
      description: "Minimum kazanç marjı (%)",
      dataType: "NUMBER",
    },
    {
      category: "PROFIT_MARGINS",
      key: "PREMIUM_MARGIN",
      value: "25",
      description: "Premium ürünler için kazanç marjı (%)",
      dataType: "NUMBER",
    },

    // Şirket Bilgileri
    {
      category: "COMPANY_INFO",
      key: "COMPANY_NAME",
      value: "Şirket Adı",
      description: "Şirket ismi",
      dataType: "STRING",
    },
    {
      category: "COMPANY_INFO",
      key: "COMPANY_ADDRESS",
      value: "Şirket Adresi\nİlçe, İl 12345",
      description: "Şirket adresi",
      dataType: "STRING",
    },
    {
      category: "COMPANY_INFO",
      key: "COMPANY_PHONE",
      value: "+90 (212) 123 45 67",
      description: "Şirket telefonu",
      dataType: "STRING",
    },
    {
      category: "COMPANY_INFO",
      key: "COMPANY_EMAIL",
      value: "info@sirket.com",
      description: "Şirket e-mail adresi",
      dataType: "STRING",
    },
    {
      category: "COMPANY_INFO",
      key: "COMPANY_TAX_NUMBER",
      value: "1234567890",
      description: "Şirket vergi numarası",
      dataType: "STRING",
    },

    // Sistem Ayarları
    {
      category: "SYSTEM_SETTINGS",
      key: "DEFAULT_CURRENCY",
      value: "TRY",
      description: "Varsayılan para birimi",
      dataType: "STRING",
    },
    {
      category: "SYSTEM_SETTINGS",
      key: "CURRENCY_SYMBOL",
      value: "₺",
      description: "Para birimi sembolü",
      dataType: "STRING",
    },
    {
      category: "SYSTEM_SETTINGS",
      key: "DEFAULT_LANGUAGE",
      value: "tr",
      description: "Varsayılan dil",
      dataType: "STRING",
    },
    {
      category: "SYSTEM_SETTINGS",
      key: "ORDER_NUMBER_PREFIX",
      value: "SIP",
      description: "Sipariş numarası öneki",
      dataType: "STRING",
    },
    {
      category: "SYSTEM_SETTINGS",
      key: "MINIMUM_ORDER_AMOUNT",
      value: "50",
      description: "Minimum sipariş tutarı",
      dataType: "NUMBER",
    },

    // Teslimat Ayarları
    {
      category: "DELIVERY_SETTINGS",
      key: "DEFAULT_DELIVERY_FEE",
      value: "25",
      description: "Varsayılan teslimat ücreti",
      dataType: "NUMBER",
    },
    {
      category: "DELIVERY_SETTINGS",
      key: "FREE_DELIVERY_THRESHOLD",
      value: "300",
      description: "Ücretsiz teslimat minimum tutarı",
      dataType: "NUMBER",
    },
    {
      category: "DELIVERY_SETTINGS",
      key: "DELIVERY_ZONES",
      value: JSON.stringify([
        { zone: "Merkez", fee: 15 },
        { zone: "Çevre", fee: 25 },
        { zone: "Uzak", fee: 40 },
      ]),
      description: "Teslimat bölgeleri ve ücretleri",
      dataType: "JSON",
    },
  ];

  console.log("Lookup Table verileri ekleniyor...");
  for (const item of lookupData) {
    await prisma.lookupTable.upsert({
      where: {
        category_key: {
          category: item.category,
          key: item.key,
        },
      },
      update: {
        value: item.value,
        description: item.description,
        dataType: item.dataType,
      },
      create: item,
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
