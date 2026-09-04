/**
 * Service client for communication with backend API.
 */

export interface HealthResponse {
  status: string;
  pipeline_completion_percentage?: number;
  total_events?: number;
  [key: string]: unknown;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Checks backend health connectivity.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/api/system/health`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: HealthResponse = await response.json();
      return data.status === 'healthy';
    }
  } catch (error) {
    console.warn('Backend connectivity check failed:', error);
  }

  return false;
}
