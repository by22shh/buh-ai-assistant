import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface User {
  id: string;
  phone: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
  company?: string;
  demoStatus?: {
    documentsUsed: number;
    documentsLimit: number;
    isActive: boolean;
  };
}

export function useUser() {
  const queryClient = useQueryClient();

  // Query для получения пользователя
  const {
    data: user = null,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get<User>('/api/users/me'),
    retry: false, // Не retry если не авторизован
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Mutation для обновления профиля с оптимистичным обновлением
  const updateMutation = useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      email?: string;
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

  // Mutation для логина
  const loginMutation = useMutation({
    mutationFn: (data: {
      phone: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      position?: string;
      company?: string;
    }) => api.post<User>('/api/users/login', data),

    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data);
    },

    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to login';
      toast.error(message);
    },
  });

  return {
    user,
    isLoading,
    error,
    updateProfile: updateMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  };
}
