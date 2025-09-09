"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import Layout from "../../../../components/Layout";
import OrderFormHeader from "../../../../components/order/OrderFormHeader";
import CustomerInfo from "../../../../components/order/CustomerInfo";
import OrderItems from "../../../../components/order/OrderItems";
import AdditionalCosts from "../../../../components/order/AdditionalCosts";
import OrderSummary from "../../../../components/order/OrderSummary";
import LoadingSpinner from "../../../../components/order/LoadingSpinner";
import { Customer, Product } from "../../../../types/api";

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

export default function EditOrder() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [taxRate, setTaxRate] = useState(18); // KDV oranı

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
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

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "orderItems",
  });

  const watchedItems = watch("orderItems");

  // Mevcut siparişi yükle
  useEffect(() => {
    async function fetchOrderData() {
      if (!orderId) return;

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();

        if (result.success && result.data) {
          const order = result.data;

          // Form verilerini doldur
          reset({
            customerId: order.customerId,
            address: order.address || "",
            description: order.description || "",
            laborCost: order.laborCost || 0,
            deliveryFee: order.deliveryFee || 0,
            taxRate: order.taxRate || 18,
            discountType: order.discountType || "percentage",
            discountValue: order.discountValue || 0,
            orderItems: order.orderItems.map((item: any) => ({
              productId: item.productId || 0,
              quantity: item.quantity,
              price: item.price,
              isManual: item.isManual || false,
              manualName: item.manualName || "",
            })),
          });
        } else {
          toast.error("Sipariş bulunamadı");
          router.push("/orders");
        }
      } catch (error) {
        console.error("Sipariş yüklenirken hata:", error);
        toast.error("Sipariş yüklenirken hata oluştu");
        router.push("/orders");
      }
    }

    fetchOrderData();
  }, [orderId, reset, router]);

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

      console.log("rrrr2", result.data);

      if (result.success) {
        setCustomers(result.data.filter((c: Customer) => true));
      }
    } catch (error) {
      console.error("Müşteri listesi yenilenirken hata:", error);
    }
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

  // Form gönderimi - UPDATE için
  const onSubmit = async (data: OrderFormData) => {
    setSubmitLoading(true);

    const loadingToast = toast.loading("Sipariş güncelleniyor...");

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Sipariş başarıyla güncellendi!", {
          id: loadingToast,
        });
        router.push("/orders");
      } else {
        toast.error(result.error || "Sipariş güncellenirken hata oluştu", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Sipariş güncellenirken hata:", error);
      toast.error("Sipariş güncellenirken bir hata oluştu", {
        id: loadingToast,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout currentPage="orders">
        <div className="min-h-screen bg-gray-50 p-4">
          <LoadingSpinner message="Veriler yükleniyor..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="orders">
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Ana Sipariş Düzenleme Formu - Tek Kolon */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <OrderFormHeader title="Sipariş Düzenle" />

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
                isEditMode={true}
              />
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
