/**
 * Manages level loading, progression, and storage
 * Optimizations:
 *   - JSON cache (Map) avoids re-fetch on restart
 *   - Debounced saveProgress (batches rapid writes)
 *   - Async loadProgress so constructor doesn't block
 */

export class LevelManager {
  constructor() {
    this.currentLevel = 1;
    this.totalLevels = 50;
    this.levelProgress = {};
    this._levelCache = new Map();
    this._saveTimeout = null;
    this._progressLoaded = false;
  }

  /**
   * Initialize progress asynchronously (call before first use if needed)
   */
  async init() {
    if (this._progressLoaded) return;
    this.levelProgress = this.loadProgress();
    this._progressLoaded = true;
  }

  /**
   * Load level data from JSON with in-memory cache
   */
  async loadLevel(levelNumber) {
    // Ensure init has run
    if (!this._progressLoaded) {
      await this.init();
    }

    if (this._levelCache.has(levelNumber)) {
      return this._levelCache.get(levelNumber);
    }

    try {
      // Dynamically generate the level instead of fetching static JSON
      const data = this.generateLevel(levelNumber);
      this._levelCache.set(levelNumber, data);
      return data;
    } catch (error) {
      console.error(`Failed to generate level ${levelNumber}:`, error);
      return null;
    }
  }

  generateLevel(levelNumber) {
    // Determine grid size based on level
    // Grow grid size much faster: Level 1 = 8x8, Level 24 = 16x16
    const size = Math.min(8 + Math.floor(levelNumber / 3), 16);
    const rows = size;
    const cols = size;
    
    const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    
    // Keep snake length very short so we fit a MASSIVE amount of snakes into the grid
    const MAX_SNAKE_LENGTH = Math.min(3 + Math.floor(levelNumber / 15), 5);
    
    // Helper to get escape path (straight line to edge)
    const getEscapePath = (r, c, dir) => {
      let path = [];
      let cr = r, cc = c;
      while(true) {
        if (dir === 'UP') cr--;
        else if (dir === 'DOWN') cr++;
        else if (dir === 'LEFT') cc--;
        else if (dir === 'RIGHT') cc++;
        
        if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) break;
        path.push({row: cr, col: cc});
      }
      return path;
    };

    // Helper to evaluate puzzle difficulty (fewer initial moves = harder)
    const countInitialMoves = (snakes) => {
      const grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
      snakes.forEach(s => s.body.forEach(p => grid[p.row][p.col] = true));
      
      let count = 0;
      for (const snake of snakes) {
        const head = snake.body[0];
        const escPath = getEscapePath(head.row, head.col, snake.dir);
        if (escPath.every(p => grid[p.row][p.col] === null)) {
          count++;
        }
      }
      return count;
    };

    let bestPuzzle = null;
    let minInitialMoves = Infinity;
    const NUM_PUZZLE_CANDIDATES = Math.min(10 + levelNumber, 40);

