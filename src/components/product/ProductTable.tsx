import { useState } from "react";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "../../constants";

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

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onEditStock: (product: Product) => void;
  onDelete: (productId: number) => void;
  onBulkDelete: (productIds: number[]) => void;
  searchTerm: string;
}

export default function ProductTable({
  products,
  isLoading,
  onEdit,
  onEditStock,
  onDelete,
  onBulkDelete,
  searchTerm,
}: ProductTableProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.currentPrice.toString().includes(searchTerm) ||
      product.stock.toString().includes(searchTerm)
  );

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length > 0) {
      onBulkDelete(selectedProducts);
      setSelectedProducts([]);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {selectedProducts.length} ürün seçildi
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            Seçilenleri Sil
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={
                    selectedProducts.length === filteredProducts.length &&
                    filteredProducts.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürün Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fiyat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min. Stok
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    {product.description && (
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {product.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(product.currentPrice)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-medium ${
                        product.minStockLevel &&
                        product.stock <= product.minStockLevel
                          ? "text-red-600"
                          : product.stock > 10
                          ? "text-green-600"
                          : product.stock > 0
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {product.stock}{" "}
                      {product.type.id === PRODUCT_TYPES.WEIGHT
                        ? PRODUCT_TYPE_LABELS[PRODUCT_TYPES.WEIGHT].unit
                        : PRODUCT_TYPE_LABELS[PRODUCT_TYPES.PIECE].unit}
                    </span>
                    {product.minStockLevel &&
                      product.stock <= product.minStockLevel && (
                        <span className="text-red-500 text-xs font-medium bg-red-100 px-2 py-1 rounded-full">
                          ⚠️ Düşük Stok
                        </span>
                      )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {product.minStockLevel || "-"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {product.type.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(product.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => onEditStock(product)}
                    className="text-green-600 hover:text-green-800 font-medium transition-colors"
                    title="Stok Düzenle"
                  >
                    Stok
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm
              ? "Arama kriterlerine uygun ürün bulunamadı."
              : "Henüz ürün bulunmuyor."}
          </p>
        </div>
      )}
    </div>
  );
}
