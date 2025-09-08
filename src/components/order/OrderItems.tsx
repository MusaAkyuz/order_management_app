import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
  Control,
  FieldArrayWithId,
} from "react-hook-form";
import { UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import SearchableSelect from "../SearchableSelect";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "../../constants";

interface Product {
  id: number;
  name: string;
  currentPrice: number;
  stock: number;
  typeId: number;
  type: {
    id: number;
    name: string;
  };
}

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
    isManual?: boolean;
    manualName?: string;
  }>;
}

interface OrderItemsProps {
  products: Product[];
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  fields: FieldArrayWithId<OrderFormData, "orderItems", "id">[];
  append: UseFieldArrayAppend<OrderFormData, "orderItems">;
  remove: UseFieldArrayRemove;
}

export default function OrderItems({
  products,
  register,
  errors,
  watch,
  setValue,
  fields,
  append,
  remove,
}: OrderItemsProps) {
  const watchedItems = watch("orderItems");

  // Ürün seçildiğinde fiyatı otomatik doldur
  const handleProductChange = (index: number, productId: number) => {
    const selectedProduct = products.find((p) => p.id === productId);
    if (selectedProduct) {
      setValue(`orderItems.${index}.price`, selectedProduct.currentPrice);
    }
  };

  // Seçili ürünün stok bilgisini al
  const getSelectedProductStock = (index: number) => {
    const productId = watchedItems[index]?.productId;
    if (productId) {
      const selectedProduct = products.find((p) => p.id === productId);
      return selectedProduct?.stock || 0;
    }
    return 0;
  };

  // Ürün tipine göre birim adını al
  const getUnitLabel = (index: number) => {
    const productId = watchedItems[index]?.productId;
    if (productId) {
      const selectedProduct = products.find((p) => p.id === productId);
      if (selectedProduct?.typeId) {
        const typeConfig =
          PRODUCT_TYPE_LABELS[
            selectedProduct.typeId as keyof typeof PRODUCT_TYPE_LABELS
          ];
        return typeConfig?.unit || "adet";
      }
    }
    return "adet";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <label className="block text-sm font-semibold text-gray-800">
          Ürünler *
        </label>
        <button
          type="button"
          onClick={() =>
            append({
              productId: 0,
              quantity: 1,
              price: 0,
              isManual: false,
              manualName: "",
            })
          }
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Ürün Ekle
        </button>
      </div>

      {/* Başlık Satırı */}
      <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-gray-700 px-2">
        <div className="col-span-1">Manuel</div>
        <div className="col-span-3">Ürün</div>
        <div className="col-span-2">Stok</div>
        <div className="col-span-2">Miktar</div>
        <div className="col-span-2">Birim Fiyat</div>
        <div className="col-span-1">Toplam</div>
        <div className="col-span-1"></div>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-12 gap-2 items-center bg-gray-50 border border-gray-200 rounded-md p-2 mb-2"
        >
          {/* Manuel Checkbox */}
          <div className="col-span-1 flex justify-center">
            <input
              type="checkbox"
              {...register(`orderItems.${index}.isManual`)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              onChange={(e) => {
                setValue(`orderItems.${index}.isManual`, e.target.checked);
                if (e.target.checked) {
                  setValue(`orderItems.${index}.productId`, 0);
                  setValue(`orderItems.${index}.price`, 0);
                  setValue(`orderItems.${index}.manualName`, "");
                } else {
                  setValue(`orderItems.${index}.manualName`, "");
                  setValue(`orderItems.${index}.productId`, 0);
                  setValue(`orderItems.${index}.price`, 0);
                }
              }}
            />
          </div>

          {/* Ürün Seçimi veya Manuel Girdi */}
          <div className="col-span-3">
            {watchedItems[index]?.isManual ? (
              <>
                <input
                  type="text"
                  {...register(`orderItems.${index}.manualName`)}
                  className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
                  placeholder="Ürün adını yazın"
                />
                {/* Manuel mod için gizli productId */}
                <input
                  type="hidden"
                  {...register(`orderItems.${index}.productId`)}
                  value={0}
                />
              </>
            ) : (
              <>
                <SearchableSelect
                  options={products.map((product) => {
                    const typeConfig =
                      PRODUCT_TYPE_LABELS[
                        product.typeId as keyof typeof PRODUCT_TYPE_LABELS
                      ];
                    const unit = typeConfig?.unit || "adet";
                    return {
                      value: product.id,
                      label: product.name,
                      description: `Stok: ${
                        product.stock
                      } ${unit} - ₺${product.currentPrice.toFixed(2)}`,
                    };
                  })}
                  value={watchedItems[index]?.productId || ""}
                  onChange={(value) => {
                    setValue(`orderItems.${index}.productId`, Number(value));
                    handleProductChange(index, Number(value));
                  }}
                  placeholder="Ürün seçin veya arayın"
                  error={errors.orderItems?.[index]?.productId?.message}
                  className="text-xs"
                />
                {/* Normal mod için gizli manualName */}
                <input
                  type="hidden"
                  {...register(`orderItems.${index}.manualName`)}
                  value=""
                />
              </>
            )}
          </div>

          {/* Stok Durumu */}
          <div className="col-span-2">
            <div
              className={`px-2 py-1 text-sm border rounded text-center ${
                watchedItems[index]?.isManual
                  ? "bg-gray-100 border-gray-300 text-gray-500"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              {watchedItems[index]?.isManual
                ? "—"
                : watchedItems[index]?.productId
                ? `${getSelectedProductStock(index)} ${getUnitLabel(index)}`
                : "—"}
            </div>
          </div>

          {/* Miktar */}
          <div className="col-span-2">
            <input
              type="number"
              {...register(`orderItems.${index}.quantity`, {
                valueAsNumber: true,
                max: watchedItems[index]?.isManual
                  ? undefined
                  : {
                      value: getSelectedProductStock(index) || 999999,
                      message: `Maksimum ${getSelectedProductStock(
                        index
                      )} ${getUnitLabel(index)} girilebilir`,
                    },
              })}
              className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
              min="1"
              max={
                watchedItems[index]?.isManual
                  ? undefined
                  : getSelectedProductStock(index) || 999999
              }
              placeholder={`Miktar${
                watchedItems[index]?.isManual ? "" : ` (${getUnitLabel(index)})`
              }`}
            />
            {errors.orderItems?.[index]?.quantity && (
              <p className="text-red-500 text-xs mt-1">
                {errors.orderItems[index]?.quantity?.message}
              </p>
            )}
          </div>

          {/* Birim Fiyat */}
          <div className="col-span-2">
            {watchedItems[index]?.isManual ? (
              <input
                type="number"
                step="0.01"
                {...register(`orderItems.${index}.price`, {
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Fiyat 0'dan büyük olmalıdır" },
                })}
                className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
                placeholder="Birim fiyat"
              />
            ) : (
              <>
                <div className="px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded text-gray-700 text-center">
                  ₺{(watchedItems[index]?.price || 0).toFixed(2)}
                </div>
                {/* Gizli input */}
                <input
                  type="hidden"
                  {...register(`orderItems.${index}.price`, {
                    valueAsNumber: true,
                  })}
                />
              </>
            )}
            {errors.orderItems?.[index]?.price && (
              <p className="text-red-500 text-xs mt-1">
                {errors.orderItems[index]?.price?.message}
              </p>
            )}
          </div>

          {/* Ara Toplam */}
          <div className="col-span-1">
            <div className="px-2 py-1 text-sm font-medium text-gray-900 text-center">
              ₺
              {(
                (watchedItems[index]?.quantity || 0) *
                (watchedItems[index]?.price || 0)
              ).toFixed(2)}
            </div>
          </div>

          {/* Sil Butonu */}
          <div className="col-span-1 flex justify-center">
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                title="Ürünü sil"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}

      {errors.orderItems && (
        <p className="text-red-500 text-sm mt-1">{errors.orderItems.message}</p>
      )}
    </div>
  );
}
