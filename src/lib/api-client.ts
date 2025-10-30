// Флаг для предотвращения бесконечных циклов при refresh
let isRefreshing = false;
let refreshPromise: Promise<Response> | null = null;

/**
 * Попытка обновить access token через refresh token
 */
async function attemptTokenRefresh(): Promise<boolean> {
  // Если уже идет процесс обновления, ждем его завершения
  if (isRefreshing && refreshPromise) {
    try {
      const response = await refreshPromise;
      return response.ok;
    } catch {
      return false;
    }
  }

  // Начинаем новый процесс обновления
  isRefreshing = true;
  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  try {
    const response = await refreshPromise;
    const success = response.ok;
    
    if (!success) {
      // Refresh не удался, возможно токен истек или отозван
      isRefreshing = false;
      refreshPromise = null;
    }
    
    return success;
  } catch (error) {
    isRefreshing = false;
    refreshPromise = null;
    return false;
  } finally {
    // Сбрасываем флаг после небольшой задержки, чтобы избежать race conditions
    setTimeout(() => {
      isRefreshing = false;
      refreshPromise = null;
    }, 1000);
  }
}

/**
 * API Client с автоматическим добавлением JWT токена из cookie
 * Cookie автоматически отправляется браузером, не нужно добавлять вручную
 * Автоматически пытается обновить токен при 401 ошибке
 */
export async function apiClient<T = any>(
  url: string,
  options?: RequestInit,
  isRetry = false // Флаг для предотвращения бесконечных ретраев
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Важно: отправляем cookies
  });

  if (!response.ok) {
    // При 401 пытаемся обновить токен и повторить запрос
    if (typeof window !== 'undefined' && response.status === 401 && !isRetry) {
      const refreshSuccess = await attemptTokenRefresh();
      
      if (refreshSuccess) {
        // Токен обновлен, повторяем оригинальный запрос
        return apiClient<T>(url, options, true);
      }
      // Refresh не удался, продолжаем с редиректом на логин
    }

    // Редиректы при ошибках авторизации/доступа
    if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
      const currentPath = window.location.pathname;

      // 403: доступ ограничен (например, истек пробный период) → на страницу триала
      if (response.status === 403) {
        if (currentPath !== '/trial/expired') {
          window.location.href = '/trial/expired';
          return new Promise<T>(() => {});
        }
      }

      // 401: неавторизован → на страницу логина (если мы не в /auth/*)
      if (response.status === 401) {
        if (currentPath !== '/auth/login' && !currentPath.startsWith('/auth/')) {
          const target = '/auth/login' + (currentPath && currentPath !== '/auth/login' ? `?next=${encodeURIComponent(currentPath + window.location.search)}` : '');
          window.location.href = target;
          return new Promise<T>(() => {});
        }
      }
    }

    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
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
