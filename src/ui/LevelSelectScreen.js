/**
 * Level selection grid
 */

export function createLevelSelectScreen(levelManager, onLevelSelect, onBack) {
  const screen = document.createElement('div');
  screen.className = 'screen level-select-screen';

  let html = `
    <style>
      .level-select-screen {
        background: radial-gradient(circle at top right, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        overflow-y: auto;
        padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
        flex-direction: column;
        justify-content: flex-start;
        position: relative;
      }

      /* Animated background floating elements */
      .bg-shapes {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        overflow: hidden;
        z-index: 0;
        pointer-events: none;
      }
      .bg-shape {
        position: absolute;
        background: rgba(233, 69, 96, 0.1);
        border-radius: 20px;
        transform: rotate(45deg);
      }
      .bg-shape:nth-child(1) { width: 100px; height: 100px; top: 10%; left: 10%; }
      .bg-shape:nth-child(2) { width: 150px; height: 150px; top: 60%; left: 80%; }
      .bg-shape:nth-child(3) { width: 80px; height: 80px; top: 70%; left: 20%; }

      .level-select-content {
        z-index: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
      }

      .level-select-screen .header {
        display: flex;
        align-items: center;
        margin-bottom: 30px;
        flex-shrink: 0;
        width: 100%;
        max-width: 500px;
      }

      .level-select-screen .back-button {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 44px;
        height: 44px;
        font-size: 20px;
        cursor: pointer;
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;
        -webkit-tap-highlight-color: transparent;
      }

      .level-select-screen .back-button:active {
        background: rgba(255, 255, 255, 0.2);
      }

      .level-select-screen .title {
        font-size: 24px;
        font-weight: 700;
        margin-left: 20px;
        color: #FFFFFF;
        letter-spacing: 1px;
      }

      .level-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: 15px;
        max-width: 500px;
        width: 100%;
      }

      .level-button {
        aspect-ratio: 1;
        background: rgba(255, 255, 255, 0.12); /* Increased opacity to compensate for removed blur */
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #FFFFFF;
        border-radius: 16px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.3s;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .level-button:hover:not(.locked) {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }

      .level-button:active:not(.locked) {
        transform: scale(0.95);
      }

      .level-button.locked {
        background: rgba(0, 0, 0, 0.2);
        color: rgba(255, 255, 255, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.05);
        cursor: not-allowed;
      }

      .level-button.completed {
        background: linear-gradient(135deg, rgba(39, 174, 96, 0.6) 0%, rgba(39, 174, 96, 0.2) 100%);
        border: 1px solid rgba(39, 174, 96, 0.5);
      }

      .level-button .stars {
        position: absolute;
        bottom: 5px;
        left: 0;
        right: 0;
        font-size: 10px;
        text-align: center;
        line-height: 1;
        color: #FFD700;
        text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
      }
    </style>

    <div class="bg-shapes">
      <div class="bg-shape"></div>
      <div class="bg-shape"></div>
      <div class="bg-shape"></div>
    </div>

    <div class="level-select-content">
      <div class="header">
        <button class="back-button" id="btn-back">&#8592;</button>
        <div class="title">Select Level</div>
      </div>

      <div class="level-grid">
  `;

  for (let i = 1; i <= levelManager.totalLevels; i++) {
    const levelData = levelManager.getLevelData(i);
    const unlocked = levelManager.isLevelUnlocked(i);
    const completed = levelData.completed;
    const stars = levelData.stars || 0;

    let className = 'level-button';
    if (!unlocked) className += ' locked';
    if (completed) className += ' completed';

    const starsHTML = completed ? `<div class="stars">${'&#9733;'.repeat(stars)}</div>` : '';

    html += `
      <button class="${className}" data-level="${i}" ${!unlocked ? 'disabled' : ''}>
        ${unlocked ? i : '&#128274;'}
        ${starsHTML}
      </button>
    `;
  }

  html += `</div></div>`;
  screen.innerHTML = html;

  screen.querySelector('#btn-back').addEventListener('click', () => {
    if (onBack) onBack();
  });

  screen.querySelectorAll('.level-button:not(.locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.dataset.level, 10);
      if (onLevelSelect) onLevelSelect(level);
    });
  });

  return screen;
}
