const X = 'X';
const O = 'O';
const EMPTY = null;
const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const translations = {
  es: {
    backHub: 'AI Demos', eyebrow: 'Búsqueda adversarial · Minimax',
    subtitle: 'Juega contra un agente óptimo y observa cómo evalúa todos los futuros posibles antes de mover.',
    gameLabel: 'Partida', chooseSide: 'Elige tu lado', newGame: 'Nueva partida', playFirst: 'Juegas primero', aiFirst: 'La IA juega primero',
    gameNote: 'Minimax juega de forma óptima. Si tú también lo haces, la partida terminará en empate.',
    analysisLabel: 'Última decisión', analysisTitle: 'Análisis de Minimax', waiting: 'Esperando', analyzing: 'Analizando', complete: 'Completado',
    availableMoves: 'Movimientos disponibles', positions: 'Posiciones evaluadas', depth: 'Profundidad máxima', time: 'Tiempo de cálculo', selectedMove: 'Movimiento elegido', evaluation: 'Evaluación',
    candidateMoves: 'Movimientos candidatos', aiPerspective: 'desde la perspectiva de la IA', emptyAnalysis: 'Los movimientos aparecerán aquí después de que juegue la IA.',
    howTitle: 'Cómo decide', howCopy: 'Minimax recorre el árbol de juego hasta estados terminales. La IA elige el movimiento que maximiza su resultado suponiendo que su rival también juega de forma óptima.',
    originLabel: 'Origen', originTitle: 'Proyecto de Harvard CS50 AI', originCopy: "Adaptación interactiva del ejercicio Tic-Tac-Toe realizado durante Harvard CS50's Introduction to Artificial Intelligence with Python. La lógica original se implementó en Python; esta demo la reproduce en JavaScript para ejecutarla en el navegador.",
    viewCode: 'Ver código original', backToHub: 'Volver a AI Demos',
    yourTurn: 'Tu turno. Juegas con {side}.', aiThinking: 'La IA está evaluando los futuros posibles.', youWon: 'Has ganado.', aiWon: 'La IA ha ganado.', draw: 'Empate. Ambos habéis jugado de forma óptima.',
    win: 'Victoria', loss: 'Derrota', drawResult: 'Empate', row: 'fila', column: 'columna', cellEmpty: 'vacía', cellMarked: 'marcada con {mark}'
  },
  en: {
    backHub: 'AI Demos', eyebrow: 'Adversarial search · Minimax',
    subtitle: 'Play against an optimal agent and watch it evaluate every possible future before making a move.',
    gameLabel: 'Game', chooseSide: 'Choose your side', newGame: 'New game', playFirst: 'You play first', aiFirst: 'AI plays first',
    gameNote: 'Minimax plays optimally. If you do too, the game will end in a draw.',
    analysisLabel: 'Last decision', analysisTitle: 'Minimax analysis', waiting: 'Waiting', analyzing: 'Analyzing', complete: 'Complete',
    availableMoves: 'Available moves', positions: 'Positions evaluated', depth: 'Maximum depth', time: 'Calculation time', selectedMove: 'Selected move', evaluation: 'Evaluation',
    candidateMoves: 'Candidate moves', aiPerspective: "from the AI's perspective", emptyAnalysis: 'Moves will appear here after the AI plays.',
    howTitle: 'How it decides', howCopy: 'Minimax traverses the game tree to terminal states. The AI chooses the move that maximizes its outcome, assuming its opponent also plays optimally.',
    originLabel: 'Origin', originTitle: 'Harvard CS50 AI project', originCopy: "Interactive adaptation of the Tic-Tac-Toe exercise completed during Harvard CS50's Introduction to Artificial Intelligence with Python. The original logic was implemented in Python; this demo reproduces it in JavaScript to run in the browser.",
    viewCode: 'View original code', backToHub: 'Back to AI Demos',
    yourTurn: 'Your turn. You are playing {side}.', aiThinking: 'The AI is evaluating possible futures.', youWon: 'You won.', aiWon: 'The AI won.', draw: 'Draw. Both players played optimally.',
    win: 'Win', loss: 'Loss', drawResult: 'Draw', row: 'row', column: 'column', cellEmpty: 'empty', cellMarked: 'marked {mark}'
  }
};

