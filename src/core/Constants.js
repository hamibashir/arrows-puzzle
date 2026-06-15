export const CONSTANTS = {
  // Game config
  FPS: 60,
  CANVAS_BG: '#FFFFFF',

  // Colors
  GRID_LINE: 'transparent',
  ARROW_BLOCKED: '#000000',
  ARROW_FREE: '#000000',
  ARROW_SELECTED: '#000000',
  SUCCESS_GREEN: '#27AE60',

  // Arrow directions
  DIRECTIONS: {
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
  },

  // Grid
  MIN_CELL_SIZE: 40,
  MAX_CELL_SIZE: 9999, // Removed clamp
  GRID_PADDING: 10,
  ARROW_PADDING: 2,
  ARROW_LINE_WIDTH: 6,

  // Tiles
  TILE_FREE: '#E74C3C',
  TILE_BLOCKED: '#34495E',
  TILE_RADIUS: 8,

  // Gameplay
  MAX_HINTS: 5,
  MAX_UNDO: 10,

  // Animation durations (ms)
  ANIM_ARROW_SLIDE: 300,
  ANIM_ARROW_SHAKE: 400,
  ANIM_ARROW_PULSE: 1200,
  ANIM_WIN: 800,
  ANIM_BUTTON_TAP: 150,

  // Screen IDs
  SCREENS: {
    SPLASH: 'splash',
    HOME: 'home',
    LEVEL_SELECT: 'levelSelect',
    GAME: 'game',
    SETTINGS: 'settings',
    CASUAL_SETUP: 'casualSetup'
  }
};
