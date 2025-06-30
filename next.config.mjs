import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  trailingSlash: true,
  // Timeout de geração de páginas estáticas (em segundos)
  staticPageGenerationTimeout: 1000,
  images: {
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
        hostname: "gregarious-civet-174.convex.cloud",
        pathname: "/api/storage/**"
      },
      {
        protocol: "https",
        hostname: "placehold.co"
      }

    ]
  }
};

// Configuração do Sentry deve ser a última antes de exportar
export default withSentryConfig(withSentryConfig(nextConfig, {
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
}), {
// For all available options, see:
// https://www.npmjs.com/package/@sentry/webpack-plugin#options

org: "web-star-studio",
project: "tn-next-convex",

// Only print logs for uploading source maps in CI
silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Upload a larger set of source maps for prettier stack traces (increases build time)
widenClientFileUpload: true,

// Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
// tunnelRoute: "/monitoring",

// Automatically tree-shake Sentry logger statements to reduce bundle size
disableLogger: true,

// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
automaticVercelMonitors: true,
});