/**
 * TIC-TAC-TOE NEO - GAME ENGINE & CONTROLLER
 * Fully featured vanilla JavaScript implementation with:
 * - 2-Player (PvP) & Vs Computer (AI) modes
 * - Unbeatable Minimax AI with multiple difficulty levels
 * - Web Audio API synthesized sound effects (zero external files required)
 * - Pure Canvas Confetti celebration system
 * - Winning strike line animation
 * - LocalStorage persistence for scores and settings
 */

(() => {
  'use strict';

  // ==========================================
  // 1. CONFIGURATION & CONSTANTS
  // ==========================================
  const WINNING_COMBINATIONS = [
    // Rows
    { combo: [0, 1, 2], type: 'row', index: 0 },
    { combo: [3, 4, 5], type: 'row', index: 1 },
    { combo: [6, 7, 8], type: 'row', index: 2 },
    // Columns
    { combo: [0, 3, 6], type: 'col', index: 0 },
    { combo: [1, 4, 7], type: 'col', index: 1 },
    { combo: [2, 5, 8], type: 'col', index: 2 },
    // Diagonals
    { combo: [0, 4, 8], type: 'diag', index: 0 },
    { combo: [2, 4, 6], type: 'diag', index: 1 }
  ];

  const STORAGE_KEY_SCORES = 'tictactoe_neo_scores';
  const STORAGE_KEY_SOUND = 'tictactoe_neo_sound';
  const STORAGE_KEY_MODE = 'tictactoe_neo_mode';
  const STORAGE_KEY_DIFF = 'tictactoe_neo_diff';

  // ==========================================
  // 2. STATE MANAGEMENT
  // ==========================================
  let board = Array(9).fill('');
  let currentPlayer = 'X';
  let gameActive = true;
  let isAiThinking = false;
  let gameMode = localStorage.getItem(STORAGE_KEY_MODE) || 'pvp'; // 'pvp' | 'ai'
  let aiDifficulty = localStorage.getItem(STORAGE_KEY_DIFF) || 'hard'; // 'easy' | 'medium' | 'hard'
  let soundEnabled = localStorage.getItem(STORAGE_KEY_SOUND) !== 'false';

  let scores = {
    x: 0,
    o: 0,
    ties: 0
  };

  // Load saved scores if available
  try {
    const savedScores = JSON.parse(localStorage.getItem(STORAGE_KEY_SCORES));
    if (savedScores && typeof savedScores.x === 'number') {
      scores = savedScores;
    }
  } catch (e) {
    console.warn('Unable to load saved scores:', e);
  }

  // ==========================================
  // 3. DOM ELEMENTS
  // ==========================================
  const cells = document.querySelectorAll('.cell');
  const boardEl = document.getElementById('board');
  const strikeLineEl = document.getElementById('strike-line');

  const turnBanner = document.getElementById('turn-banner');
  const turnDot = document.getElementById('turn-dot');
  const turnText = document.getElementById('turn-text');

  const scoreXEl = document.getElementById('score-x');
  const scoreOEl = document.getElementById('score-o');
  const scoreTiesEl = document.getElementById('score-ties');
  const scoreCardX = document.getElementById('score-card-x');
  const scoreCardO = document.getElementById('score-card-o');
  const namePlayerO = document.getElementById('name-player-o');

  const modePvpBtn = document.getElementById('mode-pvp');
  const modeAiBtn = document.getElementById('mode-ai');
  const aiDifficultyContainer = document.getElementById('ai-difficulty-container');
  const diffPills = document.querySelectorAll('.diff-pill');

  const soundBtn = document.getElementById('sound-btn');
  const soundOnIcon = document.getElementById('sound-on-icon');
  const soundOffIcon = document.getElementById('sound-off-icon');

  const resetBoardBtn = document.getElementById('reset-board-btn');
  const resetScoresBtn = document.getElementById('reset-scores-btn');

  const resultModal = document.getElementById('result-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalIconBadge = document.getElementById('modal-icon-badge');
  const modalPlayAgainBtn = document.getElementById('modal-play-again-btn');

  const confettiCanvas = document.getElementById('confetti-canvas');
  const confettiCtx = confettiCanvas.getContext('2d');

  // ==========================================
  // 4. WEB AUDIO SYNTHESIZER (No external assets)
  // ==========================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.12, gainValue = 0.15) {
    if (!soundEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(gainValue, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  function playMoveSound(player) {
    if (!soundEnabled) return;
    if (player === 'X') {
      // Crisp high melodic pop for X
      playTone(587.33, 'triangle', 0.09, 0.2); // D5
    } else {
      // Warm resonant note for O
      playTone(440.00, 'sine', 0.12, 0.2); // A4
    }
  }

  function playWinSound() {
    if (!soundEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playTone(freq, 'triangle', 0.25, 0.22);
        }, idx * 110);
      });
    } catch (e) {}
  }

  function playTieSound() {
    if (!soundEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      playTone(330, 'sawtooth', 0.2, 0.08);
      setTimeout(() => playTone(293.66, 'sawtooth', 0.35, 0.08), 120);
    } catch (e) {}
  }

  function playClickSound() {
    playTone(800, 'sine', 0.05, 0.05);
  }

  // ==========================================
  // 5. CONFETTI CELEBRATION SYSTEM
  // ==========================================
  let confettiParticles = [];
  let confettiAnimId = null;

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  function triggerConfetti() {
    confettiParticles = [];
    const colors = ['#00f2fe', '#4facfe', '#f72585', '#ff4e50', '#ffd166', '#ffffff'];
    const particleCount = 110;

    for (let i = 0; i < particleCount; i++) {
      confettiParticles.push({
        x: confettiCanvas.width / 2 + (Math.random() * 80 - 40),
        y: confettiCanvas.height / 2 + (Math.random() * 80 - 40),
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18 - 4,
        gravity: 0.35,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (!confettiAnimId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRot;
      p.opacity -= 0.007;

      if (p.opacity <= 0) {
        confettiParticles.splice(i, 1);
        continue;
      }

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      confettiCtx.globalAlpha = Math.max(0, p.opacity);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      confettiCtx.restore();
    }

    if (confettiParticles.length > 0) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
  }

  // ==========================================
  // 6. GAME LOGIC & TURN MANAGEMENT
  // ==========================================
  function handleCellClick(e) {
    initAudioContext();
    const cell = e.currentTarget;
    const index = parseInt(cell.dataset.index, 10);

    // If cell is already taken, game over, or AI is thinking, ignore click
    if (board[index] !== '' || !gameActive || isAiThinking) {
      return;
    }

    makeMove(index, currentPlayer);

    // If game active and it's AI mode, trigger AI move
    if (gameActive && gameMode === 'ai' && currentPlayer === 'O') {
      isAiThinking = true;
      updateTurnBanner();
      
      // Add dynamic delay so AI feels realistic
      const delay = aiDifficulty === 'easy' ? 300 : (aiDifficulty === 'medium' ? 450 : 500);
      setTimeout(() => {
        if (!gameActive) {
          isAiThinking = false;
          return;
        }
        const aiMove = getAiMove();
        if (aiMove !== null) {
          makeMove(aiMove, 'O');
        }
        isAiThinking = false;
        updateTurnBanner();
      }, delay);
    }
  }

  function makeMove(index, player) {
    board[index] = player;
    
    // Update cell DOM
    const cell = cells[index];
    cell.textContent = player === 'X' ? '✕' : '◯';
    cell.classList.add('filled', player === 'X' ? 'cell-x' : 'cell-o');
    cell.setAttribute('aria-label', `Cell ${index + 1}: ${player}`);

    playMoveSound(player);

    const winResult = checkWin(board);

    if (winResult) {
      handleGameOver('win', winResult);
    } else if (isBoardFull(board)) {
      handleGameOver('tie');
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateTurnBanner();
    }
  }

  function checkWin(currentBoard) {
    for (const winCombo of WINNING_COMBINATIONS) {
      const [a, b, c] = winCombo.combo;
      if (
        currentBoard[a] !== '' &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return {
          winner: currentBoard[a],
          combination: winCombo
        };
      }
    }
    return null;
  }

  function isBoardFull(currentBoard) {
    return currentBoard.every(cell => cell !== '');
  }

  function handleGameOver(result, winInfo = null) {
    gameActive = false;

    if (result === 'win') {
      const winner = winInfo.winner;
      scores[winner.toLowerCase()]++;
      saveScores();
      updateScoreboardUI();

      // Highlight winning cells
      winInfo.combination.combo.forEach(idx => {
        cells[idx].classList.add('winning-cell');
      });

      // Draw winning strike line
      drawStrikeLine(winInfo.combination);

      // Audio & Confetti
      playWinSound();
      triggerConfetti();

      // Formulate victory message
      let title = '';
      let subtitle = '';
      let badge = '🏆';

      if (gameMode === 'ai') {
        if (winner === 'X') {
          title = 'VICTORY!';
          subtitle = 'You outsmarted the computer! Well played.';
          badge = '👑';
        } else {
          title = 'AI PREVAILED!';
          subtitle = 'The machine claimed this round. Try again!';
          badge = '🤖';
        }
      } else {
        title = `PLAYER ${winner} WINS!`;
        subtitle = `Spectacular victory for ${winner}!`;
        badge = '🎉';
      }

      showResultModal(title, subtitle, badge);
    } else {
      // Tie
      scores.ties++;
      saveScores();
      updateScoreboardUI();
      playTieSound();

      showResultModal("IT'S A DRAW!", "Equally matched tactical minds. No winner this time.", "🤝");
    }
  }

  function drawStrikeLine(winCombo) {
    const { type, index } = winCombo;
    strikeLineEl.className = 'strike-line'; // Reset

    const boardRect = boardEl.getBoundingClientRect();
    const cellSize = boardRect.width / 3;
    const thickness = 6;

    if (type === 'row') {
      const topPos = index * cellSize + cellSize / 2;
      strikeLineEl.style.width = '90%';
      strikeLineEl.style.height = `${thickness}px`;
      strikeLineEl.style.top = `${topPos}px`;
      strikeLineEl.style.left = '5%';
      strikeLineEl.style.transform = 'none';
    } else if (type === 'col') {
      const leftPos = index * cellSize + cellSize / 2;
      strikeLineEl.style.height = '90%';
      strikeLineEl.style.width = `${thickness}px`;
      strikeLineEl.style.top = '5%';
      strikeLineEl.style.left = `${leftPos}px`;
      strikeLineEl.style.transform = 'none';
    } else if (type === 'diag') {
      const diagonalLength = Math.hypot(boardRect.width, boardRect.height) * 0.9;
      strikeLineEl.style.width = `${diagonalLength}px`;
      strikeLineEl.style.height = `${thickness}px`;
      strikeLineEl.style.top = '50%';
      strikeLineEl.style.left = '50%';
      
      const angle = index === 0 ? 45 : -45;
      strikeLineEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }

    strikeLineEl.classList.remove('hidden');
  }

  function resetRound() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    isAiThinking = false;

    // Reset UI cells
    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
    });

    // Hide strike line
    strikeLineEl.className = 'strike-line hidden';
    strikeLineEl.removeAttribute('style');

    // Close modal
    resultModal.classList.add('hidden');

    updateTurnBanner();
  }

  function resetScores() {
    scores = { x: 0, o: 0, ties: 0 };
    saveScores();
    updateScoreboardUI();
    playClickSound();
  }

  function saveScores() {
    try {
      localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scores));
    } catch (e) {}
  }

  // ==========================================
  // 7. AI ENGINE (Minimax & Difficulties)
  // ==========================================
  function getAiMove() {
    const emptyIndices = getEmptyIndices(board);
    if (emptyIndices.length === 0) return null;

    if (aiDifficulty === 'easy') {
      // Pick a random spot
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    if (aiDifficulty === 'medium') {
      // 1. Can AI win immediately?
      for (const idx of emptyIndices) {
        board[idx] = 'O';
        if (checkWin(board)) {
          board[idx] = '';
          return idx;
        }
        board[idx] = '';
      }

      // 2. Can player X win immediately? Block them!
      for (const idx of emptyIndices) {
        board[idx] = 'X';
        if (checkWin(board)) {
          board[idx] = '';
          return idx;
        }
        board[idx] = '';
      }

      // 3. Otherwise 50% minimax, 50% random
      if (Math.random() > 0.4) {
        return minimax(board, 'O', 0).index;
      } else {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    }

    // Hard / Unbeatable Mode: Full Minimax
    return minimax(board, 'O', 0).index;
  }

  function getEmptyIndices(currentBoard) {
    const indices = [];
    currentBoard.forEach((val, idx) => {
      if (val === '') indices.push(idx);
    });
    return indices;
  }

  /**
   * Minimax Recursive Algorithm
   * Maximizes 'O' score, minimizes 'X' score
   */
  function minimax(currentBoard, player, depth) {
    const availableMoves = getEmptyIndices(currentBoard);
    const winResult = checkWin(currentBoard);

    if (winResult) {
      if (winResult.winner === 'O') {
        return { score: 10 - depth };
      } else if (winResult.winner === 'X') {
        return { score: depth - 10 };
      }
    } else if (availableMoves.length === 0) {
      return { score: 0 };
    }

    const moves = [];

    for (let i = 0; i < availableMoves.length; i++) {
      const move = {};
      move.index = availableMoves[i];

      currentBoard[availableMoves[i]] = player;

      if (player === 'O') {
        const result = minimax(currentBoard, 'X', depth + 1);
        move.score = result.score;
      } else {
        const result = minimax(currentBoard, 'O', depth + 1);
        move.score = result.score;
      }

      currentBoard[availableMoves[i]] = ''; // Backtrack
      moves.push(move);
    }

    let bestMove = null;

    if (player === 'O') {
      let bestScore = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = moves[i];
        }
      }
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = moves[i];
        }
      }
    }

    return bestMove;
  }

  // ==========================================
  // 8. UI HELPERS & UPDATES
  // ==========================================
  function updateTurnBanner() {
    if (!gameActive) return;

    if (isAiThinking) {
      turnDot.className = 'turn-dot turn-o';
      turnText.innerHTML = '<span class="mark-o">AI</span> is calculating...';
      scoreCardX.classList.remove('active-turn');
      scoreCardO.classList.add('active-turn');
      return;
    }

    if (currentPlayer === 'X') {
      turnDot.className = 'turn-dot';
      turnText.innerHTML = '<strong class="mark-x">Player X</strong>\'s Turn';
      scoreCardX.classList.add('active-turn');
      scoreCardO.classList.remove('active-turn');
    } else {
      turnDot.className = 'turn-dot turn-o';
      const oName = gameMode === 'ai' ? 'Computer (O)' : 'Player O';
      turnText.innerHTML = `<strong class="mark-o">${oName}</strong>'s Turn`;
      scoreCardX.classList.remove('active-turn');
      scoreCardO.classList.add('active-turn');
    }
  }

  function updateScoreboardUI() {
    scoreXEl.textContent = scores.x;
    scoreOEl.textContent = scores.o;
    scoreTiesEl.textContent = scores.ties;
  }

  function setGameMode(mode) {
    if (gameMode === mode) return;
    gameMode = mode;
    localStorage.setItem(STORAGE_KEY_MODE, mode);

    if (mode === 'pvp') {
      modePvpBtn.classList.add('active');
      modePvpBtn.setAttribute('aria-checked', 'true');
      modeAiBtn.classList.remove('active');
      modeAiBtn.setAttribute('aria-checked', 'false');
      aiDifficultyContainer.classList.add('hidden');
      namePlayerO.textContent = 'PLAYER O';
    } else {
      modeAiBtn.classList.add('active');
      modeAiBtn.setAttribute('aria-checked', 'true');
      modePvpBtn.classList.remove('active');
      modePvpBtn.setAttribute('aria-checked', 'false');
      aiDifficultyContainer.classList.remove('hidden');
      namePlayerO.textContent = 'COMPUTER';
    }

    playClickSound();
    resetRound();
  }

  function setAiDifficulty(diff) {
    aiDifficulty = diff;
    localStorage.setItem(STORAGE_KEY_DIFF, diff);

    diffPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.diff === diff);
    });

    playClickSound();
    resetRound();
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(STORAGE_KEY_SOUND, soundEnabled.toString());
    updateSoundUI();
    if (soundEnabled) {
      playTone(600, 'sine', 0.08, 0.1);
    }
  }

  function updateSoundUI() {
    if (soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
      soundBtn.setAttribute('title', 'Sound: Enabled');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
      soundBtn.setAttribute('title', 'Sound: Muted');
    }
  }

  function showResultModal(title, subtitle, badge) {
    modalTitle.textContent = title;
    modalSubtitle.textContent = subtitle;
    modalIconBadge.textContent = badge;

    // Slight delay so player sees the board strike line first
    setTimeout(() => {
      resultModal.classList.remove('hidden');
    }, 450);
  }

  // ==========================================
  // 9. EVENT LISTENERS & INITIALIZATION
  // ==========================================
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });

  resetBoardBtn.addEventListener('click', () => {
    playClickSound();
    resetRound();
  });

  resetScoresBtn.addEventListener('click', resetScores);

  modalPlayAgainBtn.addEventListener('click', () => {
    playClickSound();
    resetRound();
  });

  modePvpBtn.addEventListener('click', () => setGameMode('pvp'));
  modeAiBtn.addEventListener('click', () => setGameMode('ai'));

  diffPills.forEach(pill => {
    pill.addEventListener('click', () => setAiDifficulty(pill.dataset.diff));
  });

  soundBtn.addEventListener('click', toggleSound);

  // Initialize UI based on saved state
  function init() {
    updateSoundUI();
    updateScoreboardUI();

    if (gameMode === 'ai') {
      modeAiBtn.classList.add('active');
      modePvpBtn.classList.remove('active');
      aiDifficultyContainer.classList.remove('hidden');
      namePlayerO.textContent = 'COMPUTER';
    } else {
      modePvpBtn.classList.add('active');
      modeAiBtn.classList.remove('active');
      aiDifficultyContainer.classList.add('hidden');
      namePlayerO.textContent = 'PLAYER O';
    }

    diffPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.diff === aiDifficulty);
    });

    updateTurnBanner();
  }

  init();
})();
