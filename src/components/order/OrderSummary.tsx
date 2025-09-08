import { formatCurrency } from "../../utils/currency";

interface OrderSummaryProps {
  calculateItemsTotal: () => number;
  calculateTaxAmount: () => number;
  calculateSubtotal: () => number;
  calculateDiscount: () => number;
  calculateTotal: () => number;
  taxRate: number;
  laborCost: number;
  deliveryFee: number;
  discountType: "percentage" | "amount";
  discountValue: number;
  submitLoading: boolean;
  onShowPDFPreview?: () => void;
}

export default function OrderSummary({
  calculateItemsTotal,
  calculateTaxAmount,
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  taxRate,
  laborCost,
  deliveryFee,
  discountType,
  discountValue,
  submitLoading,
  onShowPDFPreview,
}: OrderSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Toplam Detayları */}
      <div className="bg-gray-50 p-4 rounded-md space-y-2">
        {/* Ürünler Toplamı (KDV Hariç) */}
        {calculateItemsTotal() > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>Ürünler Toplamı (KDV Hariç):</span>
            <span>{formatCurrency(calculateItemsTotal())}</span>
          </div>
        )}

        {/* KDV */}
        {calculateItemsTotal() > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span className="font-bold">KDV (%{taxRate}):</span>
            <span className="font-bold">
              {formatCurrency(calculateTaxAmount())}
            </span>
          </div>
        )}

        {/* Ürünler Toplamı (KDV Dahil) */}
        {calculateItemsTotal() > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>Ürünler Toplamı (KDV Dahil):</span>
            <span>
              {formatCurrency(calculateItemsTotal() + calculateTaxAmount())}
            </span>
          </div>
        )}

        {/* İşçilik Ücreti */}
        {laborCost > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>İşçilik Ücreti:</span>
            <span>{formatCurrency(laborCost)}</span>
          </div>
        )}

        {/* Lojistik Ücreti */}
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>Lojistik Ücreti:</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
        )}

        {/* Ara Toplam */}
        <div className="flex justify-between text-sm text-gray-700 border-t pt-2">
          <span className="font-medium">Ara Toplam:</span>
          <span className="font-semibold">
            {formatCurrency(calculateSubtotal())}
          </span>
        </div>

        {/* İndirim */}
        {discountValue > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span className="font-medium">
              İndirim (
              {discountType === "percentage"
                ? "%" + discountValue
                : formatCurrency(discountValue)}
              ):
            </span>
            <span className="font-semibold">
              -{formatCurrency(calculateDiscount())}
            </span>
          </div>
        )}

        {/* Net Toplam */}
        <div className="border-t pt-2">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Net Toplam:</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </div>

      {/* Butonlar */}
      <div className="space-y-3">
        {/* Sipariş Oluştur Butonu */}
        <button
          type="submit"
          disabled={submitLoading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
        >
          {submitLoading ? "Sipariş Oluşturuluyor..." : "Sipariş Oluştur"}
        </button>
      </div>
    </div>
  );
}
