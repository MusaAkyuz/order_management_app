import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

const paymentSchema = z.object({
  amount: z.number().positive("Ödeme tutarı 0'dan büyük olmalıdır"),
  date: z.string().min(1, "Tarih seçilmelidir"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
  description?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number;
    customerId: number;
    totalPrice: number;
    totalPaid?: number;
    remainingPayment?: number;
    customer: {
      name: string;
    };
  };
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [remainingAmount, setRemainingAmountState] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  // Geçmiş ödemeleri getir
  useEffect(() => {
    if (isOpen) {
      // Eğer sipariş verisinde ödeme bilgileri varsa, bunları kullan
      if (
        order.totalPaid !== undefined &&
        order.remainingPayment !== undefined
      ) {
        // Ödeme verilerini API'den yüklemeye gerek yok, mevcut verileri kullan
        setRemainingAmountState(order.remainingPayment);
        // Geçmiş ödemeleri yine de getir (detaylı liste için)
        fetchPayments();
      } else {
        // Eski davranış: API'den hesapla
        fetchPayments();
      }
    }
  }, [isOpen, order.id, order.totalPaid, order.remainingPayment]);

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      console.log("Fetching payments for order ID:", order.id);
      const response = await fetch(`/api/payments?orderId=${order.id}`);
      const result = await response.json();
      console.log("Payment API response:", result);

      if (result.success) {
        setPayments(result.data);

        // Eğer sipariş verisinde kalan tutar yoksa, API'den hesapla
        if (order.remainingPayment === undefined) {
          const totalPaid = result.data.reduce(
            (sum: number, payment: Payment) => sum + payment.amount,
            0
          );
          const remaining = Math.max(0, order.totalPrice - totalPaid);
          setRemainingAmountState(remaining);
        }
        // Varsa zaten useEffect'te set edildi
      }
    } catch (error) {
      console.error("Ödemeler yüklenirken hata:", error);
      toast.error("Ödemeler yüklenemedi");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true);
    const loadingToast = toast.loading("Ödeme kaydediliyor...");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id.toString(),
          customerId: order.customerId.toString(),
          amount: data.amount,
          paymentDate: new Date(data.date).toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : result.error?.message || "Ödeme kaydedilemedi";
        throw new Error(errorMessage);
      }

      toast.success("Ödeme başarıyla kaydedildi!", {
        id: loadingToast,
      });

      reset();
      await fetchPayments(); // Ödemeleri yeniden yükle
      onPaymentSuccess();
    } catch (error) {
      console.error("Ödeme kaydedilirken hata:", error);
      toast.error(
        error instanceof Error ? error.message : "Ödeme kaydedilemedi",
        {
          id: loadingToast,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const setRemainingAmount = () => {
    setValue("amount", remainingAmount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Ödeme İşlemleri
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg
                className="h-6 w-6"
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
          </div>

          {/* Sipariş Bilgileri */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Sipariş:</strong> #{order.id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Müşteri:</strong> {order.customer.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Toplam Tutar:</strong> ₺{order.totalPrice.toFixed(2)}
                </p>
                {order.totalPaid !== undefined && (
                  <p className="text-sm text-gray-600">
                    <strong>Ödenen Tutar:</strong> ₺{order.totalPaid.toFixed(2)}
                  </p>
                )}
                <p
                  className={`text-sm font-medium ${
                    remainingAmount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  <strong>Kalan Tutar:</strong> ₺{remainingAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Geçmiş Ödemeler */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Geçmiş Ödemeler
            </h4>
            {paymentsLoading ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500">
                  Ödemeler yükleniyor...
                </div>
              </div>
            ) : payments.length > 0 ? (
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Tarih
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Tutar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString(
                            "tr-TR"
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          ₺{payment.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                Henüz ödeme yapılmamış
              </div>
            )}
          </div>

          {/* Yeni Ödeme Formu - Sadece kalan tutar varsa göster */}
          {remainingAmount > 0 && (
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Yeni Ödeme
              </h4>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ödeme Tutarı (₺)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={remainingAmount}
                      placeholder="Ödeme tutarını girin"
                      {...register("amount", { valueAsNumber: true })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={setRemainingAmount}
                      className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Kalan Tutarı Öde
                    </button>
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    {...register("date")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Kaydediliyor..." : "Ödeme Yap"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Kalan tutar yoksa bilgi mesajı göster */}
          {remainingAmount <= 0 && (
            <div className="border-t pt-6">
              <div className="text-center py-6">
                <div className="text-green-600 mb-2">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Sipariş Ödemesi Tamamlandı
                </h4>
                <p className="text-sm text-gray-600">
                  Bu siparişin tüm ödemeleri tamamlanmıştır.
                </p>
                <div className="mt-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
