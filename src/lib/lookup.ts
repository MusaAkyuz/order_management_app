// Lookup table utility fonksiyonları
import { prisma } from "./prisma";

export interface LookupItem {
  id: number;
  category: string;
  key: string;
  value: string;
  description?: string | null;
  dataType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessedLookupItem extends LookupItem {
  processedValue: any;
}

// Kategoriye göre lookup verilerini getir
export async function getLookupByCategory(
  category: string
): Promise<ProcessedLookupItem[]> {
  try {
    const data = await prisma.lookupTable.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: {
        key: "asc",
      },
    });

    return data.map((item) => ({
      ...item,
      processedValue: processValue(item.value, item.dataType),
    }));
  } catch (error) {
    console.error(
      `Error fetching lookup data for category ${category}:`,
      error
    );
    return [];
  }
}

// Belirli bir key'in değerini getir
export async function getLookupValue(
  category: string,
  key: string
): Promise<any> {
  try {
    const item = await prisma.lookupTable.findUnique({
      where: {
        category_key: {
          category,
          key,
        },
        isActive: true,
      },
    });

    if (!item) {
      return null;
    }

    return processValue(item.value, item.dataType);
  } catch (error) {
    console.error(`Error fetching lookup value for ${category}.${key}:`, error);
    return null;
  }
}

// Lookup değerini güncelle
export async function updateLookupValue(
  category: string,
  key: string,
  value: any
): Promise<boolean> {
  try {
    await prisma.lookupTable.update({
      where: {
        category_key: {
          category,
          key,
        },
      },
      data: {
        value: String(value),
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error(`Error updating lookup value for ${category}.${key}:`, error);
    return false;
  }
}

// Yeni lookup değeri ekle
export async function createLookupValue(
  category: string,
  key: string,
  value: any,
  description?: string,
  dataType: string = "STRING"
): Promise<LookupItem | null> {
  try {
    const newItem = await prisma.lookupTable.create({
      data: {
        category,
        key,
        value: String(value),
        description,
        dataType,
      },
    });

    return newItem;
  } catch (error) {
    console.error(`Error creating lookup value for ${category}.${key}:`, error);
    return null;
  }
}

// Veri tipine göre değeri işle
export function processValue(value: string, dataType: string): any {
  switch (dataType) {
    case "NUMBER":
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
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

// Sık kullanılan değerler için helper fonksiyonlar
export class LookupHelper {
  // KDV oranları
  static async getVATRates() {
    return await getLookupByCategory("TAX_RATES");
  }

  static async getDefaultVATRate() {
    const defaultVAT = await getLookupValue("TAX_RATES", "DEFAULT_VAT");
    if (defaultVAT) {
      return await getLookupValue("TAX_RATES", defaultVAT);
    }
    return 18; // Fallback
  }

  // Kazanç marjları
  static async getProfitMargins() {
    return await getLookupByCategory("PROFIT_MARGINS");
  }

  static async getDefaultProfitMargin() {
    return (await getLookupValue("PROFIT_MARGINS", "DEFAULT_MARGIN")) || 15;
  }

  // Şirket bilgileri
  static async getCompanyInfo() {
    const data = await getLookupByCategory("COMPANY_INFO");
    const companyInfo: any = {};

    data.forEach((item) => {
      const keyName = item.key.replace("COMPANY_", "").toLowerCase();
      companyInfo[keyName] = item.processedValue;
    });

    return companyInfo;
  }

  // Sistem ayarları
  static async getSystemSettings() {
    return await getLookupByCategory("SYSTEM_SETTINGS");
  }

  static async getCurrencySymbol() {
    return (await getLookupValue("SYSTEM_SETTINGS", "CURRENCY_SYMBOL")) || "₺";
  }

  static async getOrderNumberPrefix() {
    return (
      (await getLookupValue("SYSTEM_SETTINGS", "ORDER_NUMBER_PREFIX")) || "SIP"
    );
  }

  static async getMinimumOrderAmount() {
    return (
      (await getLookupValue("SYSTEM_SETTINGS", "MINIMUM_ORDER_AMOUNT")) || 50
    );
  }

  // Teslimat ayarları
  static async getDeliverySettings() {
    return await getLookupByCategory("DELIVERY_SETTINGS");
  }

  static async getDefaultDeliveryFee() {
    return (
      (await getLookupValue("DELIVERY_SETTINGS", "DEFAULT_DELIVERY_FEE")) || 25
    );
  }

  static async getFreeDeliveryThreshold() {
    return (
      (await getLookupValue("DELIVERY_SETTINGS", "FREE_DELIVERY_THRESHOLD")) ||
      300
    );
  }

  static async getDeliveryZones() {
    return (await getLookupValue("DELIVERY_SETTINGS", "DELIVERY_ZONES")) || [];
  }
}
