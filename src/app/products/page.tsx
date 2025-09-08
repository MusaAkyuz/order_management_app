"use client";
import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import ProductPageHeader from "../../components/product/ProductPageHeader";
import ProductTable from "../../components/product/ProductTable";
import ProductFormModal from "../../components/product/ProductFormModal";
import StockEditModal from "../../components/product/StockEditModal";
import LoadingSpinner from "../../components/product/LoadingSpinner";
import toast from "react-hot-toast";

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
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStockProduct, setEditingStockProduct] =
    useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Stok uyarıları için helper fonksiyon
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
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error("Ürünler yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      toast.error("Ürünler yüklenirken hata oluştu");
    }
  };

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

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProducts(), fetchProductTypes()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

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

  // İstatistikler
  const activeProducts = products.filter((p) => p.isActive).length;

  if (isLoading) {
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
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalProducts={products.length}
          activeProducts={activeProducts}
          lowStockCount={lowStockCount}
        />

        <ProductTable
          products={products}
          isLoading={false}
          onEdit={handleEditProduct}
          onEditStock={handleEditStock}
          onDelete={handleDeleteProduct}
          onBulkDelete={handleBulkDeleteProducts}
          searchTerm={searchTerm}
        />

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
      </div>
    </Layout>
  );
}
