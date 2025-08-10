export interface MeetingOptions {
  gameId: string
  participants: {
    id: string
    name: string
    email?: string
  }[]
}

export interface MeetingSession {
  id: string
  meetingUrl: string
  gameId: string
  createdAt: Date
  participants: string[]
}

class GoogleMeetIntegration {
  private activeSessions: Map<string, MeetingSession> = new Map()

  async generateMeetingRoom(gameId: string, participants: MeetingOptions['participants']): Promise<MeetingSession> {
    // Create a shareable meeting URL that both players can use
    // This creates a new meeting each time, which is the correct approach
    const meetingUrl = 'https://meet.google.com/new'
    const roomId = this.generateRoomId(gameId)
    
    const session: MeetingSession = {
      id: roomId,
      meetingUrl,
      gameId,
      createdAt: new Date(),
      participants: participants.map(p => p.id)
    }

    this.activeSessions.set(gameId, session)
    return session
  }

  getMeetingSession(gameId: string): MeetingSession | null {
    return this.activeSessions.get(gameId) || null
  }

  closeMeetingSession(gameId: string): boolean {
    return this.activeSessions.delete(gameId)
  }

  private generateRoomId(gameId: string): string {
    // Generate a valid Google Meet room ID format (3 groups of 4 characters separated by hyphens)
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    const generateGroup = () => Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `${generateGroup()}-${generateGroup()}-${generateGroup()}`
  }

  isValidMeetingUrl(url: string): boolean {
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i
    return meetRegex.test(url)
  }

  extractRoomIdFromUrl(url: string): string | null {
    const match = url.match(/https:\/\/meet\.google\.com\/([a-z0-9-]+)/i)
    return match ? match[1] : null
  }

  getActiveSessionsCount(): number {
    return this.activeSessions.size
  }

  getAllActiveSessions(): MeetingSession[] {
    return Array.from(this.activeSessions.values())
  }

  cleanupExpiredSessions(maxAgeHours: number = 24): number {
    const now = new Date()
    const maxAge = maxAgeHours * 60 * 60 * 1000
    let cleanedCount = 0

    for (const [gameId, session] of this.activeSessions) {
      const age = now.getTime() - session.createdAt.getTime()
      if (age > maxAge) {
        this.activeSessions.delete(gameId)
        cleanedCount++
      }
    }

    return cleanedCount
  }
}

export const googleMeetIntegration = new GoogleMeetIntegration()
export default googleMeetIntegration