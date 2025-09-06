"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import FeatureCard from "../components/FeatureCard";

export default function Home() {
  const [loadingStates, setLoadingStates] = useState({
    createOrder: false,
    products: false,
    orders: false,
    customers: false,
  });
  const router = useRouter();

  const handleNavigation = (path: string, key: keyof typeof loadingStates) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
    router.push(path);
  };

  const features = [
    {
      key: "createOrder" as keyof typeof loadingStates,
      path: "/create-order",
      title: "Sipariş Oluştur",
      description:
        "Birden fazla ürün ve miktar ile hızlıca yeni siparişler oluşturun.",
      icon: "📦",
      iconColor: "text-blue-500",
      spinnerColor: "border-blue-500",
    },
    {
      key: "products" as keyof typeof loadingStates,
      path: "/products",
      title: "Ürün Yönetimi",
      description:
        "Ürünlerinizi, stok ve fiyat bilgileriyle birlikte kolayca yönetin.",
      icon: "🗂️",
      iconColor: "text-green-500",
      spinnerColor: "border-green-500",
    },
    {
      key: "orders" as keyof typeof loadingStates,
      path: "/orders",
      title: "Siparişler",
      description:
        "Tüm siparişlerinizi, toplam tutar ve tarih bilgileriyle görüntüleyin.",
      icon: "📑",
      iconColor: "text-yellow-500",
      spinnerColor: "border-yellow-500",
    },
    {
      key: "customers" as keyof typeof loadingStates,
      path: "/customers",
      title: "Müşteriler",
      description: "Bireysel ve kurumsal müşterilerinizi kaydedin ve yönetin.",
      icon: "👥",
      iconColor: "text-purple-500",
      spinnerColor: "border-purple-500",
    },
  ];

  return (
    <Layout currentPage="home">
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 text-center">
          Sipariş Yönetim Sistemi
        </h1>
        <p className="text-lg text-gray-600 mb-10 text-center max-w-2xl">
          Siparişlerinizi kolayca oluşturun, ürün envanterinizi yönetin ve tüm
          işlemlerinizi tek bir yerden takip edin.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl">
          {features.map((feature) => (
            <FeatureCard
              key={feature.key}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              iconColor={feature.iconColor}
              onClick={() => handleNavigation(feature.path, feature.key)}
              isLoading={loadingStates[feature.key]}
              spinnerColor={feature.spinnerColor}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
