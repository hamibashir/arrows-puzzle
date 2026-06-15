/**
 * Manages the game board grid and arrow placement
 * Optimized with flat arrow lists and cached removable sets to avoid
 * per-frame garbage collection.
 */

import { Arrow } from './Arrow.js';

export class Grid {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = this.createEmptyGrid();

    // Flat arrow array — zero-allocation getter for render loop
    this._allArrows = [];

    // Cache management
    this._removableCache = null;
    this._removableIdSet = null;
    this._removableDirty = true;
  }

  createEmptyGrid() {
    return Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
  }

  /**
   * Place a snake arrow on the grid. Mutates _allArrows and invalidates cache.
   */
  setArrow(arrow) {
    if (!arrow) return;
    
    arrow.body.forEach(p => {
      if (this.isValidCell(p.row, p.col)) {
        const existing = this.cells[p.row][p.col];
        if (existing && existing.id !== arrow.id) {
          this._removeFromAllArrows(existing);
        }
        this.cells[p.row][p.col] = arrow;
      }
    });
    
    this._allArrows.push(arrow);
    this._invalidateRemovableCache();
  }

  /**
   * Get arrow at position (fast, no allocation)
   */
  getArrow(row, col) {
    if (this.isValidCell(row, col)) {
      return this.cells[row][col];
    }
    return null;
  }

  /**
   * Remove arrow from grid (fast, mutates _allArrows in-place)
   */
  removeArrow(arrow) {
    if (!arrow) return null;

    arrow.body.forEach(p => {
      if (this.isValidCell(p.row, p.col) && this.cells[p.row][p.col] === arrow) {
        this.cells[p.row][p.col] = null;
      }
    });

    this._removeFromAllArrows(arrow);
    this._invalidateRemovableCache();
    return arrow;
  }

  _removeFromAllArrows(arrow) {
    const idx = this._allArrows.indexOf(arrow);
    if (idx !== -1) {
      // Swap-and-pop for O(1) removal (order irrelevant for rendering)
      const last = this._allArrows[this._allArrows.length - 1];
      this._allArrows[idx] = last;
      this._allArrows.pop();
    }
  }

  /**
   * Check if cell coordinates are valid
   */
  isValidCell(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  /**
   * Get all arrows as a reference to the internal flat array.
   * Callers must NOT mutate this array.
   */
  getAllArrows() {
    return this._allArrows;
  }

  /**
   * Get cached Set of removable arrow IDs for O(1) lookup in render loop.
   * Rebuilds only when grid changes.
   */
  getRemovableArrowIds() {
    if (!this._removableDirty && this._removableIdSet) {
      return this._removableIdSet;
    }

    const arrows = this.getRemovableArrows();
    const set = new Set();
    for (let i = 0, len = arrows.length; i < len; i++) {
      set.add(arrows[i].id);
    }
    this._removableIdSet = set;
    return set;
  }

  /**
   * Get all arrows that can currently be removed (with caching)
   */
  getRemovableArrows() {
    if (!this._removableDirty && this._removableCache) {
      return this._removableCache;
    }

    const removable = [];
    const arrows = this._allArrows;
    for (let i = 0, len = arrows.length; i < len; i++) {
      const arrow = arrows[i];
      if (arrow.canRemove(this)) {
        removable.push(arrow);
      }
    }

    this._removableCache = removable;
    this._removableDirty = false;
    return removable;
  }

  /**
   * Check if grid is completely cleared (O(1) via flat array)
   */
  isEmpty() {
    return this._allArrows.length === 0;
  }

  _invalidateRemovableCache() {
    this._removableDirty = true;
    this._removableCache = null;
    this._removableIdSet = null;
  }

  /**
   * Clone the entire grid state. Bypasses setArrow to avoid O(n²) cache invalidation.
   */
  clone() {
    const newGrid = new Grid(this.rows, this.cols);
    for (let i = 0; i < this._allArrows.length; i++) {
      const cloned = this._allArrows[i].clone();
      newGrid._allArrows.push(cloned);
      cloned.body.forEach(p => {
        newGrid.cells[p.row][p.col] = cloned;
      });
    }
    return newGrid;
  }

  /**
   * Load grid from level data. Batch-populates without per-arrow cache invalidation.
   */
  loadFromLevelData(levelData) {
    this.cells = this.createEmptyGrid();
    this._allArrows.length = 0;
    this._invalidateRemovableCache();

    const arrows = levelData.arrows;
    for (let i = 0, len = arrows.length; i < len; i++) {
      const ad = arrows[i];
      const arrow = new Arrow(ad.body, ad.dir);
      
      arrow.body.forEach(p => {
        this.cells[p.row][p.col] = arrow;
      });
      this._allArrows.push(arrow);
    }
  }
}