    for (let candidate = 0; candidate < NUM_PUZZLE_CANDIDATES; candidate++) {
      const gridCells = Array(rows).fill(null).map(() => Array(cols).fill(null));
      let snakes = [];
      let attempts = 0;
      const MAX_ATTEMPTS = 2000;
      
      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        let emptyCells = [];
        for(let r=0; r<rows; r++) {
          for(let c=0; c<cols; c++) {
            if (gridCells[r][c] === null) emptyCells.push({row: r, col: c});
          }
        }
        
        if (emptyCells.length === 0) break; // Grid full
        
        // Prioritize filling the CENTER of the grid first.
        // This ensures that any leftover empty cells are pushed to the outer edges,
        // preventing "holes" in the middle of the puzzle.
        const centerR = rows / 2;
        const centerC = cols / 2;
        emptyCells.sort((a, b) => {
           const distA = Math.abs(a.row - centerR) + Math.abs(a.col - centerC);
           const distB = Math.abs(b.row - centerR) + Math.abs(b.col - centerC);
           return (distA - distB) + (Math.random() * 2 - 1); // Distance ascending + slight noise
        });
        
        let snakePlaced = false;
        
        for (const head of emptyCells) {
          let dirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);
          for (const dir of dirs) {
            const escPath = getEscapePath(head.row, head.col, dir);
            
            if (!escPath.every(p => gridCells[p.row][p.col] === null)) continue;
            
            let forbidden = new Set(escPath.map(p => `${p.row},${p.col}`));
            
            let firstRow = head.row;
            let firstCol = head.col;
            if (dir === 'UP') firstRow++;
            else if (dir === 'DOWN') firstRow--;
            else if (dir === 'LEFT') firstCol++;
            else if (dir === 'RIGHT') firstCol--;
            
            if (firstRow < 0 || firstRow >= rows || firstCol < 0 || firstCol >= cols) continue;
            if (gridCells[firstRow][firstCol] !== null || forbidden.has(`${firstRow},${firstCol}`)) continue;
            
            let body = [head];
            gridCells[head.row][head.col] = true;
            forbidden.add(`${head.row},${head.col}`);
            
            let next = {row: firstRow, col: firstCol};
            body.push(next);
            gridCells[next.row][next.col] = true;
            forbidden.add(`${next.row},${next.col}`);
            
            let curr = next;
            let currentLength = 2;
            const targetLength = 2 + Math.floor(Math.random() * (MAX_SNAKE_LENGTH - 1));
            
            while (currentLength < targetLength) {
              let neighbors = [];
              const {row, col} = curr;
              if (row > 0) neighbors.push({row: row-1, col: col});
              if (row < rows-1) neighbors.push({row: row+1, col: col});
              if (col > 0) neighbors.push({row: row, col: col-1});
              if (col < cols-1) neighbors.push({row: row, col: col+1});
              
              neighbors = neighbors.filter(n => 
                gridCells[n.row][n.col] === null && !forbidden.has(`${n.row},${n.col}`)
              );
              
              if (neighbors.length === 0) break;
              
              const nxt = neighbors[Math.floor(Math.random() * neighbors.length)];
              body.push(nxt);
              gridCells[nxt.row][nxt.col] = true;
              forbidden.add(`${nxt.row},${nxt.col}`);
              curr = nxt;
              currentLength++;
            }
            
            snakes.push({ body, dir });
            snakePlaced = true;
            break; 
          }
          if (snakePlaced) break;
        }
        
