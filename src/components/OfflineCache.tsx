"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function OfflineCache() {
  const pathname = usePathname();

  useEffect(() => {
    // Verify service worker and cache status
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "caches" in window) {
      const verifyCaching = async () => {
        try {
          // Check service worker status
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log("🔍 Service Worker Registrations:", registrations.length);
          
          if (registrations.length === 0) {
            console.warn("⚠️ No service worker registered!");
            return;
          }

          // Check cache status
          const cacheNames = await caches.keys();
          console.log("📦 Available Caches:", cacheNames);
          
          // Check if current page is in cache
          const pagesCache = await caches.open("pages");
          const currentUrl = window.location.href;
          const cachedResponse = await pagesCache.match(currentUrl);
          
          if (cachedResponse) {
            console.log("✅ Current page is cached:", currentUrl);
          } else {
            console.log("❌ Current page NOT cached:", currentUrl);
            console.log("💡 Visiting page while online should cache it automatically");
          }

          // List all cached pages
          const allCached = await pagesCache.keys();
          console.log("📄 Total cached pages:", allCached.length);
          allCached.forEach((request) => {
            console.log("  -", request.url);
          });
        } catch (error) {
          console.error("Error checking cache status:", error);
        }
      };

      // Wait a bit for service worker to be ready
      setTimeout(verifyCaching, 2000);
    }
  }, [pathname]);

  return null;
}
