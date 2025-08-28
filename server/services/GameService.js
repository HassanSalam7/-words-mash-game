const path = require('path');
const fs = require('fs');

class GameService {
  constructor() {
    this.words = null;
    this.translationWords = null;
    this.metaphoricalSentences = null;
    this.loadGameData();
  }

  loadGameData() {
    try {
      // Load from main project public directory first, then server public as fallback
      const mainPublicDir = path.join(__dirname, '../../public');
      const serverPublicDir = path.join(__dirname, '../public');
      
      // Load words for story-writing mode
      this.words = this.loadJsonFile([
        path.join(mainPublicDir, 'words.json'),
        path.join(serverPublicDir, 'words.json')
      ]) || this.getDefaultWords();

      // Load translation words for translation mode
      const translationData = this.loadJsonFile([
        path.join(mainPublicDir, 'translation-words.json'),
        path.join(serverPublicDir, 'translation-words.json')
      ]);
      
      if (translationData) {
        // Handle structured data (by difficulty) or flat array
        if (Array.isArray(translationData)) {
          this.translationWords = translationData;
        } else if (translationData.easy || translationData.medium || translationData.hard) {
          // Flatten structured data
          this.translationWords = [
            ...(translationData.easy || []),
            ...(translationData.medium || []),
            ...(translationData.hard || [])
          ];
        } else {
          this.translationWords = this.getDefaultTranslationWords();
        }
      } else {
        this.translationWords = this.getDefaultTranslationWords();
      }

      // Load metaphorical sentences for metaphorical translation mode
      const metaphoricalData = this.loadJsonFile([
        path.join(mainPublicDir, 'metaphorical-sentences.json'),
        path.join(serverPublicDir, 'metaphorical-sentences.json')
      ]);
      
      if (metaphoricalData) {
        // Handle structured data (by difficulty) or flat array
        if (Array.isArray(metaphoricalData)) {
          this.metaphoricalSentences = metaphoricalData;
        } else if (metaphoricalData.easy || metaphoricalData.medium || metaphoricalData.hard) {
          // Flatten structured data
          this.metaphoricalSentences = [
            ...(metaphoricalData.easy || []),
            ...(metaphoricalData.medium || []),
            ...(metaphoricalData.hard || [])
          ];
        } else {
          this.metaphoricalSentences = this.getDefaultMetaphoricalSentences();
        }
      } else {
        this.metaphoricalSentences = this.getDefaultMetaphoricalSentences();
      }

      console.log('✅ Game data loaded successfully');
      console.log(`   📖 Story Words: ${Object.keys(this.words).reduce((sum, key) => sum + this.words[key].length, 0)} total`);
      console.log(`      - Easy: ${this.words.easy?.length || 0}`);
      console.log(`      - Medium: ${this.words.medium?.length || 0}`);
      console.log(`      - Hard: ${this.words.hard?.length || 0}`);
      console.log(`   🔤 Translation Words: ${this.translationWords.length} total`);
      console.log(`   🎭 Metaphorical Sentences: ${this.metaphoricalSentences.length} total`);
    } catch (error) {
      console.error('⚠️  Error loading game data:', error.message);
      this.words = this.getDefaultWords();
      this.translationWords = this.getDefaultTranslationWords();
      this.metaphoricalSentences = this.getDefaultMetaphoricalSentences();
    }
  }

  loadJsonFile(paths) {
    for (const filePath of paths) {
      try {
        if (fs.existsSync(filePath)) {
          console.log(`📂 Loading: ${filePath}`);
          const data = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(data);
          console.log(`✅ Successfully loaded: ${path.basename(filePath)}`);
          return parsed;
        } else {
          console.log(`📂 File not found: ${filePath}`);
        }
      } catch (error) {
        console.log(`❌ Failed to load ${filePath}:`, error.message);
      }
    }
    return null;
  }

  getDefaultWords() {
    return {
      easy: ["cat", "dog", "sun", "moon", "tree", "book", "house", "water", "fire", "love"],
      medium: ["adventure", "mysterious", "beautiful", "dangerous", "wonderful", "incredible", "fantastic", "amazing", "brilliant", "creative"],
      hard: ["metamorphosis", "serendipity", "paradigm", "ephemeral", "quintessential", "ubiquitous", "ambiguous", "meticulous", "euphemism", "synchronous"]
    };
  }

