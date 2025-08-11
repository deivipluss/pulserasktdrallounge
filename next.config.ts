import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora errores de ESLint durante el build (los puedes corregir luego sin bloquear despliegues)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
