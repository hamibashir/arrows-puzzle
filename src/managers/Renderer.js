/**
 * Handles all canvas drawing operations
 * Optimizations:
 *   - Iterates flat arrow array directly (zero allocation in render loop)
 *   - Cached removable Set from Grid (no per-frame Set construction)
 *   - for-loops instead of forEach in hot paths
 *   - Offscreen canvas for grid lines (drawn once per level)
 *   - Pre-computed color values to avoid repeated CONSTANTS lookups
 */

import { CONSTANTS } from '../core/Constants.js';

export class Renderer {
  constructor(ctx, displayWidth, displayHeight) {
    this.ctx = ctx;
    this.width = displayWidth;
    this.height = displayHeight;

    // Offscreen canvas for grid lines (cached until grid size changes)
    this.gridCanvas = document.createElement('canvas');
    this.gridCtx = this.gridCanvas.getContext('2d', { alpha: false });
    this.gridCached = false;

    // Pre-cache colors to avoid repeated property lookups
    this._colorFree = CONSTANTS.ARROW_FREE;
    this._colorBlocked = CONSTANTS.ARROW_BLOCKED;
    this._colorBg = CONSTANTS.CANVAS_BG;
    this._lineWidth = CONSTANTS.ARROW_LINE_WIDTH;
    this._padding = CONSTANTS.ARROW_PADDING;
  }

  render(grid, gridDimensions, animations = []) {
    const ctx = this.ctx;

    // Clear full canvas
    ctx.fillStyle = this._colorBg;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw arrows (zero allocation path)
    this.drawArrows(grid, gridDimensions);

    // Draw animating arrows on top (slides, etc.)
    const len = animations.length;
    for (let i = 0; i < len; i++) {
      const anim = animations[i];
      if (anim.type === 'slide') {
        this.drawSlidingArrow(anim.arrow, gridDimensions, anim.progress);
      }
    }
  }

  /**
   * Draw all arrows using the Grid's flat arrow array.
   * No allocations here — only reads from cached removable Set.
   */
  drawArrows(grid, dimensions) {
    const removableIds = grid.getRemovableArrowIds();
    const arrows = grid.getAllArrows();
    const len = arrows.length;

    for (let i = 0; i < len; i++) {
      const arrow = arrows[i];
      if (!arrow.isRemoving) {
        this.drawArrow(arrow, dimensions, removableIds.has(arrow.id));
      }
    }
  }

  /**
   * Draw a single arrow snake at its position.
   */
  drawArrow(arrow, dimensions, isRemovable = false) {
    const scale = arrow.pulseScale || 1;
    this._drawSnake(arrow, dimensions, 0, scale, 1);
  }

  /**
   * Draw arrow during slide-out animation.
   */
  drawSlidingArrow(arrow, dimensions, progress) {
    this._drawSnake(arrow, dimensions, progress, 1, 1 - progress);
  }

