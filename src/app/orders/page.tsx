import Layout from "../../components/Layout";

export default function Orders() {
  return (
    <Layout currentPage="orders">
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 text-center">
          Siparişler
        </h1>
        <p className="text-lg text-gray-600 mb-10 text-center max-w-2xl">
          Bu sayfa henüz geliştirilme aşamasındadır.
        </p>
      </div>
    </Layout>
  );
}
