"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const customerSchema = z.object({
  name: z.string().min(1, "Müşteri adı zorunludur"),
  email: z
    .string()
    .email("Geçerli bir e-mail adresi giriniz")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  isCompany: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
  isCompany: boolean;
  isActive: boolean;
}

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export default function CreateCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}: CreateCustomerModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      taxNumber: "",
      isCompany: false,
    },
  });

  const isCompany = watch("isCompany");

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    const loadingToast = toast.loading("Müşteri oluşturuluyor...");

    try {
      // Boş string'leri null'a çevir
      const formattedData = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        taxNumber: data.taxNumber || null,
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Müşteri başarıyla oluşturuldu!", {
          id: loadingToast,
        });

        // Formu temizle
        reset();

        // Callback ile yeni müşteriyi bildir
        onCustomerCreated(result.data);
      } else {
        toast.error(result.error || "Müşteri oluşturulurken hata oluştu", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Müşteri oluşturulurken hata:", error);
      toast.error("Bir hata oluştu", {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Yeni Müşteri Oluştur
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Müşteri Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Tipi
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  {...register("isCompany")}
                  type="radio"
                  value="false"
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Bireysel</span>
              </label>
              <label className="flex items-center">
                <input
                  {...register("isCompany")}
                  type="radio"
                  value="true"
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Firma</span>
              </label>
            </div>
          </div>

          {/* Müşteri Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isCompany ? "Firma Adı" : "Ad Soyad"} *
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder={
                isCompany ? "Firma adını giriniz" : "Ad soyad giriniz"
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="E-mail adresini giriniz"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="Telefon numarasını giriniz"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500"
            />
          </div>

          {/* Vergi Numarası (Sadece firma için) */}
          {isCompany && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vergi Numarası
              </label>
              <input
                {...register("taxNumber")}
                type="text"
                placeholder="Vergi numarasını giriniz"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500"
              />
            </div>
          )}

          {/* Adres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adres
            </label>
            <textarea
              {...register("address")}
              rows={3}
              placeholder="Adresini giriniz"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-500 resize-none"
            />
          </div>

          {/* Butonlar */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Oluşturuluyor..." : "Müşteri Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
