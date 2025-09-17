/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  // Suprimir warnings de hidratación en desarrollo si es necesario
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Período de tiempo para mantener las páginas en memoria
      maxInactiveAge: 25 * 1000,
      // Número de páginas que deben mantenerse simultáneamente sin ser eliminadas
      pagesBufferLength: 2
    }
  })
}

module.exports = nextConfig
