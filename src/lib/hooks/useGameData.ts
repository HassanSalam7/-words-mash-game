import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { gameApi, Word, TranslationWord, MetaphoricalSentence, Speech } from '../gameApi'

// Query keys for cache management
export const gameQueryKeys = {
  all: ['game'] as const,
  words: () => [...gameQueryKeys.all, 'words'] as const,
  translationWords: () => [...gameQueryKeys.all, 'translation-words'] as const,
  metaphoricalSentences: () => [...gameQueryKeys.all, 'metaphorical-sentences'] as const,
  speeches: () => [...gameQueryKeys.all, 'speeches'] as const,
}

// Hook for loading story words
export const useWords = (options?: UseQueryOptions<Record<string, string[]>>) => {
  return useQuery({
    queryKey: gameQueryKeys.words(),
    queryFn: () => gameApi.getWords(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    refetchOnWindowFocus: false,
    ...options,
  })
}

// Hook for loading translation words
export const useTranslationWords = (options?: UseQueryOptions<Record<string, TranslationWord[]>>) => {
  return useQuery({
    queryKey: gameQueryKeys.translationWords(),
    queryFn: () => gameApi.getTranslationWords(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    ...options,
  })
}

// Hook for loading metaphorical sentences
export const useMetaphoricalSentences = (options?: UseQueryOptions<Record<string, MetaphoricalSentence[]>>) => {
  return useQuery({
    queryKey: gameQueryKeys.metaphoricalSentences(),
    queryFn: () => gameApi.getMetaphoricalSentences(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    ...options,
  })
}

// Hook for loading speeches
export const useSpeeches = (options?: UseQueryOptions<Speech[]>) => {
  return useQuery({
    queryKey: gameQueryKeys.speeches(),
    queryFn: () => gameApi.getSpeeches(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    ...options,
  })
}

// Hook for generating conversations with AI
export const useGenerateConversation = (
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof gameApi.generateConversation>>,
    Error,
    Parameters<typeof gameApi.generateConversation>[0]
  >
) => {
  return useMutation({
    mutationFn: (payload) => gameApi.generateConversation(payload),
    retry: 2,
    ...options,
  })
}

// Utility hook to prefetch all game data
export const usePrefetchGameData = () => {
  const queryClient = useQuery({
    queryKey: ['prefetch'],
    queryFn: async () => {
      // Prefetch all game data in parallel
      await Promise.allSettled([
        gameApi.getWords(),
        gameApi.getTranslationWords(),
        gameApi.getMetaphoricalSentences(),
        gameApi.getSpeeches(),
      ])
      return null
    },
    enabled: false, // Only run when manually triggered
  })

  return queryClient.refetch
}