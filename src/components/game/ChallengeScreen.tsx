'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Word {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ChallengeScreenProps {
  words: Word[];
  onComplete: (story: string, usedWords: string[]) => void;
  timeLimit?: number;
}

export default function ChallengeScreen({ words, onComplete, timeLimit = 600 }: ChallengeScreenProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [story, setStory] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [usedWords, setUsedWords] = useState(new Set<string>());

  useEffect(() => {
    if (timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isCompleted) {
      handleComplete();
    }
  }, [timeLeft, isCompleted]);

  useEffect(() => {
    const wordsInStory = new Set<string>();
    const storyLower = story.toLowerCase();
    
    words.forEach(wordObj => {
      if (storyLower.includes(wordObj.word.toLowerCase())) {
        wordsInStory.add(wordObj.word);
      }
    });
    
    setUsedWords(wordsInStory);
  }, [story, words]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    setIsCompleted(true);
    onComplete(story, Array.from(usedWords));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            WordMash Challenge
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className={`text-lg md:text-2xl font-mono font-bold px-3 md:px-4 py-2 rounded-full ${
              timeLeft <= 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 font-medium">
              Words used: {usedWords.size}/5
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Words Panel */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800">
                  Your Words
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
                  {words.map((wordObj, index) => (
                    <div key={index} className="relative">
                      <div className={`p-2 md:p-3 rounded-lg border-2 transition-all duration-300 ${
                        usedWords.has(wordObj.word) 
                          ? 'bg-green-50 border-green-300 shadow-md transform scale-105' 
                          : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-sm md:text-lg ${
                            usedWords.has(wordObj.word) ? 'text-green-700' : 'text-gray-800'
                          }`}>
                            {wordObj.word}
                          </span>
                          {usedWords.has(wordObj.word) && (
                            <span className="text-green-500 text-lg md:text-xl">✓</span>
                          )}
                        </div>
                        <Badge className={`mt-1 md:mt-2 text-xs ${getDifficultyColor(wordObj.difficulty)}`}>
                          {wordObj.difficulty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Story Editor */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-full">
              <CardContent className="p-4 md:p-6 h-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-1 sm:mb-0">
                    Write Your Story
                  </h2>
                  <div className="text-xs md:text-sm text-gray-500">
                    {story.length} characters
                  </div>
                </div>
                
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  disabled={isCompleted}
                  placeholder="Start writing your creative story using all 5 words... Be funny, dramatic, or mysterious!"
                  className="flex-1 w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-purple-400 focus:outline-none text-gray-800 placeholder-gray-400 min-h-[250px] md:min-h-[400px] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base"
                />

                <div className="mt-3 md:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-xs md:text-sm text-gray-600 order-2 sm:order-1">
                    💡 Tip: Use all 5 words to complete the challenge!
                  </div>
                  
                  {!isCompleted && (
                    <Button
                      onClick={handleComplete}
                      disabled={usedWords.size === 0}
                      className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-4 md:px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base order-1 sm:order-2"
                    >
                      I'm Done! 🚀
                    </Button>
                  )}
                  
                  {isCompleted && (
                    <div className="text-green-600 font-semibold flex items-center gap-2 order-1 sm:order-2">
                      <span className="text-lg md:text-xl">✅</span>
                      <span className="text-sm md:text-base">Story Submitted!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full transition-all duration-300"
              style={{ width: `${(usedWords.size / 5) * 100}%` }}
            />
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            Progress: {usedWords.size}/5 words used
          </div>
        </div>
      </div>
    </div>
  );
}