import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  trailingSlash: true,
  // Timeout de geração de páginas estáticas (em segundos)
  staticPageGenerationTimeout: 1000,
  images: {
    domains: [
      "calculating-sockeye-278.convex.cloud",
      "wonderful-salmon-48.convex.cloud"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        
      },
      {
        protocol: "https",
        hostname: "viagenseoutrashistorias.com.br",
      },
      {
        protocol: "https",
        hostname: "www.viagenscinematograficas.com.br",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "img.clerk.com"
      },
      {
        protocol: "https",
        hostname: "images.sympla.com.br"
      },
      {
        protocol: "https",
        hostname: "calculating-sockeye-278.convex.cloud",
        pathname: "/api/storage/**"
      },
      {
        protocol: "https", 
        hostname: "wonderful-salmon-48.convex.cloud",
        pathname: "/api/storage/**"
      },
      {
        protocol: "https",
        hostname: "placehold.co"
      },
      {
        protocol: "https",
        hostname: "media.licdn.com"
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
        pathname: "/f/**"
      }
    ]
  }
};

// Configuração do Sentry deve ser a última antes de exportar
export default withSentryConfig(nextConfig, {
// Configurações da organização
org: "web-star-studio",
project: "tn-next-convex",

// Apenas mostrar logs em CI
silent: !process.env.CI,

// Tree-shake automaticamente logs do Sentry para reduzir bundle size
disableLogger: true,

// Upload de source maps mais abrangente para stack traces mais legíveis
widenClientFileUpload: true,

// Túnel para evitar bloqueadores de anúncios
tunnelRoute: "/monitoring",

// Configurações de source maps
sourcemaps: {
deleteSourcemapsAfterUpload: true,
},

// Instrumentação automática
autoInstrumentServerFunctions: true,
autoInstrumentMiddleware: true,
autoInstrumentAppDirectory: true,
});