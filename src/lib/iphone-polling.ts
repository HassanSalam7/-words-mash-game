// iPhone polling fallback system
export class iPhonePolling {
  private gameId: string | null = null
  private polling: NodeJS.Timeout | null = null
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-api-domain.com/api' 
      : 'http://localhost:3000/api'
  }

  async startPolling(gameId: string, onUpdate: (data: any) => void) {
    this.gameId = gameId
    
    this.polling = setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/game/${gameId}/status`)
        const gameData = await response.json()
        onUpdate(gameData)
        console.log('📱 iPhone: Polled game state')
      } catch (error) {
        console.error('📱 iPhone: Polling failed', error)
      }
    }, 3000) // Poll every 3 seconds
  }

  stopPolling() {
    if (this.polling) {
      clearInterval(this.polling)
      this.polling = null
    }
  }

  async sendAction(action: string, data: any) {
    if (!this.gameId) return
    
    try {
      await fetch(`${this.baseUrl}/game/${this.gameId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      })
      console.log('📱 iPhone: Action sent', action)
    } catch (error) {
      console.error('📱 iPhone: Action failed', error)
    }
  }
}