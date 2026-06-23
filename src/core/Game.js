/**
 * Game.js
 * Core game controller. Will orchestrate the game loop, 
 * screen transitions, and high-level state in later prompts.
 */

export class Game {
  constructor(app) {
    this.app = app;
    this.running = false;
  }

  init() {
    // TODO: Wire up managers in Prompt 2-8
  }

  start() {
    this.running = true;
    this.loop(0);
  }

  stop() {
    this.running = false;
  }

  loop(timestamp) {
    if (!this.running) return;

    // TODO: Update + Render pipeline will be added in upcoming prompts

    requestAnimationFrame((t) => this.loop(t));
  }
}
