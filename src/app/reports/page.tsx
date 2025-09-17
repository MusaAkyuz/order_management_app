"use client";

import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { formatCurrency } from "../../utils/currency";

interface MonthlyData {
  month: string;
  monthNumber: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  paymentCount: number;
  expenseCount: number;
}

interface YearlyTotals {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalPayments: number;
  totalExpenseEntries: number;
  totalPaid: number;
}

interface ExpenseTypeTotal {
  expenseTypeName: string;
  expenseTypeColor: string;
  totalAmount: number;
  count: number;
}

interface DailyPayment {
  paymentDate: string;
  dailyTotal: number;
  paymentCount: number;
  month: string;
}

interface DetailedDailyPayment {
  paymentDate: string;
  amount: number;
  description: string | null;
  order: {
    id: number;
    totalPrice: number;
    description: string | null;
    customer: {
      name: string;
      isCompany: boolean;
    };
    status: {
      name: string;
      color: string;
    };
  };
}

interface ReportData {
  year: number;
  monthlyData: MonthlyData[];
  yearlyTotals: YearlyTotals;
  expenseTypeYearlyTotals: ExpenseTypeTotal[];
  dailyPayments: DailyPayment[];
  detailedDailyPayments: DetailedDailyPayment[];
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedView, setSelectedView] = useState<
    "monthly" | "yearly" | "payments" | "expenses"
  >("monthly");

  useEffect(() => {
    fetchReportData();
  }, [selectedYear]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports?year=${selectedYear}`);
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        console.error("Rapor verileri yüklenemedi:", data.error);
      }
    } catch (error) {
      console.error("Rapor verileri getirme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getProfitBgColor = (profit: number) => {
    if (profit > 0) return "bg-green-50";
    if (profit < 0) return "bg-red-50";
    return "bg-gray-50";
  };

  if (loading) {
    return (
      <Layout currentPage="reports">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout currentPage="reports">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Veri yüklenemedi</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="reports">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Başlık ve Kontroller */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Gelir-Gider Raporları
            </h1>
            <div className="flex gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <div className="flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setSelectedView("monthly")}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedView === "monthly"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Aylık
                </button>
                <button
                  onClick={() => setSelectedView("yearly")}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedView === "yearly"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Yıllık Özet
                </button>
                <button
                  onClick={() => setSelectedView("payments")}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedView === "payments"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Günlük Gelirler
                </button>
                <button
                  onClick={() => setSelectedView("expenses")}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedView === "expenses"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Gider Analizi
                </button>
              </div>
            </div>
          </div>

          {/* Yıllık Toplam İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Toplam Gelir</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(reportData.yearlyTotals.totalRevenue)}
              </p>
              <p className="text-xs text-blue-700">
                {reportData.yearlyTotals.totalPayments} ödeme
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Toplam Gider</p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(reportData.yearlyTotals.totalExpenses)}
              </p>
              <p className="text-xs text-red-700">
                {reportData.yearlyTotals.totalExpenseEntries} gider kaydı
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${getProfitBgColor(
                reportData.yearlyTotals.totalProfit
              )}`}
            >
              <p className="text-sm font-medium">Net Kar/Zarar</p>
              <p
                className={`text-2xl font-bold ${getProfitColor(
                  reportData.yearlyTotals.totalProfit
                )}`}
              >
                {formatCurrency(reportData.yearlyTotals.totalProfit)}
              </p>
              <p className="text-xs text-gray-700">
                %
                {reportData.yearlyTotals.totalRevenue > 0
                  ? (
                      (reportData.yearlyTotals.totalProfit /
                        reportData.yearlyTotals.totalRevenue) *
                      100
                    ).toFixed(1)
                  : "0"}{" "}
                kar marjı
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">
                Toplam Tahsilat
              </p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(reportData.yearlyTotals.totalPaid)}
              </p>
              <p className="text-xs text-green-700">
                %
                {reportData.yearlyTotals.totalRevenue > 0
                  ? (
                      (reportData.yearlyTotals.totalPaid /
                        reportData.yearlyTotals.totalRevenue) *
                      100
                    ).toFixed(1)
                  : "0"}{" "}
                tahsilat oranı
              </p>
            </div>
          </div>
        </div>

        {selectedView === "monthly" && (
          <>
            {/* Aylık Tablo */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Aylık Gelir-Gider Tablosu ({selectedYear})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ay
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gelir
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gider
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kar/Zarar
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ödeme
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gider Kaydı
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyData.map((month) => (
                      <tr key={month.monthNumber} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                          {formatCurrency(month.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                          {formatCurrency(month.totalExpenses)}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getProfitColor(
                            month.profit
                          )}`}
                        >
                          {formatCurrency(month.profit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {month.paymentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {month.expenseCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        TOPLAM
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                        {formatCurrency(reportData.yearlyTotals.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                        {formatCurrency(reportData.yearlyTotals.totalExpenses)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getProfitColor(
                          reportData.yearlyTotals.totalProfit
                        )}`}
                      >
                        {formatCurrency(reportData.yearlyTotals.totalProfit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        {reportData.yearlyTotals.totalPayments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        {reportData.yearlyTotals.totalExpenseEntries}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Günlük Gelirler Tablosu */}
        {selectedView === "payments" && (
          <div className="space-y-6">
            {/* Günlük Özet Tablosu */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Günlük Gelir Özeti ({selectedYear})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Ödemeler tablosundan tarih bazlı gelir analizi
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Günlük Toplam
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ödeme Sayısı
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.dailyPayments.map((payment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString(
                            "tr-TR"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          {formatCurrency(payment.dailyTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {payment.paymentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {payment.month}. Ay
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Toplam
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                        {formatCurrency(
                          reportData.dailyPayments.reduce(
                            (sum, payment) => sum + payment.dailyTotal,
                            0
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        {reportData.dailyPayments.reduce(
                          (sum, payment) => sum + payment.paymentCount,
                          0
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        -
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Detaylı Ödeme Listesi */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Detaylı Ödeme Listesi ({selectedYear})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tüm ödemelerin sipariş detayları ile birlikte görünümü
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ödeme Tutarı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Müşteri
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sipariş Tutarı
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Açıklama
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.detailedDailyPayments.map((payment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString(
                            "tr-TR"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {payment.order.customer.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {payment.order.customer.isCompany
                                ? "Şirket"
                                : "Bireysel"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(payment.order.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor:
                                payment.order.status.color || "#6B7280",
                            }}
                          >
                            {payment.order.status.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="space-y-1">
                            {payment.description && (
                              <div className="text-xs text-blue-600 font-medium">
                                Ödeme: {payment.description}
                              </div>
                            )}
                            {payment.order.description && (
                              <div className="text-xs text-gray-600 truncate">
                                Sipariş: {payment.order.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Sipariş ID: #{payment.order.id}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Toplam
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                        {formatCurrency(
                          reportData.detailedDailyPayments.reduce(
                            (sum, payment) => sum + payment.amount,
                            0
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        {reportData.detailedDailyPayments.length} ödeme
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {formatCurrency(
                          reportData.detailedDailyPayments.reduce(
                            (sum, payment) => sum + payment.order.totalPrice,
                            0
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-left font-bold text-gray-900">
                        -
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Gider Analizi */}
        {selectedView === "expenses" && (
          <div className="space-y-6">
            {/* Aylık Gider Dağılımı */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Aylık Gider Dağılımı ({selectedYear})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Giderler tablosundan ay bazlı analiz
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ay
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Toplam Gider
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gider Sayısı
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ortalama
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyData.map((month, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                          {formatCurrency(month.totalExpenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {month.expenseCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {month.expenseCount > 0
                            ? formatCurrency(
                                month.totalExpenses / month.expenseCount
                              )
                            : formatCurrency(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Toplam
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                        {formatCurrency(reportData.yearlyTotals.totalExpenses)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        {reportData.yearlyTotals.totalExpenseEntries}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {reportData.yearlyTotals.totalExpenseEntries > 0
                          ? formatCurrency(
                              reportData.yearlyTotals.totalExpenses /
                                reportData.yearlyTotals.totalExpenseEntries
                            )
                          : formatCurrency(0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Gider Tipi Analizi */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Gider Tipi Analizi ({selectedYear})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Gider türlerine göre detaylı dağılım
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gider Tipi
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Toplam Tutar
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adet
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ortalama
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oran (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.expenseTypeYearlyTotals.map(
                      (expenseType, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span
                              className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                              style={{
                                backgroundColor:
                                  expenseType.expenseTypeColor || "#6B7280",
                              }}
                            >
                              {expenseType.expenseTypeName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                            {formatCurrency(expenseType.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {expenseType.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {expenseType.count > 0
                              ? formatCurrency(
                                  expenseType.totalAmount / expenseType.count
                                )
                              : formatCurrency(0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {reportData.yearlyTotals.totalExpenses > 0
                              ? (
                                  (expenseType.totalAmount /
                                    reportData.yearlyTotals.totalExpenses) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedView === "yearly" && (
          <>
            {/* Gider Tipi Bazında Yıllık Dağılım */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gider Tipi Bazında Yıllık Dağılım ({selectedYear})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gider Tipi
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Toplam Tutar
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kayıt Sayısı
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yüzde
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.expenseTypeYearlyTotals.map(
                      (expenseType, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{
                                backgroundColor:
                                  expenseType.expenseTypeColor || "#6B7280",
                              }}
                            >
                              {expenseType.expenseTypeName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(expenseType.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {expenseType.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {reportData.yearlyTotals.totalExpenses > 0
                              ? (
                                  (expenseType.totalAmount /
                                    reportData.yearlyTotals.totalExpenses) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
