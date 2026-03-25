const ProgressManager = (() => {
  let state = { xp: 0, seenWords: [], streak: 0, lastActiveDate: null };

  const KEY_XP = 'rs_xp';
  const KEY_SEEN = 'rs_seen_words';
  const KEY_STREAK = 'rs_streak';
  const KEY_DATE = 'rs_date';

  function init() {
    try {
      const savedXp = localStorage.getItem(KEY_XP);
      const savedSeen = localStorage.getItem(KEY_SEEN);
      const savedStreak = localStorage.getItem(KEY_STREAK);
      const savedDate = localStorage.getItem(KEY_DATE);
      
      if (savedXp) state.xp = parseInt(savedXp, 10) || 0;
      if (savedSeen) state.seenWords = JSON.parse(savedSeen) || [];
      if (savedStreak) state.streak = parseInt(savedStreak, 10) || 0;
      if (savedDate) state.lastActiveDate = savedDate;

      _updateStreak();
    } catch (e) {
      console.warn('[ProgressManager] LocalStorage read error');
    }
    updateUI();
  }

  function _updateStreak() {
    const today = new Date().toDateString();
    if (state.lastActiveDate !== today) {
       if (!state.lastActiveDate) {
         state.streak = 1;
       } else {
         const lastDate = new Date(state.lastActiveDate);
         const now = new Date();
         const diffDays = Math.ceil(Math.abs(now - lastDate) / (1000 * 60 * 60 * 24)); 
         if (diffDays === 1) state.streak += 1;
         else if (diffDays > 1) state.streak = 1;
       }
       state.lastActiveDate = today;
       try {
         localStorage.setItem(KEY_DATE, state.lastActiveDate);
         localStorage.setItem(KEY_STREAK, state.streak.toString());
       } catch (e) {}
    }
  }

  function addXP(amount) {
    if (typeof amount !== 'number' || amount <= 0) return;
    state.xp += amount;
    try {
      localStorage.setItem(KEY_XP, state.xp.toString());
    } catch (e) {}
    updateUI();
  }

  function markWordSeen(wordId) {
    if (!wordId) return;
    if (!state.seenWords.includes(wordId)) {
      state.seenWords.push(wordId);
      try {
        localStorage.setItem(KEY_SEEN, JSON.stringify(state.seenWords));
      } catch (e) {}
    }
  }

  function updateUI() {
    document.querySelectorAll('#ui-streak').forEach(el => { el.textContent = state.streak; });
    document.querySelectorAll('#ui-xp').forEach(el => { el.textContent = state.xp; });
  }

  return { init, addXP, markWordSeen, getSeenWords: () => state.seenWords || [] };
})();
