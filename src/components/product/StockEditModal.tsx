import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Product {
  id: number;
  name: string;
  currentPrice: number;
  stock: number;
  minStockLevel?: number;
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

interface StockFormData {
  stock: number;
  operation: "set" | "add" | "subtract";
  amount: number;
}

interface StockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: number, newStock: number) => Promise<void>;
  product: Product | null;
}

export default function StockEditModal({
  isOpen,
  onClose,
  onSave,
  product,
}: StockEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<"set" | "add" | "subtract">("set");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StockFormData>({
    defaultValues: {
      stock: product?.stock || 0,
      operation: "set",
      amount: 0,
    },
  });

  const watchedAmount = watch("amount");
  const watchedStock = watch("stock");

  // Yeni stok miktarını hesapla
  const calculateNewStock = (): number => {
    if (!product) return 0;

    switch (operation) {
      case "set":
        return watchedStock;
      case "add":
        return product.stock + (watchedAmount || 0);
      case "subtract":
        return Math.max(0, product.stock - (watchedAmount || 0));
      default:
        return product.stock;
    }
  };

  const newStock = calculateNewStock();

  const onSubmit = async (data: StockFormData) => {
    if (!product) return;

    setIsLoading(true);
    try {
      await onSave(product.id, newStock);
      toast.success("Stok miktarı başarıyla güncellendi!");
      onClose();
    } catch (error) {
      console.error("Stock update error:", error);
      toast.error("Stok güncellenirken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOperationChange = (newOperation: "set" | "add" | "subtract") => {
    setOperation(newOperation);
    setValue("amount", 0);
    if (newOperation === "set") {
      setValue("stock", product?.stock || 0);
    }
  };

  if (!isOpen || !product) return null;

  const isLowStock = product.minStockLevel && newStock <= product.minStockLevel;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0  bg-opacity-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Stok Düzenle
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
            {/* Ürün Bilgisi */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  Mevcut Stok:{" "}
                  <span className="font-medium">{product.stock}</span>
                </p>
                {product.minStockLevel && (
                  <p>
                    Minimum Stok:{" "}
                    <span className="font-medium">{product.minStockLevel}</span>
                  </p>
                )}
              </div>
            </div>

            {/* İşlem Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşlem Tipi
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleOperationChange("set")}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                    operation === "set"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Ayarla
                </button>
                <button
                  type="button"
                  onClick={() => handleOperationChange("add")}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                    operation === "add"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => handleOperationChange("subtract")}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                    operation === "subtract"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Çıkar
                </button>
              </div>
            </div>

            {/* Miktar Input */}
            {operation === "set" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Stok Miktarı <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("stock", {
                    required: "Stok miktarı zorunludur",
                    min: { value: 0, message: "Stok negatif olamaz" },
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  autoComplete="off"
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.stock.message}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {operation === "add" ? "Eklenecek" : "Çıkarılacak"} Miktar{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("amount", {
                    required: "Miktar zorunludur",
                    min: { value: 0, message: "Miktar negatif olamaz" },
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  autoComplete="off"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.amount.message}
                  </p>
                )}
              </div>
            )}

            {/* Sonuç Önizleme */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Yeni Stok:
                </span>
                <span
                  className={`text-lg font-bold ${
                    isLowStock ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {newStock}
                  {isLowStock && (
                    <span className="text-xs text-red-500 ml-2">
                      ⚠️ Düşük Stok
                    </span>
                  )}
                </span>
              </div>
              {operation !== "set" && (
                <div className="text-xs text-gray-500 mt-1">
                  {product.stock} {operation === "add" ? "+" : "-"}{" "}
                  {watchedAmount || 0} = {newStock}
                </div>
              )}
            </div>

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
                {isLoading ? "Güncelleniyor..." : "Güncelle"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
