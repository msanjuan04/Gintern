/** @type {import('next').NextConfig} */
const supabaseHost =
  process.env.NEXT_PUBLIC_SUPABASE_URL != null
    ? (() => {
        try {
          return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
        } catch {
          return null;
        }
      })()
    : null;

const nextConfig = {
  reactStrictMode: true,
  images: supabaseHost
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ],
      }
    : undefined,
  async redirects() {
    return [
      { source: "/archivos", destination: "/wiki", permanent: false },
      { source: "/archivos/:path*", destination: "/wiki", permanent: false },
      { source: "/organizacion", destination: "/organizacion/objetivos", permanent: false },
    ];
  },
};

export default nextConfig;
