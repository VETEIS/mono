"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        // Try different possible service worker file paths
        const swPaths = ["/sw.js", "/service-worker.js", "/sw", "/serviceWorker.js"];
        
        for (const swPath of swPaths) {
          try {
            // First check if the file exists
            const response = await fetch(swPath, { method: "HEAD" });
            if (!response.ok) continue;

            // Try to register the service worker
            const registration = await navigator.serviceWorker.register(swPath, {
              scope: "/",
            });

            console.log(`✅ Service Worker registered successfully at ${swPath}:`, registration.scope);

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

            // Check for updates
            await registration.update();
            return; // Successfully registered, exit
          } catch (error) {
            console.log(`⚠️ Failed to register ${swPath}:`, error.message);
            continue; // Try next path
          }
        }
        
        // If we get here, none of the paths worked
        console.error("❌ Service Worker registration failed for all paths");
        console.log("💡 Service worker file might not be generated. Check build logs.");
        
        // Try to check what service worker files exist
        const checkPaths = ["/sw.js", "/service-worker.js", "/_next/static/sw.js"];
        for (const path of checkPaths) {
          fetch(path, { method: "HEAD" })
            .then((response) => {
              if (response.ok) {
                console.log(`✅ Found service worker file at ${path}`);
              }
            })
            .catch(() => {
              // Ignore errors
            });
        }
      };

      // Wait for page load
      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
      }

      // Also listen for controller changes
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔄 Service Worker controller changed - reloading page");
        window.location.reload();
      });
    } else {
      console.warn("⚠️ Service Workers not supported in this browser");
    }
  }, []);

  return null;
}
