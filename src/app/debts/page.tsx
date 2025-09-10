"use client";

import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { formatCurrency } from "../../utils/currency";

interface CustomerDebt {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  isCompany: boolean;
  totalOrderAmount: number;
  totalPaidAmount: number;
  remainingDebt: number;
  orderCount: number;
}

interface DebtStats {
  totalCustomers: number;
  customersWithDebt: number;
  totalDebt: number;
  totalOrderAmount: number;
  totalPaidAmount: number;
}

export default function DebtsPage() {
  const [customers, setCustomers] = useState<CustomerDebt[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerDebt[]>(
    []
  );
  const [stats, setStats] = useState<DebtStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyWithDebt, setShowOnlyWithDebt] = useState(true);

  useEffect(() => {
    fetchDebts();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, showOnlyWithDebt]);

  const fetchDebts = async () => {
    try {
      const response = await fetch("/api/debts");
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data.customers);
        setStats(data.data.stats);
      } else {
        console.error("Borç verileri yüklenemedi:", data.error);
      }
    } catch (error) {
      console.error("Borç verileri getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Sadece borcu olanları göster filtresi
    if (showOnlyWithDebt) {
      filtered = filtered.filter((customer) => customer.remainingDebt > 0);
    }

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.email &&
            customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.phone && customer.phone.includes(searchTerm))
      );
    }

    setFilteredCustomers(filtered);
  };

  if (loading) {
    return (
      <Layout currentPage="debts">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="debts">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Başlık ve İstatistikler */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Müşteri Borçları
          </h1>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">
                  Toplam Müşteri
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalCustomers}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Borcu Olan</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.customersWithDebt}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">
                  Toplam Borç
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {formatCurrency(stats.totalDebt)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">
                  Toplam Ödenen
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(stats.totalPaidAmount)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">
                  Sipariş Toplamı
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(stats.totalOrderAmount)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filtreler */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Müşteri adı, email veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWithDebt}
                onChange={(e) => setShowOnlyWithDebt(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Sadece borcu olanları göster
              </span>
            </label>
          </div>
        </div>

        {/* Müşteri Listesi */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sipariş Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ödenen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kalan Borç
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                              {customer.isCompany && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Firma
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {customer.email && <div>{customer.email}</div>}
                          {customer.phone && <div>{customer.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(customer.totalOrderAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(customer.totalPaidAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            customer.remainingDebt > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {formatCurrency(customer.remainingDebt)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {showOnlyWithDebt
                        ? "Borcu olan müşteri bulunamadı"
                        : "Müşteri bulunamadı"}
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
