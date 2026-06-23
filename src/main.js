import { App as CapacitorApp } from '@capacitor/app';
import { CONSTANTS } from './core/Constants.js';
import { Grid } from './entities/Grid.js';
import { Arrow } from './entities/Arrow.js';
import { Renderer } from './managers/Renderer.js';
import { GridCalculator } from './utils/GridCalculator.js';
import { InputHandler } from './managers/InputHandler.js';
import { GameState } from './core/GameState.js';
import { Animator } from './managers/Animator.js';
import { LevelManager } from './managers/LevelManager.js';
import { AudioManager } from './managers/AudioManager.js';
import { SceneManager } from './managers/SceneManager.js';
import { createSplashScreen } from './ui/SplashScreen.js';
import { createHomeScreen } from './ui/HomeScreen.js';
import { createLevelSelectScreen } from './ui/LevelSelectScreen.js';
import { createSettingsScreen } from './ui/SettingsScreen.js';
import { createCasualSetupScreen } from './ui/CasualSetupScreen.js';
import { createGameHUD, updateHUD, showWinModal, showFailModal, hideModals } from './ui/GameHUD.js';

class App {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    // Alpha:true is needed for slide-out fade animations; desynchronized reduces latency
    this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
    this.uiOverlay = document.getElementById('ui-overlay');

    this._rafId = null;
    this._resizePending = false;
    this._gameLoopRunning = false;
    this._audioResumed = false;

    this.setupCanvas();
    this.init();

