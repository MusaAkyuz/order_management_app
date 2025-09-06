interface NavigationProps {
  currentPage?: "home" | "create-order" | "orders" | "products" | "customers";
}

export default function Navigation({ currentPage = "home" }: NavigationProps) {
  const getLinkClass = (page: string) => {
    return currentPage === page
      ? "text-blue-600 font-medium"
      : "text-gray-700 hover:text-blue-600 font-medium transition";
  };

  return (
    <nav className="bg-white shadow-sm py-4 px-8 flex justify-between items-center">
      <span className="text-xl font-bold text-blue-600 tracking-tight">
        Order Management
      </span>
      <div className="flex gap-6">
        <a href="/" className={getLinkClass("home")}>
          Ana Sayfa
        </a>
        <a href="/create-order" className={getLinkClass("create-order")}>
          Sipariş Oluştur
        </a>
        <a href="/orders" className={getLinkClass("orders")}>
          Siparişler
        </a>
        <a href="/products" className={getLinkClass("products")}>
          Ürünler
        </a>
        <a href="/customers" className={getLinkClass("customers")}>
          Müşteriler
        </a>
      </div>
    </nav>
  );
}
