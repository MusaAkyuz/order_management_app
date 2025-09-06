"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [loadingStates, setLoadingStates] = useState({
    createOrder: false,
    products: false,
    orders: false,
  });
  const router = useRouter();

  const handleNavigation = (path: string, key: keyof typeof loadingStates) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
    router.push(path);
  };
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
          <a
            href="/products"
            className="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Ürünler
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 text-center">
          Sipariş Yönetim Sistemi
        </h1>
        <p className="text-lg text-gray-600 mb-10 text-center max-w-2xl">
          Siparişlerinizi kolayca oluşturun, ürün envanterinizi yönetin ve tüm
          işlemlerinizi tek bir yerden takip edin.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div
            onClick={() => handleNavigation("/create-order", "createOrder")}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
          >
            {loadingStates.createOrder && (
              <div className="absolute inset-0 bg-white bg-opacity-80 rounded-xl flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            <span className="text-blue-500 text-3xl mb-2">📦</span>
            <h2 className="font-bold text-lg mb-1 text-black">
              Sipariş Oluştur
            </h2>
            <p className="text-gray-500 text-center text-sm">
              Birden fazla ürün ve miktar ile hızlıca yeni siparişler oluşturun.
            </p>
          </div>
          <div
            onClick={() => handleNavigation("/products", "products")}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
          >
            {loadingStates.products && (
              <div className="absolute inset-0 bg-white bg-opacity-80 rounded-xl flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            )}
            <span className="text-green-500 text-3xl mb-2">🗂️</span>
            <h2 className="font-bold text-lg mb-1 text-black">Ürün Yönetimi</h2>
            <p className="text-gray-500 text-center text-sm">
              Ürünlerinizi, stok ve fiyat bilgileriyle birlikte kolayca yönetin.
            </p>
          </div>
          <div
            onClick={() => handleNavigation("/orders", "orders")}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
          >
            {loadingStates.orders && (
              <div className="absolute inset-0 bg-white bg-opacity-80 rounded-xl flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            )}
            <span className="text-yellow-500 text-3xl mb-2">📑</span>
            <h2 className="font-bold text-lg mb-1 text-black">Siparişler</h2>
            <p className="text-gray-500 text-center text-sm">
              Tüm siparişlerinizi, toplam tutar ve tarih bilgileriyle
              görüntüleyin.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Order Management App
      </footer>
    </div>
  );
}
