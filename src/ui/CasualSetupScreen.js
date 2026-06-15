/**
 * Casual Setup Screen for selecting custom grid sizes
 */

export function createCasualSetupScreen(onPlay, onBack) {
  const screen = document.createElement('div');
  screen.className = 'screen casual-setup-screen';
  screen.innerHTML = `
    <style>
      .casual-setup-screen {
        background: radial-gradient(circle at top right, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        flex-direction: column;
        padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
        justify-content: flex-start;
        position: relative;
        overflow: hidden;
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

      .setup-content {
        z-index: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        align-items: center;
      }

      .casual-setup-screen .header {
        display: flex;
        align-items: center;
        width: 100%;
        max-width: 400px;
        margin-bottom: 40px;
        position: relative;
      }

      .casual-setup-screen .btn-back {
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

      .casual-setup-screen .btn-back:active {
        background: rgba(255, 255, 255, 0.2);
      }

      .casual-setup-screen .title {
        font-size: 24px;
        font-weight: 700;
        color: #FFFFFF;
        flex-grow: 1;
        text-align: center;
        margin-right: 44px; /* Balance back button */
      }

      .setup-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 400px;
        margin: 0 auto;
        flex-grow: 1;
        justify-content: center;
      }

      .size-display {
        font-size: 56px;
        font-weight: 900;
        color: #FFFFFF;
        margin-bottom: 10px;
        text-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
      }

      .size-label {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 40px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .slider-container {
        width: 100%;
        padding: 0 20px;
        margin-bottom: 60px;
      }

      input[type=range] {
        -webkit-appearance: none;
        width: 100%;
        background: transparent;
      }

      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 32px;
        width: 32px;
        border-radius: 50%;
        background: #E94560;
        cursor: pointer;
        margin-top: -14px;
        box-shadow: 0 4px 10px rgba(233, 69, 96, 0.5);
        border: 2px solid #FFF;
      }

      input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .btn-start {
        background: linear-gradient(135deg, #E94560 0%, #C92A42 100%);
        color: #FFFFFF;
        border: none;
        padding: 20px 60px;
        font-size: 20px;
        font-weight: 800;
        border-radius: 16px;
        cursor: pointer;
        text-transform: uppercase;
        width: 100%;
        max-width: 300px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
      }

      .btn-start:active {
        transform: scale(0.95);
      }

      .btn-start:hover {
        box-shadow: 0 8px 25px rgba(233, 69, 96, 0.6);
        transform: translateY(-3px);
      }
    </style>

    <div class="bg-shapes">
      <div class="bg-shape"></div>
      <div class="bg-shape"></div>
      <div class="bg-shape"></div>
    </div>

    <div class="setup-content">
      <div class="header">
        <button class="btn-back" id="btn-back-casual">&#8592;</button>
        <div class="title">Casual Mode</div>
      </div>

      <div class="setup-container">
        <div class="size-display" id="size-display">8 x 8</div>
        <div class="size-label">Grid Size</div>

        <div class="slider-container">
          <input type="range" id="size-slider" min="6" max="16" value="8" step="1">
        </div>

        <button class="btn-start" id="btn-start-casual">Play Random</button>
      </div>
    </div>
  `;

  const slider = screen.querySelector('#size-slider');
  const display = screen.querySelector('#size-display');

  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    display.textContent = `${val} x ${val}`;
  });

  screen.querySelector('#btn-back-casual').addEventListener('click', () => {
    if (onBack) onBack();
  });

  screen.querySelector('#btn-start-casual').addEventListener('click', () => {
    const size = parseInt(slider.value, 10);
    if (onPlay) onPlay(size);
  });

  return screen;
}
