/**
 * API Client с автоматическим добавлением JWT токена из cookie
 * Cookie автоматически отправляется браузером, не нужно добавлять вручную
 */
export async function apiClient<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  console.log(`🌐 API Request: ${options?.method || 'GET'} ${url}`);
  console.log('🍪 Current cookies:', document.cookie);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Важно: отправляем cookies
  });

  console.log(`📥 API Response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ API Error:', error);
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

/**
 * Типизированные методы для удобства
 */
export const api = {
  get: <T = any>(url: string) => apiClient<T>(url, { method: 'GET' }),

  post: <T = any>(url: string, data?: any) =>
    apiClient<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any) =>
    apiClient<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string) =>
    apiClient<T>(url, { method: 'DELETE' }),
};
