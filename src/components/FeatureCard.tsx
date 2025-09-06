"use client";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  onClick: () => void;
  isLoading: boolean;
  spinnerColor: string;
}

export default function FeatureCard({
  title,
  description,
  icon,
  iconColor,
  onClick,
  isLoading,
  spinnerColor,
}: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 rounded-xl flex items-center justify-center z-10">
          <div
            className={`animate-spin rounded-full h-8 w-8 border-b-2 ${spinnerColor}`}
          ></div>
        </div>
      )}
      <span className={`${iconColor} text-3xl mb-2`}>{icon}</span>
      <h2 className="font-bold text-lg mb-1 text-black">{title}</h2>
      <p className="text-gray-500 text-center text-sm">{description}</p>
    </div>
  );
}
