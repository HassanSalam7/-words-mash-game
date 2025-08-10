'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CallButtonProps {
  gameId: string
  currentPlayer: {
    id: string
    name: string
    avatar: string
  }
  opponent: {
    id: string
    name: string
    avatar: string
  }
  socket?: any
}

export default function CallButton({ gameId, currentPlayer, opponent, socket }: CallButtonProps) {
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false)
  const [meetingLink, setMeetingLink] = useState('')
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [incomingMeetingLink, setIncomingMeetingLink] = useState('')
  const [showCreateOptions, setShowCreateOptions] = useState(false)
  const [userInputUrl, setUserInputUrl] = useState('')

  useEffect(() => {
    if (socket) {
      // Check for existing meeting when component mounts
      socket.emit('join-meeting-request', { gameId })

      // Listen for meeting link from other player
      socket.on('meeting-link-received', (data: { meetingLink: string, generatedBy: string }) => {
        if (data.generatedBy !== currentPlayer.id) {
          setIncomingMeetingLink(data.meetingLink)
          setMeetingLink(data.meetingLink)
        }
      })

      // Listen for existing meeting session
      socket.on('existing-meeting-session', (data: { meetingUrl: string }) => {
        setMeetingLink(data.meetingUrl)
        setIncomingMeetingLink(data.meetingUrl)
      })

      return () => {
        socket.off('meeting-link-received')
        socket.off('existing-meeting-session')
      }
    }
  }, [socket, currentPlayer.id, gameId])

  const createNewMeeting = () => {
    // Open Google Meet in a new tab to create a meeting
    window.open('https://meet.google.com/new', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
    setShowCreateOptions(true)
  }

  const shareMeetingUrl = () => {
    if (userInputUrl.trim() && userInputUrl.includes('meet.google.com')) {
      const cleanUrl = userInputUrl.trim()
      setMeetingLink(cleanUrl)
      setShowCreateOptions(false)
      setUserInputUrl('')
      
      // Emit meeting link to other player via socket
      if (socket) {
        socket.emit('meeting-link-generated', {
          gameId,
          meetingLink: cleanUrl,
          generatedBy: currentPlayer.id
        })
      }
    } else {
      alert('Please enter a valid Google Meet URL')
    }
  }

  const openMeetingInNewTab = () => {
    if (meetingLink) {
      window.open(meetingLink, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
    }
  }

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink)
    } catch (error) {
      console.error('Failed to copy meeting link:', error)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsCallDialogOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-105"
        size="lg"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline font-medium">Call</span>
        </div>
      </Button>

      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              Voice Call with {opponent.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src={currentPlayer.avatar} 
                    alt={currentPlayer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{currentPlayer.name}</p>
                  <p className="text-xs text-gray-500">You</p>
                </div>
              </div>
              <div className="text-green-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src={opponent.avatar} 
                    alt={opponent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{opponent.name}</p>
                  <p className="text-xs text-gray-500">Opponent</p>
                </div>
              </div>
              <div className="text-yellow-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {!meetingLink && !showCreateOptions ? (
              <div className="text-center py-4">
                <Button
                  onClick={createNewMeeting}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Start Google Meet Call
                  </div>
                </Button>
              </div>
            ) : !meetingLink && showCreateOptions ? (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="font-medium text-blue-800 text-sm mb-2">Create Meeting</p>
                    <p className="text-blue-700 text-xs mb-3">
                      A Google Meet window should have opened. Copy the meeting URL and paste it below to share with your opponent.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Input
                      type="url"
                      placeholder="Paste Google Meet URL here (e.g., https://meet.google.com/abc-defg-hij)"
                      value={userInputUrl}
                      onChange={(e) => setUserInputUrl(e.target.value)}
                      className="text-sm"
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={shareMeetingUrl}
                        disabled={!userInputUrl.trim()}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        Share Meeting
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCreateOptions(false)
                          setUserInputUrl('')
                        }}
                        variant="outline"
                        className="px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button
                      onClick={createNewMeeting}
                      variant="link" 
                      className="text-xs text-blue-600"
                    >
                      Open Google Meet again
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-2 mb-3">
                  <div className="bg-green-500 rounded-full p-1 flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-800 text-sm mb-1">
                      {incomingMeetingLink ? `${opponent.name} started a meeting` : 'Meeting Ready!'}
                    </p>
                    <p className="text-green-700 text-xs break-all">{meetingLink}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={openMeetingInNewTab}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2"
                  >
                    Join Call
                  </Button>
                  <Button
                    onClick={copyMeetingLink}
                    variant="outline"
                    className="px-3 border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </Button>
                </div>
              </Card>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-500">
                This will open Google Meet in a new tab. Both players will be able to join the same call.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}