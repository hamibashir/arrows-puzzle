/**
 * Represents a single arrow on the grid
 */

import { CONSTANTS } from '../core/Constants.js';

let _arrowIdCounter = 0;

export class Arrow {
  constructor(body, direction) {
    this.body = body; // Array of {row, col}
    this.direction = direction; // 'UP', 'DOWN', 'LEFT', 'RIGHT'
    this.head = body[0];
    this.isRemoving = false; // Animation state
    this.animProgress = 0; // 0 to 1
    this.id = `${this.head.row}-${this.head.col}-${++_arrowIdCounter}`; // Fast deterministic ID

    // Animation state properties (pre-allocated to avoid dynamic property creation)
    this.shakeOffset = 0;
    this.pulseScale = 1;
  }

  /**
   * Check if this snake arrow can be removed from the grid.
   * It slithers forward, so it only needs a clear straight path from its head to the edge!
   * @param {Grid} grid - The game grid
   * @returns {boolean}
   */
  canRemove(grid) {
    let r = this.head.row;
    let c = this.head.col;
    const { rows, cols } = grid;

    while (true) {
      if (this.direction === CONSTANTS.DIRECTIONS.UP) r--;
      else if (this.direction === CONSTANTS.DIRECTIONS.DOWN) r++;
      else if (this.direction === CONSTANTS.DIRECTIONS.LEFT) c--;
      else if (this.direction === CONSTANTS.DIRECTIONS.RIGHT) c++;

      if (r < 0 || r >= rows || c < 0 || c >= cols) break;
      if (grid.cells[r][c] !== null) return false;
    }
    return true;
  }

  clone() {
    // Deep copy body
    const newBody = this.body.map(p => ({ row: p.row, col: p.col }));
    return new Arrow(newBody, this.direction);
  }
}
