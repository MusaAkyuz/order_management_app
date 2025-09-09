"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import OrderFormHeader from "../../components/order/OrderFormHeader";
import CustomerInfo from "../../components/order/CustomerInfo";
import OrderItems from "../../components/order/OrderItems";
import AdditionalCosts from "../../components/order/AdditionalCosts";
import OrderSummary from "../../components/order/OrderSummary";
import LoadingSpinner from "../../components/order/LoadingSpinner";
import PDFViewer from "../../components/pdf/PDFViewer";
import { Customer, Product } from "../../types/api";

// Zod şeması
const orderSchema = z.object({
  customerId: z.number().min(1, "Müşteri seçimi zorunludur"),
  address: z.string(),
  description: z.string(),
  laborCost: z.number().min(0, "İşçilik maliyeti negatif olamaz"),
  deliveryFee: z.number().min(0, "Teslimat ücreti negatif olamaz"),
  taxRate: z
    .number()
    .min(0, "KDV oranı negatif olamaz")
    .max(100, "KDV oranı 100'den fazla olamaz"),
  discountType: z.enum(["percentage", "amount"]),
  discountValue: z.number().min(0, "İndirim değeri negatif olamaz"),
  orderItems: z
    .array(
      z
        .object({
          productId: z.number().min(0),
          quantity: z.number().min(1, "Miktar en az 1 olmalıdır"),
          price: z.number().min(0.01, "Fiyat 0'dan büyük olmalıdır"),
          isManual: z.boolean().optional(),
          manualName: z.string().optional(),
        })
        .refine(
          (data) => {
            // Manuel ürün ise productId 0 olabilir, ama manualName dolu olmalı
            if (data.isManual) {
              return data.manualName && data.manualName.trim().length > 0;
            }
            // Manuel değilse productId dolu olmalı
            return data.productId > 0;
          },
          {
            message: "Ürün seçimi veya manuel ürün adı zorunludur",
            path: ["productId"],
          }
        )
    )
    .min(1, "En az bir ürün eklemelisiniz"),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function CreateOrder() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [taxRate, setTaxRate] = useState(18); // KDV oranı
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: 0,
      address: "",
      description: "",
      laborCost: 0,
      deliveryFee: 0,
      taxRate: 18,
      discountType: "percentage" as const,
      discountValue: 0,
      orderItems: [
        {
          productId: 0,
          quantity: 1,
          price: 0,
          isManual: false,
          manualName: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "orderItems",
  });

  const watchedItems = watch("orderItems");

  // Müşteri ve ürün listelerini yükle
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [customersRes, productsRes, taxRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
          fetch("/api/lookup?category=TAX_RATES&key=VAT_18"),
        ]);

        const customersData = await customersRes.json();
        const productsData = await productsRes.json();
        const taxData = await taxRes.json();

        console.log("API Response - customersData:", customersData);
        console.log("API Response - productsData:", productsData);
        console.log("API Response - taxData:", taxData);

        if (customersData.success) {
          setCustomers(customersData.data.filter((c: Customer) => true));
          console.log(
            "Filtered customers:",
            customersData.data.filter((c: Customer) => c.isActive)
          );
        } else {
          console.error("Customers API error:", customersData);
          toast.error("Müşteriler yüklenirken hata oluştu");
        }

        if (productsData.success) {
          setProducts(productsData.data.filter((p: Product) => p.isActive));
        } else {
          toast.error("Ürünler yüklenirken hata oluştu");
        }

        if (taxData.success && taxData.data.length > 0) {
          setTaxRate(parseFloat(taxData.data[0].value) || 18);
        } else {
          console.log("Tax data not found, using default 18%");
          setTaxRate(18);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        toast.error("Veriler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Yeni müşteri eklendikten sonra listeyi yenile
  const handleCustomerCreated = async (newCustomer: Customer) => {
    try {
      const response = await fetch("/api/customers");
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data.filter((c: Customer) => true));
      }

      location.reload();
    } catch (error) {
      console.error("Müşteri listesi yenilenirken hata:", error);
    }
  };

  // PDF için mevcut form verilerini al
  const getCurrentPDFData = () => {
    const currentValues = watch();
    return {
      customer: customers.find((c) => c.id === currentValues.customerId),
      orderItems: currentValues.orderItems || [],
      address: currentValues.address || "",
      description: currentValues.description || "",
      laborCost: currentValues.laborCost || 0,
      deliveryFee: currentValues.deliveryFee || 0,
      discountType: currentValues.discountType || "percentage",
      discountValue: currentValues.discountValue || 0,
    };
  };

  // Ürünler toplamını hesapla (KDV hariç)
  const calculateItemsTotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + item.quantity * item.price;
    }, 0);
  };

  // KDV tutarını hesapla
  const calculateTaxAmount = () => {
    const itemsTotal = calculateItemsTotal();
    return (itemsTotal * taxRate) / 100;
  };

  // Ara toplam hesaplama (Ürünler + KDV + İşçilik + Teslimat)
  const calculateSubtotal = () => {
    const itemsTotal = calculateItemsTotal();
    const taxAmount = calculateTaxAmount();
    const laborCost = watch("laborCost") || 0;
    const deliveryFee = watch("deliveryFee") || 0;
    return itemsTotal + taxAmount + laborCost + deliveryFee;
  };

  // İndirim tutarını hesapla
  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    const discountType = watch("discountType") || "percentage";
    const discountValue = watch("discountValue") || 0;

    if (discountType === "percentage") {
      return (subtotal * discountValue) / 100;
    } else {
      return discountValue;
    }
  };

  // Net toplam hesaplama (Ara Toplam - İndirim)
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscount();
    return Math.max(0, subtotal - discountAmount);
  };

  // Form gönderimi
  const onSubmit = async (data: OrderFormData) => {
    setSubmitLoading(true);

    const loadingToast = toast.loading("Sipariş oluşturuluyor...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Sipariş başarıyla oluşturuldu!", {
          id: loadingToast,
        });
        router.push("/orders");
      } else {
        toast.error(result.error || "Sipariş oluşturulurken hata oluştu", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Sipariş gönderilirken hata:", error);
      toast.error("Sipariş gönderilirken bir hata oluştu", {
        id: loadingToast,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout currentPage="create-order">
        <div className="min-h-screen bg-gray-50 p-4">
          <LoadingSpinner message="Veriler yükleniyor..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="create-order">
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Ana Sipariş Formu - Tek Kolon */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <OrderFormHeader title="Sipariş Bilgileri" />

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              autoComplete="off"
            >
              <CustomerInfo
                customers={customers}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                onCustomerCreated={handleCustomerCreated}
              />

              <OrderItems
                products={products}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                fields={fields}
                append={append}
                remove={remove}
              />

              <AdditionalCosts
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                calculateDiscount={calculateDiscount}
              />

              <OrderSummary
                calculateItemsTotal={calculateItemsTotal}
                calculateTaxAmount={calculateTaxAmount}
                calculateSubtotal={calculateSubtotal}
                calculateDiscount={calculateDiscount}
                calculateTotal={calculateTotal}
                taxRate={taxRate}
                laborCost={watch("laborCost") || 0}
                deliveryFee={watch("deliveryFee") || 0}
                discountType={watch("discountType")}
                discountValue={watch("discountValue")}
                submitLoading={submitLoading}
                onShowPDFPreview={() => setShowPDFPreview(true)}
              />
            </form>
          </div>
        </div>

        {/* PDF Popup Modal */}
        {showPDFPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Sipariş Fişi Önizleme
                </h3>
                <button
                  onClick={() => setShowPDFPreview(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  type="button"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 p-4 overflow-hidden">
                <PDFViewer data={getCurrentPDFData()} products={products} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
