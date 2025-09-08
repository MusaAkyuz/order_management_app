"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";

interface Order {
  id: number;
  totalPrice: number;
  laborCost: number;
  deliveryFee: number;
  createdAt: string;
  customer: {
    name: string;
    isCompany: boolean;
  };
  status: {
    name: string;
    color: string;
  };
  orderItems: {
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/orders");
        const data = await response.json();

        console.log("Orders API response:", data);

        if (data.success && data.data && Array.isArray(data.data.orders)) {
          setOrders(data.data.orders);
        } else {
          console.error("Siparişler yüklenemedi:", data.error);
          setOrders([]); // Boş array set et
        }
      } catch (error) {
        console.error("Siparişler getirilirken hata:", error);
        setOrders([]); // Hata durumunda boş array set et
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  // Sipariş silme fonksiyonu
  const handleDeleteOrder = async (orderId: number) => {
    if (
      !confirm(
        "Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    ) {
      return;
    }

    setDeleteLoading(orderId);
    const loadingToast = toast.loading("Sipariş siliniyor...");

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Sipariş başarıyla silindi!", {
          id: loadingToast,
        });

        // Siparişi listeden kaldır
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.id !== orderId)
        );
      } else {
        toast.error(result.error || "Sipariş silinirken hata oluştu", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Sipariş silinirken hata:", error);
      toast.error("Sipariş silinirken bir hata oluştu", {
        id: loadingToast,
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <Layout currentPage="orders">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="orders">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
          <p className="text-gray-600">
            Tüm siparişleri görüntüleyin ve yönetin
          </p>
        </div>

        {!Array.isArray(orders) || orders.length === 0 ? (
          <div className="text-center py-12 bg-white shadow-lg rounded-lg">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz sipariş bulunmuyor
            </h3>
            <p className="text-gray-500 mb-4">
              İlk siparişinizi oluşturmak için sipariş oluştur sayfasına gidin.
            </p>
            <a
              href="/create-order"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Sipariş Oluştur
            </a>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Toplam {orders.length} sipariş
                </h2>
                <a
                  href="/create-order"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Yeni Sipariş
                </a>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sipariş No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer.name}
                      <span className="text-xs text-gray-500 ml-1">
                        ({order.customer.isCompany ? "Kurumsal" : "Bireysel"})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status.color === "yellow"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status.color === "green"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₺{order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href={`/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Görüntüle
                      </a>
                      <a
                        href={`/orders/${order.id}/edit`}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Düzenle
                      </a>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deleteLoading === order.id}
                        className={`text-red-600 hover:text-red-900 ${
                          deleteLoading === order.id
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {deleteLoading === order.id ? "Siliniyor..." : "Sil"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
