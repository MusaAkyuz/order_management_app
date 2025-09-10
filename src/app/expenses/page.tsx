"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { formatCurrency } from "../../utils/currency";

const expenseSchema = z.object({
  expenseTypeId: z.number().min(1, "Gider tipi seçilmelidir"),
  amount: z.number().positive("Tutar 0'dan büyük olmalıdır"),
  expenseDate: z.string().min(1, "Tarih seçilmelidir"),
  description: z.string().optional(),
  receiptNumber: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseType {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

interface Expense {
  id: number;
  amount: number;
  expenseDate: string;
  description?: string;
  receiptNumber?: string;
  expenseType: ExpenseType;
}

interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  expensesByType: Array<{
    expenseTypeId: number;
    _sum: { amount: number };
    _count: { id: number };
    expenseType: ExpenseType;
  }>;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedExpenseType, setSelectedExpenseType] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    fetchExpenseTypes();
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate, selectedExpenseType]);

  const fetchExpenseTypes = async () => {
    try {
      const response = await fetch("/api/expense-types");
      const data = await response.json();

      if (data.success) {
        setExpenseTypes(data.data);
      } else {
        toast.error("Gider tipleri yüklenemedi");
      }
    } catch (error) {
      console.error("Gider tipleri getirme hatası:", error);
      toast.error("Gider tipleri yüklenemedi");
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedExpenseType)
        params.append("expenseTypeId", selectedExpenseType);
      params.append("limit", "50"); // Daha fazla kayıt göster

      const response = await fetch(`/api/expenses?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setExpenses(data.data.expenses);
        setStats(data.data.stats);
      } else {
        toast.error("Giderler yüklenemedi");
      }
    } catch (error) {
      console.error("Giderler getirme hatası:", error);
      toast.error("Giderler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setSubmitting(true);
    const loadingToast = toast.loading("Gider kaydediliyor...");

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gider kaydedilemedi");
      }

      toast.success("Gider başarıyla kaydedildi!", {
        id: loadingToast,
      });

      reset();
      setShowForm(false);
      await fetchExpenses(); // Listeyi yenile
    } catch (error) {
      console.error("Gider kaydetme hatası:", error);
      toast.error(
        error instanceof Error ? error.message : "Gider kaydedilemedi",
        {
          id: loadingToast,
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedExpenseType("");
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Modal backdrop'a tıklandığında modal'ı kapat
    if (e.target === e.currentTarget) {
      setShowForm(false);
    }
  };

  if (loading && !expenses.length) {
    return (
      <Layout currentPage="expenses">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="expenses">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Başlık ve İstatistikler */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Şirket Giderleri
            </h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Yeni Gider Ekle
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">
                  Toplam Gider Sayısı
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalCount}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">
                  Toplam Gider Tutarı
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">
                  Gider Tipi Sayısı
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.expensesByType.length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Yeni Gider Modal */}
        {showForm && (
          <div
            className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50"
            onClick={handleModalClick}
          >
            <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Yeni Gider Ekle
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gider Tipi *
                      </label>
                      <select
                        {...register("expenseTypeId", { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Gider tipi seçin</option>
                        {expenseTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      {errors.expenseTypeId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.expenseTypeId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tutar (₺) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Gider tutarını girin"
                        {...register("amount", { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.amount.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tarih *
                      </label>
                      <input
                        type="date"
                        {...register("expenseDate")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.expenseDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.expenseDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fiş/Fatura No
                      </label>
                      <input
                        type="text"
                        placeholder="Fiş veya fatura numarası"
                        {...register("receiptNumber")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Gider hakkında açıklama..."
                      {...register("description")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={submitting}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Filtreler */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gider Tipi
              </label>
              <select
                value={selectedExpenseType}
                onChange={(e) => setSelectedExpenseType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tüm tipler</option>
                {expenseTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Gider Listesi */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gider Tipi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fiş No
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.expenseDate).toLocaleDateString(
                          "tr-TR"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{
                            backgroundColor:
                              expense.expenseType.color || "#6B7280",
                          }}
                        >
                          {expense.expenseType.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {expense.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.receiptNumber || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {loading ? "Yükleniyor..." : "Gider bulunamadı"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
