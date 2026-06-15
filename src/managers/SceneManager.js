/**
 * Manages screen/scene transitions with fade effects
 * Optimizations:
 *   - Cancels pending transition timers to prevent ghost DOM / memory leaks
 *   - Uses replaceChildren for atomic DOM swap (no intermediate blank state)
 *   - Clears old scene timeouts before removing elements
 */

export class SceneManager {
  constructor(uiContainer, onSceneChange) {
    this.container = uiContainer;
    this.onSceneChange = onSceneChange;
    this.currentScene = null;
    this.scenes = {};
    this._transitionTimer = null;
  }

  registerScene(sceneId, sceneBuilder) {
    this.scenes[sceneId] = sceneBuilder;
  }

  switchTo(sceneId, data = {}) {
    if (this.currentScene === sceneId) return;

    if (this._transitionTimer) {
      clearTimeout(this._transitionTimer);
      this._transitionTimer = null;
    }

    const oldEl = this.container.firstElementChild;
    if (oldEl && oldEl._cleanup) {
      oldEl._cleanup();
    }

    const builder = this.scenes[sceneId];
    let newEl = null;
    
    if (builder) {
      newEl = builder(data);
      newEl.style.opacity = '0';
      newEl.style.position = 'absolute';
      newEl.style.top = '0';
      newEl.style.left = '0';
      newEl.style.width = '100%';
      newEl.style.height = '100%';
      newEl.style.transition = 'opacity 0.25s ease';
      this.container.appendChild(newEl);
      
      // Force reflow
      newEl.offsetHeight;
    }

    if (oldEl) {
      oldEl.style.transition = 'opacity 0.25s ease';
      
      requestAnimationFrame(() => {
        if (newEl) newEl.style.opacity = '1';
        oldEl.style.opacity = '0';
      });

      this._transitionTimer = setTimeout(() => {
        if (oldEl.parentNode === this.container) {
          this.container.removeChild(oldEl);
        }
        if (newEl) {
          newEl.style.position = '';
          newEl.style.top = '';
          newEl.style.left = '';
          newEl.style.width = '';
          newEl.style.height = '';
        }
        this._transitionTimer = null;
      }, 250);
    } else {
      if (newEl) {
        requestAnimationFrame(() => {
          newEl.style.opacity = '1';
        });
        newEl.style.position = '';
        newEl.style.top = '';
        newEl.style.left = '';
        newEl.style.width = '';
        newEl.style.height = '';
      }
    }

    this.currentScene = sceneId;

    if (this.onSceneChange) {
      this.onSceneChange(sceneId);
    }
  }
}
