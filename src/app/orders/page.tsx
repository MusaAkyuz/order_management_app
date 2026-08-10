"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import PaymentModal from "../../components/order/PaymentModal";
import Pagination from "../../components/Pagination";
import {
  getStatusBadgeClasses,
  getStatusStyling,
} from "../../constants/orderStatus";
import type { PaginationMeta } from "@/types/api";

interface Order {
  id: number;
  totalPrice: number;
  totalPaid: number;
  remainingPayment: number;
  laborCost: number;
  deliveryFee: number;
  createdAt: string;
  customer: {
    id: number;
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

interface CustomerOption {
  id: number;
  name: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [orderToUpdateStatus, setOrderToUpdateStatus] = useState<Order | null>(
    null
  );
  const [availableStatuses, setAvailableStatuses] = useState<OrderStatus[]>([]);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderToPayment, setOrderToPayment] = useState<Order | null>(null);

  const hasActiveFilters = Boolean(
    debouncedSearch.trim() || statusFilter || customerFilter || startDate || endDate
  );

  // Arama girdisini debounce et
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusFilter) params.set("statusId", statusFilter);
      if (customerFilter) params.set("customerId", customerFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data.orders)) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);

        // Filtre değişimi sonrası mevcut sayfa aralık dışında kaldıysa son sayfaya dön
        if (
          data.data.pagination &&
          data.data.pagination.total > 0 &&
          page > data.data.pagination.total
        ) {
          setPage(data.data.pagination.total);
        }
      } else {
        console.error("Siparişler yüklenemedi:", data.error);
        setOrders([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Siparişler getirilirken hata:", error);
      setOrders([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, customerFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  // Müşteri filtre listesini yükle (sayfalama parametresi göndermeden -> tam liste)
  useEffect(() => {
    async function fetchCustomerOptions() {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setCustomerOptions(data.data);
        }
      } catch (error) {
        console.error("Müşteri listesi yüklenirken hata:", error);
      }
    }

    fetchCustomerOptions();
  }, []);

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setCustomerFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

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

        // Listeyi güncel filtre/sayfa ile yeniden yükle
        await fetchOrders();
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

  // Ödeme modal açma fonksiyonu
  const openPaymentModal = (order: Order) => {
    setOrderToPayment(order);
    setShowPaymentModal(true);
  };

  // Ödeme başarılı callback
  const handlePaymentSuccess = async () => {
    // Sipariş listesini güncel filtre/sayfa ile yeniden yükle
    await fetchOrders();

    // Modal'ı kapat
    setShowPaymentModal(false);
    setOrderToPayment(null);
  };

  if (loading && !pagination) {
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

      {/* Payment Modal */}
      {showPaymentModal && orderToPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setOrderToPayment(null);
          }}
          order={{
            id: orderToPayment.id,
            customerId: orderToPayment.customer.id,
            totalPrice: orderToPayment.totalPrice,
            totalPaid: orderToPayment.totalPaid,
            remainingPayment: orderToPayment.remainingPayment,
            customer: {
              name: orderToPayment.customer.name,
            },
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <Layout currentPage="orders">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
              <p className="text-gray-600">
                Tüm siparişleri görüntüleyin ve yönetin
              </p>
            </div>
            <a
              href="/create-order"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
            >
              Yeni Sipariş
            </a>
          </div>

          {/* Filtreler */}
          <div className="mb-6 p-4 bg-white shadow-sm rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ara
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
                    placeholder="Sipariş no, müşteri veya ürün ara..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg
                        className="h-4 w-4 text-gray-400 hover:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tüm durumlar</option>
                  {availableStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Müşteri
                </label>
                <select
                  value={customerFilter}
                  onChange={(e) => {
                    setCustomerFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tüm müşteriler</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-3">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Filtreleri temizle
                </button>
              </div>
            )}
          </div>

          {!pagination || pagination.count === 0 ? (
            hasActiveFilters ? (
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Arama sonucu bulunamadı
                </h3>
                <p className="text-gray-500 mb-4">
                  Filtrelere uygun sipariş bulunamadı.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
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
            )
          ) : (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Toplam {pagination.count} sipariş
                  {loading && (
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      güncelleniyor...
                    </span>
                  )}
                </h2>
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
                      Kalan Ödeme
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            order.remainingPayment > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          ₺{order.remainingPayment?.toFixed(2) || "0.00"}
                        </span>
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
                          onClick={() => openPaymentModal(order)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          Ödeme İşlemleri
                        </button>
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

              <Pagination
                pagination={pagination}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
