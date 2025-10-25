import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Document } from '@/lib/types';
import { toast } from 'sonner';

export function useDocuments() {
  const queryClient = useQueryClient();

  // Query для получения списка
  const {
    data: documents = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get<Document[]>('/api/documents'),
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Mutation для создания с оптимистичным обновлением
  const createMutation = useMutation({
    mutationFn: (data: {
      organizationId?: string;
      title?: string;
      templateCode: string;
      templateVersion: string;
      bodyText?: string;
      requisites?: Record<string, any>;
      hasBodyChat?: boolean;
    }) => api.post<Document>('/api/documents', data),

    onMutate: async (newDoc) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      const previous = queryClient.getQueryData<Document[]>(['documents']);

      // Оптимистично показываем документ
      queryClient.setQueryData<Document[]>(['documents'], (old = []) => [
        {
          ...newDoc,
          id: 'temp-' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'temp'
        } as Document,
        ...old,
      ]);

      return { previous };
    },

    onError: (err, newDoc, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['documents'], context.previous);
      }

      const message = err instanceof Error ? err.message : 'Failed to create document';

      // Специальная обработка для превышения лимита
      if (message.includes('Demo limit exceeded')) {
        toast.error('Превышен лимит демо-доступа. Обратитесь к менеджеру.');
      } else {
        toast.error(message);
      }
    },

    onSuccess: () => {
      toast.success('Документ создан');
      // Обновляем также демо-статус
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Mutation для обновления
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Document> }) =>
      api.put<Document>(`/api/documents/${id}`, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      const previous = queryClient.getQueryData<Document[]>(['documents']);

      queryClient.setQueryData<Document[]>(['documents'], (old = []) =>
        old.map((doc) => (doc.id === id ? { ...doc, ...data } : doc))
      );

      return { previous };
    },

    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['documents'], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to update document';
      toast.error(message);
    },

    onSuccess: () => {
      toast.success('Документ обновлен');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Mutation для удаления
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/documents/${id}`),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      const previous = queryClient.getQueryData<Document[]>(['documents']);

      queryClient.setQueryData<Document[]>(['documents'], (old = []) =>
        old.filter((doc) => doc.id !== id)
      );

      return { previous };
    },

    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['documents'], context.previous);
      }
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      toast.error(message);
    },

    onSuccess: () => {
      toast.success('Документ удален');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const getById = (id: string) => {
    return documents.find((doc) => doc.id === id);
  };

  return {
    documents,
    isLoading,
    error,
    createDocument: createMutation.mutateAsync,
    updateDocument: (id: string, data: Partial<Document>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteDocument: deleteMutation.mutateAsync,
    getById,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  };
}
