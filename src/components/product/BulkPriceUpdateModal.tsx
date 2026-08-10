import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { formatCurrency } from "../../utils/currency";

interface Product {
  id: number;
  name: string;
  currentPrice: number;
  isActive: boolean;
  type: {
    id: number;
    name: string;
  };
}

interface PriceRow {
  id: number;
  name: string;
  typeName: string;
  originalPrice: number;
  costPrice: number;
  profitMargin: number;
  newPrice: number;
  dirty: boolean;
}

interface BulkPriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// Geliş fiyatı ve kar marjından satış fiyatını hesapla
const calculateSellingPrice = (cost: number, margin: number) => {
  if (cost <= 0 || margin < 0) return 0;
  return cost * (1 + margin / 100);
};

export default function BulkPriceUpdateModal({
  isOpen,
  onClose,
  onSaved,
}: BulkPriceUpdateModalProps) {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultProfitMargin, setDefaultProfitMargin] = useState(20);

  const fetchDefaultProfitMargin = async () => {
    try {
      const response = await fetch(
        "/api/lookup?category=PROFIT_MARGINS&key=DEFAULT_MARGIN"
      );
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        return parseFloat(result.data[0].value) || 20;
      }
    } catch (error) {
      console.error("Error fetching default profit margin:", error);
    }
    return 20;
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const margin = await fetchDefaultProfitMargin();
      setDefaultProfitMargin(margin);

      const response = await fetch("/api/products?isActive=true");
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const products: Product[] = data.data;
        setRows(
          products
            .sort((a, b) => a.name.localeCompare(b.name, "tr"))
            .map((product) => {
              const estimatedCostPrice =
                product.currentPrice / (1 + margin / 100);
              return {
                id: product.id,
                name: product.name,
                typeName: product.type?.name ?? "",
                originalPrice: product.currentPrice,
                costPrice: estimatedCostPrice,
                profitMargin: margin,
                newPrice: product.currentPrice,
                dirty: false,
              };
            })
        );
      } else {
        toast.error("Ürünler yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      toast.error("Ürünler yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      loadProducts();
    }
  }, [isOpen]);

  const updateRow = (
    id: number,
    field: "costPrice" | "profitMargin",
    value: number
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const costPrice = field === "costPrice" ? value : row.costPrice;
        const profitMargin =
          field === "profitMargin" ? value : row.profitMargin;
        const newPrice = calculateSellingPrice(costPrice, profitMargin);
        return {
          ...row,
          costPrice,
          profitMargin,
          newPrice,
          dirty: true,
        };
      })
    );
  };

  const dirtyRows = useMemo(() => rows.filter((r) => r.dirty), [rows]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.trim().toLowerCase();
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(term) ||
        row.typeName.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  const handleClose = () => {
    if (dirtyRows.length > 0) {
      if (
        !confirm(
          `${dirtyRows.length} üründe kaydedilmemiş değişiklik var. Kapatmak istediğinizden emin misiniz?`
        )
      ) {
        return;
      }
    }
    onClose();
  };

  const handleSave = async () => {
    if (dirtyRows.length === 0) {
      toast.error("Değişiklik yapılmadı");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: dirtyRows.map((row) => ({
            id: row.id,
            currentPrice: row.newPrice,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `${data.data.updatedCount} ürünün fiyatı başarıyla güncellendi`
        );
        onSaved();
        onClose();
      } else {
        toast.error(data.error || "Fiyatlar güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("Bulk price update error:", error);
      toast.error("Fiyatlar güncellenirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-opacity-40 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Toplu Fiyat Güncelleme
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Geliş fiyatı ve kar marjı alanlarını düzenleyin, satış fiyatı
                otomatik hesaplanır.
              </p>
            </div>
            <button
              onClick={handleClose}
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

          {/* Search */}
          <div className="px-6 pt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
            />
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                Ürünler yükleniyor...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                {searchTerm ? "Aramanızla eşleşen ürün bulunamadı" : "Ürün bulunamadı"}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ürün
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Geliş Fiyatı
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Kar Marjı (%)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Satış Fiyatı
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        row.dirty
                          ? "bg-amber-50 border-l-4 border-amber-400"
                          : "border-l-4 border-transparent"
                      }
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {row.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.typeName}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.costPrice}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "costPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-28 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1000"
                          value={row.profitMargin}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "profitMargin",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            row.dirty ? "text-amber-700" : "text-gray-700"
                          }`}
                        >
                          {formatCurrency(row.newPrice)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              {dirtyRows.length > 0
                ? `${dirtyRows.length} üründe değişiklik yapıldı`
                : "Henüz değişiklik yapılmadı"}
            </span>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || dirtyRows.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving
                  ? "Kaydediliyor..."
                  : `Kaydet${
                      dirtyRows.length > 0 ? ` (${dirtyRows.length})` : ""
                    }`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
