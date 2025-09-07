// Ürün Tipi Sabitleri
export const PRODUCT_TYPES = {
  PIECE: 1, // Adet ile Satılan
  WEIGHT: 2, // Kilo ile Satılan
} as const;

// Ürün Tipi Etiketleri
export const PRODUCT_TYPE_LABELS = {
  [PRODUCT_TYPES.PIECE]: {
    name: "Adet ile Satılan",
    priceLabel: "Fiyat (Adet)",
    stockLabel: "Stok (Adet)",
    unit: "adet",
  },
  [PRODUCT_TYPES.WEIGHT]: {
    name: "Kilo ile Satılan",
    priceLabel: "Fiyat (kg)",
    stockLabel: "Stok (kg)",
    unit: "kg",
  },
} as const;

// Sipariş Durumu Sabitleri
export const ORDER_STATUS = {
  PENDING: 1, // Beklemede
  DELIVERED: 2, // Teslim Edildi
  CANCELLED: 3, // İptal Edildi
} as const;
