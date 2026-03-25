const LearningEngine = (() => {

  function createStep(type, word, options = {}) {
    return { type, word, ...options };
  }

  function generateNode() {
    const allVocab = DataManager.getAllWords();
    if (!allVocab || allVocab.length === 0) return null;

    const { newWords, reviewWords } = DataManager.getMixedWords(3, 2);
    if (newWords.length === 0 && reviewWords.length === 0) return null;

    const allWords = [...newWords, ...reviewWords];
    const sequence = [];

    newWords.forEach(w => {
      if (!w) return;
      sequence.push(createStep('intro', w));
      sequence.push(createStep('explain', w));
      sequence.push(createStep('mcq', w));
    });

    const shuffledWords = DataManager.shuffle(allWords);
    shuffledWords.forEach((w, idx) => {
      if (!w) return;
      if (idx % 2 === 0) sequence.push(createStep('true_false', w));
      else sequence.push(createStep('listening', w));
    });

    const validMatchWords = allWords.filter(w => w && w.hz && w.ar);
    if (validMatchWords.length > 1) {
      const matchPool = validMatchWords.slice(0, 4);
      sequence.push({ type: 'match', words: matchPool });
    }

    sequence.push({ type: 'complete', reward: 50 });

    return {
      nodeId: `N-${Date.now()}`,
      targetWords: allWords,
      sequence: sequence
    };
  }

  return { generateNode };
})();
