/**
 * Service client for communication with backend API.
 */

export interface HealthResponse {
  status: string;
  service: string;
}

/**
 * Checks backend health connectivity.
 * Uses the local Vite API proxy or relative endpoint.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    // Try relative path (Vite proxy)
    const response = await fetch('/api/health', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: HealthResponse = await response.json();
      return data.status === 'ok';
    }
  } catch (error) {
    // If the proxy fails or isn't running, fallback to absolute URL directly
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('http://localhost:8000/api/health', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data: HealthResponse = await response.json();
        return data.status === 'ok';
      }
    } catch (e) {
      console.warn("Backend connectivity check failed:", e);
    }
  }
  return false;
}
