# 🎮 Tic-Tac-Toe Neo

A modern, responsive, and feature-rich Tic-Tac-Toe web game built with pure **HTML**, **CSS**, and **JavaScript** (no external frameworks or heavy libraries). Features a sleek cyberpunk neon aesthetic, synthesized Web Audio sound effects, celebration confetti, and an unbeatable AI powered by the Minimax algorithm.

---

## ✨ Features

- **🎮 Two Game Modes**:
  - **2 Players (Pass & Play)**: Challenge a friend on the same device.
  - **Vs Computer (AI)**: Test your skills against an intelligent computer opponent.
- **🧠 3 AI Difficulty Levels**:
  - **Easy**: Casual mode; AI picks random empty cells.
  - **Medium**: Balanced; AI blocks threats and seizes immediate winning opportunities.
  - **Unbeatable (Hard)**: Uses the **Minimax algorithm** to calculate optimal moves; it will never lose.
- **🔊 Synthesized Web Audio**:
  - Dynamic audio feedback for player moves, wins, ties, and button clicks generated natively via the **Web Audio API** (zero external MP3/WAV files required).
  - Sound on/off toggle button with state persistence.
- **🎉 Interactive Visuals**:
  - Cyberpunk-inspired dark theme with neon cyan & magenta glows.
  - Custom canvas confetti celebration on win.
  - Dynamic winning strike line indicating winning 3-in-a-row rows, columns, or diagonals.
  - Active turn highlights and pop-in animations.
- **💾 Score Tracking & Persistence**:
  - Tracks Player X wins, Player O/Computer wins, and Ties.
  - Scores and settings (sound, mode, difficulty) persist across browser refreshes via `localStorage`.
- **📱 Fully Responsive**:
  - Optimized for desktops, tablets, and smartphones.

---

## 📁 Project Structure

```text
Tic-Tac-Toe/
│
├── index.html     # Semantic HTML5 layout and game structure
├── style.css      # Custom styling, dark mode theme, animations & responsiveness
├── script.js      # Game logic, Minimax AI, audio synthesis, and confetti engine
└── README.md      # Project overview and documentation
```

---

## 🚀 How to Run the Game

No installations, build steps, or package managers are required!

### Option 1: Direct Browser Launch (Simplest)
1. Navigate to the project folder (`Tic-Tac-Toe`).
2. Double-click the `index.html` file to open it in your default web browser (Chrome, Edge, Firefox, Safari, etc.).

### Option 2: Using VS Code Live Server
1. Open the folder in **Visual Studio Code**.
2. Right-click `index.html` and click **"Open with Live Server"**.

### Option 3: Using a Local HTTP Server (Python / Node)
- **Using Python 3**:
  ```bash
  python -m http.server 8000
  ```
  Then visit `http://localhost:8000` in your browser.

- **Using Node `npx serve`**:
  ```bash
  npx serve .
  ```

---

## 🕹️ How to Play

1. **Select a Game Mode**:
   - Click **2 Players** for local turn-based play.
   - Click **Vs Computer** to play against the AI, and choose your preferred difficulty (**Easy**, **Medium**, or **Unbeatable**).
2. **Take Turns**:
   - Player **X** always goes first.
   - Click on any empty cell on the 3×3 grid to place your mark.
3. **Win Condition**:
   - The first player to align 3 of their marks horizontally, vertically, or diagonally wins the round.
   - If all 9 cells are filled and neither player has 3 in a row, the round ends in a **Tie**.
4. **Controls**:
   - Click **New Round** to clear the board and start a new match.
   - Click **Reset Scores** to set all win/tie counts back to zero.
   - Click the **Speaker icon** in the top right to mute/unmute game sounds.

---

## 🛠️ Built With

- **HTML5**: Semantic tags, ARIA accessibility attributes, canvas rendering element.
- **Vanilla CSS3**: CSS Custom Properties (variables), CSS Grid & Flexbox, Glassmorphism backdrop filters, keyframe animations, and media queries.
- **Vanilla JavaScript (ES6+)**:
  - Object-oriented state management.
  - Minimax backtracking algorithm for AI decision trees.
  - Native Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`) for procedural sound synthesis.
  - HTML5 Canvas particle physics for confetti.
  - Browser `localStorage` API for state persistence.
