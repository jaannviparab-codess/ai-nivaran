// Same resolution rules as src/lib/constants.ts (API_BASE_URL / DEMO_MODE).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

/** Backend origin (scheme + host + port) derived from the API base URL, or null if it isn't a valid absolute URL. */
function backendOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return null;
  }
}

// Deployment guard, Vercel builds only (local and docker-compose builds are unaffected):
// with demo mode off, the site depends on the real API, so refuse to ship a build that
// would call localhost or a missing/invalid URL from users' browsers.
if (process.env.VERCEL === "1" && !DEMO_MODE) {
  const origin = backendOrigin();
  const isLocal = !origin || /\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|$)/.test(origin);
  if (!process.env.NEXT_PUBLIC_API_BASE_URL || isLocal) {
    throw new Error(
      "NEXT_PUBLIC_DEMO_MODE is \"false\" but NEXT_PUBLIC_API_BASE_URL is missing or points to localhost. " +
        "Set it to your production backend, e.g. https://nivaran-api.onrender.com/api, in the Vercel project settings."
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },
  eslint: {
    dirs: ["src"],
  },
  // The backend returns uploaded/placeholder images as origin-relative paths
  // ("/uploads/issues/abc.jpg"). Proxy that path to the backend so those URLs
  // resolve when the frontend and API live on different domains (Vercel + Render).
  async rewrites() {
    const origin = backendOrigin();
    // A Vercel demo-mode build has no backend to proxy to.
    if (!origin || (process.env.VERCEL === "1" && DEMO_MODE)) return [];
    return [{ source: "/uploads/:path*", destination: `${origin}/uploads/:path*` }];
  },
};

export default nextConfig;
