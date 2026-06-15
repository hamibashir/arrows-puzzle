# 🏹 Arrows Puzzle

![Game Preview](https://img.shields.io/badge/Game-Puzzle-blue?style=for-the-badge&logo=html5)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-green?style=for-the-badge)

Welcome to **Arrows Puzzle**, a minimalist and highly addictive puzzle game built with HTML5 Canvas, Vite, and Capacitor. Test your logic and spatial reasoning by carefully removing arrows from the grid!

## ✨ Features

- **Intuitive Gameplay:** Simply tap to remove arrows, but be careful—arrows can only be removed if their path is clear!
- **Endless Fun:** Enjoy handcrafted levels in Level Mode or generate endless puzzles in Casual Mode.
- **Smooth Animations:** Built with a custom Canvas rendering engine for buttery-smooth 60fps animations.
- **Cross-Platform:** Ready for Web, iOS, and Android thanks to [Capacitor](https://capacitorjs.com/).
- **Hints & Undo:** Stuck? Use hints to find your next move or undo your mistakes.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hamibashir/arrows-puzzle.git
   cd arrows-puzzle
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📱 Mobile Build (Capacitor)

This project uses Capacitor to package the web app into native mobile applications.

```bash
# Sync web assets to native projects
npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios
```

## 🛠️ Technology Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3
- **Build Tool:** Vite
- **Mobile Packaging:** Capacitor

## 🎮 How to Play

- **Objective:** Clear the entire grid of arrows.
- **Mechanic:** Tap an arrow pointing outwards with no other arrows blocking its path to remove it.
- **Progression:** Complete levels to earn stars or try the Casual mode for a custom grid size.

---
*Created with ❤️ by hamibashir.*
