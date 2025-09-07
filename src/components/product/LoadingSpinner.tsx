interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  message = "Yükleniyor...",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className="flex flex-col justify-center items-center h-64 space-y-4">
      <div className="relative">
        <div
          className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600`}
        ></div>
        <div
          className={`absolute top-0 left-0 rounded-full ${sizeClasses[size]} border-t-2 border-blue-300 animate-ping`}
        ></div>
      </div>
      <div
        className={`${textSizeClasses[size]} font-medium text-gray-600 animate-pulse flex items-center`}
      >
        <svg
          className="w-5 h-5 mr-2 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {message}
      </div>
    </div>
  );
}
