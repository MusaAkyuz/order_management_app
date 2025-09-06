export default function Products() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm py-4 px-8 flex justify-between items-center">
        <span className="text-xl font-bold text-blue-600 tracking-tight">
          Order Management
        </span>
        <div className="flex gap-6">
          <a
            href="/"
            className="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Ana Sayfa
          </a>
          <a
            href="/create-order"
            className="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Sipariş Oluştur
          </a>
          <a
            href="/orders"
            className="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Siparişler
          </a>
          <a href="/products" className="text-blue-600 font-medium">
            Ürünler
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 text-center">
          Ürün Yönetimi
        </h1>
        <p className="text-lg text-gray-600 mb-10 text-center max-w-2xl">
          Bu sayfa henüz geliştirilme aşamasındadır.
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Order Management App
      </footer>
    </div>
  );
}
