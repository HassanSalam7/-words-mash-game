interface Word {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface TranslationWord {
  english: string;
  arabic: string;
  wrongOptions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
}

interface MetaphoricalSentence {
  english: string;
  arabic: string;
  metaphor: string;
  wrongOptions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
}

export interface ComputerPlayerProfile {
  name: string;
  avatar: string;
  speed: 'slow' | 'medium' | 'fast';
  accuracy: number; // 0.3 to 0.9
  creativity: number; // 0.3 to 0.9 (for story writing)
}

export const computerPlayerProfiles: ComputerPlayerProfile[] = [
  {
    name: 'Alex AI',
    avatar: '🤖',
    speed: 'medium',
    accuracy: 0.7,
    creativity: 0.6
  },
  {
    name: 'Sophia Bot',
    avatar: '🧠',
    speed: 'fast',
    accuracy: 0.8,
    creativity: 0.7
  },
  {
    name: 'Charlie CPU',
    avatar: '💻',
    speed: 'slow',
    accuracy: 0.6,
    creativity: 0.5
  },
  {
    name: 'Digital Dana',
    avatar: '🎯',
    speed: 'medium',
    accuracy: 0.75,
    creativity: 0.8
  },
  {
    name: 'Robot Rex',
    avatar: '⚡',
    speed: 'fast',
    accuracy: 0.9,
    creativity: 0.4
  }
];

export class ComputerPlayer {
  private profile: ComputerPlayerProfile;
  private responseTimeBase: number;

  constructor(profile?: ComputerPlayerProfile) {
    this.profile = profile || this.getRandomProfile();
    this.responseTimeBase = this.getResponseTimeBase();
  }

  private getRandomProfile(): ComputerPlayerProfile {
    return computerPlayerProfiles[Math.floor(Math.random() * computerPlayerProfiles.length)];
  }

  private getResponseTimeBase(): number {
    switch (this.profile.speed) {
      case 'slow': return 8000 + Math.random() * 4000; // 8-12 seconds
      case 'medium': return 4000 + Math.random() * 3000; // 4-7 seconds  
      case 'fast': return 2000 + Math.random() * 2000; // 2-4 seconds
      default: return 5000;
    }
  }

  getProfile(): ComputerPlayerProfile {
    return { ...this.profile };
  }

  // Story Writing AI
  async generateStory(words: Word[]): Promise<{ story: string; usedWords: string[]; timeUsed: number }> {
    const baseTime = this.responseTimeBase * 2; // Stories take longer
    const variationTime = Math.random() * 3000;
    const totalTime = baseTime + variationTime;

    return new Promise((resolve) => {
      setTimeout(() => {
        const story = this.createStoryWithWords(words);
        const usedWords = this.extractUsedWords(story, words);
        
        resolve({
          story,
          usedWords,
          timeUsed: Math.round(totalTime)
        });
      }, totalTime);
    });
  }

  private createStoryWithWords(words: Word[]): string {
    const templates = [
      "Once upon a time, there was a {0} who lived near a {1}. Every day, they would {2} until the sun set. One day, something {3} happened that changed everything. With great {4}, they discovered a new path forward.",
      "In a distant land, a {0} discovered a magical {1}. They decided to {2} with it, hoping to find something {3}. Their journey was filled with {4} and wonder.",
      "The {0} stood quietly by the {1}, thinking about how to {2}. Life felt {3} sometimes, but there was always {4} in tomorrow.",
      "A young adventurer found a {0} that could {1}. They learned to {2} with it, creating something {3} and full of {4}.",
      "Every morning, the {0} would visit the old {1} to {2}. The place felt {3}, filled with memories and {4}."
    ];

    const wordList = words.map(w => w.word);
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Shuffle words for variety
    const shuffledWords = [...wordList].sort(() => Math.random() - 0.5);
    
    let story = template;
    for (let i = 0; i < Math.min(5, shuffledWords.length); i++) {
      story = story.replace(`{${i}}`, shuffledWords[i]);
    }

    // Add creativity variations based on computer profile
    if (this.profile.creativity > 0.7) {
      const enhancers = [
        " This was just the beginning of an incredible adventure.",
        " Little did they know, this moment would change everything.",
        " The magic in the air was almost tangible.",
        " It was a day that would be remembered forever."
      ];
      story += enhancers[Math.floor(Math.random() * enhancers.length)];
    }

    return story;
  }

  private extractUsedWords(story: string, words: Word[]): string[] {
    const usedWords: string[] = [];
    const storyLower = story.toLowerCase();
    
    words.forEach(wordObj => {
      if (storyLower.includes(wordObj.word.toLowerCase())) {
        usedWords.push(wordObj.word);
      }
    });
    
    return usedWords;
  }

  // Translation Multiple Choice AI
  async selectMultipleChoice(word: TranslationWord): Promise<{ answer: string; timeUsed: number }> {
    const baseTime = this.responseTimeBase * 0.3; // Quicker for multiple choice
    const variationTime = Math.random() * 1000;
    const totalTime = baseTime + variationTime;

    return new Promise((resolve) => {
      setTimeout(() => {
        const isCorrect = Math.random() < this.profile.accuracy;
        let answer: string;
        
        if (isCorrect) {
          answer = word.arabic;
        } else {
          // Pick a wrong answer
          const wrongOptions = word.wrongOptions || [];
          answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] || word.arabic;
        }

        resolve({
          answer,
          timeUsed: Math.round(totalTime)
        });
      }, totalTime);
    });
  }

  // Translation Typing AI
  async typeTranslation(word: TranslationWord): Promise<{ answer: string; timeUsed: number }> {
    const baseTime = this.responseTimeBase * 0.8; // Longer for typing
    const variationTime = Math.random() * 2000;
    const totalTime = baseTime + variationTime;

    return new Promise((resolve) => {
      setTimeout(() => {
        const isCorrect = Math.random() < this.profile.accuracy;
        let answer: string;
        
        if (isCorrect) {
          answer = word.arabic;
        } else {
          // Simulate typing errors
          answer = this.simulateTypingErrors(word.arabic);
        }

        resolve({
          answer,
          timeUsed: Math.round(totalTime)
        });
      }, totalTime);
    });
  }

  private simulateTypingErrors(correctAnswer: string): string {
    const errorChance = 1 - this.profile.accuracy;
    
    if (Math.random() > errorChance) {
      return correctAnswer;
    }

    const errors = [
      // Missing letters
      () => correctAnswer.slice(0, -1),
      // Extra letters  
      () => correctAnswer + correctAnswer[correctAnswer.length - 1],
      // Wrong letters
      () => correctAnswer.replace(correctAnswer[0], String.fromCharCode(correctAnswer.charCodeAt(0) + 1)),
      // Transposition
      () => {
        if (correctAnswer.length < 2) return correctAnswer;
        const chars = correctAnswer.split('');
        const i = Math.floor(Math.random() * (chars.length - 1));
        [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
        return chars.join('');
      }
    ];

    const errorType = errors[Math.floor(Math.random() * errors.length)];
    return errorType() || correctAnswer;
  }

  // Metaphorical Translation AI
  async selectMetaphoricalChoice(sentence: MetaphoricalSentence): Promise<{ answer: string; timeUsed: number }> {
    const baseTime = this.responseTimeBase * 1.2; // Longer for complex sentences
    const variationTime = Math.random() * 3000;
    const totalTime = baseTime + variationTime;

    return new Promise((resolve) => {
      setTimeout(() => {
        // Metaphorical sentences are harder, so reduce accuracy
        const adjustedAccuracy = this.profile.accuracy * 0.8;
        const isCorrect = Math.random() < adjustedAccuracy;
        let answer: string;
        
        if (isCorrect) {
          answer = sentence.arabic;
        } else {
          const wrongOptions = sentence.wrongOptions || [];
          answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] || sentence.arabic;
        }

        resolve({
          answer,
          timeUsed: Math.round(totalTime)
        });
      }, totalTime);
    });
  }

  // Get computer player info for UI
  getPlayerInfo() {
    return {
      id: 'computer',
      name: this.profile.name,
      avatar: this.profile.avatar,
      score: 0,
      color: '#6B73FF'
    };
  }
}

// Utility function to create a random computer player
export function createRandomComputerPlayer(): ComputerPlayer {
  return new ComputerPlayer();
}

// Utility function to create computer player with specific difficulty
export function createComputerPlayerByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): ComputerPlayer {
  let profiles: ComputerPlayerProfile[];
  
  switch (difficulty) {
    case 'easy':
      profiles = computerPlayerProfiles.filter(p => p.accuracy <= 0.6);
      break;
    case 'medium':
      profiles = computerPlayerProfiles.filter(p => p.accuracy > 0.6 && p.accuracy <= 0.8);
      break;
    case 'hard':
      profiles = computerPlayerProfiles.filter(p => p.accuracy > 0.8);
      break;
    default:
      profiles = computerPlayerProfiles;
  }
  
  if (profiles.length === 0) profiles = computerPlayerProfiles;
  
  const selectedProfile = profiles[Math.floor(Math.random() * profiles.length)];
  return new ComputerPlayer(selectedProfile);
}