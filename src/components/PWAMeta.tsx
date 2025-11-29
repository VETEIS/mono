"use client";

import { useEffect } from "react";

export default function PWAMeta() {
  useEffect(() => {
    // Add iOS-specific meta tags that might not be in initial HTML
    const addMetaTag = (name: string, content: string, attribute: string = "name") => {
      const existing = document.querySelector(`meta[${attribute}="${name}"]`);
      if (existing) return;
      
      const meta = document.createElement("meta");
      meta.setAttribute(attribute, name);
      meta.setAttribute("content", content);
      document.head.appendChild(meta);
    };

    // Ensure iOS meta tags are present
    addMetaTag("apple-mobile-web-app-capable", "yes");
    addMetaTag("apple-mobile-web-app-status-bar-style", "black-translucent");
    addMetaTag("apple-mobile-web-app-title", "MONO");
    
    // Add apple-touch-icon if not present
    const existingIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!existingIcon) {
      const iconLink = document.createElement("link");
      iconLink.setAttribute("rel", "apple-touch-icon");
      iconLink.setAttribute("href", "/icon-192x192.png");
      document.head.appendChild(iconLink);
    }

    // Verify service worker registration in production
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        // Check if service worker is already registered
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          if (registrations.length > 0) {
            console.log("Service Worker registered:", registrations.length);
            registrations.forEach((registration) => {
              console.log("Service Worker scope:", registration.scope);
            });
          } else {
            console.log("No Service Worker found. Waiting for next-pwa to register...");
          }
        });

        // Listen for service worker updates
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("Service Worker controller changed");
        });
      });
    }
  }, []);

  return null;
}
