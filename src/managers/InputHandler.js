/**
 * Handles touch and mouse input
 * Optimized with squared-distance tap detection, multi-touch safety,
 * and debounced rapid taps to prevent ghost clicks on mobile.
 */

const TAP_DIST_SQ = 10 * 10; // 10px squared (no Math.sqrt needed)
const DEBOUNCE_MS = 80;

export class InputHandler {
  constructor(canvas, onCellTap) {
    this.canvas = canvas;
    this.onCellTap = onCellTap;
    this.lastTapTime = 0;

    // Multi-touch safety: track the specific touch identifier
    this.touchId = null;
    this.touchStartPos = null;
    this.mouseDownPos = null;

    // Bound references for clean removal
    this._onTouchStart = this.handleTouchStart.bind(this);
    this._onTouchEnd   = this.handleTouchEnd.bind(this);
    this._onMouseDown  = this.handleMouseDown.bind(this);
    this._onMouseUp    = this.handleMouseUp.bind(this);

    this.setupListeners();
  }

  setupListeners() {
    // passive: false required to prevent default scrolling on canvas
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false, capture: false });
    this.canvas.addEventListener('touchend',   this._onTouchEnd,   { passive: false, capture: false });
    this.canvas.addEventListener('mousedown',  this._onMouseDown,  { passive: true });
    this.canvas.addEventListener('mouseup',    this._onMouseUp,    { passive: true });
  }

  handleTouchStart(e) {
    if (e.touches.length !== 1) return; // Ignore multi-finger gestures
    e.preventDefault();

    const touch = e.touches[0];
    this.touchId = touch.identifier;
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
  }

  handleTouchEnd(e) {
    if (this.touchId === null || !this.touchStartPos) return;

    // Find the matching changed touch by identifier
    let touch = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        touch = e.changedTouches[i];
        break;
      }
    }
    if (!touch) return;

    e.preventDefault();

    const dx = touch.clientX - this.touchStartPos.x;
    const dy = touch.clientY - this.touchStartPos.y;
    if (dx * dx + dy * dy < TAP_DIST_SQ) {
      this.handleTap(touch.clientX, touch.clientY);
    }

    this.touchId = null;
    this.touchStartPos = null;
  }

  handleMouseDown(e) {
    this.mouseDownPos = { x: e.clientX, y: e.clientY };
  }

  handleMouseUp(e) {
    if (!this.mouseDownPos) return;

    const dx = e.clientX - this.mouseDownPos.x;
    const dy = e.clientY - this.mouseDownPos.y;
    if (dx * dx + dy * dy < TAP_DIST_SQ) {
      this.handleTap(e.clientX, e.clientY);
    }

    this.mouseDownPos = null;
  }

  handleTap(x, y) {
    const now = performance.now();
    if (now - this.lastTapTime < DEBOUNCE_MS) return;
    this.lastTapTime = now;

    this.onCellTap(x, y);
  }

  destroy() {
    this.canvas.removeEventListener('touchstart', this._onTouchStart, { passive: false, capture: false });
    this.canvas.removeEventListener('touchend',   this._onTouchEnd,   { passive: false, capture: false });
    this.canvas.removeEventListener('mousedown',  this._onMouseDown,  { passive: true });
    this.canvas.removeEventListener('mouseup',    this._onMouseUp,    { passive: true });
    this.touchId = null;
    this.touchStartPos = null;
    this.mouseDownPos = null;
  }
}
