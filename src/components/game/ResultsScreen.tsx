'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/player-avatar';

interface StoryResult {
  playerName: string;
  avatar: string;
  story: string;
  usedWords: string[];
  wordsCount: number;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  color: string;
}

interface GameResults {
  gameId: string;
  gameMode?: string;
  stories?: StoryResult[];
  players?: Player[];
  winner?: Player;
}

interface ResultsScreenProps {
  results: GameResults;
  onPlayAgain: () => void;
  onBackToHome?: () => void;
  onShare?: (shareText: string) => void;
  incomingReactions?: Record<number, string[]>;
}

export default function ResultsScreen({ results, onPlayAgain, onBackToHome, onShare, incomingReactions = {} }: ResultsScreenProps) {
  // Safety check for results
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading Results...</h2>
          <p className="text-gray-600">Please wait while we prepare your results.</p>
        </Card>
      </div>
    )
  }

  // Handle translation game results
  if (results.gameMode === 'translation' && results.players) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🏆</div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Translation Battle Complete!
                </h1>
                <p className="text-gray-600">Final scores are in!</p>
              </div>

              <div className="space-y-4 mb-8">
                {results.players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div key={player.name} className={`flex items-center justify-between p-4 rounded-xl ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300' :
                      index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300' :
                      'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <PlayerAvatar avatar={player.avatar} size="md" />
                        <div>
                          <div className="font-bold text-lg">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            {index === 0 ? 'Winner!' : `${index + 1}${index === 1 ? 'nd' : 'rd'} Place`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black" style={{ color: player.color }}>
                          {player.score}
                        </div>
                        <div className="text-sm text-gray-600">points</div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="text-center space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    onClick={onPlayAgain}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
                  >
                    Play Again 🔄
                  </Button>
                  {onBackToHome && (
                    <Button 
                      onClick={onBackToHome}
                      variant="outline"
                      className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 px-8 py-3 rounded-xl font-bold"
                    >
                      🏠 Back to Home
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Handle translation game results
  if (results.gameMode === 'translation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-white/95 backdrop-blur-md shadow-2xl">
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Complete!</h2>
          
          {/* Winner */}
          <div className="mb-6">
            <div className="text-lg font-semibold text-gray-700 mb-2">Winner:</div>
            <div className="flex items-center justify-center gap-3 bg-yellow-100 rounded-lg p-4">
              <img 
                src={results.winner?.avatar || ''} 
                alt="Winner avatar"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="font-bold text-lg text-yellow-700">{results.winner?.name || 'Unknown'}</div>
                <div className="text-sm text-yellow-600">Score: {results.winner?.score || 0}</div>
              </div>
            </div>
          </div>

          {/* Final Scores */}
          {results.players && (
            <div className="mb-6">
              <div className="text-lg font-semibold text-gray-700 mb-2">Final Scores:</div>
              <div className="space-y-2">
                {results.players.map((player: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <img 
                        src={player.avatar} 
                        alt={`${player.name} avatar`}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className="font-bold text-blue-600">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={onPlayAgain} className="flex-1">
              Play Again
            </Button>
            {onBackToHome && (
              <Button onClick={onBackToHome} variant="outline" className="flex-1">
                Home
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // Handle story game results (original logic)
  if (!results.stories || !Array.isArray(results.stories)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Stories Found</h2>
          <p className="text-gray-600">It looks like no stories were created in this game.</p>
          <Button onClick={onPlayAgain} className="mt-4">
            Play Again
          </Button>
        </Card>
      </div>
    )
  }
  const [reactions, setReactions] = useState<Record<number, string[]>>({});

  const emojis = ['👍', '❤️', '😂', '🤯', '💩', '👎'];

  const handleEmojiClick = (emoji: string, storyIndex: number) => {
    setReactions(prev => ({
      ...prev,
      [storyIndex]: [...(prev[storyIndex] || []), emoji]
    }));
    
    // Emit reaction to other player via socket
    if (typeof window !== 'undefined' && (window as any).socket) {
      (window as any).socket.emit('emoji-reaction', {
        emoji,
        targetStory: storyIndex
      });
    }
  };

  const highlightWords = (story: string, usedWords: string[]) => {
    if (!story || !usedWords.length) return story;
    
    let highlightedStory = story;
    usedWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      highlightedStory = highlightedStory.replace(
        regex, 
        `<span class="bg-gradient-to-r from-yellow-200 to-yellow-300 px-1 py-0.5 rounded font-semibold text-yellow-800 shadow-sm">${word}</span>`
      );
    });
    
    return highlightedStory;
  };

  const shareResults = async () => {
    const shareText = `🎮 WordMash Battle Results!\n\n` +
      (results.stories?.map((story, index) => 
        `${story.playerName} (${story.wordsCount}/5 words):\n"${story.story}"\n`
      ).join('\n') || 'No stories available') +
      `\nPlay WordMash Battle now! 🚀`;

    // Try native sharing first (available on mobile)
    if (navigator.share && typeof navigator.canShare === 'function') {
      try {
        await navigator.share({
          title: 'WordMash Battle Results',
          text: shareText,
          url: window.location.origin
        });
        return;
      } catch (error) {
        console.log('Native share failed or cancelled:', error);
      }
    }

    // Fallback: try clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('✅ Results copied to clipboard!');
        return;
      } catch (error) {
        console.log('Clipboard API failed:', error);
      }
    }

    // Final fallback: create downloadable text file
    try {
      const blob = new Blob([shareText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wordmash-results.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('📄 Results downloaded as text file!');
    } catch (error) {
      console.error('All share methods failed:', error);
      // Ultimate fallback: show text in prompt
      prompt('Copy these results:', shareText);
    }
    
    if (onShare) onShare(shareText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            🎉 Battle Results!
          </h1>
          <p className="text-gray-600 text-lg">
            Check out these amazing stories created with the same 5 words!
          </p>
        </div>

        {/* Stories Side by Side */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {results.stories.map((storyData, index) => (
            <Card key={index} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                {/* Player Header */}
                <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar avatar={storyData.avatar} size="lg" />
                    <div>
                      <h3 className="font-bold text-lg">{storyData.playerName}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 text-white border-white/30">
                          {storyData.wordsCount}/5 words used
                        </Badge>
                        {storyData.wordsCount === 5 && (
                          <span className="text-yellow-300 text-sm font-semibold">
                            ✨ Perfect Score!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Story Content */}
                <div className="p-6">
                  <div 
                    className="text-gray-800 leading-relaxed mb-4 min-h-[200px] text-lg"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightWords(storyData.story, storyData.usedWords) 
                    }}
                  />

                  {/* Used Words */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Words Used:</h4>
                    <div className="flex flex-wrap gap-2">
                      {storyData.usedWords.map((word, wordIndex) => (
                        <Badge 
                          key={wordIndex} 
                          className="bg-green-100 text-green-700 border-green-200"
                        >
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Emoji Reactions */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-600 mb-3">React to this story:</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiClick(emoji, index)}
                          className="text-2xl p-2 rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    
                    {/* Show reactions */}
                    {(reactions[index]?.length > 0 || incomingReactions[index]?.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {/* Your reactions */}
                        {reactions[index]?.map((reaction, reactionIndex) => (
                          <span 
                            key={`local-${reactionIndex}`}
                            className="text-lg animate-bounce bg-blue-100 px-2 py-1 rounded-full border-2 border-blue-300"
                            style={{ animationDelay: `${reactionIndex * 0.1}s` }}
                            title="Your reaction"
                          >
                            {reaction}
                          </span>
                        ))}
                        {/* Opponent reactions */}
                        {incomingReactions[index]?.map((reaction, reactionIndex) => (
                          <span 
                            key={`incoming-${reactionIndex}`}
                            className="text-lg animate-bounce bg-green-100 px-2 py-1 rounded-full border-2 border-green-300"
                            style={{ animationDelay: `${(reactions[index]?.length || 0) + reactionIndex * 0.1}s` }}
                            title="Opponent's reaction"
                          >
                            {reaction}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
         {/*   <Button
              onClick={shareResults}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              📤 Share Results
            </Button>
            */}
            <Button
              onClick={onPlayAgain}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🎮 Play Again
            </Button>
            
            {onBackToHome && (
              <Button
                onClick={onBackToHome}
                variant="outline"
                className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
              >
                🏠 Back to Home
              </Button>
            )}
          </div>
          
          <p className="text-gray-500 text-sm">
            Thanks for playing WordMash Battle! 🚀
          </p>
        </div>

      </div>
    </div>
  );
}