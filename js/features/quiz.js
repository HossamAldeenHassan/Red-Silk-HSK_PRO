const QuizEngine = (() => {
  let state = { currentNode: null, currentStepIndex: 0 };
  let overlayBodyRef = null;

  function playAudio(text) {
    if (!text || typeof window.speechSynthesis === 'undefined') return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[QuizEngine] Audio err', e);
    }
  }

  const QuizRenderer = {
    renderIntro(step) {
      const w = step.word; if (!w) return `<p>خطأ</p>`;
      return `<div class="step-card fade-in"><div class="hz-large">${w.hz || ''}</div><p class="py-text">${w.py || ''}</p></div><button class="btn-primary full-width mt-4" data-action="next">متابعة</button>`;
    },
    renderExplain(step) {
      const w = step.word; if (!w) return `<p>خطأ</p>`;
      return `<div class="step-card fade-in"><div class="hz-large">${w.hz || ''}</div><div class="explain-box"><p>المعنى: <strong style="color:var(--text-dark)">${w.ar || ''}</strong></p></div></div><button class="btn-primary full-width mt-4" data-action="next">فهمت</button>`;
    },
    renderMCQ(step) {
      const w = step.word; if (!w) return `<p>خطأ</p>`;
      const allWords = DataManager.getAllWords() || [];
      const distractors = DataManager.shuffle(allWords.filter(x => x && x.id !== w.id)).slice(0, 3);
      const options = DataManager.shuffle([w, ...distractors]);
      let html = `<div class="step-card fade-in"><div class="hz-large">${w.hz || ''}</div><p class="py-text">${w.py || ''}</p><p class="q-title mt-4">ما هو المعنى الصحيح؟</p></div><div class="options-grid mt-4">`;
      options.forEach(opt => {
        if (!opt) return;
        const isCorrect = (opt.id === w.id);
        html += `<button class="option-btn" data-answer="${isCorrect}">${opt.ar || ''}</button>`;
      });
      return html + `</div>`;
    },
    renderListening(step) {
      const w = step.word; if (!w) return `<p>خطأ</p>`;
      const allWords = DataManager.getAllWords() || [];
      const distractors = DataManager.shuffle(allWords.filter(x => x && x.id !== w.id)).slice(0, 3);
      const options = DataManager.shuffle([w, ...distractors]);
      let html = `<div class="step-card fade-in"><button class="audio-btn-large" id="btn-play-audio" style="border:none;">🔊</button><p class="q-title mt-4">استمع واختر الرمز الصحيح</p></div><div class="options-grid mt-4">`;
      options.forEach(opt => {
        if (!opt) return;
        const isCorrect = (opt.id === w.id);
        html += `<button class="option-btn hz-medium" data-answer="${isCorrect}">${opt.hz || ''}</button>`;
      });
      return html + `</div>`;
    },
    renderTrueFalse(step) {
      const w = step.word; if (!w) return `<p>خطأ</p>`;
      const isActuallyTrue = Math.random() > 0.5;
      let displayAr = w.ar || '';
      if (!isActuallyTrue) {
         const others = (DataManager.getAllWords() || []).filter(x => x && x.id !== w.id);
         const other = DataManager.shuffle(others)[0];
         if (other) displayAr = other.ar || '';
      }
      return `<div class="step-card fade-in"><div class="hz-large">${w.hz || ''}</div><div class="tf-ar mt-4">${displayAr}</div></div><div class="tf-grid mt-4"><button class="btn-tf correct" data-answer="${isActuallyTrue}">✅ صحيح</button><button class="btn-tf wrong" data-answer="${!isActuallyTrue}">❌ خطأ</button></div>`;
    },
    renderMatch(step) {
      const pool = step.words || [];
      if (pool.length === 0) return this.renderIntro(step) || `<p>خطأ</p>`;
      const chiCol = DataManager.shuffle([...pool]);
      const arCol = DataManager.shuffle([...pool]);
      let html = `<div class="step-card fade-in"><h3 class="q-title">تمرين التوصيل</h3><p class="text-sm text-gray pt-2">اربط الكلمة بمعناها</p></div><div class="match-grid mt-4"><div class="match-col">`;
      chiCol.forEach(w => { if (w) html += `<button class="match-btn match-chi" data-match-id="${w.id}">${w.hz || ''}</button>`; });
      html += `</div><div class="match-col">`;
      arCol.forEach(w => { if (w) html += `<button class="match-btn match-ar" data-match-id="${w.id}">${w.ar || ''}</button>`; });
      return html + `</div></div>`;
    },
    renderComplete(step) {
      const reward = step.reward || 50;
      return `<div class="step-card fade-in success-card"><div style="font-size: 48px">🎉</div><h2 class="mt-4" style="color:var(--gold)">اكتملت العقدة!</h2><p class="mt-2 text-gray">+${reward} نقطة خبرة</p></div><button class="btn-primary full-width mt-4" data-finish="true">عودة للرئيسية</button>`;
    }
  };

  function capitalize(s) {
    if (!s) return '';
    const name = String(s).replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function bindDelegatedEvents(container, step) {
    container.querySelectorAll('[data-action="next"]').forEach(btn => {
      btn.addEventListener('click', () => { btn.disabled = true; handleAnswer(true); });
    });

    container.querySelectorAll('[data-answer]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        container.querySelectorAll('[data-answer]').forEach(b => b.disabled = true);
        const isCorrect = btn.getAttribute('data-answer') === 'true';
        if (isCorrect) {
           btn.style.background = '#2ECC71'; btn.style.borderColor = '#2ECC71'; btn.style.color = 'white';
           ProgressManager.addXP(2); setTimeout(() => handleAnswer(true), 300);
        } else {
           btn.style.background = '#E74C3C'; btn.style.borderColor = '#E74C3C'; btn.style.color = 'white';
           btn.classList.add('shake'); setTimeout(() => handleAnswer(false), 800);
        }
      });
    });

    const playBtn = container.querySelector('#btn-play-audio');
    if (playBtn && step.word) {
      playBtn.addEventListener('click', () => playAudio(step.word.py || step.word.hz));
    }

    let selectedChi = null, selectedAr = null, pairsLeft = (step.words && Array.isArray(step.words)) ? step.words.length : 0;
    container.querySelectorAll('.match-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('matched') || btn.classList.contains('selected')) return;
        container.querySelectorAll('.wrong-match').forEach(b => b.classList.remove('wrong-match'));
        
        if (btn.classList.contains('match-chi')) {
          if (selectedChi) selectedChi.classList.remove('selected');
          selectedChi = btn; selectedChi.classList.add('selected');
        } else {
          if (selectedAr) selectedAr.classList.remove('selected');
          selectedAr = btn; selectedAr.classList.add('selected');
        }

        if (selectedChi && selectedAr) {
          const idChi = selectedChi.getAttribute('data-match-id'), idAr = selectedAr.getAttribute('data-match-id');
          if (idChi && idChi === idAr) {
            selectedChi.classList.remove('selected'); selectedAr.classList.remove('selected');
            selectedChi.classList.add('matched'); selectedAr.classList.add('matched');
            ProgressManager.addXP(2); pairsLeft--; selectedChi = null; selectedAr = null;
            if (pairsLeft <= 0) setTimeout(() => handleAnswer(true), 500);
          } else {
            selectedChi.classList.remove('selected'); selectedAr.classList.remove('selected');
            selectedChi.classList.add('wrong-match'); selectedAr.classList.add('wrong-match');
            selectedChi = null; selectedAr = null;
          }
        }
      });
    });

    container.querySelectorAll('[data-finish]').forEach(btn => {
      btn.addEventListener('click', () => { btn.disabled = true; handleSequenceComplete(); });
    });
  }

  function renderCurrentStep() {
    if (!state.currentNode || !state.currentNode.sequence || !overlayBodyRef) return nextStep();
    const step = state.currentNode.sequence[state.currentStepIndex];
    if (!step) return nextStep();

    let html = '';
    try {
      const renderFn = QuizRenderer[`render${capitalize(step.type)}`];
      html = (typeof renderFn === 'function') ? renderFn(step) : QuizRenderer.renderIntro(step);
    } catch(e) {
      html = `<div class="step-card fade-in"><p>خطأ في تحميل السؤال.</p></div><button data-action="next" class="btn-primary full-width mt-4">متابعة</button>`;
    }

    const totalSteps = state.currentNode.sequence.length;
    const percent = totalSteps > 0 ? (state.currentStepIndex / totalSteps) * 100 : 0;
    
    overlayBodyRef.innerHTML = `<div class="quiz-header"><div class="quiz-progress-bar"><div class="fill" style="width:${percent}%"></div></div></div><div class="quiz-body">${html}</div>`;

    bindDelegatedEvents(overlayBodyRef, step);
    if (step.word && step.word.id) ProgressManager.markWordSeen(step.word.id);
    if ((step.type === 'listening' || step.type === 'intro') && step.word) playAudio(step.word.py || step.word.hz);
  }

  function startQuiz(nodePayload) {
    if (!nodePayload || !nodePayload.sequence || !Array.isArray(nodePayload.sequence) || nodePayload.sequence.length === 0) {
      alert('لا توجد بيانات متاحة لإنشاء الدرس.'); return;
    }
    state.currentNode = nodePayload;
    state.currentStepIndex = 0;
    overlayBodyRef = document.querySelector('#quiz-overlay .overlay-body');
    if (!overlayBodyRef) return;
    OverlayManager.open('quiz-overlay');
    renderCurrentStep();
  }

  function handleAnswer(isCorrect) { nextStep(); }
  
  function handleSequenceComplete() {
    if (!state.currentNode) return;
    const lastStep = state.currentNode.sequence[state.currentStepIndex];
    if (lastStep && lastStep.reward) ProgressManager.addXP(lastStep.reward);
    OverlayManager.close('quiz-overlay');
    state.currentNode = null;
    state.currentStepIndex = 0;
    overlayBodyRef = null;
  }

  function nextStep() {
    if (!state.currentNode || !state.currentNode.sequence) return;
    state.currentStepIndex++;
    if (state.currentStepIndex >= state.currentNode.sequence.length) return handleSequenceComplete();
    renderCurrentStep();
  }

  return { startQuiz };
})();
