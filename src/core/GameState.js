/**
 * Manages game state and rules
 */

import { CONSTANTS } from './Constants.js';

export class GameState {
  constructor(grid) {
    this.grid = grid;
    this.hintsRemaining = CONSTANTS.MAX_HINTS;
    this.moveHistory = []; // For undo
    this.isGameOver = false;
    this.isWon = false;
    this.score = 0;
  }

  /**
   * Attempt to remove an arrow at the given position
   * @returns {{ success: boolean, reason: string, arrow: Arrow|null }}
   */
  tryRemoveArrow(row, col) {
    const arrow = this.grid.getArrow(row, col);

    if (!arrow) {
      return { success: false, reason: 'empty', arrow: null };
    }

    if (arrow.canRemove(this.grid)) {
      // Valid move - remove the arrow
      this.removeArrow(arrow);
      return { success: true, reason: 'valid', arrow };
    } else {
      // Invalid move - costs a hint
      this.hintsRemaining--;

      if (this.hintsRemaining <= 0) {
        this.isGameOver = true;
      }

      return { success: false, reason: 'blocked', arrow };
    }
  }

  /**
   * Remove arrow and save to history
   */
  removeArrow(arrow) {
    this.grid.removeArrow(arrow);

    // Save to history for undo
    this.moveHistory.push({
      arrow: arrow.clone()
    });

    // Keep history limited
    if (this.moveHistory.length > CONSTANTS.MAX_UNDO) {
      this.moveHistory.shift();
    }

    this.score++;

    // Check win condition
    if (this.grid.isEmpty()) {
      this.isWon = true;
      this.isGameOver = true;
    }
  }

  /**
   * Undo last move
   * @returns {boolean}
   */
  undo() {
    if (this.moveHistory.length === 0) return false;

    const lastMove = this.moveHistory.pop();
    this.grid.setArrow(lastMove.arrow);
    this.score = Math.max(0, this.score - 1);

    return true;
  }

  /**
   * Restart level
   * @param {Grid} originalGrid
   */
  restart(originalGrid) {
    this.grid = originalGrid.clone();
    this.hintsRemaining = CONSTANTS.MAX_HINTS;
    this.moveHistory = [];
    this.isGameOver = false;
    this.isWon = false;
    this.score = 0;
  }

  /**
   * Get star rating based on hints used
   * @returns {number} 1-3 stars
   */
  getStarRating() {
    const hintsUsed = CONSTANTS.MAX_HINTS - this.hintsRemaining;
    if (hintsUsed === 0) return 3;
    if (hintsUsed <= 2) return 2;
    return 1;
  }

  /**
   * Get hint: find best removable arrow
   * @returns {Arrow|null}
   */
  getHint() {
    const removable = this.grid.getRemovableArrows();
    if (removable.length === 0) return null;

    // Return first removable arrow (could be enhanced with scoring)
    return removable[0];
  }
}