let board = Array(9).fill(EMPTY);
let human = X;
let ai = O;
let aiIsThinking = false;
let language = localStorage.getItem('lang')
  || (navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en');
let lastAnalysis = null;
let currentStatus = { key: 'yourTurn', tone: '', replacements: { side: X } };

const cells = [...document.querySelectorAll('[data-cell]')];
const statusElement = document.querySelector('#game-status');
const analysisState = document.querySelector('#analysis-state');
const candidateList = document.querySelector('#candidate-list');
const metrics = {
  moves: document.querySelector('#metric-moves'), positions: document.querySelector('#metric-positions'),
  depth: document.querySelector('#metric-depth'), time: document.querySelector('#metric-time'),
  selected: document.querySelector('#metric-selected'), evaluation: document.querySelector('#metric-evaluation')
};

function t(key, replacements = {}) {
  let value = translations[language][key];
  Object.entries(replacements).forEach(([name, replacement]) => {
    value = value.replace(`{${name}}`, replacement);
  });
  return value;
}

function winner(state) {
  for (const line of winningLines) {
    const [a, b, c] = line;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) return { mark: state[a], line };
  }
  return null;
}

function isTerminal(state) { return Boolean(winner(state)) || state.every(Boolean); }
function availableActions(state) { return state.map((cell, index) => cell ? null : index).filter((index) => index !== null); }
function nextPlayer(state) { return state.filter((cell) => cell === X).length === state.filter((cell) => cell === O).length ? X : O; }

function terminalScore(state, aiMark) {
  const result = winner(state);
  if (!result) return 0;
  return result.mark === aiMark ? 1 : -1;
}

function minimaxValue(state, aiMark, stats, depth) {
  stats.positions += 1;
  stats.maxDepth = Math.max(stats.maxDepth, depth);
  if (isTerminal(state)) return terminalScore(state, aiMark);

  const current = nextPlayer(state);
  const values = availableActions(state).map((action) => {
    const next = [...state];
    next[action] = current;
    return minimaxValue(next, aiMark, stats, depth + 1);
  });
  return current === aiMark ? Math.max(...values) : Math.min(...values);
}

function analyzeMoves(state, aiMark) {
  const started = performance.now();
  const candidates = [];
  let positions = 0;
  let maxDepth = 0;

  for (const action of availableActions(state)) {
    const next = [...state];
    next[action] = aiMark;
    const stats = { positions: 0, maxDepth: 0 };
    const score = minimaxValue(next, aiMark, stats, 1);
    positions += stats.positions;
    maxDepth = Math.max(maxDepth, stats.maxDepth);
    candidates.push({ action, score, positions: stats.positions });
  }

  candidates.sort((a, b) => b.score - a.score || a.action - b.action);
  return { candidates, selected: candidates[0], positions, maxDepth, time: performance.now() - started };
}

function coordinates(index) { return `[${Math.floor(index / 3) + 1}, ${(index % 3) + 1}]`; }
function resultLabel(score) { return score === 1 ? t('win') : score === -1 ? t('loss') : t('drawResult'); }

function setStatus(key, tone = '', replacements = {}) {
  currentStatus = { key, tone, replacements };
  statusElement.textContent = t(key, replacements);
  statusElement.dataset.tone = tone;
}

function renderBoard() {
  const result = winner(board);
  cells.forEach((cell, index) => {
    const mark = board[index];
    cell.textContent = mark || '';
    cell.dataset.mark = mark || '';
    cell.dataset.winning = String(Boolean(result?.line.includes(index)));
    cell.disabled = Boolean(mark) || aiIsThinking || isTerminal(board) || nextPlayer(board) !== human;
    const row = Math.floor(index / 3) + 1;
    const column = (index % 3) + 1;
    const state = mark ? t('cellMarked', { mark }) : t('cellEmpty');
    cell.setAttribute('aria-label', `${t('row')} ${row}, ${t('column')} ${column}, ${state}`);
  });
  metrics.moves.textContent = String(availableActions(board).length);
}

