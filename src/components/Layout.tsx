import Navigation from "./Navigation";
import Footer from "./Footer";
import { Toaster } from "react-hot-toast";

interface LayoutProps {
  children: React.ReactNode;
  currentPage?:
    | "home"
    | "create-order"
    | "orders"
    | "products"
    | "customers"
    | "debts"
    | "expenses"
    | "reports";
}

export default function Layout({ children, currentPage }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation currentPage={currentPage} />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
            padding: "16px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
          },
          success: {
            style: {
              background: "#10B981",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#EF4444",
            },
          },
        }}
      />
    </div>
  );
}
