/** @type {import('next').NextConfig} */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig = staticExport
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