  getDefaultTranslationWords() {
    return [
      { english: "hello", arabic: "مرحبا", wrongOptions: ["وداعا", "شكرا", "أهلا"], difficulty: "easy" },
      { english: "water", arabic: "ماء", wrongOptions: ["نار", "هواء", "تراب"], difficulty: "easy" },
      { english: "beautiful", arabic: "جميل", wrongOptions: ["قبيح", "كبير", "صغير"], difficulty: "medium" },
      { english: "knowledge", arabic: "معرفة", wrongOptions: ["جهل", "حكمة", "فهم"], difficulty: "medium" },
      { english: "philosophy", arabic: "فلسفة", wrongOptions: ["علم", "فن", "أدب"], difficulty: "hard" }
    ];
  }

  getDefaultMetaphoricalSentences() {
    return [
      {
        english: "Time is money",
        arabic: "الوقت من ذهب",
        metaphor: "Time is valuable like gold",
        wrongOptions: ["الوقت سريع", "الوقت طويل", "الوقت جميل"],
        difficulty: "easy"
      },
      {
        english: "Life is a journey",
        arabic: "الحياة رحلة",
        metaphor: "Life has paths and destinations",
        wrongOptions: ["الحياة صعبة", "الحياة قصيرة", "الحياة حلوة"],
        difficulty: "medium"
      }
    ];
  }

  getRandomWords(count = 5, difficulty = 'mixed') {
    if (!this.words) {
      console.warn('⚠️  No words available, using defaults');
      return this.getDefaultWords().easy.slice(0, count).map(word => ({ word, difficulty: 'easy' }));
    }

    let wordPool = [];
    
    if (difficulty === 'mixed') {
      // Mix all difficulty levels
      wordPool = [
        ...(this.words.easy || []).map(word => ({ word, difficulty: 'easy' })),
        ...(this.words.medium || []).map(word => ({ word, difficulty: 'medium' })),
        ...(this.words.hard || []).map(word => ({ word, difficulty: 'hard' }))
      ];
    } else if (this.words[difficulty]) {
      // Get specific difficulty level
      wordPool = this.words[difficulty].map(word => ({ word, difficulty }));
    }

    if (wordPool.length === 0) {
      console.warn(`⚠️  No words found for difficulty: ${difficulty}, using defaults`);
      return this.getDefaultWords().easy.slice(0, count).map(word => ({ word, difficulty: 'easy' }));
    }

    console.log(`📚 Selected ${count} words from ${wordPool.length} available (difficulty: ${difficulty})`);
    return this.shuffleArray(wordPool).slice(0, count);
  }

  getRandomTranslationWords(count = 5, difficulty = 'mixed') {
    if (!Array.isArray(this.translationWords) || this.translationWords.length === 0) {
      console.warn('⚠️  No translation words available, using defaults');
      return this.getDefaultTranslationWords().slice(0, count).map(word => ({
        ...word,
        options: this.shuffleArray([word.arabic, ...word.wrongOptions])
      }));
    }

    let filtered = this.translationWords;
    if (difficulty !== 'mixed') {
      filtered = this.translationWords.filter(word => word.difficulty === difficulty);
    }

    if (filtered.length === 0) {
      console.warn(`⚠️  No translation words found for difficulty: ${difficulty}, using mixed`);
      filtered = this.translationWords;
    }

    const selected = this.shuffleArray(filtered).slice(0, count);
    
    // Add options for multiple choice
    return selected.map(word => ({
      ...word,
      options: this.shuffleArray([word.arabic, ...(word.wrongOptions || [])])
    }));
  }

  getRandomMetaphoricalSentences(count = 5, difficulty = 'mixed') {
    if (!Array.isArray(this.metaphoricalSentences) || this.metaphoricalSentences.length === 0) {
      console.warn('⚠️  No metaphorical sentences available, using defaults');
      return this.getDefaultMetaphoricalSentences().slice(0, count).map(sentence => ({
        ...sentence,
        options: this.shuffleArray([sentence.arabic, ...sentence.wrongOptions])
      }));
    }

    let filtered = this.metaphoricalSentences;
    if (difficulty !== 'mixed') {
      filtered = this.metaphoricalSentences.filter(sentence => sentence.difficulty === difficulty);
    }

    if (filtered.length === 0) {
      console.warn(`⚠️  No metaphorical sentences found for difficulty: ${difficulty}, using mixed`);
      filtered = this.metaphoricalSentences;
    }

    const selected = this.shuffleArray(filtered).slice(0, count);
    
    // Add options for multiple choice
    return selected.map(sentence => ({
      ...sentence,
      options: this.shuffleArray([sentence.arabic, ...(sentence.wrongOptions || [])])
    }));
  }

  shuffleArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
      console.warn('⚠️  shuffleArray: Invalid array provided:', array);
      return [];
    }
    
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

module.exports = GameService;