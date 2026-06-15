/**
 * Manages all game animations
 * Optimized for zero-allocation updates and clamped delta time
 * to prevent spiral-of-death on tab-switch or jank frames.
 */

import { CONSTANTS } from '../core/Constants.js';

export class Animator {
  constructor() {
    this.animations = [];
    this._winTimers = null;
    this.lastFrameTime = performance.now();
  }

  /**
   * Update all active animations. Mutates array in-place to avoid
   * per-frame GC pressure from filter() allocations.
   */
  update() {
    const now = performance.now();
    let deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Clamp delta to 100ms (6 frames at 60fps) to prevent animation jumps
    // after tab switching or severe jank.
    if (deltaTime > 100) deltaTime = 100;

    let i = 0;
    while (i < this.animations.length) {
      const anim = this.animations[i];
      anim.elapsed += deltaTime;
      anim.progress = anim.elapsed / anim.duration;

      if (anim.progress >= 1) {
        anim.progress = 1;
        const eased = this.applyEasing(1, anim.easing);
        if (anim.onUpdate) anim.onUpdate(eased);
        if (anim.onComplete) anim.onComplete();

        // Remove in-place without allocating new array
        this.animations.splice(i, 1);
      } else {
        const eased = this.applyEasing(anim.progress, anim.easing);
        if (anim.onUpdate) anim.onUpdate(eased);
        i++;
      }
    }
  }

  /**
   * Apply easing function (branchless friendly switch)
   */
  applyEasing(t, easing = 'linear') {
    switch (easing) {
      case 'easeIn':  return t * t;
      case 'easeOut': return t * (2 - t);
      case 'easeInOut': {
        const tt = t * 2;
        return (t < 0.5) ? tt * t : -1 + (4 - tt) * t;
      }
      default: return t;
    }
  }

  /**
   * Slide arrow out of grid. Reuses a single animation object shape.
   */
  slideArrowOut(arrow, onComplete) {
    arrow.isRemoving = true;
    this.animations.push({
      type: 'slide',
      arrow: arrow,
      elapsed: 0,
      duration: CONSTANTS.ANIM_ARROW_SLIDE,
      progress: 0,
      easing: 'easeIn',
      onComplete: () => {
        arrow.isRemoving = false;
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Shake arrow (invalid move). Amplitude decays with (1 - progress).
   */
  shakeArrow(arrow, gridDimensions, onComplete) {
    this.animations.push({
      type: 'shake',
      arrow: arrow,
      elapsed: 0,
      duration: CONSTANTS.ANIM_ARROW_SHAKE,
      progress: 0,
      easing: 'linear',
      onUpdate: (progress) => {
        // 4 shake cycles, decaying amplitude
        arrow.shakeOffset = Math.sin(progress * Math.PI * 4) * 6 * (1 - progress);
      },
      onComplete: () => {
        arrow.shakeOffset = 0;
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Pulse removable arrow (subtle scale breathing)
   */
  pulseArrow(arrow, onComplete) {
    this.animations.push({
      type: 'pulse',
      arrow: arrow,
      elapsed: 0,
      duration: CONSTANTS.ANIM_ARROW_PULSE,
      progress: 0,
      easing: 'easeInOut',
      onUpdate: (progress) => {
        arrow.pulseScale = 1 + Math.sin(progress * Math.PI * 2) * 0.05;
      },
      onComplete: () => {
        arrow.pulseScale = 1;
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Win animation sequence with staggered slide-out.
   * Tracks timer IDs so they can be killed on scene exit.
   */
  playWinAnimation(grid, onComplete) {
    const arrows = grid.getAllArrows();
    if (arrows.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    let completed = 0;
    this._winTimers = [];

    arrows.forEach((arrow, index) => {
      const timer = setTimeout(() => {
        this.slideArrowOut(arrow, () => {
          completed++;
          if (completed === arrows.length && onComplete) {
            onComplete();
          }
        });
      }, index * 50);
      this._winTimers.push(timer);
    });
  }

  /**
   * Get active animations (same array reference, no allocation)
   */
  getActiveAnimations() {
    return this.animations;
  }

  /**
   * Check if any animations are playing
   */
  isAnimating() {
    return this.animations.length > 0 || (this._winTimers !== null && this._winTimers.length > 0);
  }

  /**
   * Clear all animations and kill pending win timers.
   */
  clear() {
    this.animations.length = 0;
    if (this._winTimers) {
      this._winTimers.forEach(id => clearTimeout(id));
      this._winTimers = null;
    }
  }
}
