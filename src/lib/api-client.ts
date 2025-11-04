// Флаг для предотвращения бесконечных циклов при refresh
let isRefreshing = false;
let refreshPromise: Promise<Response> | null = null;

// CSRF token для защиты от CSRF атак
let csrfToken: string | null = null;

/**
 * Получить CSRF token из cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return value;
    }
  }
  return null;
}

/**
 * Инициализировать CSRF token из cookie или sessionStorage при загрузке
 */
function initializeCsrfToken(): void {
  if (typeof document === 'undefined') return;
  
  // Сначала проверяем sessionStorage (для свежих токенов после логина)
  if (typeof sessionStorage !== 'undefined') {
    const tempToken = sessionStorage.getItem('csrf-token-temp');
    if (tempToken) {
      csrfToken = tempToken;
      sessionStorage.removeItem('csrf-token-temp'); // Используем только один раз
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 CSRF token initialized from sessionStorage');
      }
      return;
    }
  }
  
  // Затем проверяем cookie
  const token = getCsrfToken();
  if (token) {
    csrfToken = token;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 CSRF token initialized from cookie');
    }
  }
}

// Инициализируем CSRF token при загрузке модуля
if (typeof document !== 'undefined') {
  initializeCsrfToken();
}

/**
 * Сохранить CSRF token из response
 */
function saveCsrfTokenFromResponse(data: any) {
  if (data && data.csrfToken) {
    csrfToken = data.csrfToken;
  }
}

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
    
    if (success) {
      // Сохраняем новый CSRF token из response
      const data = await response.json();
      saveCsrfTokenFromResponse(data);
    }
    
    return success;
  } catch (error) {
    return false;
  } finally {
    // Сбрасываем флаги после завершения
    isRefreshing = false;
    refreshPromise = null;
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
  // Получаем CSRF token для state-changing операций
  // Приоритет: in-memory > cookie (для свежих токенов)
  const token = csrfToken || getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };
  
  // Добавляем CSRF token для POST/PUT/DELETE/PATCH
  if (token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options?.method || 'GET')) {
    headers['x-csrf-token'] = token;
  }

  const response = await fetch(url, {
    ...options,
    headers,
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

  const data = await response.json();
  
  // ВАЖНО: Сохраняем CSRF token из response СРАЗУ, до возврата данных
  // Это гарантирует, что токен доступен для следующих запросов
  saveCsrfTokenFromResponse(data);
  
  return data;
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
