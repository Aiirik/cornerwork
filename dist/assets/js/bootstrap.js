(() => {
  const blockGesture = (e) => {
    e.preventDefault();
  };
  const blockMultiTouch = (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  };
  document.addEventListener('gesturestart', blockGesture, { passive: false });
  document.addEventListener('gesturechange', blockGesture, { passive: false });
  document.addEventListener('gestureend', blockGesture, { passive: false });
  document.addEventListener('touchmove', blockMultiTouch, { passive: false });

  // Keep help bubbles above nested workout groups and allow them to escape
  // the Advanced options container instead of being clipped by it.
  const tooltipStyle = document.createElement('style');
  tooltipStyle.textContent =
    '.advanced-fold[open],.advanced-fold[open]>.advanced-fold-body{overflow:visible!important}.advanced-fold-body>section{position:relative}.advanced-fold-body>section:has(.help.open){z-index:100}.advanced-fold-body .help.open:after{z-index:1000}';
  document.head.appendChild(tooltipStyle);

  const core = document.createElement('script');
  core.src = 'assets/js/enhancements.js?v=265';
  core.defer = true;
  core.addEventListener('load', () => {
    const endless = document.createElement('script');
    endless.src = 'assets/js/endless.js?v=10';
    endless.defer = true;
    document.head.appendChild(endless);
  });
  document.head.appendChild(core);
})();
