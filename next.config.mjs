/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self' https: data: blob:; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' https: data: blob:; " +
              "font-src 'self' https: data:; " +
              "connect-src 'self' https: blob: data:; " +
              "worker-src 'self' blob:; " +
              "child-src 'self' blob:; " +
              "media-src 'self' https: blob: data:; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self';",

            // IMPORTANT:
            // CDN model files from staticimgly.com must be allowed.
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;