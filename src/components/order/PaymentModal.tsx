import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

const paymentSchema = z.object({
  amount: z.number().positive("Ödeme tutarı 0'dan büyük olmalıdır"),
  date: z.string().min(1, "Tarih seçilmelidir"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number;
    customerId: number;
    totalPrice: number;
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
      onClose();
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

  const setFullAmount = () => {
    setValue("amount", order.totalPrice);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Ödeme Yap
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

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Sipariş:</strong> #{order.id}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Müşteri:</strong> {order.customer.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Toplam Tutar:</strong> ₺{order.totalPrice.toFixed(2)}
            </p>
          </div>

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
                  placeholder="Ödeme tutarını girin"
                  {...register("amount", { valueAsNumber: true })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={setFullAmount}
                  className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Tamamı
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
                İptal
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
      </div>
    </div>
  );
}
