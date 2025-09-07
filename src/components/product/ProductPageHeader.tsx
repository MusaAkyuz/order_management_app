interface ProductPageHeaderProps {
  onAddProduct: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalProducts: number;
  activeProducts: number;
}

export default function ProductPageHeader({
  onAddProduct,
  searchTerm,
  onSearchChange,
  totalProducts,
  activeProducts,
}: ProductPageHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Sol taraf - Başlık ve İstatistikler */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ürün Yönetimi
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {activeProducts} Aktif Ürün
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              {totalProducts - activeProducts} Pasif Ürün
            </span>
            <span className="font-medium">Toplam: {totalProducts}</span>
          </div>
        </div>

        {/* Sağ taraf - Arama ve Ekle butonu */}
        <div className="flex items-center gap-3">
          {/* Arama */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ürün ara..."
              className="pl-10 pr-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 placeholder-gray-600"
            />
          </div>

          {/* Yeni Ürün Ekle Butonu */}
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Yeni Ürün Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