  /**
   * Helper to draw a polyline snake arrow with slithering animation!
   */
  _drawSnake(arrow, dimensions, progress, scale, alpha) {
    const ctx = this.ctx;
    const { cellSize, offsetX, offsetY } = dimensions;
    const { body, direction, shakeOffset } = arrow;

    // Build the "track" the snake will slither along.
    // The track is: [escape_path_cells_in_reverse, body_cells]
    let track = [];
    const head = body[0];
    
    // Add escape path cells (up to 20 offscreen to ensure it fully exits)
    let cr = head.row, cc = head.col;
    let escapeCells = [];
    for (let i = 0; i < 20; i++) {
      if (direction === CONSTANTS.DIRECTIONS.UP) cr--;
      else if (direction === CONSTANTS.DIRECTIONS.DOWN) cr++;
      else if (direction === CONSTANTS.DIRECTIONS.LEFT) cc--;
      else if (direction === CONSTANTS.DIRECTIONS.RIGHT) cc++;
      escapeCells.push({row: cr, col: cc});
    }
    
    // Track from farthest exit point back to head, then down the body
    track = [...escapeCells.reverse(), ...body];
    
    // Convert track cells to pixel coordinates
    const trackPoints = track.map(p => {
      let x = offsetX + (p.col * cellSize) + (cellSize * 0.5);
      let y = offsetY + (p.row * cellSize) + (cellSize * 0.5);
      // Apply shake
      if (shakeOffset) {
        if (direction === CONSTANTS.DIRECTIONS.UP || direction === CONSTANTS.DIRECTIONS.DOWN) y += shakeOffset;
        else x += shakeOffset;
      }
      return {x, y};
    });

    // Snake length (number of segments)
    const snakeLen = body.length - 1;
    
    // At progress 0, head is at escapeCells.length. Tail is at end of track.
    const startIdx = escapeCells.length;
    // We move the window of size `snakeLen` along the track towards 0
    const slideDist = progress * startIdx; // How many cells we moved
    
    // The head's float index in the track array
    const headFloatIdx = startIdx - slideDist;
    const tailFloatIdx = headFloatIdx + snakeLen;
    
    // We now sample the trackPoints between headFloatIdx and tailFloatIdx
    let snakePoints = [];
    for (let i = Math.floor(headFloatIdx); i <= Math.ceil(tailFloatIdx); i++) {
      if (i < 0 || i >= trackPoints.length) continue;
      snakePoints.push(trackPoints[i]);
    }
    
    // If the snake is completely offscreen, skip rendering
    if (snakePoints.length < 2) return;

    // Fine-tune the start (head) and end (tail) points for smooth sub-cell interpolation
    const headT = headFloatIdx % 1;
    if (headT > 0 && Math.floor(headFloatIdx) >= 0 && Math.floor(headFloatIdx) + 1 < trackPoints.length) {
      const p1 = trackPoints[Math.floor(headFloatIdx)];
      const p2 = trackPoints[Math.floor(headFloatIdx) + 1];
      snakePoints[0] = {
        x: p1.x + (p2.x - p1.x) * headT,
        y: p1.y + (p2.y - p1.y) * headT
      };
    }
    
    const tailT = tailFloatIdx % 1;
    if (tailT > 0 && Math.floor(tailFloatIdx) >= 0 && Math.floor(tailFloatIdx) + 1 < trackPoints.length) {
      const p1 = trackPoints[Math.floor(tailFloatIdx)];
      const p2 = trackPoints[Math.floor(tailFloatIdx) + 1];
      snakePoints[snakePoints.length - 1] = {
        x: p1.x + (p2.x - p1.x) * tailT,
        y: p1.y + (p2.y - p1.y) * tailT
      };
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = CONSTANTS.ARROW_FREE;
    // SLIMMER ARROWS (reduced from 0.15 to 0.08)
    ctx.lineWidth = cellSize * 0.08 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw the body polyline
    ctx.beginPath();
    ctx.moveTo(snakePoints[0].x, snakePoints[0].y);
    for (let i = 1; i < snakePoints.length; i++) {
      ctx.lineTo(snakePoints[i].x, snakePoints[i].y);
    }
    ctx.stroke();

    // Draw the arrowhead at snakePoints[0] pointing towards snakePoints[1]
    const p0 = snakePoints[0];
    const p1 = snakePoints[1];
    const angle = Math.atan2(p0.y - p1.y, p0.x - p1.x); // Vector from p1 to p0 is the forward direction

    ctx.translate(p0.x, p0.y);
    ctx.rotate(angle);

    // Slimmer arrowhead
    const arrowHeadSize = cellSize * 0.22 * scale;
    
    ctx.beginPath();
    ctx.moveTo(-arrowHeadSize, -arrowHeadSize * 0.7);
    ctx.lineTo(0, 0);
    ctx.lineTo(-arrowHeadSize, arrowHeadSize * 0.7);
    ctx.stroke();

    ctx.restore();
  }

  invalidateGridCache() {
    this.gridCached = false;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.invalidateGridCache();
  }
}
