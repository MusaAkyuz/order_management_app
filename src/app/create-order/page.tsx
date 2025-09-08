"use client";

import { useState, useEffect, useMemo } from "react";
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

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CreateOrder() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: 0,
      address: "",
      description: "",
      laborCost: 0,
      deliveryFee: 0,
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

  // PDF için debounced değerler (1.5 saniye bekle)
  const debouncedCustomerId = useDebounce(watch("customerId"), 1500);
  const debouncedItems = useDebounce(watchedItems, 1500);
  const debouncedAddress = useDebounce(watch("address"), 1500);
  const debouncedDescription = useDebounce(watch("description"), 1500);
  const debouncedLaborCost = useDebounce(watch("laborCost"), 1500);
  const debouncedDeliveryFee = useDebounce(watch("deliveryFee"), 1500);
  const debouncedDiscountType = useDebounce(watch("discountType"), 1500);
  const debouncedDiscountValue = useDebounce(watch("discountValue"), 1500);

  // PDF için debounced data objesi
  const debouncedPDFData = useMemo(
    () => ({
      customer: customers.find((c) => c.id === debouncedCustomerId),
      orderItems: debouncedItems,
      address: debouncedAddress,
      description: debouncedDescription,
      laborCost: debouncedLaborCost || 0,
      deliveryFee: debouncedDeliveryFee || 0,
      discountType: debouncedDiscountType || "percentage",
      discountValue: debouncedDiscountValue || 0,
    }),
    [
      customers,
      debouncedCustomerId,
      debouncedItems,
      debouncedAddress,
      debouncedDescription,
      debouncedLaborCost,
      debouncedDeliveryFee,
      debouncedDiscountType,
      debouncedDiscountValue,
    ]
  );

  // Müşteri ve ürün listelerini yükle
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
        ]);

        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        console.log("API Response - customersData:", customersData);
        console.log("API Response - productsData:", productsData);

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

      console.log("rrrr2", result.data);

      if (result.success) {
        setCustomers(result.data.filter((c: Customer) => true));
      }
    } catch (error) {
      console.error("Müşteri listesi yenilenirken hata:", error);
    }
  };

  // Ara toplam hesaplama (Ürünler + İşçilik + Teslimat)
  const calculateSubtotal = () => {
    const itemsTotal = watchedItems.reduce((sum, item) => {
      return sum + item.quantity * item.price;
    }, 0);
    const laborCost = watch("laborCost") || 0;
    const deliveryFee = watch("deliveryFee") || 0;
    return itemsTotal + laborCost + deliveryFee;
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sol Taraf - Sipariş Formu */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <OrderFormHeader title="Sipariş Bilgileri" />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                calculateSubtotal={calculateSubtotal}
                calculateDiscount={calculateDiscount}
                calculateTotal={calculateTotal}
                discountType={watch("discountType")}
                discountValue={watch("discountValue")}
                submitLoading={submitLoading}
                onShowPDFPreview={() => setShowPDFPreview(true)}
              />
            </form>
          </div>

          {/* Sağ Taraf - PDF Önizleme ve İşlemleri */}
          <div className="bg-white shadow-lg rounded-lg p-6 overflow-y-auto">
            <PDFViewer data={debouncedPDFData} products={products} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
