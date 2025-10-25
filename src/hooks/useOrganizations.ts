import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Organization } from '@/lib/types';
import { toast } from 'sonner';

export function useOrganizations() {
  const queryClient = useQueryClient();

  // Query для получения списка
  const {
    data: organizations = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<Organization[]>('/api/organizations'),
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Mutation для создания с оптимистичным обновлением
  const createMutation = useMutation({
    mutationFn: (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) =>
      api.post<Organization>('/api/organizations', data),

    onMutate: async (newOrg) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ queryKey: ['organizations'] });

      // Сохраняем предыдущее состояние
      const previous = queryClient.getQueryData<Organization[]>(['organizations']);

      // Оптимистично обновляем UI
      queryClient.setQueryData<Organization[]>(['organizations'], (old = []) => [
        { ...newOrg, id: 'temp-' + Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Organization,
        ...old,
      ]);

      return { previous };
    },

    onError: (err, newOrg, context) => {
      // Откатываем при ошибке
      if (context?.previous) {
        queryClient.setQueryData(['organizations'], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to create organization';
      toast.error(message);
    },

    onSuccess: () => {
      toast.success('Организация создана');
    },

    onSettled: () => {
      // Рефетч для синхронизации с сервером
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  // Mutation для обновления
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Organization> }) =>
      api.put<Organization>(`/api/organizations/${id}`, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['organizations'] });
      const previous = queryClient.getQueryData<Organization[]>(['organizations']);

      queryClient.setQueryData<Organization[]>(['organizations'], (old = []) =>
        old.map((org) => (org.id === id ? { ...org, ...data } : org))
      );

      return { previous };
    },

    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['organizations'], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to update organization';
      toast.error(message);
    },

    onSuccess: () => {
      toast.success('Организация обновлена');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  // Mutation для удаления
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/organizations/${id}`),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['organizations'] });
      const previous = queryClient.getQueryData<Organization[]>(['organizations']);

      queryClient.setQueryData<Organization[]>(['organizations'], (old = []) =>
        old.filter((org) => org.id !== id)
      );

      return { previous };
    },

    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['organizations'], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to delete organization';
      toast.error(message);
    },

    onSuccess: () => {
      toast.success('Организация удалена');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const getById = (id: string) => {
    return organizations.find((org) => org.id === id);
  };

  return {
    organizations,
    isLoading,
    error,
    createOrganization: createMutation.mutateAsync,
    updateOrganization: (id: string, data: Partial<Organization>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteOrganization: deleteMutation.mutateAsync,
    getById,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  };
}
