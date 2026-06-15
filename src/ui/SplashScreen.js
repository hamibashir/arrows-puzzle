/**
 * Splash screen with animated logo
 * Registers a cleanup timer on the DOM element so SceneManager
 * can cancel it during rapid scene transitions (prevents ghost navigation).
 */

export function createSplashScreen(onComplete) {
  const screen = document.createElement('div');
  screen.className = 'screen splash-screen';
  screen.innerHTML = `
    <style>
      .splash-screen .logo {
        font-size: 48px;
        font-weight: bold;
        color: #1A1A1A;
        animation: fadeIn 1s ease;
        letter-spacing: 4px;
      }

      .splash-screen .arrow-icon {
        font-size: 64px;
        margin-bottom: 20px;
        animation: slideIn 0.8s ease;
        color: #E74C3C;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes slideIn {
        from { transform: translateX(-100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>

    <div class="arrow-icon">&#8594;</div>
    <div class="logo">ARROWS</div>
  `;

  // Auto-transition after 2 seconds
  const timer = setTimeout(() => {
    if (onComplete) onComplete();
  }, 2000);

  // Expose cleanup for SceneManager to prevent ghost callbacks
  screen._cleanup = () => clearTimeout(timer);

  return screen;
}
