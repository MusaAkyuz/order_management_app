// Order Status Constants
export const ORDER_STATUS = {
  PENDING: {
    color: "#FFD700", // Sarı
    name: "Beklemede",
    tailwindBg: "bg-yellow-100",
    tailwindText: "text-yellow-800",
    tailwindBorder: "border-yellow-300",
    tailwindHover: "hover:bg-yellow-100",
    tailwindFocus: "focus:ring-yellow-500",
  },
  PAID: {
    color: "#17A2B8", // Mavi
    name: "Ücreti Ödendi",
    tailwindBg: "bg-blue-100",
    tailwindText: "text-blue-800",
    tailwindBorder: "border-blue-300",
    tailwindHover: "hover:bg-blue-100",
    tailwindFocus: "focus:ring-blue-500",
  },
  DELIVERED: {
    color: "#28A745", // Yeşil
    name: "Teslim Edildi",
    tailwindBg: "bg-green-100",
    tailwindText: "text-green-800",
    tailwindBorder: "border-green-300",
    tailwindHover: "hover:bg-green-100",
    tailwindFocus: "focus:ring-green-500",
  },
  CANCELLED: {
    color: "#DC3545", // Kırmızı
    name: "İptal Edildi",
    tailwindBg: "bg-red-100",
    tailwindText: "text-red-800",
    tailwindBorder: "border-red-300",
    tailwindHover: "hover:bg-red-100",
    tailwindFocus: "focus:ring-red-500",
  },
} as const;

// Status'a göre styling getiren helper function
export function getStatusStyling(statusColor: string) {
  switch (statusColor) {
    case ORDER_STATUS.PENDING.color:
      return ORDER_STATUS.PENDING;
    case ORDER_STATUS.PAID.color:
      return ORDER_STATUS.PAID;
    case ORDER_STATUS.DELIVERED.color:
      return ORDER_STATUS.DELIVERED;
    case ORDER_STATUS.CANCELLED.color:
      return ORDER_STATUS.CANCELLED;
    default:
      return ORDER_STATUS.PENDING; // Fallback
  }
}

// Badge styling için helper function
export function getStatusBadgeClasses(statusColor: string): string {
  const styling = getStatusStyling(statusColor);
  return `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styling.tailwindBg} ${styling.tailwindText}`;
}

// Modal button styling için helper function
export function getStatusButtonClasses(statusColor: string): string {
  const styling = getStatusStyling(statusColor);
  return `w-full px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-${
    styling.tailwindBg.split("-")[1]
  }-50 ${styling.tailwindText} ${styling.tailwindBorder} ${
    styling.tailwindHover
  } ${styling.tailwindFocus}`;
}
