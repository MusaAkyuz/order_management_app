import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";

interface OrderFormData {
  customerId: number;
  address: string;
  description: string;
  laborCost: number;
  deliveryFee: number;
  discountType: "percentage" | "amount";
  discountValue: number;
  orderItems: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}

interface AdditionalCostsProps {
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  calculateDiscount: () => number;
}

export default function AdditionalCosts({
  register,
  errors,
  watch,
  setValue,
  calculateDiscount,
}: AdditionalCostsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* İşçilik Maliyeti */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">
          İşçilik Maliyeti (₺)
        </label>
        <input
          type="number"
          step="0.01"
          {...register("laborCost", { valueAsNumber: true })}
          className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
          placeholder="İşçilik maliyeti girin"
        />
        {errors.laborCost && (
          <p className="text-red-500 text-xs mt-1">
            {errors.laborCost.message}
          </p>
        )}
      </div>

      {/* Teslimat Ücreti */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">
          Teslimat Ücreti (₺)
        </label>
        <input
          type="number"
          step="0.01"
          {...register("deliveryFee", { valueAsNumber: true })}
          className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
          placeholder="Teslimat ücreti girin"
        />
        {errors.deliveryFee && (
          <p className="text-red-500 text-xs mt-1">
            {errors.deliveryFee.message}
          </p>
        )}
      </div>

      {/* İndirim */}
      <div>
        <label className="block text-sm font-medium text-red-600 mb-1">
          İndirim
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            {...register("discountValue", { valueAsNumber: true })}
            className="flex-1 px-2 py-1 text-sm text-gray-800 border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-gray-600"
            placeholder={
              watch("discountType") === "percentage"
                ? "Yüzde girin"
                : "Tutar girin"
            }
          />
          {/* Toggle Butonu */}
          <div className="flex bg-gray-100 rounded p-1">
            <button
              type="button"
              onClick={() => setValue("discountType", "percentage")}
              className={`px-2 py-1 text-xs rounded transition ${
                watch("discountType") === "percentage"
                  ? "bg-red-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => setValue("discountType", "amount")}
              className={`px-2 py-1 text-xs rounded transition ${
                watch("discountType") === "amount"
                  ? "bg-red-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              ₺
            </button>
          </div>
        </div>
        {errors.discountValue && (
          <p className="text-red-500 text-xs mt-1">
            {errors.discountValue.message}
          </p>
        )}
        {/* İndirim tutarı gösterimi */}
        {watch("discountValue") > 0 && (
          <p className="text-red-600 text-xs mt-1">
            -₺{calculateDiscount().toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}
