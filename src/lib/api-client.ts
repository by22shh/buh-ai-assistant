// Флаг для предотвращения бесконечных циклов при refresh
let isRefreshing = false;
let refreshPromise: Promise<Response> | null = null;

// CSRF token для защиты от CSRF атак
let csrfToken: string | null = null;

export type ApiClientOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

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
 * Сбросить локальное состояние аутентификации (используется при logout)
 */
export function resetAuthState() {
  csrfToken = null;
  isRefreshing = false;
  refreshPromise = null;

  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem('csrf-token-temp');
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to clear temporary CSRF token from sessionStorage:', error);
      }
    }
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
  options: ApiClientOptions = {},
  isRetry = false // Флаг для предотвращения бесконечных ретраев
): Promise<T> {
  const { skipAuthRedirect = false, ...requestInit } = options ?? {};

  // Получаем CSRF token для state-changing операций
  // Приоритет: in-memory > cookie (для свежих токенов)
  const token = csrfToken || getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(requestInit.headers as Record<string, string>),
  };
  
  // Добавляем CSRF token для POST/PUT/DELETE/PATCH
  if (token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(requestInit.method || 'GET')) {
    headers['x-csrf-token'] = token;
  }

  const response = await fetch(url, {
    ...requestInit,
    headers,
    credentials: 'include', // Важно: отправляем cookies
  });

  if (!response.ok) {
    // Пробуем прочитать тело ошибки, чтобы понять причину (CSRF/доступ/авторизация)
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));

    // Специальное форматирование ошибок валидации (Zod)
    const formatValidationError = (body: any): string | null => {
      // Бэкенд часто возвращает: { error: 'Validation error', details: [{ field, message }] }
      if (body && Array.isArray(body.details) && body.details.length > 0) {
        const messages = body.details
          .map((d: any) => {
            const field = typeof d?.field === 'string' ? d.field : undefined;
            const msg = typeof d?.message === 'string' ? d.message : undefined;
            if (field && msg) return `${field}: ${msg}`;
            return msg || field || null;
          })
          .filter(Boolean)
          .join('; ');
        return messages ? `Ошибка валидации: ${messages}` : 'Ошибка валидации';
      }

      // Некоторые маршруты Zod могут возвращать issues
      if (body && Array.isArray(body.issues) && body.issues.length > 0) {
        const messages = body.issues
          .map((i: any) => {
            const path = Array.isArray(i?.path) ? i.path.join('.') : undefined;
            const msg = typeof i?.message === 'string' ? i.message : undefined;
            if (path && msg) return `${path}: ${msg}`;
            return msg || path || null;
          })
          .filter(Boolean)
          .join('; ');
        return messages ? `Ошибка валидации: ${messages}` : 'Ошибка валидации';
      }
      return null;
    };

    // 401 → попытаться рефрешнуть токен и повторить один раз
    if (typeof window !== 'undefined' && response.status === 401 && !isRetry) {
      const refreshSuccess = await attemptTokenRefresh();
      if (refreshSuccess) {
        return apiClient<T>(url, options, true);
      }
    }

    // 403 из-за CSRF → запросить новый CSRF через refresh и повторить один раз
    const csrfFailed = response.status === 403 && typeof errorBody?.message === 'string' && errorBody.message.toLowerCase().includes('csrf');
    if (typeof window !== 'undefined' && csrfFailed && !isRetry) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        return apiClient<T>(url, options, true);
      }
    }

    // Редиректы при ошибках авторизации/доступа
    if (!skipAuthRedirect && typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
      const currentPath = window.location.pathname;

      // 403: доступ ограничен (например, истек пробный период) → на страницу триала
      if (response.status === 403) {
        if (currentPath !== '/trial/expired' && !csrfFailed) {
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

    const validationMsg = formatValidationError(errorBody);
    const generic = errorBody.error || errorBody.message || 'API request failed';
    const error = new Error(validationMsg || generic) as Error & { status?: number; body?: any };
    error.status = response.status;
    error.body = errorBody;
    throw error;
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
  get: <T = any>(url: string, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...(options ?? {}), method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, {
      ...(options ?? {}),
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: ApiClientOptions) =>
    apiClient<T>(url, {
      ...(options ?? {}),
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: ApiClientOptions) =>
    apiClient<T>(url, { ...(options ?? {}), method: 'DELETE' }),
};
