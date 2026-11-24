/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'v.melolo.com' }],
  },
};

export default nextConfig;
