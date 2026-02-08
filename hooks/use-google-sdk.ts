import { useEffect, useState } from "react"

/**
 * Hook to wait for Google SDK (Google Identity Services) to be loaded
 * 
 * Usage:
 * ```
 * const isGoogleReady = useGoogleSDK()
 * 
 * if (isGoogleReady) {
 *   // Initialize google.accounts.id or use google features
 * }
 * ```
 */
export function useGoogleSDK() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      return
    }

    // Check if already loaded
    if (typeof (window as any).google !== "undefined") {
      setIsReady(true)
      return
    }

    // Listen for the custom event dispatched by the script onload
    const handleGoogleSDKLoaded = () => {
      setIsReady(true)
    }

    window.addEventListener("google-sdk-loaded", handleGoogleSDKLoaded)

    // Fallback: Check again after 3 seconds if event didn't fire
    const fallbackTimer = setTimeout(() => {
      if (typeof (window as any).google !== "undefined") {
        setIsReady(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener("google-sdk-loaded", handleGoogleSDKLoaded)
      clearTimeout(fallbackTimer)
    }
  }, [])

  return isReady
}

/**
 * Promise-based utility to wait for Google SDK
 * 
 * Usage:
 * ```
 * await waitForGoogleSDK()
 * // Google SDK is now available
 * ```
 */
export function waitForGoogleSDK(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window object not available"))
      return
    }

    if (typeof (window as any).google !== "undefined") {
      resolve()
      return
    }

    const handleGoogleSDKLoaded = () => {
      window.removeEventListener("google-sdk-loaded", handleGoogleSDKLoaded)
      clearTimeout(timeoutHandle)
      resolve()
    }

    const timeoutHandle = setTimeout(() => {
      window.removeEventListener("google-sdk-loaded", handleGoogleSDKLoaded)
      // Check one more time in case it loaded just before timeout
      if (typeof (window as any).google !== "undefined") {
        resolve()
      } else {
        reject(new Error("Google SDK failed to load within timeout"))
      }
    }, timeout)

    window.addEventListener("google-sdk-loaded", handleGoogleSDKLoaded)
  })
}
