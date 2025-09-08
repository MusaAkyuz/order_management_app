"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";
import PDFViewer from "../../../components/pdf/PDFViewer";
import { Order, Product, OrderStatus, Customer } from "../../../types/api";

interface OrderWithDetails {
  id: number;
  totalPrice: number;
  laborCost: number;
  deliveryFee: number;
  taxRate: number;
  discountType: string;
  discountValue: number;
  address: string | null;
  description: string | null;
  customerId: number;
  statusId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  status: {
    name: string;
    color: string;
  };
  orderItems: {
    id: number;
    quantity: number;
    price: number;
    productId: number;
    isManual?: boolean;
    manualName?: string;
    product?: {
      id: number;
      name: string;
      currentPrice: number;
      type: {
        name: string;
      };
    };
  }[];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function OrderDetail({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const orderId = resolvedParams?.id;

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderAndProducts = async () => {
      try {
        setLoading(true);

        // Sipariş detaylarını getir
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        console.log("Order response status:", orderResponse.status);

        const orderData = await orderResponse.json();

        console.log("Order API response:", orderData);
        console.log("Order ID:", orderId);

        if (!orderResponse.ok || !orderData.success) {
          console.error("Order fetch failed:", orderData.error);
          setError(orderData.error || "Sipariş bulunamadı");
          return;
        }

        // Ürünleri getir
        const productsResponse = await fetch("/api/products");
        const productsData = await productsResponse.json();

        console.log("Products API response:", productsData);

        if (productsData.success) {
          setProducts(productsData.data);
          console.log("Products set:", productsData.data);
        } else {
          console.error("Products fetch failed:", productsData.error);
        }

        setOrder(orderData.data);
      } catch (error) {
        console.error("Sipariş yüklenirken hata:", error);
        setError("Sipariş yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndProducts();
  }, [orderId]);

  if (loading) {
    return (
      <Layout currentPage="orders">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout currentPage="orders">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || "Sipariş bulunamadı"}
            </h3>
            <button
              onClick={() => router.push("/orders")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Siparişlere Geri Dön
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // PDF için veri hazırla
  const pdfData = {
    customer: order.customer,
    orderItems: order.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            currentPrice: item.product.currentPrice,
            stock: 0, // PDFViewer için gerekli ama kullanılmıyor
            isActive: true, // PDFViewer için gerekli ama kullanılmıyor
            typeId: 1, // PDFViewer için gerekli ama kullanılmıyor
            type: {
              id: 1, // PDFViewer için gerekli ama kullanılmıyor
              name: item.product.type.name,
            },
          }
        : undefined,
      isManual: item.isManual || false,
      manualName: item.manualName || "",
    })),
    address: order.address || "",
    description: order.description || "",
    laborCost: order.laborCost || 0,
    deliveryFee: order.deliveryFee || 0,
    discountType: (order.discountType as "percentage" | "amount") || "amount",
    discountValue: order.discountValue || 0,
    orderNumber: order.id.toString(),
    orderDate: new Date(order.createdAt).toLocaleDateString("tr-TR"),
    status: order.status?.name || "",
  };

  return (
    <Layout currentPage="orders">
      <div className="max-w-full mx-auto px-4 py-8">
        {/* İki Kolunlu Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
          {/* Sol Taraf - Sipariş Bilgileri */}
          <div className="lg:col-span-1 space-y-6">
            {/* Header */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sipariş #{order.id} - Görüntüle
              </h1>
              <p className="text-gray-600 mb-4">
                {order.customer.name} -{" "}
                {new Date(order.createdAt).toLocaleDateString("tr-TR")}
              </p>

              {/* Sipariş Durumu */}
              <div className="mb-4">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    order.status?.color === "yellow"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status?.color === "green"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.status?.name || "Bilinmeyen Durum"}
                </span>
              </div>

              {/* Geri Dön Butonu */}
              <button
                onClick={() => router.push("/orders")}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Geri Dön
              </button>
            </div>

            {/* Sipariş Detayları */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Sipariş Detayları
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">
                    Toplam Tutar:
                  </span>
                  <span className="font-semibold text-gray-800">
                    ₺{order.totalPrice.toFixed(2)}
                  </span>
                </div>

                {order.laborCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">İşçilik:</span>
                    <span className="font-semibold text-gray-800">
                      ₺{order.laborCost.toFixed(2)}
                    </span>
                  </div>
                )}

                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Teslimat:</span>
                    <span className="font-semibold text-gray-800">
                      ₺{order.deliveryFee.toFixed(2)}
                    </span>
                  </div>
                )}

                {order.address && (
                  <div>
                    <span className="text-gray-700 font-medium block mb-1">
                      Teslimat Adresi:
                    </span>
                    <p className="text-sm text-gray-800">{order.address}</p>
                  </div>
                )}

                {order.description && (
                  <div>
                    <span className="text-gray-700 font-medium block mb-1">
                      Açıklama:
                    </span>
                    <p className="text-sm text-gray-800">{order.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Müşteri Bilgileri */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Müşteri Bilgileri
              </h2>

              <div className="space-y-2">
                <div>
                  <span className="text-gray-700 font-medium">Ad:</span>
                  <span className="ml-2 text-gray-800">
                    {order.customer.name}
                  </span>
                </div>

                <div>
                  <span className="text-gray-700 font-medium">Tip:</span>
                  <span className="ml-2 text-gray-800">
                    {order.customer.isCompany ? "Kurumsal" : "Bireysel"}
                  </span>
                </div>

                {order.customer.email && (
                  <div>
                    <span className="text-gray-700 font-medium">E-posta:</span>
                    <span className="ml-2 text-gray-800">
                      {order.customer.email}
                    </span>
                  </div>
                )}

                {order.customer.phone && (
                  <div>
                    <span className="text-gray-700 font-medium">Telefon:</span>
                    <span className="ml-2 text-gray-800">
                      {order.customer.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ Taraf - PDF Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden h-full">
              <PDFViewer data={pdfData} products={products} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
