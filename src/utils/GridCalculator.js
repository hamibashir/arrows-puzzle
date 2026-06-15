/**
 * Calculate optimal grid rendering dimensions
 */

import { CONSTANTS } from '../core/Constants.js';

export class GridCalculator {
  static calculate(rows, cols, screenWidth, screenHeight) {
    const availableWidth = screenWidth - (CONSTANTS.GRID_PADDING * 2);
    const availableHeight = screenHeight - (CONSTANTS.GRID_PADDING * 2) - 200; // Reserve space for UI

    let cellSize = Math.min(
      availableWidth / cols,
      availableHeight / rows
    );

    // Cap maximum cell size so small grids don't look comically huge
    cellSize = Math.min(cellSize, 60);

    const gridWidth = cellSize * cols;
    const gridHeight = cellSize * rows;

    const offsetX = (screenWidth - gridWidth) / 2;
    const offsetY = (screenHeight - gridHeight) / 2;

    return {
      cellSize,
      gridWidth,
      gridHeight,
      offsetX,
      offsetY
    };
  }

  /**
   * Convert screen coordinates to grid cell
   */
  static screenToGrid(x, y, offsetX, offsetY, cellSize) {
    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    return { row, col };
  }

  /**
   * Convert grid cell to screen coordinates (center of cell)
   */
  static gridToScreen(row, col, offsetX, offsetY, cellSize) {
    const x = offsetX + (col * cellSize) + (cellSize / 2);
    const y = offsetY + (row * cellSize) + (cellSize / 2);
    return { x, y };
  }
}
