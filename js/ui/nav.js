const NavManager = (() => {
  let currentView = 'home';

  function init() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.isOverlayOpen) return;

        const viewId = item.getAttribute('data-view');
        if (viewId && viewId !== currentView) setActiveView(viewId);
      });
    });
  }

  function setActiveView(viewId) {
    currentView = viewId;
    
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewId) item.classList.add('active');
      else item.classList.remove('active');
    });

    document.querySelectorAll('.view-section').forEach(section => {
      if (section.id === `view-${viewId}`) section.classList.add('active');
      else section.classList.remove('active');
    });

    document.dispatchEvent(new CustomEvent('view:change', { detail: { view: viewId } }));
  }

  return { init, getCurrentView: () => currentView, setActiveView };
})();