        if (!snakePlaced) break;
      }

      if (snakes.length > 0) {
        const initialMoves = countInitialMoves(snakes);
        if (initialMoves < minInitialMoves) {
          minInitialMoves = initialMoves;
          bestPuzzle = snakes;
        }
        // If we found a puzzle with only 1 or 2 initial valid moves, it's perfect!
        if (minInitialMoves <= 2) {
          break;
        }
      }
    }
    
    return {
      id: levelNumber,
      name: `Level ${levelNumber}`,
      rows,
      cols,
      difficulty: "dynamic",
      arrows: bestPuzzle
    };
  }

  generateCasualLevel(size) {
    const rows = size;
    const cols = size;
    
    const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    // In casual mode, we want a decent density, but mostly bounded by size
    const MAX_SNAKE_LENGTH = Math.min(4 + Math.floor(size / 3), 8);
    
    const getEscapePath = (r, c, dir) => {
      let path = [];
      let cr = r, cc = c;
      while(true) {
        if (dir === 'UP') cr--;
        else if (dir === 'DOWN') cr++;
        else if (dir === 'LEFT') cc--;
        else if (dir === 'RIGHT') cc++;
        
        if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) break;
        path.push({row: cr, col: cc});
      }
      return path;
    };

    const countInitialMoves = (snakes) => {
      const grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
      snakes.forEach(s => s.body.forEach(p => grid[p.row][p.col] = true));
      let count = 0;
      for (const snake of snakes) {
        const head = snake.body[0];
        const escPath = getEscapePath(head.row, head.col, snake.dir);
        if (escPath.every(p => grid[p.row][p.col] === null)) count++;
      }
      return count;
    };

    let bestPuzzle = null;
    let minInitialMoves = Infinity;
    const NUM_PUZZLE_CANDIDATES = 20; // Generate a few candidates for a good puzzle

    for (let candidate = 0; candidate < NUM_PUZZLE_CANDIDATES; candidate++) {
      const gridCells = Array(rows).fill(null).map(() => Array(cols).fill(null));
      let snakes = [];
      let attempts = 0;
      const MAX_ATTEMPTS = 2000;
      
      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        let emptyCells = [];
        for(let r=0; r<rows; r++) {
          for(let c=0; c<cols; c++) {
            if (gridCells[r][c] === null) emptyCells.push({row: r, col: c});
          }
        }
        if (emptyCells.length === 0) break;
        
        const centerR = rows / 2;
        const centerC = cols / 2;
        emptyCells.sort((a, b) => {
           const distA = Math.abs(a.row - centerR) + Math.abs(a.col - centerC);
           const distB = Math.abs(b.row - centerR) + Math.abs(b.col - centerC);
           return (distA - distB) + (Math.random() * 2 - 1);
        });

        let snakePlaced = false;
        
        for (const head of emptyCells) {
          let dirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);
          for (const dir of dirs) {
            const escPath = getEscapePath(head.row, head.col, dir);
            if (!escPath.every(p => gridCells[p.row][p.col] === null)) continue;
            let forbidden = new Set(escPath.map(p => `${p.row},${p.col}`));
            
            let firstRow = head.row;
            let firstCol = head.col;
            if (dir === 'UP') firstRow++;
            else if (dir === 'DOWN') firstRow--;
            else if (dir === 'LEFT') firstCol++;
            else if (dir === 'RIGHT') firstCol--;
            
            if (firstRow < 0 || firstRow >= rows || firstCol < 0 || firstCol >= cols) continue;
            if (gridCells[firstRow][firstCol] !== null || forbidden.has(`${firstRow},${firstCol}`)) continue;
            
            let body = [head];
            gridCells[head.row][head.col] = true;
            forbidden.add(`${head.row},${head.col}`);
            
            let next = {row: firstRow, col: firstCol};
            body.push(next);
            gridCells[next.row][next.col] = true;
            forbidden.add(`${next.row},${next.col}`);
            
            let curr = next;
            let currentLength = 2;
            const targetLength = 2 + Math.floor(Math.random() * (MAX_SNAKE_LENGTH - 1));
            
            while (currentLength < targetLength) {
              let neighbors = [];
              const {row, col} = curr;
              if (row > 0) neighbors.push({row: row-1, col: col});
              if (row < rows-1) neighbors.push({row: row+1, col: col});
              if (col > 0) neighbors.push({row: row, col: col-1});
              if (col < cols-1) neighbors.push({row: row, col: col+1});
              
              neighbors = neighbors.filter(n => 
                gridCells[n.row][n.col] === null && !forbidden.has(`${n.row},${n.col}`)
              );
              
              if (neighbors.length === 0) break;
              
              const nxt = neighbors[Math.floor(Math.random() * neighbors.length)];
              body.push(nxt);
              gridCells[nxt.row][nxt.col] = true;
              forbidden.add(`${nxt.row},${nxt.col}`);
              curr = nxt;
              currentLength++;
            }
            
            snakes.push({ body, dir });
            snakePlaced = true;
            break; 
          }
          if (snakePlaced) break;
        }
        if (!snakePlaced) break;
      }

      if (snakes.length > 0) {
        const initialMoves = countInitialMoves(snakes);
        if (initialMoves < minInitialMoves) {
          minInitialMoves = initialMoves;
          bestPuzzle = snakes;
        }
        if (minInitialMoves <= 2) break;
      }
    }
    
    return {
      id: 'casual',
      name: `Casual ${size}x${size}`,
      rows,
      cols,
      difficulty: "casual",
      arrows: bestPuzzle
    };
  }

  /**
   * Save level completion with star aggregation and next-level unlock
   */
  completeLevel(levelNumber, stars) {
    if (!this.levelProgress[levelNumber]) {
      this.levelProgress[levelNumber] = { completed: false, stars: 0 };
    }

    this.levelProgress[levelNumber].completed = true;
    this.levelProgress[levelNumber].stars = Math.max(
      this.levelProgress[levelNumber].stars,
      stars
    );

    if (levelNumber < this.totalLevels) {
      if (!this.levelProgress[levelNumber + 1]) {
        this.levelProgress[levelNumber + 1] = { completed: false, stars: 0, unlocked: true };
      }
    }

    this.saveProgress();
  }

  isLevelUnlocked(levelNumber) {
    if (levelNumber === 1) return true;
    return this.levelProgress[levelNumber]?.unlocked === true;
  }

  getLevelData(levelNumber) {
    return this.levelProgress[levelNumber] || { completed: false, stars: 0, unlocked: false };
  }

  loadProgress() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('arrowsPuzzleProgress');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved progress, resetting');
        }
      }
    }
    return {
      1: { completed: false, stars: 0, unlocked: true }
    };
  }

  /**
   * Debounced save to avoid blocking main thread during rapid events
   */
  saveProgress() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this._doSave();
      this._saveTimeout = null;
    }, 100);
  }

  _doSave() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('arrowsPuzzleProgress', JSON.stringify(this.levelProgress));
    }
  }

  resetProgress() {
    this.levelProgress = {
      1: { completed: false, stars: 0, unlocked: true }
    };
    this._doSave();
  }
}
