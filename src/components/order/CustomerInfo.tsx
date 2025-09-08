import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { useState } from "react";
import CustomerFormModal from "../customer/CustomerFormModal";
import SearchableSelect from "../SearchableSelect";
import { Customer } from "../../types/api";

interface OrderFormData {
  customerId: number;
  address: string;
  description: string;
  laborCost: number;
  deliveryFee: number;
  discountType: "percentage" | "amount";
  discountValue: number;
  orderItems: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}

interface CustomerInfoProps {
  customers: Customer[];
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  onCustomerCreated?: (customer: Customer) => void;
}

export default function CustomerInfo({
  customers,
  register,
  errors,
  watch,
  setValue,
  onCustomerCreated,
}: CustomerInfoProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const selectedCustomerId = watch("customerId");
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Müşteri seçimi değiştiğinde
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "create-new") {
      setShowCreateModal(true);
      return;
    }

    const customerId = parseInt(value);
    setValue("customerId", customerId);

    // Seçilen müşterinin adresini otomatik doldur
    const customer = customers.find((c) => c.id === customerId);
    if (customer?.address) {
      setValue("address", customer.address);
    }
  };

  // Yeni müşteri oluşturulduktan sonra (CustomerFormModal için)
  const handleCustomerSuccess = async (customer: Customer) => {
    // Modal'ı kapat
    setShowCreateModal(false);

    if (onCustomerCreated) {
      // Parent component'deki handleCustomerCreated fonksiyonunu çağır
      // Bu fonksiyon müşteri listesini yeniden yükleyecek
      await onCustomerCreated(customer);
    }
  }; // SearchableSelect için müşteri seçim handler'ı
  const handleSearchableSelectChange = (value: string | number) => {
    if (value === "create-new") {
      setShowCreateModal(true);
      return;
    }

    const customerId = Number(value);
    setValue("customerId", customerId);

    // Seçilen müşterinin adresini otomatik doldur
    const customer = customers.find((c) => c.id === customerId);
    if (customer?.address) {
      setValue("address", customer.address);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Debug bilgisi göster */}
        {customers.length === 0 && (
          <div className="p-2 bg-yellow-100 border border-yellow-300 rounded-md">
            <p className="text-xs text-yellow-800">
              Müşteri verisi yükleniyor veya hiç müşteri yok...
            </p>
          </div>
        )}

        {/* Müşteri Seçimi */}
        <SearchableSelect
          label="Müşteri *"
          options={customers.map((customer) => ({
            value: customer.id,
            label: customer.name,
            description: `${customer.phone || "Telefon Numarası Yok"} - ${
              customer.isCompany ? "Kurumsal" : "Bireysel"
            } - ${customer.address || "Adres Yok"}`,
          }))}
          value={watch("customerId") > 0 ? watch("customerId") : ""}
          onChange={(value: any) => handleSearchableSelectChange(value)}
          placeholder="Müşteri seçin veya arayın"
          error={errors.customerId?.message}
          className="text-sm"
          noResultsAction={{
            value: "create-new",
            label: "+ Yeni Müşteri Oluştur",
            description: "Hızlı müşteri kaydı yapın",
          }}
        />

        {/* Adres */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Teslimat Adresi
          </label>
          <input
            type="text"
            {...register("address")}
            className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
            placeholder="Teslimat adresi (müşteri seçildiğinde otomatik yüklenebilir)"
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Açıklama */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Sipariş Açıklaması
          </label>
          <textarea
            {...register("description")}
            className="w-full px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
            placeholder="Sipariş ile ilgili ek bilgiler, notlar..."
            rows={2}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      {/* Yeni Müşteri Oluşturma Modal'ı */}
      {showCreateModal && (
        <CustomerFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(item) => handleCustomerSuccess(item)}
        />
      )}
    </>
  );
}