function renderCandidates(analysis) {
  candidateList.replaceChildren();
  analysis.candidates.forEach((candidate) => {
    const row = document.createElement('div');
    row.className = 'candidate-row';
    row.dataset.score = String(candidate.score);
    row.dataset.selected = String(candidate.action === analysis.selected.action);

    const move = document.createElement('span');
    move.className = 'candidate-row__move';
    move.textContent = coordinates(candidate.action);
    const bar = document.createElement('span');
    bar.className = 'candidate-row__bar';
    bar.append(document.createElement('span'));
    const result = document.createElement('span');
    result.className = 'candidate-row__result';
    result.textContent = resultLabel(candidate.score);
    row.append(move, bar, result);
    candidateList.append(row);
  });
}

function updateAnalysis(analysis) {
  lastAnalysis = analysis;
  metrics.positions.textContent = analysis.positions.toLocaleString(language);
  metrics.depth.textContent = String(analysis.maxDepth);
  metrics.time.textContent = `${analysis.time.toFixed(1)} ms`;
  metrics.selected.textContent = coordinates(analysis.selected.action);
  metrics.evaluation.textContent = resultLabel(analysis.selected.score);
  analysisState.textContent = t('complete');
  analysisState.dataset.active = 'false';
  renderCandidates(analysis);
}

function finishOrContinue() {
  const result = winner(board);
  if (result) {
    setStatus(result.mark === human ? 'youWon' : 'aiWon', result.mark === human ? 'won' : 'lost');
    return true;
  }
  if (board.every(Boolean)) {
    setStatus('draw', 'draw');
    return true;
  }
  setStatus('yourTurn', '', { side: human });
  return false;
}

function makeAiMove() {
  if (isTerminal(board) || nextPlayer(board) !== ai) return;
  aiIsThinking = true;
  setStatus('aiThinking', 'thinking');
  analysisState.textContent = t('analyzing');
  analysisState.dataset.active = 'true';
  renderBoard();

  window.setTimeout(() => {
    const analysis = analyzeMoves(board, ai);
    board[analysis.selected.action] = ai;
    aiIsThinking = false;
    updateAnalysis(analysis);
    renderBoard();
    finishOrContinue();
  }, 60);
}

function playHuman(index) {
  if (aiIsThinking || board[index] || isTerminal(board) || nextPlayer(board) !== human) return;
  board[index] = human;
  renderBoard();
  if (!finishOrContinue()) makeAiMove();
}

function resetAnalysis() {
  lastAnalysis = null;
  metrics.positions.textContent = '0';
  metrics.depth.textContent = '0';
  metrics.time.textContent = '—';
  metrics.selected.textContent = '—';
  metrics.evaluation.textContent = '—';
  analysisState.textContent = t('waiting');
  analysisState.dataset.active = 'false';
  candidateList.innerHTML = `<p class="empty-state" data-i18n="emptyAnalysis">${t('emptyAnalysis')}</p>`;
}

function newGame() {
  board = Array(9).fill(EMPTY);
  aiIsThinking = false;
  resetAnalysis();
  renderBoard();
  if (ai === X) makeAiMove(); else setStatus('yourTurn', '', { side: human });
}

function setSide(side) {
  human = side;
  ai = side === X ? O : X;
  document.querySelectorAll('[data-side]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.side === side));
  });
  newGame();
}

function setLanguage(nextLanguage) {
  language = translations[nextLanguage] ? nextLanguage : 'es';
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === language));
  });
  localStorage.setItem('lang', language);
  renderBoard();
  if (lastAnalysis) updateAnalysis(lastAnalysis);
  setStatus(currentStatus.key, currentStatus.tone, currentStatus.replacements);
}

cells.forEach((cell) => cell.addEventListener('click', () => playHuman(Number(cell.dataset.cell))));
document.querySelectorAll('[data-side]').forEach((button) => button.addEventListener('click', () => setSide(button.dataset.side)));
document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
document.querySelector('#new-game').addEventListener('click', newGame);

setLanguage(language);
newGame();
