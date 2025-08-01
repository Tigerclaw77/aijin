/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // ✅ keep using static export for Netlify
  images: {
    unoptimized: true, // ✅ disable image optimization
  },
  experimental: {
    css: {
      lightningCSS: false, // ✅ disable Lightning CSS for Vercel compatibility
    },
  },
};

export default nextConfig;
