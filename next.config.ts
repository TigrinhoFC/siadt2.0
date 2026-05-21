/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Mantém isso para o Firebase Hosting
  images: {
    unoptimized: true,
  },
  eslint: {
    // Isso ignora os erros de ESLint (como o 'any' e variáveis não usadas) no build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Isso ignora erros de tipagem do TypeScript no build
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig