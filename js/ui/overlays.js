const OverlayManager = (() => {
  let activeOverlay = null;

  function init() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('overlay') && e.target.classList.contains('active')) {
        close(e.target.id);
      }
      const closeBtn = e.target.closest('.overlay-close-btn');
      if (closeBtn) {
        const overlay = closeBtn.closest('.overlay');
        if (overlay) close(overlay.id);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeOverlay) close(activeOverlay);
    });
  }

  function open(id) {
    if (activeOverlay) close(activeOverlay);
    const el = document.getElementById(id);
    if (!el) return;
    
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
    activeOverlay = id;
    window.isOverlayOpen = true; 
  }

  function close(id) {
    const el = document.getElementById(id);
    if (!el) return;
    
    el.classList.remove('active');
    document.body.style.overflow = '';
    activeOverlay = null;
    window.isOverlayOpen = false;
  }

  return { init, open, close, getActive: () => activeOverlay };
})();
