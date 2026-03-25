document.addEventListener('DOMContentLoaded', async () => {
  NavManager.init();
  OverlayManager.init();
  ProgressManager.init();

  await DataManager.init();

  const startBtn = document.getElementById('btn-start-learning');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const nodePayload = LearningEngine.generateNode();
      if (nodePayload) QuizEngine.startQuiz(nodePayload);
      else alert("عذراً، لا توجد بيانات متاحة أو لقد أكملت كافة المستويات.");
    });
  }
});
