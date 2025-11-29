"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          // Check if already registered
          const existingRegistrations = await navigator.serviceWorker.getRegistrations();
          if (existingRegistrations.length > 0) {
            console.log("✅ Service Worker already registered");
            return;
          }

          // Register the service worker
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

          console.log("✅ Service Worker registered:", registration.scope);

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("🔄 New service worker available");
                }
              });
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("❌ Service Worker registration failed:", errorMessage);
        }
      };

      // Wait for page load
      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
      }
    }
  }, []);

  return null;
}
