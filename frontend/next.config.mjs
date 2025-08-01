/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // ✅ keep using static export for Netlify
  images: {
    unoptimized: true, // ✅ disable image optimization
  },
};

export default nextConfig;
