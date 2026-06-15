/**
 * Home screen with main menu
 */

export function createHomeScreen(callbacks) {
  const screen = document.createElement('div');
  screen.className = 'screen home-screen';
  screen.innerHTML = `
    <style>
      .home-screen {
        background: radial-gradient(circle at top right, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        flex-direction: column;
        overflow: hidden; /* Hide floating arrows */
        justify-content: center;
        align-items: center;
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

      .home-content {
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 400px;
        padding: 20px;
      }

      .home-screen .logo {
        font-size: 52px;
        font-weight: 900;
        color: #FFFFFF;
        margin-bottom: 60px;
        letter-spacing: 4px;
        text-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .home-screen .logo span {
        color: #E94560;
        animation: pulse 2s infinite ease-in-out;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .home-screen .menu-button {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #FFFFFF;
        padding: 18px 40px;
        font-size: 18px;
        font-weight: 700;
        border-radius: 16px;
        margin: 10px 0;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 2px;
        width: 100%;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
      }

      .home-screen .menu-button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
      }

      .home-screen .menu-button:active {
        transform: translateY(1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .home-screen #btn-play {
        background: linear-gradient(135deg, #E94560 0%, #C92A42 100%);
        border: none;
        box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
        font-size: 20px;
        padding: 20px 40px;
        margin-bottom: 24px;
      }

      .home-screen #btn-play:hover {
        box-shadow: 0 8px 25px rgba(233, 69, 96, 0.6);
        transform: translateY(-3px);
      }
    </style>

    <div class="bg-shapes">
      <div class="bg-shape"></div>
      <div class="bg-shape"></div>
      <div class="bg-shape"></div>
    </div>

    <div class="home-content">
      <div class="logo"><span>&#8594;</span> ARROWS</div>
      <button class="menu-button" id="btn-play">Play</button>
      <button class="menu-button" id="btn-levels">Levels</button>
      <button class="menu-button" id="btn-casual">Casual Mode</button>
      <button class="menu-button" id="btn-settings">Settings</button>
    </div>
  `;

  screen.querySelector('#btn-play').addEventListener('click', () => {
    if (callbacks.onPlay) callbacks.onPlay();
  });

  screen.querySelector('#btn-levels').addEventListener('click', () => {
    if (callbacks.onLevels) callbacks.onLevels();
  });

  screen.querySelector('#btn-casual').addEventListener('click', () => {
    if (callbacks.onCasual) callbacks.onCasual();
  });

  screen.querySelector('#btn-settings').addEventListener('click', () => {
    if (callbacks.onSettings) callbacks.onSettings();
  });

  return screen;
}
