import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora errores de ESLint durante el build (los puedes corregir luego sin bloquear despliegues)
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/imprimir-pulseras',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
