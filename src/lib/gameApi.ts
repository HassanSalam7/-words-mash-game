import { apiService } from './api'

// Type definitions
export interface Word {
  word: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface TranslationWord {
  english: string
  arabic: string
  wrongOptions: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  options?: string[]
}

export interface MetaphoricalSentence {
  english: string
  arabic: string
  metaphor: string
  wrongOptions: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  options?: string[]
}

export interface Speech {
  id: number
  title: string
  content: string
  author?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  duration?: number
  wordCount?: number
}

// Game API service class
export class GameApiService {
  // Load story words
  async getWords(): Promise<Record<string, string[]>> {
    try {
      return await apiService.get<Record<string, string[]>>('/words.json')
    } catch (error) {
      console.error('Failed to load words:', error)
      throw new Error('Failed to load game words. Please try again.')
    }
  }

  // Load translation words
  async getTranslationWords(): Promise<Record<string, TranslationWord[]>> {
    try {
      return await apiService.get<Record<string, TranslationWord[]>>('/translation-words.json')
    } catch (error) {
      console.error('Failed to load translation words:', error)
      throw new Error('Failed to load translation words. Please try again.')
    }
  }

  // Load metaphorical sentences
  async getMetaphoricalSentences(): Promise<Record<string, MetaphoricalSentence[]>> {
    try {
      return await apiService.get<Record<string, MetaphoricalSentence[]>>('/metaphorical-sentences.json')
    } catch (error) {
      console.error('Failed to load metaphorical sentences:', error)
      throw new Error('Failed to load metaphorical sentences. Please try again.')
    }
  }

  // Load speeches
  async getSpeeches(): Promise<Speech[]> {
    try {
      const data = await apiService.get<{ speeches: Speech[] }>('/speeches.json')
      return data.speeches || []
    } catch (error) {
      console.error('Failed to load speeches:', error)
      throw new Error('Failed to load speeches. Please try again.')
    }
  }

  // Generate AI conversation using local API route
  async generateConversation(payload: {
    topic: string
    wordCount: number
    characters: string[]
  }): Promise<{
    id: string
    topic: string
    wordCount: number
    characters: string[]
    turns: Array<{
      character: string
      dialogue: string
    }>
    createdAt: Date
  }> {
    try {
      const response = await apiService.post<any>('/api/generate-conversation', {
        topic: payload.topic,
        wordCount: payload.wordCount,
        characters: payload.characters
      })

      return {
        ...response,
        createdAt: new Date(response.createdAt)
      }
    } catch (error) {
      console.error('Failed to generate conversation:', error)
      throw new Error('Failed to generate conversation. Please try again.')
    }
  }
}

// Create and export game API service instance
export const gameApi = new GameApiService()
export default gameApi