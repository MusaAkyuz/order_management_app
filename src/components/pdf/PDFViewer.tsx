"use client";

import { useEffect, useRef, useState } from "react";
import { Customer, Product, PDFOrderItem } from "../../types/api";
import { formatNumber } from "../../utils/currency";

// pdfMake dinamik import
let pdfMake: any = null;

const loadPdfMake = async () => {
  if (!pdfMake) {
    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfFonts = await import("pdfmake/build/vfs_fonts");

    pdfMake = pdfMakeModule.default;
    // pdfMake.vfs = (pdfFonts as any).pdfMake.vfs;
  }
  return pdfMake;
};

interface PDFData {
  customer?: Customer;
  orderItems: PDFOrderItem[];
  address?: string;
  description?: string;
  laborCost: number;
  deliveryFee: number;
  discountType: "percentage" | "amount";
  discountValue: number;
  orderNumber?: string;
  orderDate?: string;
  status?: string;
}

interface PDFViewerProps {
  data: PDFData;
  products: Product[];
}

export default function PDFViewer({ data, products }: PDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [currencySymbol, setCurrencySymbol] = useState("₺");
  const [taxRate, setTaxRate] = useState(18); // Varsayılan KDV oranı %18

  // Şirket bilgilerini ve sistem ayarlarını yükle
  useEffect(() => {
    const loadLookupData = async () => {
      try {
        // Şirket bilgilerini API'dan getir
        const companyResponse = await fetch(
          "/api/lookup?category=COMPANY_INFO"
        );
        const companyResult = await companyResponse.json();

        console.log("companyResult", companyResult);

        // Para birimi sembolünü API'dan getir
        const currencyResponse = await fetch(
          "/api/lookup?category=SYSTEM_SETTINGS&key=CURRENCY_SYMBOL"
        );
        const currencyResult = await currencyResponse.json();

        // KDV oranını API'dan getir
        const taxResponse = await fetch(
          "/api/lookup?category=TAX_RATES&key=VAT_18"
        );
        const taxResult = await taxResponse.json();

        console.log("currencyResult", currencyResult);

        if (companyResult.success && companyResult.data.length > 0) {
          // Şirket bilgilerini organize et
          const companyData = companyResult.data.reduce(
            (acc: any, item: any) => {
              // key'i daha uygun forma çevir
              let key = item.key;
              if (key === "COMPANY_NAME") key = "name";
              else if (key === "COMPANY_ADDRESS") key = "address";
              else if (key === "COMPANY_PHONE") key = "phone";
              else if (key === "COMPANY_EMAIL") key = "email";
              else if (key === "COMPANY_TAX_NUMBER") key = "tax_number";

              acc[key] = item.value; // processedValue yerine value kullan
              return acc;
            },
            {}
          );
          console.log("Company data organized:", companyData);
          setCompanyInfo(companyData);
        } else {
          console.log("Company data not found, using fallback");
          setCompanyInfo({
            name: "",
            address: "",
            phone: "",
            email: "",
            tax_number: "",
          });
        }

        if (currencyResult.success && currencyResult.data.length > 0) {
          console.log("Currency result:", currencyResult.data[0]);
          setCurrencySymbol(currencyResult.data[0].value); // processedValue yerine value kullan
        } else {
          console.log("Currency data not found, using fallback");
          setCurrencySymbol("₺");
        }

        if (taxResult.success && taxResult.data.length > 0) {
          console.log("Tax result:", taxResult.data[0]);
          setTaxRate(parseFloat(taxResult.data[0].value) || 18);
        } else {
          console.log("Tax data not found, using fallback");
          setTaxRate(18);
        }
      } catch (error) {
        console.error("Lookup data yüklenirken hata:", error);
        // Fallback değerler
        setCompanyInfo({
          name: "Şirket Adı",
          address: "Şirket Adresi\nİlçe, İl 12345",
          phone: "+90 (212) 123 45 67",
          email: "info@sirket.com",
          tax_number: "1234567890",
        });
        setCurrencySymbol("₺");
        setTaxRate(18);
      }
    };

    loadLookupData();
  }, []);

  // Toplam hesaplamaları
  const calculateItemsTotal = () => {
    return data.orderItems.reduce((sum, item) => {
      return sum + item.quantity * item.price;
    }, 0);
  };

  const calculateTaxAmount = () => {
    const itemsTotal = calculateItemsTotal();
    return (itemsTotal * taxRate) / 100;
  };

  const calculateSubtotal = () => {
    const itemsTotal = calculateItemsTotal();
    const taxAmount = calculateTaxAmount();
    return itemsTotal + taxAmount + data.laborCost + data.deliveryFee;
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (data.discountType === "percentage") {
      return (subtotal * data.discountValue) / 100;
    } else {
      return data.discountValue;
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscount();
    return Math.max(0, subtotal - discountAmount);
  };

  // PDF içeriğini oluştur
  const generatePDFContent = () => {
    const customer = data.customer;
    const orderItems = data.orderItems.map((item) => {
      if (item.isManual) {
        return {
          ...item,
          product: {
            id: 0,
            name: item.manualName || "Manuel Ürün",
            currentPrice: item.price,
            stock: 0,
            isActive: true,
            typeId: 1,
            type: { id: 1, name: "Adet ile Satılan" },
          },
        };
      } else {
        const product = products.find((p) => p.id === item.productId);
        return {
          ...item,
          product,
        };
      }
    });

    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscount();
    const total = calculateTotal();

    const content: any[] = [];

    // Header - Logo ve Şirket Bilgileri
    content.push({
      columns: [
        {
          // Logo alanı (şimdilik placeholder)
          text: "LOGO",
          fontSize: 24,
          bold: true,
          color: "#666",
          width: "30%",
          alignment: "center",
          margin: [0, 10, 0, 0],
        },
        {
          // Şirket bilgileri
          width: "70%",
          stack: [
            {
              text: companyInfo?.name || "Şirket Adı",
              fontSize: 18,
              bold: true,
              color: "#333",
            },
            {
              text: companyInfo?.address || "Şirket Adresi",
              fontSize: 10,
              color: "#666",
              margin: [0, 5, 0, 0],
            },
            {
              text: `Tel: ${companyInfo?.phone || ""}`,
              fontSize: 10,
              color: "#666",
            },
            {
              text: `E-mail: ${companyInfo?.email || ""}`,
              fontSize: 10,
              color: "#666",
            },
            {
              text: `Vergi No: ${companyInfo?.tax_number || ""}`,
              fontSize: 10,
              color: "#666",
            },
          ],
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 20],
    });

    // Başlık
    content.push({
      text: "SİPARİŞ FORMU",
      fontSize: 16,
      bold: true,
      alignment: "center",
      margin: [0, 0, 0, 20],
      color: "#333",
    });

    // Sipariş Bilgileri
    if (data.orderNumber || data.orderDate || data.status) {
      content.push({
        table: {
          widths: ["25%", "25%", "25%", "25%"],
          body: [
            [
              { text: "Sipariş No", bold: true, fillColor: "#f5f5f5" },
              { text: data.orderNumber || "-" },
              { text: "Tarih", bold: true, fillColor: "#f5f5f5" },
              {
                text: data.orderDate || new Date().toLocaleDateString("tr-TR"),
              },
            ],
            [
              { text: "Durum", bold: true, fillColor: "#f5f5f5" },
              { text: data.status || "Yeni Sipariş", colSpan: 3 },
              {},
              {},
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 15],
      });
    }

    // Müşteri Bilgileri
    if (customer) {
      content.push({
        text: "Müşteri Bilgileri",
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10],
        color: "#333",
      });

      const customerTableBody = [
        [
          { text: "Müşteri Adı", bold: true, fillColor: "#f5f5f5" },
          { text: customer.name },
        ],
        [
          { text: "Tip", bold: true, fillColor: "#f5f5f5" },
          { text: customer.isCompany ? "Kurumsal" : "Bireysel" },
        ],
        [
          { text: "E-mail", bold: true, fillColor: "#f5f5f5" },
          { text: customer.email || "-" },
        ],
        [
          { text: "Telefon", bold: true, fillColor: "#f5f5f5" },
          { text: customer.phone || "-" },
        ],
        [
          { text: "Adres", bold: true, fillColor: "#f5f5f5" },
          { text: customer.address || "-" },
        ],
      ];

      if (customer.isCompany && customer.taxNumber) {
        customerTableBody.push([
          { text: "Vergi No", bold: true, fillColor: "#f5f5f5" },
          { text: customer.taxNumber },
        ]);
      }

      content.push({
        table: {
          widths: ["25%", "75%"],
          body: customerTableBody,
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 15],
      });
    }

    // Teslimat Adresi
    if (data.address) {
      content.push({
        text: "Teslimat Adresi",
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10],
        color: "#333",
      });

      content.push({
        table: {
          widths: ["100%"],
          body: [[{ text: data.address, fillColor: "#f9f9f9" }]],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 15],
      });
    }

    // Sipariş Ürünleri
    if (orderItems.length > 0) {
      content.push({
        text: "Sipariş Detayları",
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10],
        color: "#333",
      });

      const tableBody: any[][] = [
        [
          { text: "Ürün", bold: true, fillColor: "#f5f5f5" },
          {
            text: "Miktar",
            bold: true,
            fillColor: "#f5f5f5",
            alignment: "center",
          },
          {
            text: "Birim Fiyat",
            bold: true,
            fillColor: "#f5f5f5",
            alignment: "right",
          },
          {
            text: "Toplam",
            bold: true,
            fillColor: "#f5f5f5",
            alignment: "right",
          },
        ],
      ];

      orderItems.forEach((item) => {
        const product = item.product;
        const total = item.quantity * item.price;
        tableBody.push([
          { text: product?.name || `Ürün #${item.productId}` },
          {
            text: `${item.quantity} ${product?.type?.name || ""}`,
            alignment: "center",
          },
          {
            text: `${currencySymbol}${formatNumber(item.price)}`,
            alignment: "right",
          },
          {
            text: `${currencySymbol}${formatNumber(total)}`,
            alignment: "right",
          },
        ]);
      });

      content.push({
        table: {
          widths: ["40%", "20%", "20%", "20%"],
          body: tableBody,
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 15],
      });
    }

    // Maliyet Detayları
    const costDetails: any[][] = [];
    const itemsTotal = calculateItemsTotal();
    const taxAmount = calculateTaxAmount();

    // Ürünler toplamı (KDV hariç)
    if (itemsTotal > 0) {
      costDetails.push([
        { text: "Ürünler Toplamı (KDV Hariç)", alignment: "right" },
        {
          text: `${currencySymbol}${formatNumber(itemsTotal)}`,
          alignment: "right",
        },
      ]);

      // KDV tutarı
      costDetails.push([
        { text: `KDV (%${taxRate})`, alignment: "right", bold: true },
        {
          text: `${currencySymbol}${formatNumber(taxAmount)}`,
          alignment: "right",
          bold: true,
        },
      ]);

      // Ürünler toplamı (KDV dahil)
      costDetails.push([
        { text: "Ürünler Toplamı (KDV Dahil)", alignment: "right" },
        {
          text: `${currencySymbol}${formatNumber(itemsTotal + taxAmount)}`,
          alignment: "right",
        },
      ]);
    }

    // İşçilik ücreti
    if (data.laborCost > 0) {
      costDetails.push([
        { text: "İşçilik Ücreti", alignment: "right" },
        {
          text: `${currencySymbol}${formatNumber(data.laborCost)}`,
          alignment: "right",
        },
      ]);
    }

    // Lojistik ücreti
    if (data.deliveryFee > 0) {
      costDetails.push([
        { text: "Lojistik Ücreti", alignment: "right" },
        {
          text: `${currencySymbol}${formatNumber(data.deliveryFee)}`,
          alignment: "right",
        },
      ]);
    }

    // Ara toplam (indirim öncesi)
    costDetails.push([
      { text: "Ara Toplam", alignment: "right", bold: true },
      {
        text: `${currencySymbol}${formatNumber(subtotal)}`,
        alignment: "right",
        bold: true,
      },
    ]);

    // İndirim varsa
    if (discountAmount > 0) {
      const discountText =
        data.discountType === "percentage"
          ? `İndirim (%${data.discountValue})`
          : "İndirim";

      costDetails.push([
        { text: discountText, alignment: "right", color: "#d32f2f" },
        {
          text: `-${currencySymbol}${formatNumber(discountAmount)}`,
          alignment: "right",
          color: "#d32f2f",
        },
      ]);
    }

    costDetails.push([
      {
        text: "GENEL TOPLAM",
        alignment: "right",
        bold: true,
        fontSize: 12,
        fillColor: "#f5f5f5",
      },
      {
        text: `${currencySymbol}${formatNumber(total)}`,
        alignment: "right",
        bold: true,
        fontSize: 12,
        fillColor: "#f5f5f5",
      },
    ]);

    content.push({
      table: {
        widths: ["70%", "30%"],
        body: costDetails,
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 15],
    });

    // Açıklama
    if (data.description) {
      content.push({
        text: "Açıklama",
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10],
        color: "#333",
      });

      content.push({
        table: {
          widths: ["100%"],
          body: [[{ text: data.description, fillColor: "#f9f9f9" }]],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 15],
      });
    }

    return {
      content,
      pageSize: "A4" as const,
      pageMargins: [40, 60, 40, 60] as [number, number, number, number],
      defaultStyle: {
        fontSize: 10,
        color: "#333",
      },
    };
  };

  // PDF'i oluştur ve göster
  useEffect(() => {
    const generatePDF = async () => {
      // companyInfo yüklenene kadar bekle
      if (!companyInfo) return;

      try {
        const pdfMakeInstance = await loadPdfMake();
        const docDefinition = generatePDFContent();
        const pdfDocGenerator = pdfMakeInstance.createPdf(docDefinition);

        pdfDocGenerator.getBlob((blob: Blob) => {
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        });
      } catch (error) {
        console.error("PDF oluşturulurken hata:", error);
      }
    };

    generatePDF();
  }, [data, products, companyInfo, currencySymbol, taxRate]); // Component unmount olduğunda URL'i temizle
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">PDF Önizleme</h3>
        {pdfUrl && (
          <div className="flex space-x-2">
            <a
              href={pdfUrl}
              download={`siparis-${data.orderNumber || "yeni"}.pdf`}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              İndir
            </a>
            <button
              onClick={() => window.open(pdfUrl, "_blank")}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Yeni Sekmede Aç
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 border border-gray-300 rounded">
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full rounded"
            title="PDF Önizleme"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">PDF oluşturuluyor...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
