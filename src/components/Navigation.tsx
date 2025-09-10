"use client";

import { useState } from "react";

interface NavigationProps {
  currentPage?:
    | "home"
    | "create-order"
    | "orders"
    | "products"
    | "customers"
    | "debts";
}

export default function Navigation({ currentPage = "home" }: NavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const pageInfo = {
    home: {
      title: "Ana Sayfa",
      description: "Sipariş yönetim sistemi ana sayfası",
      path: "/",
      icon: "🏠",
    },
    "create-order": {
      title: "Sipariş Oluştur",
      description:
        "Birden fazla ürün ve miktar ile hızlıca yeni siparişler oluşturun",
      path: "/create-order",
      icon: "📦",
    },
    orders: {
      title: "Siparişler",
      description:
        "Tüm siparişlerinizi, toplam tutar ve tarih bilgileriyle görüntüleyin",
      path: "/orders",
      icon: "📑",
    },
    products: {
      title: "Ürün Yönetimi",
      description:
        "Ürünlerinizi, stok ve fiyat bilgileriyle birlikte kolayca yönetin",
      path: "/products",
      icon: "🗂️",
    },
    customers: {
      title: "Müşteriler",
      description: "Bireysel ve kurumsal müşterilerinizi kaydedin ve yönetin",
      path: "/customers",
      icon: "👥",
    },
    debts: {
      title: "Müşteri Borçları",
      description:
        "Müşterilerin toplam borç durumlarını görüntüleyin ve takip edin",
      path: "/debts",
      icon: "💰",
    },
  };

  const getBreadcrumbPath = () => {
    if (currentPage === "home") return [pageInfo.home];
    return [pageInfo.home, pageInfo[currentPage]];
  };

  const getLinkClass = (page: string) => {
    return currentPage === page
      ? "text-blue-600 font-medium"
      : "text-gray-700 hover:text-blue-600 font-medium transition";
  };

  return (
    <nav className="bg-white shadow-sm">
      {/* Ana Navigation */}
      <div className="py-4 px-8 flex justify-between items-center border-b border-gray-100">
        <span className="text-xl font-bold text-blue-600 tracking-tight">
          Order Management
        </span>
        <div className="flex gap-6">
          <a href="/" className={getLinkClass("home")}>
            Ana Sayfa
          </a>
          <a href="/create-order" className={getLinkClass("create-order")}>
            Sipariş Oluştur
          </a>
          <a href="/orders" className={getLinkClass("orders")}>
            Siparişler
          </a>
          <a href="/products" className={getLinkClass("products")}>
            Ürünler
          </a>
          <a href="/customers" className={getLinkClass("customers")}>
            Müşteriler
          </a>
          <a href="/debts" className={getLinkClass("debts")}>
            Müşteri Borçları
          </a>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentPage !== "home" && (
        <div className="px-8 py-3 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm">
            {getBreadcrumbPath().map((item, index) => (
              <div key={item.path} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-400 mx-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <a
                    href={item.path}
                    className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                      index === getBreadcrumbPath().length - 1
                        ? "text-blue-600 font-medium bg-blue-50"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </a>

                  {/* Tooltip */}
                  {hoveredItem === item.path && (
                    <div className="absolute top-full left-0 mt-2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                      <div className="font-medium mb-1">{item.title}</div>
                      <div className="text-gray-300">{item.description}</div>
                      {/* Tooltip Arrow */}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
