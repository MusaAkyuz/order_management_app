interface OrderSummaryProps {
  calculateSubtotal: () => number;
  calculateDiscount: () => number;
  calculateTotal: () => number;
  discountType: "percentage" | "amount";
  discountValue: number;
  submitLoading: boolean;
  onShowPDFPreview?: () => void;
}

export default function OrderSummary({
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  discountType,
  discountValue,
  submitLoading,
  onShowPDFPreview,
}: OrderSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Toplam */}
      <div className="bg-gray-50 p-4 rounded-md space-y-2">
        {/* Ara Toplam */}
        <div className="flex justify-between text-sm text-gray-700">
          <span className="font-medium">Ara Toplam:</span>
          <span className="font-semibold">
            ₺{calculateSubtotal().toFixed(2)}
          </span>
        </div>

        {/* İndirim */}
        {discountValue > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span className="font-medium">
              İndirim (
              {discountType === "percentage"
                ? "%" + discountValue
                : "₺" + discountValue}
              ):
            </span>
            <span className="font-semibold">
              -₺{calculateDiscount().toFixed(2)}
            </span>
          </div>
        )}

        {/* Net Toplam */}
        <div className="border-t pt-2">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Net Toplam:</span>
            <span>₺{calculateTotal().toFixed(2)}</span>
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
