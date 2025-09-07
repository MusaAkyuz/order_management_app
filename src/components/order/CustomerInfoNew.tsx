import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { useState } from "react";
import CreateCustomerModal from "../customer/CreateCustomerModal";

interface Customer {
  id: number;
  name: string;
  email: string | null;
  address: string | null;
  isCompany: boolean;
  isActive: boolean;
  phone?: string | null;
  taxNumber?: string | null;
}

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

  // Yeni müşteri oluşturulduktan sonra
  const handleCustomerCreated = (newCustomer: Customer) => {
    // Yeni müşteriyi otomatik seç
    setValue("customerId", newCustomer.id);

    // Adresini otomatik doldur
    if (newCustomer.address) {
      setValue("address", newCustomer.address);
    }

    // Modal'ı kapat
    setShowCreateModal(false);

    // Parent component'e bildir
    if (onCustomerCreated) {
      onCustomerCreated(newCustomer);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
          Müşteri Bilgileri
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Müşteri Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Müşteri *
            </label>
            <select
              {...register("customerId", { valueAsNumber: true })}
              onChange={handleCustomerChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
            >
              <option value={0} className="text-gray-500">
                Müşteri seçiniz...
              </option>
              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                  className="text-gray-700"
                >
                  {customer.name}{" "}
                  {customer.isCompany ? "(Firma)" : "(Bireysel)"}
                </option>
              ))}
              <option value="create-new" className="text-blue-600 font-medium">
                + Yeni Müşteri Oluştur
              </option>
            </select>
            {errors.customerId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.customerId.message as string}
              </p>
            )}
          </div>

          {/* Seçilen Müşteri Bilgileri */}
          {selectedCustomer && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Müşteri Detayları
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Ad:</span>{" "}
                  {selectedCustomer.name}
                </p>
                {selectedCustomer.email && (
                  <p>
                    <span className="font-medium">E-mail:</span>{" "}
                    {selectedCustomer.email}
                  </p>
                )}
                {selectedCustomer.phone && (
                  <p>
                    <span className="font-medium">Telefon:</span>{" "}
                    {selectedCustomer.phone}
                  </p>
                )}
                {selectedCustomer.taxNumber && (
                  <p>
                    <span className="font-medium">Vergi No:</span>{" "}
                    {selectedCustomer.taxNumber}
                  </p>
                )}
                <p>
                  <span className="font-medium">Tip:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      selectedCustomer.isCompany
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {selectedCustomer.isCompany ? "Firma" : "Bireysel"}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Teslimat Adresi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teslimat Adresi
          </label>
          <textarea
            {...register("address")}
            rows={3}
            placeholder="Teslimat adresini giriniz..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500 resize-none"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message as string}
            </p>
          )}
        </div>

        {/* Sipariş Açıklaması */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sipariş Açıklaması
          </label>
          <textarea
            {...register("description")}
            rows={2}
            placeholder="Sipariş hakkında notlar..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500 resize-none"
          />
        </div>
      </div>

      {/* Yeni Müşteri Oluşturma Modal'ı */}
      <CreateCustomerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
}
