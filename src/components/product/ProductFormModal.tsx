import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "../../constants";

interface Product {
  id: number;
  name: string;
  currentPrice: number;
  stock: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: {
    id: number;
    name: string;
    description?: string;
  };
}

interface ProductType {
  id: number;
  name: string;
  description?: string;
}

interface ProductFormData {
  name: string;
  currentPrice: number;
  stock: number;
  description?: string;
  typeId: number;
  isActive?: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
  product?: Product | null;
  productTypes: ProductType[];
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  product,
  productTypes,
}: ProductFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>();

  // Seçili ürün tipini izle
  const selectedTypeId = watch("typeId");

  // Seçili ürün tipine göre etiketleri al
  const getTypeLabels = () => {
    if (selectedTypeId === PRODUCT_TYPES.WEIGHT) {
      return PRODUCT_TYPE_LABELS[PRODUCT_TYPES.WEIGHT];
    }
    return PRODUCT_TYPE_LABELS[PRODUCT_TYPES.PIECE]; // Default
  };

  const typeLabels = getTypeLabels();

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setValue("name", product.name);
        setValue("currentPrice", product.currentPrice);
        setValue("stock", product.stock);
        setValue("description", product.description || "");
        setValue("typeId", product.type.id);
        setValue("isActive", product.isActive);
      } else {
        reset({
          name: "",
          currentPrice: 0,
          stock: 0,
          description: "",
          typeId: productTypes[0]?.id || 1,
          isActive: true,
        });
      }
    }
  }, [isOpen, product, setValue, reset, productTypes]);

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      await onSave(data);
      toast.success(
        isEdit ? "Ürün başarıyla güncellendi!" : "Ürün başarıyla eklendi!"
      );
      onClose();
    } catch (error) {
      console.error("Form submit error:", error);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-opacity-40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Ürün Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name", { required: "Ürün adı zorunludur" })}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                placeholder="Ürün adını girin"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Ürün Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Tipi <span className="text-red-500">*</span>
              </label>
              <select
                {...register("typeId", {
                  required: "Ürün tipi seçimi zorunludur",
                  valueAsNumber: true,
                })}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Ürün tipi seçin</option>
                {productTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.typeId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.typeId.message}
                </p>
              )}
            </div>

            {/* Fiyat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {typeLabels.priceLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("currentPrice", {
                  required: "Fiyat zorunludur",
                  min: { value: 0, message: "Fiyat negatif olamaz" },
                  valueAsNumber: true,
                })}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                placeholder="0.00"
              />
              {errors.currentPrice && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentPrice.message}
                </p>
              )}
            </div>

            {/* Stok */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {typeLabels.stockLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                {...register("stock", {
                  required: "Stok miktarı zorunludur",
                  min: { value: 0, message: "Stok negatif olamaz" },
                  valueAsNumber: true,
                })}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                placeholder="0"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.stock.message}
                </p>
              )}
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                placeholder="Ürün açıklaması (opsiyonel)"
              />
            </div>

            {/* Durum (Sadece düzenleme modunda) */}
            {isEdit && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Ürün aktif
                </label>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