    // Pause loop when tab hidden to save battery / GPU
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.displayWidth = width;
    this.displayHeight = height;

    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Debounced resize: coalesces multiple resize events into a single rAF frame.
   */
  handleResize() {
    if (this._resizePending) return;
    this._resizePending = true;
    requestAnimationFrame(() => {
      this._resizePending = false;
      this.setupCanvas();
      if (this.renderer) {
        this.renderer.resize(this.displayWidth, this.displayHeight);
      }
      if (this.grid) {
        this.gridDimensions = GridCalculator.calculate(
          this.grid.rows, this.grid.cols,
          this.displayWidth, this.displayHeight
        );
      }
      this._needsRedraw = true;
    });
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.stopGameLoop();
    } else if (this.currentScreen === CONSTANTS.SCREENS.GAME) {
      this.startGameLoop();
      this._needsRedraw = true;
    }
  }

  handleHardwareBackButton() {
    // If a confirmation modal is already open, pressing back should dismiss it
    const existingModal = document.querySelector('.modal-overlay.confirm-modal');
    if (existingModal) {
      if (this.audioManager) this.audioManager.playButtonTap();
      existingModal.classList.remove('visible');
      setTimeout(() => existingModal.remove(), 300);
      return;
    }

    if (this.currentScreen === CONSTANTS.SCREENS.GAME) {
      this.showConfirmationModal('Exit Game?', 'Are you sure you want to leave this level?', 'Stay', 'Exit', () => {
        this.sceneManager.switchTo(CONSTANTS.SCREENS.HOME);
      });
    } else if (this.currentScreen === CONSTANTS.SCREENS.HOME) {
      this.showConfirmationModal('Exit App?', 'Are you sure you want to exit?', 'Cancel', 'Exit', () => {
        CapacitorApp.exitApp();
      });
    } else {
      // For other screens (Settings, Level Select, etc.) just go back to Home
      this.sceneManager.switchTo(CONSTANTS.SCREENS.HOME);
    }
  }

  showConfirmationModal(title, message, cancelText, confirmText, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay confirm-modal';
    overlay.style.zIndex = '2000';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const h2 = document.createElement('h2');
    h2.textContent = title;
    h2.style.marginBottom = '10px';
    
    const p = document.createElement('p');
    p.textContent = message;
    p.style.marginBottom = '20px';
    
    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = confirmText;
    btnConfirm.style.marginBottom = '10px';
    btnConfirm.addEventListener('click', () => {
      if (this.audioManager) this.audioManager.playButtonTap();
      overlay.classList.remove('visible');
      setTimeout(() => {
        overlay.remove();
        onConfirm();
      }, 300);
    });
    
    const btnCancel = document.createElement('button');
    btnCancel.className = 'secondary';
    btnCancel.textContent = cancelText;
    btnCancel.addEventListener('click', () => {
      if (this.audioManager) this.audioManager.playButtonTap();
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    });
    
    modal.appendChild(h2);
    modal.appendChild(p);
    modal.appendChild(btnConfirm);
    modal.appendChild(btnCancel);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Force reflow and add visible class for transition
    overlay.offsetHeight;
    overlay.classList.add('visible');
  }

  async init() {
    this.levelManager = new LevelManager();
    await this.levelManager.init();

    this.audioManager = new AudioManager();
    this.animator = new Animator();
    this.renderer = new Renderer(this.ctx, this.displayWidth, this.displayHeight);

    this._needsRedraw = true;
    this._wasAnimating = false;

    this.setupScenes();
    
    CapacitorApp.addListener('backButton', () => {
      this.handleHardwareBackButton();
    });

    this.sceneManager.switchTo(CONSTANTS.SCREENS.SPLASH);
  }

  setupScenes() {
    this.sceneManager = new SceneManager(this.uiOverlay, (sceneId) => {
      this.currentScreen = sceneId;
      const isGame = sceneId === CONSTANTS.SCREENS.GAME;
      this.canvas.style.display = isGame ? 'block' : 'none';
      if (isGame) {
        this._needsRedraw = true;
        this.startGameLoop();
      } else {
        this.stopGameLoop();
      }
    });

    this.sceneManager.registerScene(CONSTANTS.SCREENS.SPLASH, () => {
      return createSplashScreen(() => {
        this.sceneManager.switchTo(CONSTANTS.SCREENS.HOME);
      });
    });

    this.sceneManager.registerScene(CONSTANTS.SCREENS.HOME, () => {
      return createHomeScreen({
        onPlay: () => {
          this.audioManager.playButtonTap();
          const nextLevel = this.findNextUncompletedLevel();
          this.startGame(nextLevel);
        },
        onLevels: () => {
          this.audioManager.playButtonTap();
          this.sceneManager.switchTo(CONSTANTS.SCREENS.LEVEL_SELECT);
        },
        onCasual: () => {
          this.audioManager.playButtonTap();
          this.sceneManager.switchTo(CONSTANTS.SCREENS.CASUAL_SETUP);
        },
        onSettings: () => {
          this.audioManager.playButtonTap();
          this.sceneManager.switchTo(CONSTANTS.SCREENS.SETTINGS);
        }
      });
    });

    this.sceneManager.registerScene(CONSTANTS.SCREENS.CASUAL_SETUP, () => {
      return createCasualSetupScreen(
        (size) => {
          this.audioManager.playButtonTap();
          this.startGame({ mode: 'casual', size });
        },
        () => {
          this.audioManager.playButtonTap();
          this.sceneManager.switchTo(CONSTANTS.SCREENS.HOME);
        }
      );
    });

    this.sceneManager.registerScene(CONSTANTS.SCREENS.LEVEL_SELECT, () => {
      return createLevelSelectScreen(
        this.levelManager,
        (level) => {
          this.audioManager.playButtonTap();
          this.startGame(level);
        },
        () => {
          this.audioManager.playButtonTap();
          this.sceneManager.switchTo(CONSTANTS.SCREENS.HOME);
        }
      );
    });

    this.sceneManager.registerScene(CONSTANTS.SCREENS.SETTINGS, () => {
      return createSettingsScreen(
        this.audioManager,
        this.levelManager,
        () => {
          this.audioManager.playButtonTap();
          this.sceneManager.switchTo(CONSTANTS.SCREENS.HOME);
        }
      );
    });
  }

  findNextUncompletedLevel() {
    for (let i = 1; i <= this.levelManager.totalLevels; i++) {
      if (!this.levelManager.getLevelData(i).completed) {
        return i;
      }
    }
    return 1;
  }

  async startGame(options) {
    // Show loading indicator on top of current screen
    const loading = document.createElement('div');
    loading.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:999;background:rgba(255,255,255,0.9);';
    loading.innerHTML = '<div style="font-size:18px;font-weight:bold;color:#1A1A1A;">Loading...</div>';
    document.body.appendChild(loading);

    let loaded = false;
    let levelTitle = '';
    
    if (typeof options === 'object' && options.mode === 'casual') {
      loaded = await this.loadCasualLevel(options.size);
      levelTitle = `Casual ${options.size}x${options.size}`;
      this.currentCasualSize = options.size;
    } else {
      loaded = await this.loadLevel(options);
      levelTitle = `Level ${options}`;
    }
    loading.remove();

    if (!loaded) {
      // Level failed to load — stay on current screen and show toast
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:#E74C3C;color:#fff;padding:12px 24px;border-radius:8px;font-weight:bold;z-index:1000;transition:opacity 0.5s;';
      toast.textContent = 'Failed to load level. Try again.';
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 2000);
      return;
    }

    this.sceneManager.switchTo(CONSTANTS.SCREENS.GAME);

    // Build HUD with cached DOM references
    this.gameHUD = createGameHUD({
      onBack: () => {
        this.audioManager.playButtonTap();
        this.handleHardwareBackButton();
      },
      onHint: () => this.showHint(),
      onUndo: () => this.undoMove(),
      onRestart: () => this.restartLevel(),
      onNext: () => this.nextLevel(),
      onHome: () => {
        this.audioManager.playButtonTap();
        this.sceneManager.switchTo(CONSTANTS.SCREENS.HOME);
      }
    }, levelTitle, this.gameState.hintsRemaining, this.gameState.score);

    this.uiOverlay.replaceChildren(this.gameHUD);

    if (this.inputHandler) {
      this.inputHandler.destroy();
    }
    this.inputHandler = new InputHandler(this.canvas, (x, y) => this.handleCellTap(x, y));
  }

  async loadLevel(levelNumber) {
    const levelData = await this.levelManager.loadLevel(levelNumber);
    if (!levelData) return false;

    this.currentLevelNumber = levelNumber;
    return this._initLoadedLevel(levelData);
  }

  async loadCasualLevel(size) {
    const levelData = this.levelManager.generateCasualLevel(size);
    if (!levelData) return false;
    
    this.currentLevelNumber = 'casual';
    return this._initLoadedLevel(levelData);
  }

  _initLoadedLevel(levelData) {
    this.grid = new Grid(levelData.rows, levelData.cols);
    this.grid.loadFromLevelData(levelData);
    this.originalGrid = this.grid.clone();

    this.gameState = new GameState(this.grid);

    this.gridDimensions = GridCalculator.calculate(
      this.grid.rows, this.grid.cols,
      this.displayWidth, this.displayHeight
    );

    this.renderer.invalidateGridCache();
    this.animator.clear();
    this._needsRedraw = true;
    return true;
  }

  handleCellTap(x, y) {
    if (this.animator.isAnimating()) return;
    if (this.currentScreen !== CONSTANTS.SCREENS.GAME) return;

    // Resume AudioContext on first user gesture (required by mobile Safari)
    if (!this._audioResumed) {
      this.audioManager.resume();
      this._audioResumed = true;
    }

    const { row, col } = GridCalculator.screenToGrid(
      x, y,
      this.gridDimensions.offsetX,
      this.gridDimensions.offsetY,
      this.gridDimensions.cellSize
    );

    const result = this.gameState.tryRemoveArrow(row, col);

    if (result.success) {
      this.audioManager.playArrowRemoved();
      result.arrow.isRemoving = true;
      this.animator.slideArrowOut(result.arrow, () => {
        result.arrow.isRemoving = false;
        this._needsRedraw = true;
      });
    } else if (result.reason === 'blocked') {
      this.audioManager.playArrowBlocked();
      this.animator.shakeArrow(result.arrow, this.gridDimensions);
    }

    const levelTitle = this.currentLevelNumber === 'casual' ? `Casual ${this.currentCasualSize}x${this.currentCasualSize}` : this.currentLevelNumber;
    updateHUD(this.gameHUD, levelTitle, this.gameState.hintsRemaining, this.gameState.score);

    if (this.gameState.isWon) {
      // Schedule win using rAF so it doesn't block the current tap handler
      requestAnimationFrame(() => {
        this.audioManager.playLevelComplete();
        const stars = this.gameState.getStarRating();
        if (this.currentLevelNumber !== 'casual') {
          this.levelManager.completeLevel(this.currentLevelNumber, stars);
        }
        showWinModal(this.gameHUD, stars);
      });
    } else if (this.gameState.hintsRemaining <= 0) {
      requestAnimationFrame(() => {
        showFailModal(this.gameHUD);
      });
    }
  }

  showHint() {
    const hint = this.gameState.getHint();
    if (hint) {
      this.audioManager.playButtonTap();
      this.animator.pulseArrow(hint, () => {
        this._needsRedraw = true;
      });
    }
  }

  undoMove() {
    if (this.gameState.undo()) {
      this.audioManager.playButtonTap();
      const levelTitle = this.currentLevelNumber === 'casual' ? `Casual ${this.currentCasualSize}x${this.currentCasualSize}` : this.currentLevelNumber;
      updateHUD(this.gameHUD, levelTitle, this.gameState.hintsRemaining, this.gameState.score);
      this._needsRedraw = true;
    }
  }

  restartLevel() {
    this.audioManager.playButtonTap();
    this.gameState.restart(this.originalGrid);
    this.grid = this.gameState.grid; // FIX: Sync main.js grid reference with the new restarted grid
    hideModals(this.gameHUD);
    const levelTitle = this.currentLevelNumber === 'casual' ? `Casual ${this.currentCasualSize}x${this.currentCasualSize}` : this.currentLevelNumber;
    updateHUD(this.gameHUD, levelTitle, this.gameState.hintsRemaining, this.gameState.score);
    this.animator.clear();
    this._needsRedraw = true;
  }

  nextLevel() {
    if (this.currentLevelNumber === 'casual') {
      // For casual mode, "Next" just generates a new random puzzle of the same size
      this.startGame({ mode: 'casual', size: this.currentCasualSize });
    } else if (this.currentLevelNumber < this.levelManager.totalLevels) {
      this.startGame(this.currentLevelNumber + 1);
    } else {
      this.audioManager.playButtonTap();
      this.sceneManager.switchTo(CONSTANTS.SCREENS.HOME);
    }
  }

  startGameLoop() {
    if (this._gameLoopRunning) return;
    this._gameLoopRunning = true;
    this._tick();
  }

  stopGameLoop() {
    this._gameLoopRunning = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tick() {
    if (!this._gameLoopRunning) return;

    if (this.currentScreen === CONSTANTS.SCREENS.GAME && this.grid) {
      this.animator.update();
      const anims = this.animator.getActiveAnimations();
      const hasAnims = anims.length > 0;

      if (this._needsRedraw || hasAnims || this._wasAnimating) {
        this.renderer.render(this.grid, this.gridDimensions, anims);
        this._needsRedraw = false;
      }
      this._wasAnimating = hasAnims;
    }

    this._rafId = requestAnimationFrame(() => this._tick());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
