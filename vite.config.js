import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
        "maskable-icon.png",
        "manifest.json",
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,ico,json}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "html-cache" },
          },
          {
            urlPattern: ({ request }) =>
              ["script", "style", "image", "manifest"].includes(
                request.destination
              ),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "asset-cache" },
          },
          // Add Firebase Auth caching
          {
            urlPattern: /^https:\/\/.*\.firebaseapp\.com\/__\/firebase\//,
            handler: "NetworkFirst",
            options: { cacheName: "firebase-cache" },
          },
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-apis-cache" },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Content Idea",
        short_name: "ContentIdea",
        description: "Write and save content idea, create content draft",
        theme_color: "#1e40af",
        background_color: "#f3f4f6",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait-primary",
        lang: "en",
        dir: "ltr",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any"
          }
        ]
      }
    }),
  ],
  // Add proper HTTPS configuration for development
  server: {
    https: false, // Set to true if you need HTTPS in development
    host: true,
    port: 5173,
  },
  // Ensure proper asset handling
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});