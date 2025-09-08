"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import {
  getStatusBadgeClasses,
  getStatusStyling,
} from "../../constants/orderStatus";

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
    id: number;
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

interface OrderStatus {
  id: number;
  name: string;
  color: string;
  description: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [orderToUpdateStatus, setOrderToUpdateStatus] = useState<Order | null>(
    null
  );
  const [availableStatuses, setAvailableStatuses] = useState<OrderStatus[]>([]);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

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

  // Sipariş statülerini yükle
  useEffect(() => {
    async function fetchStatuses() {
      try {
        const response = await fetch("/api/order-statuses");
        const data = await response.json();

        if (data.success) {
          setAvailableStatuses(data.data);
        }
      } catch (error) {
        console.error("Statüler yüklenirken hata:", error);
      }
    }

    fetchStatuses();
  }, []);

  // Sipariş silme modal açma fonksiyonu
  const openDeleteModal = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  // Sipariş silme fonksiyonu
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    setDeleteLoading(orderToDelete.id);
    const loadingToast = toast.loading("Sipariş siliniyor...");

    try {
      const response = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Sipariş başarıyla silindi!", {
          id: loadingToast,
        });

        // Siparişi listeden kaldır
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.id !== orderToDelete.id)
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
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

  // Statü değiştirme modal açma fonksiyonu
  const openStatusModal = (order: Order) => {
    setOrderToUpdateStatus(order);
    setShowStatusModal(true);
  };

  // Statü güncelleme fonksiyonu
  const handleStatusUpdate = async (newStatusId: number) => {
    if (!orderToUpdateStatus) return;

    setStatusUpdateLoading(true);
    const loadingToast = toast.loading("Sipariş durumu güncelleniyor...");

    try {
      const response = await fetch(`/api/orders/${orderToUpdateStatus.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statusId: newStatusId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Sipariş durumu başarıyla güncellendi!", {
          id: loadingToast,
        });

        // Siparişi listede güncelle
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderToUpdateStatus.id
              ? { ...order, status: result.data.status }
              : order
          )
        );
      } else {
        toast.error(
          result.error || "Sipariş durumu güncellenirken hata oluştu",
          {
            id: loadingToast,
          }
        );
      }
    } catch (error) {
      console.error("Sipariş durumu güncellenirken hata:", error);
      toast.error("Sipariş durumu güncellenirken bir hata oluştu", {
        id: loadingToast,
      });
    } finally {
      setStatusUpdateLoading(false);
      setShowStatusModal(false);
      setOrderToUpdateStatus(null);
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
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">
                Siparişi Sil
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  <strong>#{orderToDelete.id}</strong> numaralı siparişi silmek
                  istediğinizden emin misiniz?
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setOrderToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleDeleteOrder}
                    disabled={deleteLoading === orderToDelete.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteLoading === orderToDelete.id
                      ? "Siliniyor..."
                      : "Sil"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && orderToUpdateStatus && (
        <div className="fixed inset-0  bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">
                Sipariş Durumu Değiştir
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  <strong>#{orderToUpdateStatus.id}</strong> numaralı siparişin
                  durumunu değiştirin:
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Mevcut durum:{" "}
                  <span className="font-medium">
                    {orderToUpdateStatus.status.name}
                  </span>
                </p>

                <div className="space-y-2">
                  {availableStatuses
                    .filter(
                      (status) => status.id !== orderToUpdateStatus.status.id
                    )
                    .map((status) => (
                      <button
                        key={status.id}
                        onClick={() => handleStatusUpdate(status.id)}
                        disabled={statusUpdateLoading}
                        className={`w-full px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusStyling(
                          status.color
                        ).tailwindBg.replace("100", "50")} ${
                          getStatusStyling(status.color).tailwindText
                        } ${getStatusStyling(status.color).tailwindBorder} ${
                          getStatusStyling(status.color).tailwindHover
                        } ${getStatusStyling(status.color).tailwindFocus}`}
                      >
                        {statusUpdateLoading ? "Güncelleniyor..." : status.name}
                      </button>
                    ))}
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setOrderToUpdateStatus(null);
                  }}
                  disabled={statusUpdateLoading}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                İlk siparişinizi oluşturmak için sipariş oluştur sayfasına
                gidin.
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
                          className={getStatusBadgeClasses(order.status.color)}
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
                          onClick={() => openStatusModal(order)}
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                        >
                          Durum Değiştir
                        </button>
                        <button
                          onClick={() => openDeleteModal(order)}
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
    </>
  );
}
