"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "../../components/Layout";
import SearchableSelect from "../../components/SearchableSelect";

// Zod şeması
const orderSchema = z.object({
  customerId: z.number().min(1, "Müşteri seçimi zorunludur"),
  laborCost: z.number().min(0, "İşçilik maliyeti negatif olamaz"),
  deliveryFee: z.number().min(0, "Teslimat ücreti negatif olamaz"),
  discountType: z.enum(["percentage", "amount"]),
  discountValue: z.number().min(0, "İndirim değeri negatif olamaz"),
  orderItems: z
    .array(
      z.object({
        productId: z.number().min(1, "Ürün seçimi zorunludur"),
        quantity: z.number().min(1, "Miktar en az 1 olmalıdır"),
        price: z.number().min(0.01, "Fiyat 0'dan büyük olmalıdır"),
      })
    )
    .min(1, "En az bir ürün eklemelisiniz"),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface Customer {
  id: number;
  name: string;
  email: string;
  isCompany: boolean;
}

interface Product {
  id: number;
  name: string;
  currentPrice: number;
  stock: number;
  type: {
    name: string;
  };
}

export default function CreateOrder() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

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
      laborCost: 0,
      deliveryFee: 0,
      discountType: "percentage" as const,
      discountValue: 0,
      orderItems: [{ productId: 0, quantity: 1, price: 0 }],
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
        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
        ]);

        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        if (customersData.success) {
          setCustomers(customersData.data);
        }
        if (productsData.success) {
          setProducts(productsData.data);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Ürün seçildiğinde fiyatı otomatik doldur
  const handleProductChange = (index: number, productId: number) => {
    const selectedProduct = products.find((p) => p.id === productId);
    if (selectedProduct) {
      setValue(`orderItems.${index}.price`, selectedProduct.currentPrice);
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

  // Net toplam hesaplama (Ara Toplam - İndirim)
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();

    // İndirim hesaplama
    const discountType = watch("discountType") || "percentage";
    const discountValue = watch("discountValue") || 0;

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    return Math.max(0, subtotal - discountAmount);
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

  // Form gönderimi
  const onSubmit = async (data: OrderFormData) => {
    setSubmitLoading(true);
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
        alert("Sipariş başarıyla oluşturuldu!");
        // Form resetle veya başka sayfaya yönlendir
        window.location.href = "/orders";
      } else {
        alert("Sipariş oluşturulurken hata: " + result.error);
      }
    } catch (error) {
      console.error("Sipariş gönderilirken hata:", error);
      alert("Sipariş gönderilirken bir hata oluştu");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout currentPage="create-order">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="create-order">
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-150px)]">
          {/* Sol Taraf - Sipariş Formu */}
          <div className="bg-white shadow-lg rounded-lg p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              Sipariş Bilgileri
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Müşteri Seçimi */}
              <SearchableSelect
                label="Müşteri *"
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                  description: `${customer.email} - ${
                    customer.isCompany ? "Kurumsal" : "Bireysel"
                  }`,
                }))}
                value={watch("customerId") || ""}
                onChange={(value) => setValue("customerId", Number(value))}
                placeholder="Müşteri seçin veya arayın"
                error={errors.customerId?.message}
              />

              {/* Ürünler */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-semibold text-gray-800">
                    Ürünler *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      append({ productId: 0, quantity: 1, price: 0 })
                    }
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Ürün Ekle
                  </button>
                </div>

                {/* Başlık Satırı */}
                <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-gray-700 px-2">
                  <div className="col-span-5">Ürün</div>
                  <div className="col-span-2">Adet</div>
                  <div className="col-span-2">Birim Fiyat</div>
                  <div className="col-span-2">Toplam</div>
                  <div className="col-span-1"></div>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-center bg-gray-50 border border-gray-200 rounded-md p-2 mb-2"
                  >
                    {/* Ürün Seçimi */}
                    <div className="col-span-5">
                      <SearchableSelect
                        options={products.map((product) => ({
                          value: product.id,
                          label: product.name,
                          description: `Stok: ${
                            product.stock
                          } - ₺${product.currentPrice.toFixed(2)}`,
                        }))}
                        value={watchedItems[index]?.productId || ""}
                        onChange={(value) => {
                          setValue(
                            `orderItems.${index}.productId`,
                            Number(value)
                          );
                          handleProductChange(index, Number(value));
                        }}
                        placeholder="Ürün seçin veya arayın"
                        error={errors.orderItems?.[index]?.productId?.message}
                        className="text-xs"
                      />
                    </div>

                    {/* Miktar */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        {...register(`orderItems.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
                        min="1"
                        placeholder="Miktar"
                      />
                      {errors.orderItems?.[index]?.quantity && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.orderItems[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    {/* Birim Fiyat (Sadece Görüntüleme) */}
                    <div className="col-span-2">
                      <div className="px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded text-gray-700">
                        ₺{(watchedItems[index]?.price || 0).toFixed(2)}
                      </div>
                      {/* Gizli input */}
                      <input
                        type="hidden"
                        {...register(`orderItems.${index}.price`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    {/* Ara Toplam */}
                    <div className="col-span-2">
                      <div className="px-2 py-1 text-sm font-medium text-gray-900">
                        ₺
                        {(
                          (watchedItems[index]?.quantity || 0) *
                          (watchedItems[index]?.price || 0)
                        ).toFixed(2)}
                      </div>
                    </div>

                    {/* Sil Butonu */}
                    <div className="col-span-1 flex justify-center">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Ürünü sil"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {errors.orderItems && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.orderItems.message}
                  </p>
                )}
              </div>

              {/* İşçilik, Teslimat ve İndirim */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* İşçilik Maliyeti */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    İşçilik Maliyeti (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("laborCost", { valueAsNumber: true })}
                    className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
                    placeholder="İşçilik maliyeti girin"
                  />
                  {errors.laborCost && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.laborCost.message}
                    </p>
                  )}
                </div>

                {/* Teslimat Ücreti */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Teslimat Ücreti (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("deliveryFee", { valueAsNumber: true })}
                    className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
                    placeholder="Teslimat ücreti girin"
                  />
                  {errors.deliveryFee && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.deliveryFee.message}
                    </p>
                  )}
                </div>

                {/* İndirim */}
                <div>
                  <label className="block text-sm font-semibold text-red-600 mb-2">
                    İndirim
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      {...register("discountValue", { valueAsNumber: true })}
                      className="flex-1 px-2 py-1 text-sm text-gray-800 border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-gray-600"
                      placeholder={
                        watch("discountType") === "percentage"
                          ? "Yüzde girin"
                          : "Tutar girin"
                      }
                    />
                    {/* Toggle Butonu */}
                    <div className="flex bg-gray-100 rounded p-1">
                      <button
                        type="button"
                        onClick={() => setValue("discountType", "percentage")}
                        className={`px-2 py-1 text-xs rounded transition ${
                          watch("discountType") === "percentage"
                            ? "bg-red-600 text-white"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("discountType", "amount")}
                        className={`px-2 py-1 text-xs rounded transition ${
                          watch("discountType") === "amount"
                            ? "bg-red-600 text-white"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        ₺
                      </button>
                    </div>
                  </div>
                  {errors.discountValue && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.discountValue.message}
                    </p>
                  )}
                  {/* İndirim tutarı gösterimi */}
                  {watch("discountValue") > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      -₺{calculateDiscount().toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Toplam */}
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                {/* Ara Toplam */}
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-medium">Ara Toplam:</span>
                  <span className="font-semibold">
                    ₺{calculateSubtotal().toFixed(2)}
                  </span>
                </div>

                {/* İndirim */}
                {watch("discountValue") > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span className="font-medium">
                      İndirim (
                      {watch("discountType") === "percentage"
                        ? "%" + watch("discountValue")
                        : "₺" + watch("discountValue")}
                      ):
                    </span>
                    <span className="font-semibold">
                      -₺{calculateDiscount().toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Net Toplam */}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Net Toplam:</span>
                    <span>₺{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Gönder Butonu */}
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitLoading ? "Sipariş Oluşturuluyor..." : "Sipariş Oluştur"}
              </button>
            </form>
          </div>

          {/* Sağ Taraf - PDF İşlemleri (Şimdilik Boş) */}
          <div className="bg-gray-100 shadow-lg rounded-lg p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              PDF İşlemleri
            </h2>
            <div className="text-center text-gray-600">
              <p className="font-medium">
                Fatura ve sipariş listesi PDF oluşturma özelliği
              </p>
              <p>yakında eklenecek...</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
