import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ResultsScreen({ results, onPlayAgain, onShare }) {
  const [reactions, setReactions] = useState({});
  const [selectedEmoji, setSelectedEmoji] = useState('');

  const emojis = ['👍', '❤️', '😂', '🤯', '💩', '👎'];

  const handleEmojiClick = (emoji, storyIndex) => {
    setReactions(prev => ({
      ...prev,
      [storyIndex]: [...(prev[storyIndex] || []), emoji]
    }));
    setSelectedEmoji(emoji);
    
    // Emit reaction to other player via socket
    if (window.socket) {
      window.socket.emit('emoji-reaction', {
        emoji,
        targetStory: storyIndex
      });
    }
  };

  const highlightWords = (story, usedWords) => {
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
      results.stories.map((story, index) => 
        `${story.playerName} (${story.wordsCount}/5 words):\n"${story.story}"\n`
      ).join('\n') +
      `\nPlay WordMash Battle now! 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WordMash Battle Results',
          text: shareText,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Results copied to clipboard!');
      });
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
                    <div className="text-3xl">{storyData.avatar}</div>
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
                    {reactions[index] && reactions[index].length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reactions[index].map((reaction, reactionIndex) => (
                          <span 
                            key={reactionIndex}
                            className="text-lg animate-bounce"
                            style={{ animationDelay: `${reactionIndex * 0.1}s` }}
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
            <Button
              onClick={shareResults}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              📤 Share Results
            </Button>
            
            <Button
              onClick={onPlayAgain}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🎮 Play Again
            </Button>
          </div>
          
          <p className="text-gray-500 text-sm">
            Thanks for playing WordMash Battle! 🚀
          </p>
        </div>

        {/* Fun Stats */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {results.stories.reduce((total, story) => total + story.wordsCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Words Used</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cyan-600">
                {results.stories.reduce((total, story) => total + story.story.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Characters</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {results.stories.filter(story => story.wordsCount === 5).length}
              </div>
              <div className="text-sm text-gray-600">Perfect Scores</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(reactions).flat().length}
              </div>
              <div className="text-sm text-gray-600">Reactions Given</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}