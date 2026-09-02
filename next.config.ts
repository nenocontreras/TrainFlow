import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {/* config options here */};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // El service worker molesta en desarrollo (caché agresiva); solo en producción.
  disable: process.env.NODE_ENV === "development",
  // Deja que el SW atienda las navegaciones (necesario para el modo offline).
  cacheOnNavigation: true,
});

export default withSerwist(nextConfig);
