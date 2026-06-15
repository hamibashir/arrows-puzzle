/**
 * Settings screen
 */

export function createSettingsScreen(audioManager, levelManager, onBack) {
  const screen = document.createElement('div');
  screen.className = 'screen settings-screen';
  screen.innerHTML = `
    <style>
      .settings-screen {
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

      .settings-content {
        z-index: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
      }

      .settings-screen .header {
        display: flex;
        align-items: center;
        margin-bottom: 40px;
        flex-shrink: 0;
        width: 100%;
        max-width: 400px;
      }

      .settings-screen .back-button {
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

      .settings-screen .back-button:active {
        background: rgba(255, 255, 255, 0.2);
      }

      .settings-screen .title {
        font-size: 24px;
        font-weight: 700;
        margin-left: 20px;
        color: #FFFFFF;
      }

      .settings-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        max-width: 400px;
        margin-bottom: 16px;
        width: 100%;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .settings-item label {
        font-size: 18px;
        font-weight: 600;
        color: #FFFFFF;
      }

      .toggle-switch {
        width: 50px;
        height: 28px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 14px;
        position: relative;
        cursor: pointer;
        transition: background 0.3s;
        flex-shrink: 0;
      }

      .toggle-switch.active {
        background: #27AE60;
      }

      .toggle-switch::after {
        content: '';
        position: absolute;
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 12px;
        top: 2px;
        left: 2px;
        transition: transform 0.3s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }

      .toggle-switch.active::after {
        transform: translateX(22px);
      }

      .reset-button {
        background: rgba(231, 76, 60, 0.2);
        color: #E74C3C;
        border: 1px solid rgba(231, 76, 60, 0.5);
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        transition: all 0.3s;
      }
      
      .reset-button:active {
        transform: scale(0.95);
      }
    </style>

    <div class="bg-shapes">
      <div class="bg-shape"></div>
      <div class="bg-shape"></div>
      <div class="bg-shape"></div>
    </div>

    <div class="settings-content">
      <div class="header">
        <button class="back-button" id="btn-back">&#8592;</button>
        <div class="title">Settings</div>
      </div>

      <div class="settings-item">
        <label>Sound</label>
        <div class="toggle-switch ${!audioManager.isMuted ? 'active' : ''}" id="toggle-sound"></div>
      </div>

      <div class="settings-item">
        <label>Reset Progress</label>
        <button class="reset-button" id="btn-reset">Reset</button>
      </div>
    </div>
  `;

  screen.querySelector('#btn-back').addEventListener('click', () => {
    if (onBack) onBack();
  });

  screen.querySelector('#toggle-sound').addEventListener('click', (e) => {
    audioManager.toggleMute();
    e.target.classList.toggle('active');
  });

  screen.querySelector('#btn-reset').addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      levelManager.resetProgress();
      alert('Progress reset!');
    }
  });

  return screen;
}
