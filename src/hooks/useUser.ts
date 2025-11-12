import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, resetAuthState } from '@/lib/api-client';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

import type { User } from '@/lib/types/user';

export function useUser() {
  const queryClient = useQueryClient();

  const hasToken = !!Cookies.get('auth-token');

  // Query для получения пользователя
  const {
    data: user = null,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get<User>('/api/users/me'),
    retry: false, // Не retry если не авторизован
    enabled: hasToken, // ВАЖНО: Запрос выполняется только если есть токен
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Mutation для обновления профиля с оптимистичным обновлением
  const updateMutation = useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      position?: string;
      company?: string;
    }) => api.put<User>('/api/users/me', data),

    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['user'] });
      const previous = queryClient.getQueryData<User>(['user']);

      if (previous) {
        queryClient.setQueryData<User>(['user'], {
          ...previous,
          ...newData,
        });
      }

      return { previous };
    },

    onError: (err, newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user'], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    },

    onSuccess: () => {
      toast.success('Профиль обновлен');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
      resetAuthState();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Не удалось выйти из аккаунта';
      toast.error(message);
    },
  });

  // Production: login через auth flow, не нужен отдельный mutation

  return {
    user,
    isLoading,
    error,
    updateProfile: updateMutation.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
