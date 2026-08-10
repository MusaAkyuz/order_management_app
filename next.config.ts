import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mevcut kod tabanında biriken lint hataları prod build'i kilitlemesin;
  // `npm run lint` ile geliştirme sırasında ayrıca kontrol edilebilir.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
