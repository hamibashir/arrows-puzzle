/**
 * Audio manager using Web Audio API
 * All sounds are procedurally generated — no audio files required.
 *
 * Optimizations:
 *   - Lazy AudioContext creation (avoids autoplay policy failure on page load)
 *   - Explicit node disconnect via onended callbacks (prevents memory leaks)
 *   - Cached mute state in memory (no storage read per sound)
 */

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this._contextCreated = false;
    this._isMuted = false;
    this._muteLoaded = false;
  }

  /**
   * Lazy AudioContext initialization — only called on first user interaction.
   */
  _ensureContext() {
    if (this._contextCreated) return this.audioContext;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
    this._contextCreated = true;
    return this.audioContext;
  }

  /**
   * Ensure AudioContext is resumed (required by mobile Safari after user gesture)
   */
  resume() {
    const ctx = this.audioContext;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  /**
   * Lazy-load mute state from storage only once.
   */
  _loadMuteOnce() {
    if (this._muteLoaded) return;
    if (typeof localStorage !== 'undefined') {
      this._isMuted = localStorage.getItem('arrowsPuzzleMuted') === 'true';
    }
    this._muteLoaded = true;
  }

  /**
   * Play arrow removed sound
   */
  playArrowRemoved() {
    this._loadMuteOnce();
    if (this._isMuted) return;

    const ctx = this._ensureContext();
    if (!ctx) return;
    this.resume();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.start(t);
    osc.stop(t + 0.08);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Play blocked arrow sound
   */
  playArrowBlocked() {
    this._loadMuteOnce();
    if (this._isMuted) return;

    const ctx = this._ensureContext();
    if (!ctx) return;
    this.resume();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.1);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Play level complete sound (C major arpeggio: C-E-G)
   */
  playLevelComplete() {
    this._loadMuteOnce();
    if (this._isMuted) return;

    const ctx = this._ensureContext();
    if (!ctx) return;
    this.resume();

    const notes = [523.25, 659.25, 783.99];
    const t = ctx.currentTime;
    const step = 0.15;

    for (let i = 0; i < notes.length; i++) {
      const freq = notes[i];
      const start = t + i * step;
      const stop = start + 0.15;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, stop);

      osc.start(start);
      osc.stop(stop);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
  }

  /**
   * Play button tap sound
   */
  playButtonTap() {
    this._loadMuteOnce();
    if (this._isMuted) return;

    const ctx = this._ensureContext();
    if (!ctx) return;
    this.resume();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.start(t);
    osc.stop(t + 0.04);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this._loadMuteOnce();
    this._isMuted = !this._isMuted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('arrowsPuzzleMuted', this._isMuted);
    }
    return this._isMuted;
  }

  get isMuted() {
    this._loadMuteOnce();
    return this._isMuted;
  }
}
