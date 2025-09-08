/**
 * Para formatı utility fonksiyonları
 */

/**
 * Para değerini Türk Lirası formatında gösterir
 * Binlik ayracı ve ondalık kısmı ile
 * @param amount - Formatlanacak miktar
 * @returns Formatlanmış para string'i (örn: "₺1.234,56")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Para değerini sadece sayı formatında gösterir (₺ işareti olmadan)
 * Binlik ayracı ve ondalık kısmı ile
 * @param amount - Formatlanacak miktar
 * @returns Formatlanmış sayı string'i (örn: "1.234,56")
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
