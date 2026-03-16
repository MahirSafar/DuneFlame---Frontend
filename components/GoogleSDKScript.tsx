"use client";

import Script from "next/script";

/**
 * Google Identity Services (GSI) Script Loader
 * 
 * This is a Client Component that handles loading the Google SDK
 * and dispatching a custom event when it's ready.
 * 
 * Must be a Client Component because it uses onLoad callback
 * which requires client-side code.
 */
export default function GoogleSDKScript() {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="lazyOnload"
      onLoad={() => {
        if (typeof window !== "undefined" && (window as any).google) {
          // Dispatch custom event to notify other components
          window.dispatchEvent(new Event("google-sdk-loaded"));
        }
      }}
    />
  );
}
