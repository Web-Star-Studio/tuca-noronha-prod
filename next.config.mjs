/** @type {import('next').NextConfig} */
const nextConfig = {
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
      }
    ]
  }
};

export default nextConfig;
