interface OrderFormHeaderProps {
  title: string;
}

export default function OrderFormHeader({ title }: OrderFormHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
  );
}
