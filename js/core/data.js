const DataManager = (() => {
  let cache = { vocab: [], lessons: [], sentences: [] };
  let isLoading = false;

  const shuffle = (array) => {
    if (!Array.isArray(array)) return [];
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const normalizeWord = (w) => {
    if (!w) return null;
    if (Array.isArray(w)) {
      if (w.length < 4) return null;
      return { id: w[0], hz: w[0], py: w[1] || "", ar: w[2] || "", en: w[3] || "", lessonId: w[4] || 1 };
    }
    if (typeof w === 'object') {
      const id = w.hz || w.id;
      if (!id) return null;
      return { id: id, hz: id, py: w.py || "", ar: w.ar || "", en: w.en || "", lessonId: w.lessonId || w.le || 1 };
    }
    return null;
  };

  async function fetchJSON(url) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn(`[DataManager] Network fetch failed: ${url}`);
    }
    return [];
  }

  return {
    shuffle,
    async init() {
      isLoading = true;
      const [vocab, lessons, sentences] = await Promise.all([
        fetchJSON('data/hsk1_vocab.json'),
        fetchJSON('data/hsk1_lessons.json'),
        fetchJSON('data/hsk1_sentences.json')
      ]);

      let rawVocab = vocab || [];
      if (!Array.isArray(rawVocab) && rawVocab.vocabulary) rawVocab = rawVocab.vocabulary;
      else if (!Array.isArray(rawVocab) && rawVocab.hsk1) rawVocab = rawVocab.hsk1;
      
      if (Array.isArray(rawVocab)) {
        cache.vocab = rawVocab.map(normalizeWord).filter(w => w !== null);
      } else {
        cache.vocab = [];
      }

      cache.lessons = Array.isArray(lessons) ? lessons : [];
      cache.sentences = Array.isArray(sentences) ? sentences : [];
      isLoading = false;
    },
    getAllWords: () => cache.vocab || [],
    getWordById: (id) => (cache.vocab || []).find(w => w && w.id === id) || null,
    getNextUnlearnedWords(count) {
      if (!cache.vocab || cache.vocab.length === 0) return [];
      const seen = ProgressManager.getSeenWords() || [];
      const unlearned = cache.vocab.filter(w => w && !seen.includes(w.id));
      return unlearned.slice(0, count);
    },
    getReviewWords(count) {
      if (!cache.vocab || cache.vocab.length === 0) return [];
      const seen = ProgressManager.getSeenWords() || [];
      if (seen.length === 0) return [];
      const review = cache.vocab.filter(w => w && seen.includes(w.id));
      return shuffle(review).slice(0, count);
    },
    getMixedWords(newCount, reviewCount) {
      return { 
        newWords: this.getNextUnlearnedWords(newCount) || [], 
        reviewWords: this.getReviewWords(reviewCount) || [] 
      };
    }
  };
})();
