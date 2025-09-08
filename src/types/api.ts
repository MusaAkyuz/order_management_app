// API için ortak type tanımlamaları

export interface Customer {
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

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  isCompany: boolean;
}

export interface Product {
  id: number;
  name: string;
  currentPrice: number;
  stock: number;
  isActive: boolean;
  typeId: number;
  type: {
    id: number;
    name: string;
  };
}

export interface ProductType {
  id: number;
  name: string;
  description: string | null;
}

export interface Order {
  id: number;
  totalPrice: number;
  laborCost: number;
  deliveryFee: number;
  address: string | null;
  description: string | null;
  customerId: number;
  statusId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  orderId: number;
  productId: number;
  isActive: boolean;
  isManual?: boolean;
  manualName?: string;
  product?: Product;
}

// PDF için kullanılan basit OrderItem tipi
export interface PDFOrderItem {
  productId: number;
  quantity: number;
  price: number;
  isManual?: boolean;
  manualName?: string;
  product?: Product;
}

export interface OrderStatus {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
