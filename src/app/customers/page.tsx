"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import PageHeader from "@/components/customer/PageHeader";
import CustomerTable from "@/components/customer/CustomerTable";
import CustomerFormModal from "@/components/customer/CustomerFormModal";
import LoadingSpinner from "@/components/customer/LoadingSpinner";
import Pagination from "@/components/Pagination";
import type { PaginationMeta } from "@/types/api";

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
  isCompany: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Arama girdisini debounce et
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Müşteri listesini yükle
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const response = await fetch(`/api/customers?${params.toString()}`);
      const result = await response.json();
      if (result.success && result.data) {
        setCustomers(result.data.customers ?? []);
        setPagination(result.data.pagination ?? null);
      } else {
        toast.error("Müşteriler yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Müşteriler yüklenirken hata:", error);
      toast.error("Müşteriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Modal açma/kapama
  const handleOpenModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(false);
  };

  // Düzenleme
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  // Silme
  const handleDelete = async (id: number) => {
    if (!confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) return;

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        await fetchCustomers();
        toast.success("Müşteri başarıyla silindi!");
      } else {
        toast.error(result.error || "Silme işlemi başarısız");
      }
    } catch (error) {
      console.error("Silme işleminde hata:", error);
      toast.error("Bir hata oluştu");
    }
  };

  // Form başarılı işlem sonrası
  const handleFormSuccess = () => {
    fetchCustomers();
    handleCloseModal();
  };

  if (loading && !pagination) {
    return (
      <Layout currentPage="customers">
        <div className="max-w-6xl mx-auto p-6">
          <LoadingSpinner size="lg" message="Müşteriler yükleniyor..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="customers">
      <div className="max-w-6xl mx-auto p-6">
        <PageHeader
          title="Müşteri Yönetimi"
          description="Müşterilerinizi ekleyin, düzenleyin ve yönetin"
          onAddNew={handleOpenModal}
          addButtonText="Yeni Müşteri Ekle"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Müşteri ara (isim, email, telefon, adres, vergi no...)"
          icon={
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />

        {/* Arama Sonuçları Bilgisi */}
        {debouncedSearch && pagination && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-sm text-blue-700">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                "{debouncedSearch}" araması için{" "}
                <strong>{pagination.count}</strong> sonuç bulundu
              </span>
              <button
                onClick={() => setSearchInput("")}
                className="ml-auto text-blue-600 hover:text-blue-800 underline"
              >
                Aramayı temizle
              </button>
            </div>
          </div>
        )}

        <CustomerTable
          customers={customers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchTerm={debouncedSearch}
          totalCustomers={pagination?.count}
        />

        {pagination && (
          <div className="bg-white shadow-lg rounded-xl border border-gray-200 mt-4">
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        )}

        {isModalOpen && (
          <CustomerFormModal
            editingCustomer={editingCustomer}
            onClose={handleCloseModal}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </Layout>
  );
}
