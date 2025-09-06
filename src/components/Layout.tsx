import Navigation from "./Navigation";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: "home" | "create-order" | "orders" | "products" | "customers";
}

export default function Layout({ children, currentPage }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation currentPage={currentPage} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
