"use client";
import { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import ProductPageHeader from "../../components/product/ProductPageHeader";
import ProductTable from "../../components/product/ProductTable";
import ProductFormModal from "../../components/product/ProductFormModal";
import StockEditModal from "../../components/product/StockEditModal";
import BulkPriceUpdateModal from "../../components/product/BulkPriceUpdateModal";
import LoadingSpinner from "../../components/product/LoadingSpinner";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";
import type { PaginationMeta } from "@/types/api";

interface Product {
  id: number;
  name: string;
  currentPrice: number;
  stock: number;
  minStockLevel?: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: {
    id: number;
    name: string;
    description?: string;
  };
}

interface ProductType {
  id: number;
  name: string;
  description?: string;
}

interface ProductFormData {
  name: string;
  currentPrice: number;
  stock: number;
  minStockLevel?: number;
  description?: string;
  typeId: number;
  isActive?: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStockProduct, setEditingStockProduct] =
    useState<Product | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Arama girdisini debounce et
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Stok uyarıları için helper fonksiyon (mevcut sayfadaki ürünler için)
  const getLowStockProducts = () => {
    return products.filter(
      (product) =>
        product.minStockLevel &&
        product.stock <= product.minStockLevel &&
        product.isActive
    );
  };

  const lowStockCount = getLowStockProducts().length;

  // Ürünleri yükle
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (typeFilter) params.set("typeId", typeFilter);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setProducts(data.data.products ?? []);
        setPagination(data.data.pagination ?? null);
      } else {
        toast.error("Ürünler yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      toast.error("Ürünler yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, typeFilter]);

  // Ürün tiplerini yükle
  const fetchProductTypes = async () => {
    try {
      const response = await fetch("/api/product-types");
      const data = await response.json();

      if (data.success) {
        setProductTypes(data.data);
      } else {
        toast.error("Ürün tipleri yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Fetch product types error:", error);
      toast.error("Ürün tipleri yüklenirken hata oluştu");
    }
  };

  // Ürün tiplerini bir kez yükle
  useEffect(() => {
    fetchProductTypes();
  }, []);

  // Ürünleri sayfa/limit/arama/tip filtresi değiştikçe yeniden çek
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Yeni ürün ekleme
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Ürün düzenleme
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Stok düzenleme
  const handleEditStock = (product: Product) => {
    setEditingStockProduct(product);
    setIsStockModalOpen(true);
  };

  // Ürün kaydetme (yeni ekle veya güncelle)
  const handleSaveProduct = async (formData: ProductFormData) => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchProducts(); // Listeyi yenile
        setIsModalOpen(false);
        setEditingProduct(null);
      } else {
        toast.error(data.error || "Bir hata oluştu");
      }
    } catch (error) {
      console.error("Save product error:", error);
      toast.error("Bir hata oluştu");
    }
  };

  // Stok güncelleme
  const handleSaveStock = async (productId: number, newStock: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stock: newStock,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchProducts(); // Listeyi yenile
        setIsStockModalOpen(false);
        setEditingStockProduct(null);
      } else {
        throw new Error(data.error || "Stok güncellenirken hata oluştu");
      }
    } catch (error) {
      throw error; // StockEditModal'da yakalanacak
    }
  };

  // Tek ürün silme
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Ürün başarıyla silindi");
        await fetchProducts(); // Listeyi yenile
      } else {
        toast.error(data.error || "Ürün silinirken hata oluştu");
      }
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error("Ürün silinirken hata oluştu");
    }
  };

  // Toplu ürün silme
  const handleBulkDeleteProducts = async (productIds: number[]) => {
    if (
      !confirm(`${productIds.length} ürünü silmek istediğinizden emin misiniz?`)
    ) {
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.data.deletedCount} ürün başarıyla silindi`);
        await fetchProducts(); // Listeyi yenile
      } else {
        toast.error(data.error || "Ürünler silinirken hata oluştu");
      }
    } catch (error) {
      console.error("Bulk delete products error:", error);
      toast.error("Ürünler silinirken hata oluştu");
    }
  };

  // İstatistikler (mevcut sayfadaki ürünler için)
  const activeProducts = products.filter((p) => p.isActive).length;

  if (isLoading && !pagination) {
    return (
      <Layout currentPage="products">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSpinner message="Ürünler yükleniyor..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="products">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductPageHeader
          onAddProduct={handleAddProduct}
          onBulkPriceUpdate={() => setIsBulkPriceModalOpen(true)}
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          totalProducts={pagination?.count ?? products.length}
          activeProducts={activeProducts}
          lowStockCount={lowStockCount}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ürün Tipi
          </label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tüm tipler</option>
            {productTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <ProductTable
          products={products}
          isLoading={false}
          onEdit={handleEditProduct}
          onEditStock={handleEditStock}
          onDelete={handleDeleteProduct}
          onBulkDelete={handleBulkDeleteProducts}
          searchTerm={debouncedSearch}
        />

        {pagination && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 mt-4">
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

        <ProductFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
          productTypes={productTypes}
        />

        <StockEditModal
          isOpen={isStockModalOpen}
          onClose={() => {
            setIsStockModalOpen(false);
            setEditingStockProduct(null);
          }}
          onSave={handleSaveStock}
          product={editingStockProduct}
        />

        <BulkPriceUpdateModal
          isOpen={isBulkPriceModalOpen}
          onClose={() => setIsBulkPriceModalOpen(false)}
          onSaved={fetchProducts}
        />
      </div>
    </Layout>
  );
}
