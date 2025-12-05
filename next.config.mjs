/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para producción
  // output: 'standalone',   // Comentar temporalmente
   
  // Configuración de imágenes para AWS
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.comodoro.gov.ar',
      },
      {
        protocol: 'https',
        hostname: 'chatbot.isurgob.net',
      },
    ],
    unoptimized: false,
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Configuración para AWS
  trailingSlash: false,
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  
  // Silenciar warning de workspace root
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
