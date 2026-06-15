/**
 * In-game HUD overlay with hearts, modals, and action buttons.
 * Optimizations:
 *   - Heart nodes cached once; updates toggle className (no DOM rebuild)
 *   - All interactive nodes cached on creation for O(1) updates
 *   - Modal visibility driven by classList (GPU-composited layer)
 */

export function createGameHUD(callbacks, levelNumber, hintsRemaining, moves = 0) {
  const hud = document.createElement('div');
  hud.className = 'game-hud';

  hud.innerHTML = `
    <style>
      .game-hud {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none !important;
        z-index: 100;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .game-hud > * { pointer-events: auto; }

      .hud-top {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: max(16px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) 16px max(20px, env(safe-area-inset-left));
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        position: relative;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      }
      .hud-button.back-button {
        position: absolute;
        left: 20px;
        background: rgba(93, 113, 246, 0.1); 
        border: none; 
        font-size: 20px; 
        cursor: pointer;
        padding: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        color: #5D71F6; 
        font-family: inherit;
        -webkit-tap-highlight-color: transparent; 
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, background 0.2s;
      }
      .hud-button.back-button:active { transform: scale(0.9); background: rgba(93, 113, 246, 0.2); }
      .level-info { text-align: center; }
      .level-label { font-size: 18px; font-weight: 700; color: #5D71F6; letter-spacing: 0.5px; }
      .hearts { display: flex; gap: 4px; margin-top: 6px; justify-content: center; }
      .heart { font-size: 18px; color: #FB4E61; transition: opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease; filter: grayscale(0); }
      .heart.lost { opacity: 0.25; filter: grayscale(1); transform: scale(0.8); }

      .hud-bottom {
        display: flex; justify-content: center; gap: 12px;
        padding: 16px max(20px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
        background: linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0));
      }
      .action-button {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: #1A1A1A; 
        border: 1px solid rgba(0,0,0,0.05);
        padding: 12px 20px;
        border-radius: 14px; 
        font-weight: 700; 
        cursor: pointer; 
        font-size: 14px;
        font-family: inherit; 
        -webkit-tap-highlight-color: transparent;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        display: flex; align-items: center; gap: 6px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.04);
      }
      .action-button:hover {
        transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.08); background: rgba(255,255,255,1);
      }
      .action-button:active { transform: scale(0.95); }
      .action-button.primary { background: #5D71F6; color: white; border: none; box-shadow: 0 4px 12px rgba(93, 113, 246, 0.3); }
      .action-button.primary:hover { background: #4b5be0; box-shadow: 0 6px 15px rgba(93, 113, 246, 0.4); }

      .modal-overlay {
        position: fixed; inset: 0; background: rgba(255,255,255,0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: none; align-items: center; justify-content: center;
        z-index: 1000; opacity: 0; transition: opacity 0.3s ease; pointer-events: auto;
      }
      .modal-overlay.visible { display: flex; opacity: 1; }
      .modal {
        background: white; padding: 40px 32px; border-radius: 24px; text-align: center;
        max-width: 320px; width: 85%; box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .modal-overlay.visible .modal { transform: scale(1); }
      .modal h2 { margin: 0 0 12px 0; font-size: 28px; color: #1A1A1A; font-weight: 800; }
      .modal p { margin: 0 0 24px 0; color: #666; font-size: 16px; }
      .modal .stars { font-size: 40px; margin: 16px 0 24px; letter-spacing: 4px; color: #FFD700; text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3); }
      .modal button {
        background: #5D71F6; color: white; border: none; padding: 14px 32px;
        border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 16px;
        font-family: inherit; -webkit-tap-highlight-color: transparent;
        margin: 6px; min-width: 120px; transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 4px 10px rgba(93, 113, 246, 0.2);
      }
      .modal button:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(93, 113, 246, 0.3); }
      .modal button:active { transform: scale(0.95); }
      .modal button.secondary { background: transparent; color: #5D71F6; border: 2px solid #5D71F6; box-shadow: none; }
      .modal button.secondary:hover { background: rgba(93, 113, 246, 0.05); }
    </style>

    <div class="hud-top">
      <button class="hud-button back-button" id="hud-back">&#9664;</button>
      <div class="level-info">
        <div class="level-label" id="hud-level">Level ${levelNumber}</div>
        <div class="hearts" id="hud-hearts"></div>
      </div>
    </div>

    <div class="hud-bottom">
      <button class="action-button" id="hud-undo">&#8630; Undo</button>
      <button class="action-button primary" id="hud-hint">&#128161; Hint</button>
      <button class="action-button" id="hud-restart">&#8635; Restart</button>
    </div>

    <div class="modal-overlay" id="win-modal">
      <div class="modal">
        <h2>Level Complete!</h2>
        <div class="stars" id="win-stars"></div>
        <button id="win-next">Next Level</button>
        <button class="secondary" id="win-home">Home</button>
      </div>
    </div>

    <div class="modal-overlay" id="fail-modal">
      <div class="modal">
        <h2>Out of Hints!</h2>
        <p>You ran out of lives. Try again?</p>
        <button id="fail-retry">Retry</button>
        <button class="secondary" id="fail-home">Home</button>
      </div>
    </div>
  `;

  // Cache interactive DOM references for O(1) updates
  hud._heartsContainer = hud.querySelector('#hud-hearts');
  hud._levelLabel = hud.querySelector('#hud-level');
  hud._movesLabel = hud.querySelector('#hud-moves');
  hud._winModal = hud.querySelector('#win-modal');
  hud._winStars = hud.querySelector('#win-stars');
  hud._failModal = hud.querySelector('#fail-modal');
  hud._hearts = [];

  // Create heart nodes once and cache them
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = '\u2764\uFE0F'; // red heart
    hud._heartsContainer.appendChild(heart);
    hud._hearts.push(heart);
  }

  updateHearts(hud, hintsRemaining);

  // Wire callbacks
  const btnBack = hud.querySelector('#hud-back');
  if (btnBack) btnBack.addEventListener('click', () => { if (callbacks.onBack) callbacks.onBack(); });

  const btnHint = hud.querySelector('#hud-hint');
  if (btnHint) btnHint.addEventListener('click', () => { if (callbacks.onHint) callbacks.onHint(); });

  const btnUndo = hud.querySelector('#hud-undo');
  if (btnUndo) btnUndo.addEventListener('click', () => { if (callbacks.onUndo) callbacks.onUndo(); });

  const btnRestart = hud.querySelector('#hud-restart');
  if (btnRestart) btnRestart.addEventListener('click', () => { if (callbacks.onRestart) callbacks.onRestart(); });

  const btnWinNext = hud.querySelector('#win-next');
  if (btnWinNext) btnWinNext.addEventListener('click', () => { if (callbacks.onNext) callbacks.onNext(); });

  const btnWinHome = hud.querySelector('#win-home');
  if (btnWinHome) btnWinHome.addEventListener('click', () => { if (callbacks.onHome) callbacks.onHome(); });

  const btnFailRetry = hud.querySelector('#fail-retry');
  if (btnFailRetry) btnFailRetry.addEventListener('click', () => { if (callbacks.onRestart) callbacks.onRestart(); });

  const btnFailHome = hud.querySelector('#fail-home');
  if (btnFailHome) btnFailHome.addEventListener('click', () => { if (callbacks.onHome) callbacks.onHome(); });

  return hud;
}

/**
 * Update hearts using class toggles (zero DOM node creation)
 */
export function updateHearts(hud, hintsRemaining) {
  const hearts = hud._hearts;
  if (!hearts) return;
  for (let i = 0; i < 5; i++) {
    hearts[i].classList.toggle('lost', i >= hintsRemaining);
  }
}

/**
 * Batch-update HUD text fields (zero DOM rebuild)
 */
export function updateHUD(hud, levelNumber, hintsRemaining, moves) {
  if (hud._levelLabel) hud._levelLabel.textContent = `Level ${levelNumber}`;
  if (hud._movesLabel) hud._movesLabel.textContent = `${moves} moves`;
  updateHearts(hud, hintsRemaining);
}

export function showWinModal(hud, stars) {
  hud._winStars.textContent = '\u2605'.repeat(stars);
  hud._winModal.classList.add('visible');
}

export function showFailModal(hud) {
  hud._failModal.classList.add('visible');
}

export function hideModals(hud) {
  hud._winModal.classList.remove('visible');
  hud._failModal.classList.remove('visible');
}
