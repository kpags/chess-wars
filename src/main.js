import {
  BOARD_SIZE,
  PIECE_STATS,
  TEAM,
  createInitialPieces,
  describePiece,
  getLegalMoves,
  getPieceAt,
  getPieceById,
  otherTeam
} from "./rules.js";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const els = {
  modeAi: document.querySelector("#mode-ai"),
  modeLocal: document.querySelector("#mode-local"),
  newGame: document.querySelector("#new-game"),
  createRoom: document.querySelector("#create-room"),
  joinRoom: document.querySelector("#join-room"),
  roomCode: document.querySelector("#room-code"),
  onlineStatus: document.querySelector("#online-status"),
  onlineDetail: document.querySelector("#online-detail"),
  onlineLink: document.querySelector("#online-link"),
  turnLabel: document.querySelector("#turn-label"),
  status: document.querySelector("#status-message"),
  selectionLabel: document.querySelector("#selection-label"),
  selectionDetail: document.querySelector("#selection-detail"),
  powerupCard: document.querySelector("#powerup-card"),
  powerupLabel: document.querySelector("#powerup-label"),
  powerupDetail: document.querySelector("#powerup-detail"),
  powerupOptions: document.querySelector("#powerup-options"),
  victoryCard: document.querySelector("#victory-card"),
  victoryLabel: document.querySelector("#victory-label"),
  victoryDetail: document.querySelector("#victory-detail"),
  showoffPanel: document.querySelector("#showoff-panel"),
  showoffTitle: document.querySelector("#showoff-title"),
  duelLeftName: document.querySelector("#duel-left-name"),
  duelRightName: document.querySelector("#duel-right-name"),
  duelLeftWeapon: document.querySelector("#duel-left-weapon"),
  duelRightWeapon: document.querySelector("#duel-right-weapon"),
  duelLeftHp: document.querySelector("#duel-left-hp"),
  duelRightHp: document.querySelector("#duel-right-hp"),
  duelLeftManaText: document.querySelector("#duel-left-mana-text"),
  duelRightManaText: document.querySelector("#duel-right-mana-text"),
  duelLeftMana: document.querySelector("#duel-left-mana"),
  duelRightMana: document.querySelector("#duel-right-mana"),
  battleLog: document.querySelector("#battle-log"),
  battleLogCard: document.querySelector("#battle-log-card"),
  touchControls: document.querySelector("#showoff-touch")
};

const PLAYER_CONTROLS = {
  p1: {
    up: ["w", "W", "KeyW"],
    down: ["s", "S", "KeyS"],
    left: ["a", "A", "KeyA"],
    right: ["d", "D", "KeyD"],
    attack: ["e", "E", "KeyE"],
    block: ["r", "R", "KeyR"],
    jump: [" ", "Space", "Spacebar"],
    ultimate: ["c", "C", "KeyC"]
  },
  p2: {
    up: ["ArrowUp"],
    down: ["ArrowDown"],
    left: ["ArrowLeft"],
    right: ["ArrowRight"],
    attack: ["?", "/", "Slash"],
    block: [".", "Period"],
    jump: [" ", "Space", "Spacebar"],
    ultimate: ["<", ",", "Comma"]
  }
};

const BOARD_THEME = {
  light: "#f3d79c",
  dark: "#9b542c",
  frame: "#6d351d",
  frameDark: "#3a1f16",
  frameLight: "#a96736",
  white: "#e8bd72",
  black: "#5a321e",
  whiteEdge: "#fff2c6",
  blackEdge: "#2b1710",
  move: "rgba(54, 128, 103, 0.62)",
  capture: "rgba(214, 77, 67, 0.76)"
};

const ARENA = {
  width: 960,
  height: 960,
  floorY: 680,
  minX: 130,
  maxX: 830,
  minY: 420,
  maxY: 690,
  speed: 265,
  blockSpeed: 120,
  attackRange: 128,
  attackCooldown: 0.55,
  attackDuration: 0.3,
  blockReduction: 0.35,
  aiReaction: 0.16,
  aiAttackDistance: 108
};

const SHOWDOWN_ROUND_SECONDS = 60;
const SHOWDOWN_INTRO_SECONDS = 3;
const ROUND_RESULT_SECONDS = 1.45;
const SHOWDOWN_ROUNDS_TO_WIN = 2;
const MAX_MANA = 100;
const SMASH_DAMAGE_BONUS = 0.5;
const DASH_MULTIPLIER = 1.75;
const ULTIMATE_ATTACK_RANGE = ARENA.attackRange;
const STAMPEDE_DURATION = 3;
const STAMPEDE_SPEED_MULTIPLIER = 2;
const STAMPEDE_DAMAGE = 12;
const STAMPEDE_HIT_COOLDOWN = 0.18;
const STAMPEDE_DASH_INTERVAL = 0.07;
const STAMPEDE_DASH_DISTANCE = 96;
const STAMPEDE_TRAIL_SECONDS = 0.1;
const PASSIVE_TRIGGER_CHANCE = 0.25;
const PASSIVE_FLASH_SECONDS = 1.35;
const PASSIVE_PLUS_DAMAGE = 3;
const PASSIVE_PLUS_DAMAGE_SECONDS = 3;
const PASSIVE_STUN_SECONDS = 1.5;
const PASSIVE_SPEED_MULTIPLIER = 1.5;
const PASSIVE_SPEED_SECONDS = 3;
const PASSIVE_LIFE_STEAL = 15;
const PASSIVE_INTIMIDATE_SECONDS = 2;
const PASSIVE_INTIMIDATE_COOLDOWN_MULTIPLIER = 2;
const PASSIVE_DOMINANCE_SECONDS = 5;
const PASSIVE_DOMINANCE_DAMAGE = 10;
const PASSIVE_DOMINANCE_REDUCTION = 5;
const PASSIVE_SKILLS = {
  pawn: { name: "Plus Damage", color: "#ffd166" },
  rook: { name: "Stun", color: "#9bd7ff" },
  horse: { name: "Speed", color: "#68c284" },
  bishop: { name: "Life Steal", color: "#d98cff" },
  queen: { name: "Intimidate", color: "#ff8f70" },
  king: { name: "Dominance", color: "#f7efe0" }
};
const SHOWDOWN_SPRITE_WIDTH = 460;
const SHOWDOWN_SPRITE_HEIGHT = 320;
const SHOWDOWN_SPRITE_BODY_Y = 246;
const SHOWDOWN_SPRITE_FLOOR_Y = 284;
const ULTIMATE_KEYS = ["e", "E", "KeyE"];
const ULTIMATES = {
  pawn: { name: "Heavy Fist", detail: "25 damage" },
  rook: { name: "Fortify", detail: "50% damage reduction for 5s" },
  horse: { name: "Stampede", detail: "200% speed for 3s, 12 damage on each pass" },
  bishop: { name: "Blessing", detail: "Restore 30% HP" },
  queen: { name: "Barrage", detail: "5 hits at 10 damage" },
  king: { name: "Hard Swing", detail: "80 damage and 3s stun" }
};

const POWERUPS_ENABLED = false;
const SMALL_SCREEN_QUERY = "(max-width: 720px), (pointer: coarse)";
const smallScreenModeQuery = window.matchMedia(SMALL_SCREEN_QUERY);

const POWERUP_TURN_RANGE = {
  min: 4,
  max: 8
};

const POWERUPS = [
  { type: "dance", name: "Dance", icon: "D", rate: 30, color: "#8bd7ff", description: "Move in any direction on that piece's next turn." },
  { type: "heal", name: "Heal", icon: "H", rate: 25, color: "#7df0a1", description: "Heal the receiving piece by 50 HP." },
  { type: "revive", name: "Revive", icon: "R", rate: 15, color: "#68c284", description: "Return one destroyed piece to the board at full HP." },
  { type: "restrict", name: "Restrict", icon: "!", rate: 10, color: "#b39cff", description: "The other player skips their next 2 turns." },
  { type: "strength", name: "Strength", icon: "+", rate: 15, color: "#ffd166", description: "Boost this piece's HP and damage by 10% for one Showdown." },
  { type: "smash", name: "Smash", icon: "S", rate: 3, color: "#ff8a65", description: "Empower only the receiving piece for its next Showdown." },
  { type: "extinct", name: "Extinct", icon: "X", rate: 2, color: "#ff4d6d", description: "Destroy the opponent's army and win immediately." }
];

const ONLINE_POLL_INTERVAL = 0.08;
const ONLINE_SNAPSHOT_INTERVAL = 0.12;
const REMOTE_SHOWDOWN_LERP = 18;
const ANNOUNCEMENT_SECONDS = 1;
const spriteCache = new Map();
const online = {
  clientId: getClientId(),
  roomId: null,
  role: "offline",
  connected: false,
  lastEventId: 0,
  pollTimer: 0,
  pollInFlight: false,
  stream: null,
  streamConnected: false,
  snapshotTimer: 0,
  remoteInput: { x: 0, y: 0, attack: false, block: false, jump: false, ultimate: false },
  lastSentInput: "",
  pendingSnapshotEvent: null,
  pendingSnapshotFrame: 0,
  showdownTargets: new Map()
};

const state = {
  mode: "ai",
  phase: "board",
  pieces: createInitialPieces(),
  selectedId: null,
  legalMoves: [],
  currentTeam: TEAM.WHITE,
  message: "Select a white piece to begin.",
  log: ["White opens the board."],
  winner: null,
  victoryReason: "",
  showoff: null,
  graveyard: [],
  powerup: null,
  powerupTurnsRemaining: getInitialPowerupTurns(),
  skipPowerupAdvance: false,
  nextPowerupId: 1,
  pendingChoice: null,
  pendingPowerupMove: null,
  restrictTurns: {
    [TEAM.WHITE]: 0,
    [TEAM.BLACK]: 0
  },
  keys: new Set(),
  touch: new Set(),
  touchPointers: new Map(),
  mouse: {
    attack: false,
    block: false
  },
  lastTime: 0,
  aiTimer: null,
  shake: 0,
  floatingText: [],
  combatBanner: null,
  announcement: null
};

function boot() {
  bindEvents();
  syncResponsiveMode();
  syncOnlineHud();
  joinRoomFromUrl();
  syncHud();
  requestAnimationFrame(loop);
}

function bindEvents() {
  canvas.addEventListener("click", onCanvasClick);
  canvas.addEventListener("pointerdown", onCanvasPointerDown);
  canvas.addEventListener("pointerup", onCanvasPointerUp);
  canvas.addEventListener("pointerleave", onCanvasPointerUp);
  canvas.addEventListener("contextmenu", (event) => {
    if (state.phase === "showoff") {
      event.preventDefault();
    }
  });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearCombatInput);
  window.addEventListener("pointerup", clearTouchInput);
  window.addEventListener("pointercancel", clearTouchInput);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearCombatInput();
    }
  });
  els.modeAi.addEventListener("click", () => setMode("ai"));
  els.modeLocal.addEventListener("click", () => {
    if (isSmallScreenMode()) {
      state.message = "Local 2P is disabled on smaller screens.";
      syncResponsiveMode();
      syncHud();
      return;
    }
    setMode("local");
  });
  els.newGame.addEventListener("click", () => {
    if (isOnlineGuest()) {
      sendOnlineEvent("reset-request", {});
      state.message = "Reset request sent to the room host.";
      syncHud();
      return;
    }
    resetGame();
  });
  els.createRoom.addEventListener("click", createOnlineRoom);
  els.joinRoom.addEventListener("click", joinTypedRoom);
  els.powerupOptions.addEventListener("click", onPowerupChoiceClick);
  ensureCombatStateForPieces();
  if (smallScreenModeQuery.addEventListener) {
    smallScreenModeQuery.addEventListener("change", syncResponsiveMode);
  } else {
    smallScreenModeQuery.addListener(syncResponsiveMode);
  }

  document.querySelectorAll("[data-touch]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      setTouchPointer(event.pointerId, button.dataset.touch);
      sendOnlineInputState();
    });
    button.addEventListener("pointerup", (event) => {
      if (button.hasPointerCapture?.(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
      clearTouchPointer(event.pointerId);
      sendOnlineInputState();
    });
    button.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && event.buttons === 0) {
        clearTouchPointer(event.pointerId);
        sendOnlineInputState();
      }
    });
    button.addEventListener("pointercancel", (event) => {
      if (button.hasPointerCapture?.(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
      clearTouchPointer(event.pointerId);
      sendOnlineInputState();
    });
  });
}

function setMode(mode) {
  if (mode === "local" && isSmallScreenMode()) {
    state.message = "Local 2P is disabled on smaller screens.";
    syncResponsiveMode();
    syncHud();
    return;
  }
  if (mode !== "online") {
    leaveOnlineRoom();
  }
  state.mode = mode;
  els.modeAi.classList.toggle("is-active", mode === "ai");
  els.modeLocal.classList.toggle("is-active", mode === "local");
  resetGame();
}

function isSmallScreenMode() {
  return smallScreenModeQuery.matches;
}

function syncResponsiveMode() {
  const localDisabled = isSmallScreenMode();
  document.body.classList.toggle("single-touch-controls", localDisabled);
  els.modeLocal.disabled = localDisabled;
  els.modeLocal.setAttribute("aria-disabled", String(localDisabled));
  els.modeLocal.title = localDisabled ? "Local 2P is disabled on smaller screens." : "";

  if (localDisabled && state.mode === "local") {
    state.mode = "ai";
    els.modeAi.classList.add("is-active");
    els.modeLocal.classList.remove("is-active");
    resetGame();
  }
}

function resetGame() {
  clearTimeout(state.aiTimer);
  state.phase = "board";
  state.pieces = createInitialPieces();
  ensureCombatStateForPieces();
  state.selectedId = null;
  state.legalMoves = [];
  state.currentTeam = TEAM.WHITE;
  state.message = state.mode === "ai" ? "Select a white piece. Black is controlled by AI." : "White starts. Both players use the same board.";
  state.log = ["New war begins."];
  state.winner = null;
  state.victoryReason = "";
  state.showoff = null;
  state.graveyard = [];
  state.powerup = null;
  state.powerupTurnsRemaining = getInitialPowerupTurns();
  state.skipPowerupAdvance = false;
  state.nextPowerupId = 1;
  state.pendingChoice = null;
  state.pendingPowerupMove = null;
  state.restrictTurns = {
    [TEAM.WHITE]: 0,
    [TEAM.BLACK]: 0
  };
  state.keys.clear();
  clearTouchInput();
  state.mouse.attack = false;
  state.mouse.block = false;
  state.floatingText = [];
  state.combatBanner = null;
  state.announcement = null;
  online.showdownTargets.clear();
  syncHud();
  if (isOnlineHost()) {
    publishSnapshot("reset");
  }
}

function onCanvasClick(event) {
  if (state.phase === "showoff") {
    return;
  }

  if (state.phase !== "board" || state.winner || isAiBoardTurn() || state.announcement) {
    return;
  }

  const square = getClickedSquare(event);
  if (!square) {
    return;
  }

  if (isOnlineGuest()) {
    sendOnlineEvent("board-click", square);
    state.message = "Move sent to the room host.";
    syncHud();
    return;
  }

  if (isOnlineSpectator() || (isOnlineHost() && state.currentTeam !== TEAM.WHITE)) {
    state.message = isOnlineSpectator() ? "You are watching this room." : "Waiting for player 2.";
    syncHud();
    return;
  }

  handleBoardSquare(square);
}

function handleBoardSquare(square) {
  const clickedPiece = getPieceAt(state.pieces, square.x, square.y);
  const selected = getPieceById(state.pieces, state.selectedId);

  if (clickedPiece && clickedPiece.team === state.currentTeam) {
    selectPiece(clickedPiece);
    return;
  }

  if (!selected) {
    state.message = clickedPiece ? "That piece belongs to the other side." : "Select one of your pieces first.";
    syncHud();
    return;
  }

  const move = state.legalMoves.find((candidate) => candidate.x === square.x && candidate.y === square.y);
  if (!move) {
    state.message = "That square is not available for the selected piece.";
    syncHud();
    return;
  }

  performBoardMove(selected, move);
}

function onCanvasPointerDown(event) {
  if (state.phase !== "showoff" || isOnlineSpectator()) {
    return;
  }

  if (event.button === 0) {
    state.mouse.attack = true;
  } else if (event.button === 2) {
    state.mouse.block = true;
    event.preventDefault();
  }
  sendOnlineInputState();
}

function onCanvasPointerUp(event) {
  if (event.button === 0) {
    state.mouse.attack = false;
  } else if (event.button === 2) {
    state.mouse.block = false;
  }
  sendOnlineInputState();
}

function getClickedSquare(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

  if (state.phase !== "board") {
    return null;
  }

  const board = getBoardRect();
  if (x < board.x || y < board.y || x > board.x + board.size || y > board.y + board.size) {
    return null;
  }

  return {
    x: Math.floor((x - board.x) / board.cell),
    y: Math.floor((y - board.y) / board.cell)
  };
}

function selectPiece(piece) {
  state.selectedId = piece.id;
  state.legalMoves = getLegalMovesForPiece(piece);
  state.message = `${describePiece(piece)} selected. ${state.legalMoves.length} move${state.legalMoves.length === 1 ? "" : "s"} available.`;
  syncHud();
  if (isOnlineHost()) {
    publishSnapshot("select");
  }
}

function getLegalMovesForPiece(piece) {
  if (piece.danceTurns > 0) {
    return getDanceMoves(piece);
  }

  return getLegalMoves(state.pieces, piece);
}

function getAllLegalMovesForTeam(team) {
  return state.pieces
    .filter((piece) => piece.team === team)
    .flatMap((piece) => getLegalMovesForPiece(piece).map((move) => ({ ...move, pieceId: piece.id })));
}

function performBoardMove(piece, move) {
  const usedDance = piece.danceTurns > 0;
  if (move.capture) {
    const defender = getPieceById(state.pieces, move.targetId);
    if (defender) {
      consumeDanceMove(piece, usedDance);
      startShowoff(piece, defender, move);
    }
    return;
  }

  movePiece(piece, move.x, move.y);
  addLog(`${describePiece(piece)} moves to ${toSquareName(move.x, move.y)}.`);
  const powerup = takePowerupAt(move.x, move.y);
  if (powerup && powerupRequiresPieceSelection(powerup)) {
    beginSelectionPowerupBeforeMoveEnds(piece, powerup, usedDance);
    return;
  }

  finishBoardMove(piece, usedDance);
  if (powerup) {
    addLog(`${describePiece(piece)} collects ${powerup.name}.`);
    applyPowerup(piece, powerup);
    return;
  }

  endTurn();
}

function movePiece(piece, x, y) {
  piece.x = x;
  piece.y = y;
}

function finishBoardMove(piece, usedDance) {
  piece.hasMoved = true;
  consumeDanceMove(piece, usedDance);
  maybePromote(piece);
}

function maybePromote(piece) {
  if (piece.type !== "pawn") {
    return;
  }

  if ((piece.team === TEAM.WHITE && piece.y === 0) || (piece.team === TEAM.BLACK && piece.y === 7)) {
    piece.type = "queen";
    piece.maxHp = PIECE_STATS.queen.hp;
    piece.hp = PIECE_STATS.queen.hp;
    addLog(`${capitalize(piece.team)} pawn promotes to queen.`);
  }
}

function startShowoff(attacker, defender, move) {
  clearCombatInput();
  ensureCombatPieceState(attacker);
  ensureCombatPieceState(defender);
  attacker.hp = attacker.maxHp;
  defender.hp = defender.maxHp;
  attacker.mana = 0;
  defender.mana = 0;
  state.phase = "showoff";
  state.selectedId = null;
  state.legalMoves = [];
  state.showoff = {
    attackerId: attacker.id,
    defenderId: defender.id,
    move,
    leftTeam: attacker.team === TEAM.WHITE ? attacker.team : defender.team,
    fighters: {
      [attacker.id]: createFighter(attacker, attacker.team === TEAM.WHITE ? 255 : 705, attacker.team === TEAM.WHITE ? 1 : -1, "attacker"),
      [defender.id]: createFighter(defender, defender.team === TEAM.WHITE ? 255 : 705, defender.team === TEAM.WHITE ? 1 : -1, "defender")
    },
    round: 1,
    roundTimer: SHOWDOWN_ROUND_SECONDS,
    roundWins: {
      [attacker.id]: 0,
      [defender.id]: 0
    },
    roundBaseHp: {
      [attacker.id]: attacker.maxHp,
      [defender.id]: defender.maxHp
    },
    started: false,
    introTimer: SHOWDOWN_INTRO_SECONDS,
    roundWinnerId: null,
    roundLoserId: null,
    roundReason: "",
    finished: false,
    ended: false,
    endTimer: 0,
    nextAiThink: 0
  };

  state.message = `Showdown initiated: ${describePiece(attacker)} vs ${describePiece(defender)}.`;
  addLog(`Showdown initiated: ${describePiece(attacker)} attacks ${describePiece(defender)}. Combat starts in 3 seconds.`);
  syncHud();
  if (isOnlineHost()) {
    publishSnapshot("showdown-start");
  }
}

function createFighter(piece, x, facing, role) {
  return {
    id: piece.id,
    team: piece.team,
    type: piece.type,
    role,
    x,
    y: ARENA.floorY,
    z: 0,
    vz: 0,
    onGround: true,
    vx: 0,
    vy: 0,
    facing,
    cooldown: 0,
    attackTimer: 0,
    block: false,
    blockTimer: 0,
    motionTime: 0,
    moveBlend: 0,
    hitFlash: 0,
    criticalFlash: 0,
    aiHoldBlock: 0,
    mana: piece.mana ?? 0,
    stunTimer: 0,
    fortifyTimer: 0,
    dashTimer: 0,
    plusDamageTimer: 0,
    speedTimer: 0,
    intimidateTimer: 0,
    dominanceTimer: 0,
    passiveFlashTimer: 0,
    passiveFlashLabel: "",
    stampedeTimer: 0,
    stampedeDirection: facing,
    stampedeDashTimer: 0,
    stampedeHitCooldown: 0,
    stampedeTrailTimer: 0,
    stampedeTrailFrom: x,
    stampedeTrailTo: x,
    barrageTimer: 0,
    barrageShots: 0,
    ultimateTimer: 0,
    jumpHeld: false,
    fallen: false,
    fallTimer: 0,
    victoryPose: false,
    victoryTimer: 0
  };
}

function endShowoff(winnerId, loserId) {
  const showoff = state.showoff;
  const attacker = getPieceById(state.pieces, showoff.attackerId);
  const defender = getPieceById(state.pieces, showoff.defenderId);
  const winner = getPieceById(state.pieces, winnerId);
  const loser = getPieceById(state.pieces, loserId);
  syncShowdownManaToPieces();

  if (!winner || !loser || !attacker || !defender) {
    state.phase = "board";
    state.showoff = null;
    syncHud();
    return;
  }

  removePieceFromBoard(loser, "showdown");
  winner.hp = winner.maxHp;

  if (winnerId === attacker.id) {
    movePiece(attacker, showoff.move.x, showoff.move.y);
    attacker.hasMoved = true;
    maybePromote(attacker);
    addLog(`${describePiece(attacker)} wins Showdown and takes ${toSquareName(showoff.move.x, showoff.move.y)}.`);
  } else {
    addLog(`${describePiece(defender)} wins Showdown. ${describePiece(attacker)} is removed.`);
  }

  consumeStrengthAfterShowdown(winner);
  consumeSmashAfterShowdown(attacker);
  consumeSmashAfterShowdown(defender);

  if (loser.type === "king") {
    const victor = winner.team;
    setWinner(victor, `${capitalize(victor)} wins. The enemy king has fallen.`);
    state.phase = "gameover";
    state.showoff = null;
    syncHud();
    if (isOnlineHost()) {
      publishSnapshot("showdown-end");
    }
    return;
  }

  state.phase = "board";
  state.showoff = null;
  clearCombatInput();
  endTurn();
}

function endTurn() {
  state.selectedId = null;
  state.legalMoves = [];
  advancePowerupTurnCounter();
  state.currentTeam = otherTeam(state.currentTeam);
  resolveRestrictedTurns();
  state.message = `${capitalize(state.currentTeam)} to move.`;
  syncHud();

  if (isAiBoardTurn()) {
    state.message = "Black AI is choosing a move.";
    syncHud();
    state.aiTimer = setTimeout(runAiBoardTurn, 650);
  }

  if (isOnlineHost()) {
    publishSnapshot("turn");
  }
}

function resolveRestrictedTurns() {
  let safety = 0;
  while (state.restrictTurns[state.currentTeam] > 0 && safety < 4) {
    state.restrictTurns[state.currentTeam] -= 1;
    addLog(`${capitalize(state.currentTeam)} is restricted and skips a turn.`);
    advancePowerupTurnCounter();
    state.currentTeam = otherTeam(state.currentTeam);
    safety += 1;
  }
}

function runAiBoardTurn() {
  if (state.phase !== "board" || state.currentTeam !== TEAM.BLACK || state.winner) {
    return;
  }

  const allMoves = getAllLegalMovesForTeam(TEAM.BLACK);
  if (allMoves.length === 0) {
    setWinner(TEAM.WHITE, "White wins. Black has no legal moves.");
    state.phase = "gameover";
    syncHud();
    return;
  }

  const captures = allMoves.filter((move) => move.capture);
  const move = chooseAiMove(captures.length > 0 ? captures : allMoves);
  const piece = getPieceById(state.pieces, move.pieceId);

  if (piece) {
    performBoardMove(piece, move);
  }
}

function chooseAiMove(moves) {
  const sorted = [...moves].sort((a, b) => {
    const aTarget = a.targetId ? getPieceById(state.pieces, a.targetId) : null;
    const bTarget = b.targetId ? getPieceById(state.pieces, b.targetId) : null;
    const aScore = aTarget ? PIECE_STATS[aTarget.type].value * 10 - aTarget.hp : Math.random();
    const bScore = bTarget ? PIECE_STATS[bTarget.type].value * 10 - bTarget.hp : Math.random();
    return bScore - aScore;
  });

  return sorted[0];
}

function advancePowerupTurnCounter() {
  if (!POWERUPS_ENABLED) {
    state.powerup = null;
    state.powerupTurnsRemaining = null;
    state.skipPowerupAdvance = false;
    return;
  }

  if (state.winner || state.powerup || state.phase === "choice") {
    return;
  }

  if (state.skipPowerupAdvance) {
    state.skipPowerupAdvance = false;
    syncPowerupHud();
    return;
  }

  state.powerupTurnsRemaining = Math.max(0, state.powerupTurnsRemaining - 1);
  if (state.powerupTurnsRemaining === 0) {
    spawnPowerup();
  }
  syncHud();
}

function scheduleNextPowerup() {
  if (!POWERUPS_ENABLED) {
    state.powerupTurnsRemaining = null;
    state.skipPowerupAdvance = false;
    return;
  }

  if (state.winner) {
    state.powerupTurnsRemaining = null;
    return;
  }

  state.powerupTurnsRemaining = rollPowerupTurnCount();
  state.skipPowerupAdvance = true;
}

function getInitialPowerupTurns() {
  return POWERUPS_ENABLED ? rollPowerupTurnCount() : null;
}

function rollPowerupTurnCount() {
  return randomInt(POWERUP_TURN_RANGE.min, POWERUP_TURN_RANGE.max);
}

function spawnPowerup() {
  if (!POWERUPS_ENABLED) {
    state.powerup = null;
    state.powerupTurnsRemaining = null;
    state.skipPowerupAdvance = false;
    return;
  }

  const emptySquares = getEmptySquares();
  if (emptySquares.length === 0) {
    state.powerupTurnsRemaining = rollPowerupTurnCount();
    addLog("Powerup spawn delayed because the board is full.");
    return;
  }

  const square = emptySquares[randomInt(0, emptySquares.length - 1)];
  const definition = pickPowerupDefinition();
  state.powerup = {
    id: state.nextPowerupId,
    type: definition.type,
    x: square.x,
    y: square.y
  };
  state.powerupTurnsRemaining = null;
  state.skipPowerupAdvance = false;
  state.nextPowerupId += 1;
  addLog(`${definition.name} powerup spawned at ${toSquareName(square.x, square.y)}.`);
}

function getEmptySquares() {
  const squares = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!getPieceAt(state.pieces, x, y)) {
        squares.push({ x, y });
      }
    }
  }
  return squares;
}

function pickPowerupDefinition() {
  const total = POWERUPS.reduce((sum, powerup) => sum + powerup.rate, 0);
  let roll = Math.random() * total;

  for (const powerup of POWERUPS) {
    roll -= powerup.rate;
    if (roll <= 0) {
      return powerup;
    }
  }

  return POWERUPS[0];
}

function takePowerupAt(x, y) {
  if (!POWERUPS_ENABLED) {
    return null;
  }

  if (!state.powerup || state.powerup.x !== x || state.powerup.y !== y) {
    return null;
  }

  const powerup = getPowerupDefinition(state.powerup.type);
  state.powerup = null;
  state.selectedId = null;
  state.legalMoves = [];
  scheduleNextPowerup();
  return powerup;
}

function powerupRequiresPieceSelection(powerup) {
  return powerup.type === "revive";
}

function beginSelectionPowerupBeforeMoveEnds(piece, powerup, usedDance) {
  state.pendingPowerupMove = {
    receiverId: piece.id,
    usedDance
  };
  addLog(`${describePiece(piece)} collects ${powerup.name}. Choose a target before the move is completed.`);
  applyPowerup(piece, powerup, { finishMoveAfterChoice: true });
}

function finishPendingPowerupMove() {
  const pending = state.pendingPowerupMove;
  if (!pending) {
    return;
  }

  const piece = getPieceById(state.pieces, pending.receiverId);
  if (piece) {
    finishBoardMove(piece, Boolean(pending.usedDance));
  }
  state.pendingPowerupMove = null;
}

function applyPowerup(piece, powerup, options = {}) {
  if (powerup.type === "heal") {
    const oldHp = piece.hp;
    piece.hp = roundDamage(Math.min(piece.maxHp, piece.hp + 50));
    const healed = roundDamage(piece.hp - oldHp);
    state.message = `${describePiece(piece)} heals ${formatNumber(healed)} HP.`;
    addLog(`${describePiece(piece)} receives Heal for ${formatNumber(healed)} HP.`);
    announcePowerup(piece, powerup, `Heals ${formatNumber(healed)} HP.`);
    endTurn();
    return;
  }

  if (powerup.type === "dance") {
    piece.danceTurns = 1;
    state.message = `${describePiece(piece)} gained Dance. Its next move can go in any direction.`;
    announcePowerup(piece, powerup, "Next move can travel in any direction.");
    endTurn();
    return;
  }

  if (powerup.type === "restrict") {
    const targetTeam = otherTeam(piece.team);
    state.restrictTurns[targetTeam] += 2;
    state.message = `${capitalize(targetTeam)} is restricted for 2 turns.`;
    addLog(`${capitalize(targetTeam)} cannot move for 2 turns.`);
    announcePowerup(piece, powerup, `${capitalize(targetTeam)} skips 2 turns.`);
    endTurn();
    return;
  }

  if (powerup.type === "strength") {
    applyStrength(piece);
    state.message = `${describePiece(piece)} gains Strength for one Showdown.`;
    announcePowerup(piece, powerup, "+10% HP and damage for one Showdown.");
    endTurn();
    return;
  }

  if (powerup.type === "extinct") {
    announcePowerup(piece, powerup, "Destroys the opposing army and wins.");
    applyExtinct(piece);
    return;
  }

  if (powerup.type === "revive") {
    announcePowerup(piece, powerup, "Choose one destroyed allied piece to return.");
    beginReviveChoice(piece, options);
    return;
  }

  if (powerup.type === "smash") {
    applySmash(piece);
    state.message = `${describePiece(piece)} gains Smash for one Showdown.`;
    announcePowerup(piece, powerup, "Only this piece gains +50% Showdown damage for one Showdown.");
    endTurn();
  }
}

function applyStrength(piece) {
  if (piece.strengthShowdowns > 0) {
    piece.hp = roundDamage(Math.min(piece.maxHp, piece.hp + piece.maxHp * 0.1));
    addLog(`${describePiece(piece)} already has Strength, so it restores bonus HP.`);
    return;
  }

  const oldMaxHp = piece.maxHp;
  piece.strengthShowdowns = 1;
  piece.strengthHpBonus = roundDamage(oldMaxHp * 0.1);
  piece.maxHp = roundDamage(oldMaxHp + piece.strengthHpBonus);
  piece.hp = roundDamage(Math.min(piece.maxHp, piece.hp + piece.strengthHpBonus));
  addLog(`${describePiece(piece)} gains +10% HP and damage for one Showdown.`);
}

function applySmash(piece) {
  piece.smashShowdowns = 1;
  addLog(`${describePiece(piece)} is empowered by Smash for one Showdown.`);
}

function applyExtinct(piece) {
  const targetTeam = otherTeam(piece.team);
  const removed = state.pieces.filter((target) => target.team === targetTeam);
  for (const target of removed) {
    removePieceFromBoard(target, "extinct");
  }
  setWinner(piece.team, `${capitalize(piece.team)} wins by Extinct.`);
  state.phase = "gameover";
  syncHud();
}

function beginReviveChoice(piece, options = {}) {
  const choices = state.graveyard.filter((entry) => entry.team === piece.team);
  if (choices.length === 0) {
    state.message = `${describePiece(piece)} found Revive, but no allied piece is destroyed.`;
    addLog("Revive fizzles because there is no allied piece to return.");
    finishPendingPowerupMove();
    endTurn();
    return;
  }

  if (isAiControlled(piece.team)) {
    const choice = chooseBestGraveyardPiece(choices);
    revivePiece(choice.id);
    finishPendingPowerupMove();
    endTurn();
    return;
  }

  state.phase = "choice";
  state.pendingChoice = {
    type: "revive",
    team: piece.team,
    receiverId: piece.id,
    finishMoveAfterChoice: Boolean(options.finishMoveAfterChoice),
    selectedIds: []
  };
  state.message = `${capitalize(piece.team)} chooses one destroyed piece to revive before the move is completed.`;
  syncHud();
}

function onPowerupChoiceClick(event) {
  const button = event.target.closest("button[data-choice-action]");
  if (!button || !state.pendingChoice) {
    return;
  }

  const action = button.dataset.choiceAction;
  const id = Number(button.dataset.choiceId);
  if (isOnlineGuest()) {
    sendOnlineEvent("choice-action", { action, id });
    state.message = "Choice sent to the room host.";
    syncHud();
    return;
  }

  if (isOnlineHost() && state.pendingChoice.team === TEAM.BLACK) {
    state.message = "Waiting for player 2 to choose.";
    syncHud();
    return;
  }

  handlePowerupChoiceAction(action, id);
}

function handlePowerupChoiceAction(action, id) {
  if (state.pendingChoice.type === "revive" && action === "select") {
    revivePiece(id);
    if (state.pendingChoice.finishMoveAfterChoice) {
      finishPendingPowerupMove();
    }
    state.pendingChoice = null;
    state.phase = "board";
    endTurn();
  }
}

function revivePiece(graveyardId) {
  const entry = state.graveyard.find((candidate) => candidate.id === graveyardId);
  if (!entry) {
    return false;
  }

  const square = findReviveSquare(entry.team);
  if (!square) {
    addLog("Revive failed because the board has no empty square.");
    return false;
  }

  const piece = {
    ...entry,
    x: square.x,
    y: square.y,
    hp: PIECE_STATS[entry.type].hp,
    maxHp: PIECE_STATS[entry.type].hp,
    hasMoved: false,
    mana: 0,
    danceTurns: 0,
    smashShowdowns: 0,
    strengthShowdowns: 0,
    strengthHpBonus: 0
  };
  delete piece.reason;

  state.graveyard = state.graveyard.filter((candidate) => candidate.id !== graveyardId);
  state.pieces.push(piece);
  state.message = `${describePiece(piece)} revived at ${toSquareName(square.x, square.y)}.`;
  addLog(`${describePiece(piece)} returns at full HP.`);
  return true;
}

function findReviveSquare(team) {
  const preferredRows = team === TEAM.WHITE ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  for (const y of preferredRows) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!getPieceAt(state.pieces, x, y)) {
        return { x, y };
      }
    }
  }

  return null;
}

function chooseBestGraveyardPiece(choices) {
  return [...choices].sort((a, b) => PIECE_STATS[b.type].value - PIECE_STATS[a.type].value)[0];
}

function getPowerupDefinition(type) {
  return POWERUPS.find((powerup) => powerup.type === type) ?? POWERUPS[0];
}

function ensureCombatStateForPieces() {
  for (const piece of state.pieces) {
    ensureCombatPieceState(piece);
  }
}

function ensureCombatPieceState(piece) {
  piece.mana = clamp(Number(piece.mana ?? 0), 0, MAX_MANA);
  piece.smashShowdowns = Number(piece.smashShowdowns ?? 0);
  piece.danceTurns = Number(piece.danceTurns ?? 0);
  piece.strengthShowdowns = Number(piece.strengthShowdowns ?? 0);
  piece.strengthHpBonus = Number(piece.strengthHpBonus ?? 0);
}

function removePieceFromBoard(piece, reason) {
  state.pieces = state.pieces.filter((candidate) => candidate.id !== piece.id);
  state.graveyard = state.graveyard.filter((candidate) => candidate.id !== piece.id);
  state.graveyard.push({
    id: piece.id,
    team: piece.team,
    type: piece.type,
    hp: 0,
    maxHp: PIECE_STATS[piece.type].hp,
    hasMoved: false,
    reason
  });
}

function syncShowdownManaToPieces() {
  if (!state.showoff?.fighters) {
    return;
  }

  for (const fighter of Object.values(state.showoff.fighters)) {
    const piece = getPieceById(state.pieces, fighter.id);
    if (piece) {
      piece.mana = clamp(fighter.mana ?? piece.mana ?? 0, 0, MAX_MANA);
    }
  }
}

function consumeStrengthAfterShowdown(piece) {
  if (!piece || piece.strengthShowdowns <= 0) {
    return;
  }

  piece.strengthShowdowns = 0;
  const bonus = piece.strengthHpBonus ?? 0;
  piece.strengthHpBonus = 0;
  piece.maxHp = Math.max(1, roundDamage(piece.maxHp - bonus));
  piece.hp = Math.min(piece.hp, piece.maxHp);
  addLog(`${describePiece(piece)}'s Strength fades after the Showdown.`);
}

function consumeSmashAfterShowdown(piece) {
  if (!piece || piece.smashShowdowns <= 0) {
    return;
  }

  piece.smashShowdowns = 0;
  addLog(`${describePiece(piece)}'s Smash fades after the Showdown.`);
}

function applySmashDamageBonus(piece, damage) {
  if (!piece || piece.smashShowdowns <= 0) {
    return damage;
  }

  return roundDamage(damage * (1 + SMASH_DAMAGE_BONUS));
}

function consumeDanceMove(piece, usedDance) {
  if (usedDance) {
    piece.danceTurns = 0;
    addLog(`${describePiece(piece)} spends Dance movement.`);
  }
}

function getDanceMoves(piece) {
  const moves = [];
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];

  for (const [dx, dy] of directions) {
    let x = piece.x + dx;
    let y = piece.y + dy;

    while (isBoardSquare(x, y)) {
      const target = getPieceAt(state.pieces, x, y);
      if (!target) {
        moves.push({ x, y, capture: false, targetId: null });
      } else {
        if (target.team !== piece.team) {
          moves.push({ x, y, capture: true, targetId: target.id });
        }
        break;
      }

      x += dx;
      y += dy;
    }
  }

  return moves;
}

function isBoardSquare(x, y) {
  return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
}

async function createOnlineRoom() {
  try {
    const data = await apiRequest("/api/rooms", { method: "POST", body: {} });
    await joinOnlineRoom(data.roomId);
    setRoomUrl(data.roomId);
  } catch (error) {
    online.connected = false;
    els.onlineStatus.textContent = "Room Error";
    els.onlineDetail.textContent = error.message;
  }
}

async function joinTypedRoom() {
  const roomId = els.roomCode.value.trim().toUpperCase();
  if (!roomId) {
    els.onlineDetail.textContent = "Enter a room code first.";
    return;
  }

  await joinOnlineRoom(roomId);
  setRoomUrl(roomId);
}

async function joinRoomFromUrl() {
  const roomId = new URLSearchParams(window.location.search).get("room");
  if (roomId) {
    els.roomCode.value = roomId.toUpperCase();
    await joinOnlineRoom(roomId);
  }
}

async function joinOnlineRoom(roomId) {
  try {
    const cleanRoom = roomId.trim().toUpperCase();
    const data = await apiRequest(`/api/rooms/${cleanRoom}/join`, {
      method: "POST",
      body: { clientId: online.clientId }
    });

    leaveOnlineRoom(false);
    online.roomId = cleanRoom;
    online.role = data.role;
    online.connected = true;
    online.lastEventId = data.lastEventId ?? 0;
    online.pollTimer = 0;
    online.pollInFlight = false;
    online.snapshotTimer = 0;
    online.remoteInput = { x: 0, y: 0, attack: false, block: false, jump: false, ultimate: false };
    online.lastSentInput = "";
    online.showdownTargets.clear();
    state.mode = "online";
    els.modeAi.classList.remove("is-active");
    els.modeLocal.classList.remove("is-active");
    resetGame();
    state.message = getOnlineRoleMessage();
    openOnlineStream();
    syncOnlineHud();
    syncHud();
    if (isOnlineHost()) {
      publishSnapshot("join");
    }
  } catch (error) {
    online.connected = false;
    els.onlineStatus.textContent = "Room Error";
    els.onlineDetail.textContent = error.message;
  }
}

function leaveOnlineRoom(resetUrl = true) {
  closeOnlineStream();
  online.roomId = null;
  online.role = "offline";
  online.connected = false;
  online.lastEventId = 0;
  online.pollTimer = 0;
  online.pollInFlight = false;
  online.streamConnected = false;
  online.snapshotTimer = 0;
  online.remoteInput = { x: 0, y: 0, attack: false, block: false, jump: false, ultimate: false };
  online.lastSentInput = "";
  online.pendingSnapshotEvent = null;
  online.showdownTargets.clear();
  if (resetUrl && window.location.search.includes("room=")) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  syncOnlineHud();
}

function updateOnline(dt) {
  if (!online.connected || !online.roomId) {
    return;
  }

  if (!online.streamConnected) {
    online.pollTimer -= dt;
    if (online.pollTimer <= 0 && !online.pollInFlight) {
      online.pollTimer = ONLINE_POLL_INTERVAL;
      pollOnlineEvents();
    }
  } else {
    online.pollTimer = ONLINE_POLL_INTERVAL;
  }

  if (isOnlineHost()) {
    online.snapshotTimer -= dt;
    if (online.snapshotTimer <= 0 && shouldPublishPeriodicSnapshot()) {
      online.snapshotTimer = ONLINE_SNAPSHOT_INTERVAL;
      publishSnapshot("tick");
    }
  } else if (isOnlineGuest() && state.phase === "showoff") {
    sendOnlineInputState();
  }
}

function shouldPublishPeriodicSnapshot() {
  return state.phase === "showoff" || Boolean(state.announcement);
}

function openOnlineStream() {
  if (!online.roomId || !("EventSource" in window)) {
    return;
  }

  closeOnlineStream();
  const streamUrl = `/api/rooms/${online.roomId}/stream?clientId=${encodeURIComponent(online.clientId)}&since=${online.lastEventId}`;
  const stream = new EventSource(streamUrl);
  online.stream = stream;
  online.streamConnected = false;

  stream.addEventListener("open", () => {
    online.streamConnected = true;
    online.connected = true;
    syncOnlineHud();
  });

  stream.addEventListener("room-event", (message) => {
    try {
      const event = JSON.parse(message.data);
      handleOnlineEvent(event);
    } catch {
      online.streamConnected = false;
    }
  });

  stream.addEventListener("error", () => {
    online.streamConnected = false;
    syncOnlineHud();
  });
}

function closeOnlineStream() {
  if (online.stream) {
    online.stream.close();
  }
  online.stream = null;
  online.streamConnected = false;
  if (online.pendingSnapshotFrame) {
    cancelAnimationFrame(online.pendingSnapshotFrame);
  }
  online.pendingSnapshotFrame = 0;
  online.pendingSnapshotEvent = null;
}

async function pollOnlineEvents() {
  if (online.pollInFlight) {
    return;
  }

  online.pollInFlight = true;
  try {
    const data = await apiRequest(`/api/rooms/${online.roomId}/events?since=${online.lastEventId}&clientId=${encodeURIComponent(online.clientId)}`);
    const events = data.events ?? [];
    const latestSnapshot = [...events].reverse().find((event) => event.type === "snapshot");
    for (const event of events) {
      if (event.type !== "snapshot" || event === latestSnapshot) {
        handleOnlineEvent(event);
      }
    }
    online.connected = true;
    syncOnlineHud();
  } catch {
    online.connected = false;
    syncOnlineHud();
  } finally {
    online.pollInFlight = false;
  }
}

function handleOnlineEvent(event) {
  online.lastEventId = Math.max(online.lastEventId, event.id ?? 0);
  if ((isOnlineGuest() || isOnlineSpectator()) && event.type === "snapshot" && online.streamConnected) {
    online.pendingSnapshotEvent = event;
    if (!online.pendingSnapshotFrame) {
      online.pendingSnapshotFrame = requestAnimationFrame(flushOnlineSnapshotEvent);
    }
    return;
  }

  processOnlineEvent(event);
}

function flushOnlineSnapshotEvent() {
  online.pendingSnapshotFrame = 0;
  const event = online.pendingSnapshotEvent;
  online.pendingSnapshotEvent = null;
  if (event) {
    processOnlineEvent(event);
  }
}

function processOnlineEvent(event) {
  if (isOnlineHost()) {
    if (event.type === "board-click" && state.currentTeam === TEAM.BLACK && !state.announcement) {
      handleBoardSquare(event.payload);
      publishSnapshot("move");
    } else if (event.type === "presence") {
      publishSnapshot("presence");
    } else if (event.type === "choice-action" && state.pendingChoice?.team === TEAM.BLACK && !state.announcement) {
      handlePowerupChoiceAction(event.payload.action, Number(event.payload.id));
      publishSnapshot("choice");
    } else if (event.type === "input-state") {
      online.remoteInput = normalizeRemoteInput(event.payload);
    } else if (event.type === "reset-request") {
      resetGame();
    }
    return;
  }

  if ((isOnlineGuest() || isOnlineSpectator()) && event.type === "snapshot") {
    applyRemoteSnapshot(event.payload);
  }
}

function publishSnapshot(reason) {
  if (!isOnlineHost()) {
    return;
  }

  sendOnlineEvent("snapshot", { reason, snapshot: createSnapshot() });
}

function createSnapshot() {
  return {
    phase: state.phase,
    pieces: state.pieces,
    selectedId: state.selectedId,
    legalMoves: state.legalMoves,
    currentTeam: state.currentTeam,
    message: state.message,
    log: state.log,
    winner: state.winner,
    victoryReason: state.victoryReason,
    showoff: state.showoff,
    graveyard: state.graveyard,
    powerup: state.powerup,
    powerupTurnsRemaining: state.powerupTurnsRemaining,
    skipPowerupAdvance: state.skipPowerupAdvance,
    pendingChoice: state.pendingChoice,
    pendingPowerupMove: state.pendingPowerupMove,
    restrictTurns: state.restrictTurns,
    shake: state.shake,
    floatingText: state.floatingText,
    combatBanner: state.combatBanner,
    announcement: state.announcement
  };
}

function applyRemoteSnapshot(payload) {
  const snapshot = payload?.snapshot ?? payload;
  if (!snapshot) {
    return;
  }

  const previousFighters = state.showoff?.fighters;
  const remoteShowdownTargets =
    isRemoteOnlineClient() && snapshot.phase === "showoff" && snapshot.showoff?.fighters
      ? createRemoteShowdownTargets(snapshot.showoff)
      : null;

  state.mode = "online";
  state.phase = snapshot.phase;
  state.pieces = snapshot.pieces ?? [];
  ensureCombatStateForPieces();
  state.selectedId = snapshot.selectedId ?? null;
  state.legalMoves = snapshot.legalMoves ?? [];
  state.currentTeam = snapshot.currentTeam ?? TEAM.WHITE;
  state.message = snapshot.message ?? "";
  state.log = snapshot.log ?? [];
  state.winner = snapshot.winner ?? null;
  state.victoryReason = snapshot.victoryReason ?? "";
  state.showoff = snapshot.showoff ?? null;
  state.graveyard = snapshot.graveyard ?? [];
  state.powerup = snapshot.powerup ?? null;
  state.powerupTurnsRemaining = snapshot.powerupTurnsRemaining ?? null;
  state.skipPowerupAdvance = Boolean(snapshot.skipPowerupAdvance);
  state.pendingChoice = snapshot.pendingChoice ?? null;
  state.pendingPowerupMove = snapshot.pendingPowerupMove ?? null;
  state.restrictTurns = snapshot.restrictTurns ?? { [TEAM.WHITE]: 0, [TEAM.BLACK]: 0 };
  state.shake = snapshot.shake ?? 0;
  state.floatingText = snapshot.floatingText ?? [];
  state.combatBanner = snapshot.combatBanner ?? null;
  state.announcement = snapshot.announcement ?? null;

  if (remoteShowdownTargets) {
    online.showdownTargets = remoteShowdownTargets;
    preserveRemoteShowdownVisuals(previousFighters);
  } else {
    online.showdownTargets.clear();
  }

  syncHud();
}

function createRemoteShowdownTargets(showoff) {
  const targets = new Map();
  for (const fighter of Object.values(showoff.fighters)) {
    targets.set(String(fighter.id), {
      x: fighter.x,
      y: fighter.y,
      z: fighter.z ?? 0,
      facing: fighter.facing,
      block: Boolean(fighter.block),
      cooldown: fighter.cooldown ?? 0,
      attackTimer: fighter.attackTimer ?? 0,
      blockTimer: fighter.blockTimer ?? 0,
      hitFlash: fighter.hitFlash ?? 0,
      criticalFlash: fighter.criticalFlash ?? 0,
      motionTime: fighter.motionTime ?? 0,
      moveBlend: fighter.moveBlend ?? 0,
      mana: fighter.mana ?? 0,
      stunTimer: fighter.stunTimer ?? 0,
      fortifyTimer: fighter.fortifyTimer ?? 0,
      dashTimer: fighter.dashTimer ?? 0,
      plusDamageTimer: fighter.plusDamageTimer ?? 0,
      speedTimer: fighter.speedTimer ?? 0,
      intimidateTimer: fighter.intimidateTimer ?? 0,
      dominanceTimer: fighter.dominanceTimer ?? 0,
      passiveFlashTimer: fighter.passiveFlashTimer ?? 0,
      passiveFlashLabel: fighter.passiveFlashLabel ?? "",
      stampedeTimer: fighter.stampedeTimer ?? 0,
      stampedeDirection: fighter.stampedeDirection ?? fighter.facing,
      stampedeDashTimer: fighter.stampedeDashTimer ?? 0,
      stampedeHitCooldown: fighter.stampedeHitCooldown ?? 0,
      stampedeTrailTimer: fighter.stampedeTrailTimer ?? 0,
      stampedeTrailFrom: fighter.stampedeTrailFrom ?? fighter.x,
      stampedeTrailTo: fighter.stampedeTrailTo ?? fighter.x,
      barrageTimer: fighter.barrageTimer ?? 0,
      barrageShots: fighter.barrageShots ?? 0,
      ultimateTimer: fighter.ultimateTimer ?? 0,
      fallen: Boolean(fighter.fallen),
      fallTimer: fighter.fallTimer ?? 0,
      victoryPose: Boolean(fighter.victoryPose),
      victoryTimer: fighter.victoryTimer ?? 0
    });
  }
  return targets;
}

function preserveRemoteShowdownVisuals(previousFighters) {
  if (!previousFighters || !state.showoff?.fighters) {
    return;
  }

  for (const fighter of Object.values(state.showoff.fighters)) {
    const previous = previousFighters[fighter.id];
    if (!previous) {
      continue;
    }

    fighter.x = previous.x ?? fighter.x;
    fighter.y = previous.y ?? fighter.y;
    fighter.z = previous.z ?? fighter.z ?? 0;
    fighter.vz = previous.vz ?? fighter.vz ?? 0;
    fighter.onGround = previous.onGround ?? fighter.onGround ?? true;
    fighter.motionTime = previous.motionTime ?? fighter.motionTime ?? 0;
    fighter.moveBlend = previous.moveBlend ?? fighter.moveBlend ?? 0;
    fighter.attackTimer = Math.max(previous.attackTimer ?? 0, fighter.attackTimer ?? 0);
    fighter.blockTimer = Math.max(previous.blockTimer ?? 0, fighter.blockTimer ?? 0);
    fighter.hitFlash = Math.max(previous.hitFlash ?? 0, fighter.hitFlash ?? 0);
    fighter.criticalFlash = Math.max(previous.criticalFlash ?? 0, fighter.criticalFlash ?? 0);
    fighter.ultimateTimer = Math.max(previous.ultimateTimer ?? 0, fighter.ultimateTimer ?? 0);
    fighter.plusDamageTimer = Math.max(previous.plusDamageTimer ?? 0, fighter.plusDamageTimer ?? 0);
    fighter.speedTimer = Math.max(previous.speedTimer ?? 0, fighter.speedTimer ?? 0);
    fighter.intimidateTimer = Math.max(previous.intimidateTimer ?? 0, fighter.intimidateTimer ?? 0);
    fighter.dominanceTimer = Math.max(previous.dominanceTimer ?? 0, fighter.dominanceTimer ?? 0);
    fighter.passiveFlashTimer = Math.max(previous.passiveFlashTimer ?? 0, fighter.passiveFlashTimer ?? 0);
    fighter.passiveFlashLabel = previous.passiveFlashLabel ?? fighter.passiveFlashLabel ?? "";
    fighter.stampedeTimer = Math.max(previous.stampedeTimer ?? 0, fighter.stampedeTimer ?? 0);
    fighter.stampedeDirection = previous.stampedeDirection ?? fighter.stampedeDirection ?? fighter.facing;
    fighter.stampedeDashTimer = Math.max(previous.stampedeDashTimer ?? 0, fighter.stampedeDashTimer ?? 0);
    fighter.stampedeHitCooldown = Math.max(previous.stampedeHitCooldown ?? 0, fighter.stampedeHitCooldown ?? 0);
    fighter.stampedeTrailTimer = Math.max(previous.stampedeTrailTimer ?? 0, fighter.stampedeTrailTimer ?? 0);
    fighter.stampedeTrailFrom = previous.stampedeTrailFrom ?? fighter.stampedeTrailFrom ?? fighter.x;
    fighter.stampedeTrailTo = previous.stampedeTrailTo ?? fighter.stampedeTrailTo ?? fighter.x;
    fighter.fallen = previous.fallen ?? fighter.fallen ?? false;
    fighter.fallTimer = Math.max(previous.fallTimer ?? 0, fighter.fallTimer ?? 0);
    fighter.victoryPose = previous.victoryPose ?? fighter.victoryPose ?? false;
    fighter.victoryTimer = Math.max(previous.victoryTimer ?? 0, fighter.victoryTimer ?? 0);
  }
}

function sendOnlineInputState() {
  if (!isOnlineGuest() || state.phase !== "showoff") {
    return;
  }

  const input = getGuestInputState();
  const signature = JSON.stringify(input);
  if (signature === online.lastSentInput) {
    return;
  }

  online.lastSentInput = signature;
  sendOnlineEvent("input-state", input);
}

function getGuestInputState() {
  const p1 = {
    x: readAxis("p1", "left", "right"),
    y: 0,
    attack: readAction("p1", "attack"),
    block: readAction("p1", "block"),
    jump: readAction("p1", "jump"),
    ultimate: readOnlineUltimateAction()
  };
  const p2 = {
    x: readAxis("p2", "left", "right"),
    y: 0,
    attack: readAction("p2", "attack"),
    block: readAction("p2", "block"),
    jump: readAction("p2", "jump"),
    ultimate: readOnlineUltimateAction()
  };
  const x = p2.x || p1.x;

  return {
    x: shouldFlipShowdownPerspective() ? -x : x,
    y: 0,
    attack: p2.attack || p1.attack || state.mouse.attack,
    block: p2.block || p1.block || state.mouse.block,
    jump: p2.jump || p1.jump,
    ultimate: p2.ultimate || p1.ultimate
  };
}

function normalizeRemoteInput(input) {
  return {
    x: clamp(Number(input?.x ?? 0), -1, 1),
    y: 0,
    attack: Boolean(input?.attack),
    block: Boolean(input?.block),
    jump: Boolean(input?.jump),
    ultimate: Boolean(input?.ultimate)
  };
}

async function sendOnlineEvent(type, payload) {
  if (!online.roomId || !online.connected) {
    return;
  }

  try {
    await apiRequest(`/api/rooms/${online.roomId}/events`, {
      method: "POST",
      body: { clientId: online.clientId, type, payload }
    });
  } catch {
    online.connected = false;
    syncOnlineHud();
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Room request failed");
  }
  return data;
}

function syncOnlineHud() {
  if (!online.connected || !online.roomId) {
    els.onlineStatus.textContent = "Offline";
    els.onlineDetail.textContent = "Create a room, then share the same link with player 2.";
    els.onlineLink.textContent = "";
    return;
  }

  els.onlineStatus.textContent = `${online.roomId} - ${capitalize(online.role)}`;
  els.onlineDetail.textContent = getOnlineRoleMessage();
  els.onlineLink.textContent = getRoomLink(online.roomId);
}

function getOnlineRoleMessage() {
  if (isOnlineHost()) {
    return "You are white. Share this room link with player 2.";
  }

  if (isOnlineGuest()) {
    return "You are black. Your moves are sent to the host.";
  }

  if (isOnlineSpectator()) {
    return "Room is full, so you are watching.";
  }

  return "Create a room, then share the same link with player 2.";
}

function setRoomUrl(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

function getRoomLink(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  return url.toString();
}

function getClientId() {
  const key = "chess-wars-client-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() ?? `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function isOnlineHost() {
  return state.mode === "online" && online.role === "host";
}

function isOnlineGuest() {
  return state.mode === "online" && online.role === "guest";
}

function isOnlineSpectator() {
  return state.mode === "online" && online.role === "spectator";
}

function isRemoteOnlineClient() {
  return isOnlineGuest() || isOnlineSpectator();
}

function canViewPieceMoves(piece) {
  if (!online.connected || state.mode !== "online") {
    return true;
  }

  if (isOnlineHost()) {
    return piece.team === TEAM.WHITE;
  }

  if (isOnlineGuest()) {
    return piece.team === TEAM.BLACK;
  }

  return false;
}

function isAiControlled(team) {
  return state.mode === "ai" && team === TEAM.BLACK;
}

function setWinner(team, reason) {
  state.winner = team;
  state.victoryReason = reason;
  state.message = reason;
  state.selectedId = null;
  state.legalMoves = [];
  state.pendingChoice = null;
  state.pendingPowerupMove = null;
  state.powerup = null;
  state.powerupTurnsRemaining = null;
  state.skipPowerupAdvance = false;
  addLog(`${capitalize(team)} wins Chess Wars.`);
}

function isAiBoardTurn() {
  return state.mode === "ai" && state.currentTeam === TEAM.BLACK;
}

function isAiFighter(team) {
  return state.mode === "ai" && team === TEAM.BLACK;
}

function onKeyDown(event) {
  if (state.phase === "showoff") {
    state.keys.add(event.key);
    state.keys.add(event.code);
    if (isGameplayKey(event.key) || isGameplayKey(event.code)) {
      event.preventDefault();
    }
    sendOnlineInputState();
  }
}

function onKeyUp(event) {
  state.keys.delete(event.key);
  state.keys.delete(event.code);
  sendOnlineInputState();
}

function isGameplayKey(key) {
  return Object.values(PLAYER_CONTROLS).some((group) => Object.values(group).some((keys) => keys.includes(key)));
}

function clearCombatInput() {
  state.keys.clear();
  state.mouse.attack = false;
  state.mouse.block = false;
  clearTouchInput();
  sendOnlineInputState();
}

function setTouchPointer(pointerId, touchKey) {
  state.touchPointers.set(pointerId, touchKey);
  syncTouchSetFromPointers();
}

function clearTouchPointer(pointerId) {
  state.touchPointers.delete(pointerId);
  syncTouchSetFromPointers();
}

function syncTouchSetFromPointers() {
  state.touch = new Set(state.touchPointers.values());
}

function clearTouchInput(event) {
  if (event?.pointerId !== undefined && state.touchPointers.has(event.pointerId)) {
    clearTouchPointer(event.pointerId);
    sendOnlineInputState();
    return;
  }

  state.touchPointers.clear();
  state.touch.clear();
}

function loop(time) {
  const dt = Math.min((time - state.lastTime) / 1000 || 0, 0.033);
  state.lastTime = time;

  updateOnline(dt);
  const paused = updateAnnouncement(dt);

  if (!paused && state.phase === "showoff") {
    if (isRemoteOnlineClient()) {
      updateRemoteShowdownVisuals(dt);
    } else {
      updateShowoff(dt);
    }
  }

  updateFloatingText(dt);
  render();
  requestAnimationFrame(loop);
}

function updateRemoteShowdownVisuals(dt) {
  const showoff = state.showoff;
  if (!showoff?.fighters) {
    return;
  }

  const alpha = 1 - Math.exp(-REMOTE_SHOWDOWN_LERP * dt);
  for (const fighter of Object.values(showoff.fighters)) {
    const target = online.showdownTargets.get(String(fighter.id));
    if (!target) {
      continue;
    }

    const oldX = fighter.x;
    const oldY = fighter.y;
    fighter.x = lerp(fighter.x, target.x, alpha);
    fighter.y = lerp(fighter.y, target.y, alpha);
    fighter.z = lerp(fighter.z ?? 0, target.z ?? 0, alpha);

    if (Math.abs(fighter.x - target.x) < 0.35) {
      fighter.x = target.x;
    }
    if (Math.abs(fighter.y - target.y) < 0.35) {
      fighter.y = target.y;
    }
    if (Math.abs((fighter.z ?? 0) - (target.z ?? 0)) < 0.35) {
      fighter.z = target.z ?? 0;
    }

    if (Math.abs(fighter.x - oldX) > 0.05 || Math.abs(fighter.y - oldY) > 0.05) {
      fighter.motionTime = (fighter.motionTime ?? 0) + dt;
      fighter.moveBlend = Math.min(1, (fighter.moveBlend ?? 0) + dt * 10);
    } else {
      fighter.moveBlend = Math.max(0, (fighter.moveBlend ?? 0) - dt * 7);
    }

    fighter.facing = target.facing || fighter.facing;
    fighter.block = target.block;
    fighter.moveBlend = Math.max(fighter.moveBlend ?? 0, target.moveBlend ?? 0);
    fighter.mana = target.mana ?? fighter.mana ?? 0;
    fighter.stunTimer = Math.max(0, target.stunTimer ?? fighter.stunTimer ?? 0);
    fighter.fortifyTimer = Math.max(0, target.fortifyTimer ?? fighter.fortifyTimer ?? 0);
    fighter.dashTimer = Math.max(0, target.dashTimer ?? fighter.dashTimer ?? 0);
    fighter.plusDamageTimer = Math.max(0, target.plusDamageTimer ?? fighter.plusDamageTimer ?? 0);
    fighter.speedTimer = Math.max(0, target.speedTimer ?? fighter.speedTimer ?? 0);
    fighter.intimidateTimer = Math.max(0, target.intimidateTimer ?? fighter.intimidateTimer ?? 0);
    fighter.dominanceTimer = Math.max(0, target.dominanceTimer ?? fighter.dominanceTimer ?? 0);
    fighter.passiveFlashTimer = Math.max(0, target.passiveFlashTimer ?? fighter.passiveFlashTimer ?? 0);
    fighter.passiveFlashLabel = target.passiveFlashLabel ?? fighter.passiveFlashLabel ?? "";
    fighter.stampedeTimer = Math.max(0, target.stampedeTimer ?? fighter.stampedeTimer ?? 0);
    fighter.stampedeDirection = target.stampedeDirection ?? fighter.stampedeDirection ?? fighter.facing;
    fighter.stampedeDashTimer = Math.max(0, target.stampedeDashTimer ?? fighter.stampedeDashTimer ?? 0);
    fighter.stampedeHitCooldown = Math.max(0, target.stampedeHitCooldown ?? fighter.stampedeHitCooldown ?? 0);
    fighter.stampedeTrailTimer = Math.max(0, target.stampedeTrailTimer ?? fighter.stampedeTrailTimer ?? 0);
    fighter.stampedeTrailFrom = target.stampedeTrailFrom ?? fighter.stampedeTrailFrom ?? fighter.x;
    fighter.stampedeTrailTo = target.stampedeTrailTo ?? fighter.stampedeTrailTo ?? fighter.x;
    fighter.barrageTimer = Math.max(0, target.barrageTimer ?? fighter.barrageTimer ?? 0);
    fighter.barrageShots = target.barrageShots ?? fighter.barrageShots ?? 0;
    fighter.fallen = target.fallen ?? fighter.fallen ?? false;
    fighter.fallTimer = Math.max(fighter.fallTimer ?? 0, target.fallTimer ?? 0);
    fighter.victoryPose = target.victoryPose ?? fighter.victoryPose ?? false;
    fighter.victoryTimer = Math.max(fighter.victoryTimer ?? 0, target.victoryTimer ?? 0);
    fighter.cooldown = Math.max(0, (fighter.cooldown ?? target.cooldown ?? 0) - dt);
    fighter.attackTimer = Math.max(0, (fighter.attackTimer ?? target.attackTimer ?? 0) - dt);
    fighter.blockTimer = Math.max(0, (fighter.blockTimer ?? target.blockTimer ?? 0) - dt);
    fighter.hitFlash = Math.max(0, (fighter.hitFlash ?? target.hitFlash ?? 0) - dt);
    fighter.criticalFlash = Math.max(0, (fighter.criticalFlash ?? target.criticalFlash ?? 0) - dt);
    fighter.ultimateTimer = Math.max(0, (fighter.ultimateTimer ?? target.ultimateTimer ?? 0) - dt);
  }
  updateShowdownEndAnimations(dt);
}

function updateShowoff(dt) {
  const showoff = state.showoff;
  if (!showoff) {
    return;
  }

  const attacker = getPieceById(state.pieces, showoff.attackerId);
  const defender = getPieceById(state.pieces, showoff.defenderId);
  if (!attacker || !defender) {
    return;
  }

  if (showoff.ended) {
    showoff.endTimer += dt;
    updateShowdownEndAnimations(dt);
    if (showoff.finished && showoff.endTimer > ROUND_RESULT_SECONDS) {
      endShowoff(showoff.roundWinnerId, showoff.roundLoserId);
    } else if (!showoff.finished && showoff.endTimer > ROUND_RESULT_SECONDS) {
      startNextShowdownRound();
    }
    return;
  }

  if (!showoff.started) {
    showoff.introTimer = Math.max(0, (showoff.introTimer ?? SHOWDOWN_INTRO_SECONDS) - dt);
    if (showoff.introTimer <= 0) {
      showoff.started = true;
      state.message = `Round ${showoff.round} begins. First piece to 2 rounds wins.`;
      addLog(`Showdown round ${showoff.round} begins.`);
      if (isOnlineHost()) {
        publishSnapshot("round-start");
      }
    }
    syncHud();
    return;
  }

  showoff.roundTimer = Math.max(0, (showoff.roundTimer ?? SHOWDOWN_ROUND_SECONDS) - dt);
  const fighters = Object.values(showoff.fighters);
  for (const fighter of fighters) {
    const input = getFighterInput(fighter, dt);
    if ((fighter.stampedeTimer ?? 0) > 0) {
      updateStampede(fighter, dt);
    } else {
      applyFighterInput(fighter, input, dt);
    }
  }

  const [a, b] = fighters;
  a.facing = b.x >= a.x ? 1 : -1;
  b.facing = a.x >= b.x ? 1 : -1;

  for (const fighter of fighters) {
    fighter.cooldown = Math.max(0, fighter.cooldown - dt);
    fighter.attackTimer = Math.max(0, fighter.attackTimer - dt);
    fighter.blockTimer = Math.max(0, fighter.blockTimer - dt);
    fighter.hitFlash = Math.max(0, fighter.hitFlash - dt);
    fighter.criticalFlash = Math.max(0, (fighter.criticalFlash ?? 0) - dt);
    fighter.stunTimer = Math.max(0, (fighter.stunTimer ?? 0) - dt);
    fighter.fortifyTimer = Math.max(0, (fighter.fortifyTimer ?? 0) - dt);
    fighter.dashTimer = Math.max(0, (fighter.dashTimer ?? 0) - dt);
    fighter.ultimateTimer = Math.max(0, (fighter.ultimateTimer ?? 0) - dt);
    updateFighterEffectTimers(fighter, dt);
    updateBarrage(fighter, dt);
  }

  syncPieceHp(attacker, showoff.fighters[attacker.id]);
  syncPieceHp(defender, showoff.fighters[defender.id]);
  syncShowdownManaToPieces();
  syncHud();

  if (attacker.hp <= 0 || defender.hp <= 0) {
    const winnerId = attacker.hp <= 0 ? defender.id : attacker.id;
    const loserId = attacker.hp <= 0 ? attacker.id : defender.id;
    finishShowdownRound(winnerId, loserId, "knockout");
  } else if (showoff.roundTimer <= 0) {
    const winnerId = getTimedRoundWinner(attacker, defender);
    const loserId = winnerId === attacker.id ? defender.id : attacker.id;
    finishShowdownRound(winnerId, loserId, "timer");
  }
}

function updateFighterEffectTimers(fighter, dt) {
  fighter.plusDamageTimer = Math.max(0, (fighter.plusDamageTimer ?? 0) - dt);
  fighter.speedTimer = Math.max(0, (fighter.speedTimer ?? 0) - dt);
  fighter.intimidateTimer = Math.max(0, (fighter.intimidateTimer ?? 0) - dt);
  fighter.dominanceTimer = Math.max(0, (fighter.dominanceTimer ?? 0) - dt);
  fighter.passiveFlashTimer = Math.max(0, (fighter.passiveFlashTimer ?? 0) - dt);
  if (fighter.passiveFlashTimer <= 0) {
    fighter.passiveFlashLabel = "";
  }
}

function finishShowdownRound(winnerId, loserId, reason) {
  const showoff = state.showoff;
  if (!showoff || showoff.ended) {
    return;
  }

  const winner = getPieceById(state.pieces, winnerId);
  const loser = getPieceById(state.pieces, loserId);
  if (!winner || !loser) {
    return;
  }

  showoff.roundWins[winnerId] = (showoff.roundWins[winnerId] ?? 0) + 1;
  showoff.roundWinnerId = winnerId;
  showoff.roundLoserId = loserId;
  showoff.roundReason = reason;
  showoff.finished = showoff.roundWins[winnerId] >= SHOWDOWN_ROUNDS_TO_WIN;
  showoff.ended = true;
  showoff.endTimer = 0;
  markShowdownEndPoses(showoff, winnerId, loserId);

  const score = `${showoff.roundWins[showoff.attackerId] ?? 0}-${showoff.roundWins[showoff.defenderId] ?? 0}`;
  const reasonText = reason === "timer" ? "by higher health" : "by knockout";
  state.message = `${describePiece(winner)} wins round ${showoff.round} ${reasonText}. Score ${score}.`;
  addLog(`${describePiece(winner)} wins Showdown round ${showoff.round} ${reasonText}.`);

  if (!showoff.finished) {
    addFloatingText(`Round ${showoff.round}`, 480, 250, "#ffd166");
  }
}

function markShowdownEndPoses(showoff, winnerId, loserId) {
  const winnerFighter = showoff.fighters[winnerId];
  const loserFighter = showoff.fighters[loserId];

  if (winnerFighter) {
    winnerFighter.victoryPose = true;
    winnerFighter.victoryTimer = 0;
    winnerFighter.block = false;
    winnerFighter.attackTimer = 0;
    winnerFighter.stampedeTimer = 0;
    winnerFighter.barrageShots = 0;
    winnerFighter.ultimateTimer = 0;
    clearFighterActiveEffects(winnerFighter);
  }

  if (loserFighter) {
    loserFighter.fallen = true;
    loserFighter.fallTimer = 0;
    loserFighter.z = 0;
    loserFighter.vz = 0;
    loserFighter.onGround = true;
    loserFighter.block = false;
    loserFighter.attackTimer = 0;
    loserFighter.stampedeTimer = 0;
    loserFighter.barrageShots = 0;
    loserFighter.ultimateTimer = 0;
    clearFighterActiveEffects(loserFighter);
  }
}

function clearFighterActiveEffects(fighter) {
  fighter.stunTimer = 0;
  fighter.plusDamageTimer = 0;
  fighter.speedTimer = 0;
  fighter.intimidateTimer = 0;
  fighter.dominanceTimer = 0;
  fighter.passiveFlashTimer = 0;
  fighter.passiveFlashLabel = "";
}

function updateShowdownEndAnimations(dt) {
  const fighters = Object.values(state.showoff?.fighters ?? {});
  for (const fighter of fighters) {
    if (fighter.fallen) {
      fighter.fallTimer = (fighter.fallTimer ?? 0) + dt;
    }
    if (fighter.victoryPose) {
      fighter.victoryTimer = (fighter.victoryTimer ?? 0) + dt;
    }
  }
}

function startNextShowdownRound() {
  const showoff = state.showoff;
  if (!showoff) {
    return;
  }

  const attacker = getPieceById(state.pieces, showoff.attackerId);
  const defender = getPieceById(state.pieces, showoff.defenderId);
  if (!attacker || !defender) {
    return;
  }

  const previousMana = {};
  for (const fighter of Object.values(showoff.fighters)) {
    previousMana[fighter.id] = fighter.mana ?? getPieceById(state.pieces, fighter.id)?.mana ?? 0;
  }

  attacker.hp = roundDamage(Math.min(attacker.maxHp, showoff.roundBaseHp[attacker.id] ?? attacker.maxHp));
  defender.hp = roundDamage(Math.min(defender.maxHp, showoff.roundBaseHp[defender.id] ?? defender.maxHp));
  attacker.mana = clamp(previousMana[attacker.id] ?? attacker.mana ?? 0, 0, MAX_MANA);
  defender.mana = clamp(previousMana[defender.id] ?? defender.mana ?? 0, 0, MAX_MANA);

  showoff.round += 1;
  showoff.roundTimer = SHOWDOWN_ROUND_SECONDS;
  showoff.roundWinnerId = null;
  showoff.roundLoserId = null;
  showoff.roundReason = "";
  showoff.finished = false;
  showoff.ended = false;
  showoff.endTimer = 0;
  showoff.fighters = {
    [attacker.id]: createFighter(attacker, attacker.team === TEAM.WHITE ? 255 : 705, attacker.team === TEAM.WHITE ? 1 : -1, "attacker"),
    [defender.id]: createFighter(defender, defender.team === TEAM.WHITE ? 255 : 705, defender.team === TEAM.WHITE ? 1 : -1, "defender")
  };

  state.message = `Round ${showoff.round} begins. First piece to 2 rounds wins.`;
  addLog(`Showdown round ${showoff.round} begins.`);
  syncHud();
  if (isOnlineHost()) {
    publishSnapshot("round");
  }
}

function getTimedRoundWinner(attacker, defender) {
  if (attacker.hp === defender.hp) {
    return attacker.id;
  }
  return attacker.hp > defender.hp ? attacker.id : defender.id;
}

function getFighterInput(fighter, dt) {
  if (isOnlineHost() && fighter.team === TEAM.BLACK) {
    return online.remoteInput;
  }

  if (isAiFighter(fighter.team)) {
    return getAiFighterInput(fighter, dt);
  }

  const slot = fighter.team === TEAM.WHITE ? "p1" : "p2";
  const mouseControlsThisFighter =
    (isOnlineHost() && fighter.team === TEAM.WHITE) ||
    (isOnlineGuest() && fighter.team === TEAM.BLACK) ||
    (!online.connected && fighter.team === TEAM.WHITE);
  return {
    x: readAxis(slot, "left", "right"),
    y: 0,
    attack: readAction(slot, "attack") || (mouseControlsThisFighter && state.mouse.attack),
    block: readAction(slot, "block") || (mouseControlsThisFighter && state.mouse.block),
    jump: readAction(slot, "jump"),
    ultimate: readUltimateAction(fighter, slot)
  };
}

function getAiFighterInput(fighter, dt) {
  const opponent = getOpponentFighter(fighter);
  const distance = Math.abs(opponent.x - fighter.x);
  const verticalDistance = opponent.y - fighter.y;

  fighter.aiHoldBlock = Math.max(0, fighter.aiHoldBlock - dt);
  if (Math.random() < ARENA.aiReaction * dt && distance < 145 && opponent.attackTimer > 0) {
    fighter.aiHoldBlock = 0.35;
  }

  return {
    x: distance > ARENA.aiAttackDistance ? Math.sign(opponent.x - fighter.x) : (Math.random() - 0.5) * 0.35,
    y: 0,
    attack: distance < ARENA.aiAttackDistance && Math.random() < 2.6 * dt,
    block: fighter.aiHoldBlock > 0,
    jump: false,
    ultimate: fighter.mana >= MAX_MANA && Math.random() < 0.5 * dt
  };
}

function applyFighterInput(fighter, input, dt) {
  fighter.z ??= 0;
  fighter.vz ??= 0;
  fighter.onGround ??= true;
  const stunned = (fighter.stunTimer ?? 0) > 0;
  const dashMultiplier = (fighter.dashTimer ?? 0) > 0 ? DASH_MULTIPLIER : 1;
  const passiveSpeedMultiplier = (fighter.speedTimer ?? 0) > 0 ? PASSIVE_SPEED_MULTIPLIER : 1;
  const speed = (input.block ? ARENA.blockSpeed : ARENA.speed) * dashMultiplier * passiveSpeedMultiplier;
  const wasBlocking = fighter.block;
  fighter.block = !stunned && input.block;
  if (fighter.block && !wasBlocking) {
    fighter.blockTimer = 0.28;
  }

  const jumpPressed = Boolean(input.jump);
  fighter.jumpHeld ??= false;
  if (!jumpPressed) {
    fighter.jumpHeld = false;
  }
  if (!stunned && jumpPressed && !fighter.jumpHeld && fighter.onGround) {
    fighter.vz = 430 * dashMultiplier;
    fighter.onGround = false;
  }
  if (jumpPressed) {
    fighter.jumpHeld = true;
  }

  const moving = !stunned && Math.abs(input.x) > 0.01;
  if (moving) {
    fighter.motionTime += dt * (dashMultiplier > 1 ? 1.35 : 1);
    fighter.moveBlend = Math.min(1, (fighter.moveBlend ?? 0) + dt * 10);
  } else {
    fighter.moveBlend = Math.max(0, (fighter.moveBlend ?? 0) - dt * 7);
  }

  if (!stunned) {
    fighter.x = clamp(fighter.x + input.x * speed * dt, ARENA.minX, ARENA.maxX);
  }
  fighter.y = ARENA.floorY;
  fighter.z = Math.max(0, fighter.z + fighter.vz * dt);
  fighter.vz -= 980 * dt;
  if (fighter.z === 0 && fighter.vz < 0) {
    fighter.vz = 0;
    fighter.onGround = true;
  }

  if (stunned) {
    return;
  }

  if (input.ultimate && tryUltimate(fighter)) {
    return;
  }

  if (input.attack && fighter.cooldown <= 0) {
    tryAttack(fighter);
  }
}

function getAttackCooldown(fighter) {
  const intimidateMultiplier = (fighter.intimidateTimer ?? 0) > 0 ? PASSIVE_INTIMIDATE_COOLDOWN_MULTIPLIER : 1;
  return ARENA.attackCooldown * intimidateMultiplier;
}

function tryAttack(fighter) {
  const opponent = getOpponentFighter(fighter);
  const dx = Math.abs(opponent.x - fighter.x);
  const attackerPiece = getPieceById(state.pieces, fighter.id);
  fighter.cooldown = getAttackCooldown(fighter);
  fighter.attackTimer = ARENA.attackDuration;

  if (dx > ARENA.attackRange) {
    addFloatingText("Miss", fighter.x + fighter.facing * 56, fighter.y - 96, "#f2dfbb");
    return;
  }

  const opponentPiece = getPieceById(state.pieces, opponent.id);
  if (!opponentPiece || !attackerPiece) {
    return;
  }

  const stat = PIECE_STATS[attackerPiece.type];
  const passive = maybeActivatePassiveSkill(fighter, opponent, attackerPiece);
  const baseDamage = randomInt(5, 10);
  let damage = applyDamageBonus(baseDamage, stat.damageBonus + getStrengthDamageBonus(attackerPiece));
  damage = applyPassiveAttackDamage(fighter, damage);
  const critical = Math.random() < 0.04;
  if (critical) {
    damage = roundDamage(damage * 2);
  }
  damage = applySmashDamageBonus(attackerPiece, damage);

  const dealt = dealCombatDamage(fighter, opponent, damage, {
    label: stat.weapon,
    critical,
    mana: true,
    stun: passive === "stun" ? PASSIVE_STUN_SECONDS : 0,
    color: critical ? "#ffd166" : "#f7efe0"
  });
  addLog(`${describePiece(attackerPiece)} uses ${stat.weapon} for ${formatNumber(dealt)}${critical ? " critical" : ""}.`);
  if (passive === "lifeSteal" && dealt > 0) {
    applyLifeStealPassive(fighter, opponent);
  }
  if (critical) {
    startCombatBanner("CRITICAL DAMAGE", `${describePiece(attackerPiece)} dealt ${formatNumber(dealt)} to ${describePiece(opponentPiece)}.`);
  }
}

function maybeActivatePassiveSkill(fighter, opponent, piece) {
  const passive = PASSIVE_SKILLS[piece.type];
  if (!passive || Math.random() >= PASSIVE_TRIGGER_CHANCE) {
    return null;
  }

  showPassiveActivation(fighter, piece, passive);

  if (piece.type === "pawn") {
    fighter.plusDamageTimer = PASSIVE_PLUS_DAMAGE_SECONDS;
    return "plusDamage";
  }

  if (piece.type === "rook") {
    return "stun";
  }

  if (piece.type === "horse") {
    fighter.speedTimer = PASSIVE_SPEED_SECONDS;
    return "speed";
  }

  if (piece.type === "bishop") {
    return "lifeSteal";
  }

  if (piece.type === "queen") {
    opponent.intimidateTimer = PASSIVE_INTIMIDATE_SECONDS;
    opponent.cooldown = Math.max(opponent.cooldown ?? 0, ARENA.attackCooldown);
    return "intimidate";
  }

  if (piece.type === "king") {
    fighter.dominanceTimer = PASSIVE_DOMINANCE_SECONDS;
    return "dominance";
  }

  return null;
}

function showPassiveActivation(fighter, piece, passive) {
  const label = `${PIECE_STATS[piece.type].name}: ${passive.name}`;
  fighter.passiveFlashTimer = PASSIVE_FLASH_SECONDS;
  fighter.passiveFlashLabel = label;
  addFloatingText(label, fighter.x, fighter.y - 164, passive.color);
  addLog(`${describePiece(piece)} activates ${passive.name}.`);
}

function applyPassiveAttackDamage(fighter, damage) {
  let adjustedDamage = damage;
  if ((fighter.plusDamageTimer ?? 0) > 0) {
    adjustedDamage += PASSIVE_PLUS_DAMAGE;
  }
  if ((fighter.dominanceTimer ?? 0) > 0) {
    adjustedDamage += PASSIVE_DOMINANCE_DAMAGE;
  }
  return roundDamage(adjustedDamage);
}

function applyLifeStealPassive(attacker, opponent) {
  const attackerPiece = getPieceById(state.pieces, attacker.id);
  const opponentPiece = getPieceById(state.pieces, opponent.id);
  if (!attackerPiece || !opponentPiece || opponentPiece.hp <= 0) {
    return 0;
  }

  const stolen = roundDamage(Math.min(PASSIVE_LIFE_STEAL, opponentPiece.hp));
  opponentPiece.hp = roundDamage(Math.max(0, opponentPiece.hp - stolen));
  attackerPiece.hp = roundDamage(Math.min(attackerPiece.maxHp, attackerPiece.hp + stolen));
  opponent.hitFlash = Math.max(opponent.hitFlash ?? 0, 0.22);
  addFloatingText(`-${formatNumber(stolen)} steal`, opponent.x, opponent.y - 146, PASSIVE_SKILLS.bishop.color);
  addFloatingText(`+${formatNumber(stolen)}`, attacker.x, attacker.y - 132, PASSIVE_SKILLS.bishop.color);
  addLog(`${describePiece(attackerPiece)} steals ${formatNumber(stolen)} HP from ${describePiece(opponentPiece)}.`);
  return stolen;
}

function dealCombatDamage(attacker, opponent, amount, options = {}) {
  const attackerPiece = getPieceById(state.pieces, attacker.id);
  const opponentPiece = getPieceById(state.pieces, opponent.id);
  if (!attackerPiece || !opponentPiece) {
    return 0;
  }

  let damage = amount;
  const blocked = Boolean(opponent.block);
  if (blocked) {
    damage = randomInt(0, 2);
  } else if ((opponent.fortifyTimer ?? 0) > 0) {
    damage = roundDamage(Math.max(1, damage * 0.5));
  }
  if ((opponent.dominanceTimer ?? 0) > 0) {
    damage = roundDamage(Math.max(0, damage - PASSIVE_DOMINANCE_REDUCTION));
  }

  opponentPiece.hp = roundDamage(Math.max(0, opponentPiece.hp - damage));
  opponent.hitFlash = 0.22;
  if (options.critical) {
    opponent.criticalFlash = 0.5;
  }
  opponent.stunTimer = Math.max(opponent.stunTimer ?? 0, options.stun ?? 0);
  state.shake = Math.max(state.shake, options.shake ?? 0.18);
  addFloatingText(`${options.critical ? "Crit " : ""}-${formatNumber(damage)}`, opponent.x, opponent.y - 120, options.color ?? "#f7efe0");

  if (options.mana && damage > 0 && !blocked) {
    grantMana(attackerPiece, attacker, randomInt(5, 10));
  }

  return damage;
}

function tryUltimate(fighter) {
  const piece = getPieceById(state.pieces, fighter.id);
  if (!piece || (piece.mana ?? 0) < MAX_MANA) {
    return false;
  }

  piece.mana = 0;
  fighter.mana = 0;
  fighter.cooldown = Math.max(fighter.cooldown, 0.35);
  fighter.ultimateTimer = 0.45;
  fighter.attackTimer = Math.max(fighter.attackTimer, ARENA.attackDuration);

  const opponent = getOpponentFighter(fighter);
  const ultimate = ULTIMATES[piece.type];
  addFloatingText(ultimate.name, fighter.x, fighter.y - 150, "#8bd7ff");
  addLog(`${describePiece(piece)} uses ${ultimate.name}.`);

  if (piece.type === "pawn") {
    dealUltimateDamage(fighter, opponent, 25, ultimate.name);
  } else if (piece.type === "rook") {
    fighter.fortifyTimer = 5;
    addFloatingText("Fortify", fighter.x, fighter.y - 118, "#68c284");
  } else if (piece.type === "horse") {
    startStampede(fighter, opponent);
  } else if (piece.type === "bishop") {
    const restored = roundDamage(piece.maxHp * 0.3);
    piece.hp = roundDamage(Math.min(piece.maxHp, piece.hp + restored));
    addFloatingText(`+${formatNumber(restored)} HP`, fighter.x, fighter.y - 118, "#68c284");
  } else if (piece.type === "queen") {
    fighter.barrageShots = 5;
    fighter.barrageTimer = 0;
  } else if (piece.type === "king") {
    dealUltimateDamage(fighter, opponent, 80, ultimate.name, 3);
  }

  syncHud();
  return true;
}

function startStampede(fighter, opponent) {
  const direction = opponent.x >= fighter.x ? 1 : -1;
  fighter.stampedeTimer = STAMPEDE_DURATION;
  fighter.stampedeDirection = direction;
  fighter.stampedeDashTimer = 0;
  fighter.stampedeHitCooldown = 0;
  fighter.stampedeTrailTimer = STAMPEDE_TRAIL_SECONDS;
  fighter.stampedeTrailFrom = fighter.x;
  fighter.stampedeTrailTo = fighter.x + direction * STAMPEDE_DASH_DISTANCE;
  fighter.block = false;
  fighter.moveBlend = 1;
  fighter.attackTimer = Math.max(fighter.attackTimer, 0.16);
  fighter.facing = direction;
  addFloatingText("Stampede", fighter.x, fighter.y - 118, "#ffd166");
}

function isStampeding(fighter) {
  return (fighter.stampedeTimer ?? 0) > 0;
}

function updateStampede(fighter, dt) {
  const opponent = getOpponentFighter(fighter);
  const attackerPiece = getPieceById(state.pieces, fighter.id);
  const opponentPiece = opponent ? getPieceById(state.pieces, opponent.id) : null;
  if (!attackerPiece || !opponentPiece) {
    fighter.stampedeTimer = 0;
    return;
  }

  fighter.stampedeTimer = Math.max(0, (fighter.stampedeTimer ?? 0) - dt);
  fighter.stampedeDashTimer = Math.max(0, (fighter.stampedeDashTimer ?? 0) - dt);
  fighter.stampedeHitCooldown = Math.max(0, (fighter.stampedeHitCooldown ?? 0) - dt);
  fighter.stampedeTrailTimer = Math.max(0, (fighter.stampedeTrailTimer ?? 0) - dt);
  if (!isStampeding(fighter)) {
    fighter.stampedeTrailTimer = 0;
    return;
  }

  fighter.block = false;
  fighter.motionTime = (fighter.motionTime ?? 0) + dt * STAMPEDE_SPEED_MULTIPLIER * 4.2;
  fighter.moveBlend = 1;
  fighter.attackTimer = Math.max(fighter.attackTimer, 0.12);

  while (isStampeding(fighter) && fighter.stampedeDashTimer <= 0) {
    performStampedeDash(fighter, opponent, attackerPiece, opponentPiece);
    fighter.stampedeDashTimer += STAMPEDE_DASH_INTERVAL;
  }
}

function performStampedeDash(fighter, opponent, attackerPiece, opponentPiece) {
  const previousX = fighter.x;
  let direction = fighter.stampedeDirection || fighter.facing || 1;
  let nextX = fighter.x + direction * STAMPEDE_DASH_DISTANCE;

  if (nextX >= ARENA.maxX) {
    nextX = ARENA.maxX;
    direction = -1;
  } else if (nextX <= ARENA.minX) {
    nextX = ARENA.minX;
    direction = 1;
  }

  fighter.x = nextX;
  fighter.facing = direction;
  fighter.stampedeDirection = direction;
  fighter.stampedeTrailTimer = STAMPEDE_TRAIL_SECONDS;
  fighter.stampedeTrailFrom = previousX;
  fighter.stampedeTrailTo = nextX;
  fighter.ultimateTimer = Math.max(fighter.ultimateTimer, 0.08);

  const crossedOpponent =
    (previousX < opponent.x && fighter.x >= opponent.x) ||
    (previousX > opponent.x && fighter.x <= opponent.x);
  if (crossedOpponent && fighter.stampedeHitCooldown <= 0) {
    const dealt = dealCombatDamage(fighter, opponent, STAMPEDE_DAMAGE, {
      label: "Stampede",
      mana: false,
      color: "#ffd166",
      shake: 0.22
    });
    fighter.stampedeHitCooldown = STAMPEDE_HIT_COOLDOWN;
    addLog(`${describePiece(attackerPiece)} stampedes past ${describePiece(opponentPiece)} for ${formatNumber(dealt)}.`);
  }
}

function dealUltimateDamage(fighter, opponent, damage, label, stun = 0) {
  const attackerPiece = getPieceById(state.pieces, fighter.id);
  if (!attackerPiece) {
    return 0;
  }
  if (!isUltimateAttackInRange(fighter, opponent)) {
    missUltimateAttack(fighter, attackerPiece, label);
    return 0;
  }
  const boostedDamage = applySmashDamageBonus(attackerPiece, damage);
  const dealt = dealCombatDamage(fighter, opponent, boostedDamage, {
    label,
    stun,
    mana: false,
    color: "#8bd7ff",
    shake: 0.24
  });
  addLog(`${describePiece(attackerPiece)}'s ${label} deals ${formatNumber(dealt)}.`);
  return dealt;
}

function isUltimateAttackInRange(fighter, opponent) {
  return Math.abs(opponent.x - fighter.x) <= ULTIMATE_ATTACK_RANGE;
}

function missUltimateAttack(fighter, attackerPiece, label) {
  addFloatingText(`${label} Miss`, fighter.x + fighter.facing * 82, fighter.y - 105, "#f2dfbb");
  addLog(`${describePiece(attackerPiece)}'s ${label} misses.`);
}

function updateBarrage(fighter, dt) {
  if ((fighter.barrageShots ?? 0) <= 0) {
    return;
  }

  fighter.barrageTimer -= dt;
  while (fighter.barrageShots > 0 && fighter.barrageTimer <= 0) {
    fighter.barrageTimer += 0.16;
    fighter.barrageShots -= 1;
    fighter.attackTimer = ARENA.attackDuration;
    const opponent = getOpponentFighter(fighter);
    dealUltimateDamage(fighter, opponent, 10, "Barrage", 0.32);
  }
}

function grantMana(piece, fighter, amount) {
  const current = piece.mana ?? 0;
  if (current >= MAX_MANA) {
    fighter.mana = MAX_MANA;
    return;
  }

  piece.mana = clamp(current + amount, 0, MAX_MANA);
  fighter.mana = piece.mana;
  addFloatingText(`+${amount} mana`, fighter.x, fighter.y - 138, "#8bd7ff");
}

function syncPieceHp(piece, fighter) {
  if (piece.hp <= 0) {
    fighter.hitFlash = Math.max(fighter.hitFlash, 0.1);
  }
}

function getOpponentFighter(fighter) {
  return Object.values(state.showoff.fighters).find((candidate) => candidate.id !== fighter.id);
}

function readAxis(slot, negative, positive) {
  const neg = readAction(slot, negative) ? 1 : 0;
  const pos = readAction(slot, positive) ? 1 : 0;
  return pos - neg;
}

function readAction(slot, action) {
  const touchKey = `${slot}-${action}`;
  return PLAYER_CONTROLS[slot][action].some((key) => state.keys.has(key)) || state.touch.has(touchKey);
}

function readUltimateAction(fighter, slot) {
  if ((state.mode === "ai" && fighter.team === TEAM.WHITE) || isOnlineHost() || isOnlineGuest()) {
    return readOnlineUltimateAction();
  }

  return readAction(slot, "ultimate");
}

function readOnlineUltimateAction() {
  return readKeyGroup(ULTIMATE_KEYS) || state.touch.has("p1-ultimate") || state.touch.has("p2-ultimate");
}

function readKeyGroup(keys) {
  return keys.some((key) => state.keys.has(key));
}

function syncHud() {
  els.turnLabel.textContent = state.winner ? `${capitalize(state.winner)} wins` : capitalize(state.currentTeam);
  els.status.textContent = state.message;
  syncPowerupHud();
  syncVictoryHud();

  const selected = getPieceById(state.pieces, state.selectedId);
  if (selected) {
    const stat = PIECE_STATS[selected.type];
    const perks = [];
    if (selected.danceTurns > 0) {
      perks.push("Dance ready");
    }
    if (selected.strengthShowdowns > 0) {
      perks.push("Strength ready");
    }
    if (selected.smashShowdowns > 0) {
      perks.push("Smash ready");
    }
    if ((selected.mana ?? 0) >= MAX_MANA) {
      perks.push(`${ULTIMATES[selected.type].name} ready`);
    }
    if (!canViewPieceMoves(selected)) {
      els.selectionLabel.textContent = "Opponent selected";
      els.selectionDetail.textContent = `Selected at ${toSquareName(selected.x, selected.y)}. Possible moves are hidden.`;
    } else {
      els.selectionLabel.textContent = describePiece(selected);
      els.selectionDetail.textContent = `HP activates at full value during Showdown. Mana ${formatNumber(selected.mana ?? 0)}/${MAX_MANA}. Weapon: ${stat.weapon}. Ultimate: ${ULTIMATES[selected.type].name}. Passive: ${PASSIVE_SKILLS[selected.type].name}. Damage bonus: ${formatPercent(stat.damageBonus)}.${perks.length ? ` Perks: ${perks.join(", ")}.` : ""}`;
    }
  } else {
    els.selectionLabel.textContent = "None";
    els.selectionDetail.textContent = state.phase === "board" ? "Click a piece, then choose a highlighted square." : "A Showdown duel is active.";
  }

  els.showoffPanel.classList.toggle("is-hidden", state.phase !== "showoff");
  els.touchControls.classList.toggle("is-hidden", state.phase !== "showoff");
  els.touchControls.classList.toggle("hide-p2-touch-controls", state.phase === "showoff" && shouldHideP2ShowdownControls());

  if (state.showoff) {
    const fighters = getShowdownHudFighters();
    const leftPiece = getPieceById(state.pieces, fighters[0].id);
    const rightPiece = getPieceById(state.pieces, fighters[1].id);
    if (!state.showoff.started) {
      els.showoffTitle.textContent = `Showdown starts in ${Math.ceil(state.showoff.introTimer ?? SHOWDOWN_INTRO_SECONDS)}`;
    } else if (state.showoff.ended) {
      els.showoffTitle.textContent = state.showoff.finished ? "Showdown winner decided" : `Round ${state.showoff.round} finished`;
    } else {
      els.showoffTitle.textContent = `Round ${state.showoff.round ?? 1}/3 - ${Math.ceil(state.showoff.roundTimer ?? SHOWDOWN_ROUND_SECONDS)}s - First to 2`;
    }
    els.duelLeftName.textContent = describePiece(leftPiece);
    els.duelRightName.textContent = describePiece(rightPiece);
    els.duelLeftWeapon.textContent = `${PIECE_STATS[leftPiece.type].weapon} - ${ULTIMATES[leftPiece.type].name} - Passive: ${PASSIVE_SKILLS[leftPiece.type].name}`;
    els.duelRightWeapon.textContent = `${PIECE_STATS[rightPiece.type].weapon} - ${ULTIMATES[rightPiece.type].name} - Passive: ${PASSIVE_SKILLS[rightPiece.type].name}`;
    els.duelLeftHp.max = leftPiece.maxHp;
    els.duelLeftHp.value = leftPiece.hp;
    els.duelRightHp.max = rightPiece.maxHp;
    els.duelRightHp.value = rightPiece.hp;
    els.duelLeftMana.max = MAX_MANA;
    els.duelLeftMana.value = leftPiece.mana ?? 0;
    els.duelLeftManaText.textContent = `Mana ${formatNumber(leftPiece.mana ?? 0)}/${MAX_MANA}`;
    els.duelRightMana.max = MAX_MANA;
    els.duelRightMana.value = rightPiece.mana ?? 0;
    els.duelRightManaText.textContent = `Mana ${formatNumber(rightPiece.mana ?? 0)}/${MAX_MANA}`;
  }

  els.battleLogCard.classList.toggle("is-hidden", state.phase !== "showoff");
  if (state.phase === "showoff") {
    els.battleLog.replaceChildren(...state.log.slice(0, 8).map((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      return li;
    }));
  } else {
    els.battleLog.replaceChildren();
  }
}

function shouldHideP2ShowdownControls() {
  return state.mode === "ai" || state.mode === "online" || isSmallScreenMode();
}

function getShowdownHudFighters() {
  const fighters = Object.values(state.showoff.fighters);
  const playerTeam = getLocalShowdownTeam();
  return fighters.sort((a, b) => {
    if (a.team === playerTeam && b.team !== playerTeam) {
      return -1;
    }
    if (b.team === playerTeam && a.team !== playerTeam) {
      return 1;
    }
    return a.team === TEAM.WHITE ? -1 : 1;
  });
}

function getLocalShowdownTeam() {
  if (isOnlineGuest()) {
    return TEAM.BLACK;
  }

  return TEAM.WHITE;
}

function syncPowerupHud() {
  els.powerupCard.classList.toggle("is-hidden", !POWERUPS_ENABLED);
  if (!POWERUPS_ENABLED) {
    els.powerupOptions.classList.add("is-hidden");
    els.powerupOptions.replaceChildren();
    els.powerupLabel.textContent = "Powerups disabled";
    els.powerupDetail.textContent = "Powerups are disabled for balance.";
    return;
  }

  if (state.pendingChoice) {
    els.powerupLabel.textContent = "Choose Revive Target";
    els.powerupDetail.textContent = state.pendingPowerupMove
      ? "Pick one destroyed allied piece to return before this move is completed."
      : "Pick one destroyed allied piece to return at full HP.";
    renderChoiceOptions();
    return;
  }

  els.powerupOptions.classList.add("is-hidden");
  els.powerupOptions.replaceChildren();

  if (state.powerup) {
    const definition = getPowerupDefinition(state.powerup.type);
    els.powerupLabel.textContent = `${definition.name} at ${toSquareName(state.powerup.x, state.powerup.y)}`;
    els.powerupDetail.textContent = `${definition.description} Spawn rate: ${definition.rate}%.`;
    return;
  }

  if (state.winner) {
    els.powerupLabel.textContent = "Powerups ended";
    els.powerupDetail.textContent = "The match is over.";
    return;
  }

  const turns = state.powerupTurnsRemaining ?? POWERUP_TURN_RANGE.min;
  els.powerupLabel.textContent = `Next spawn in ${turns} turn${turns === 1 ? "" : "s"}`;
  els.powerupDetail.textContent = `Heal 25%, Dance 30%, Revive 15%, Restrict 10%, Strength 15%, Smash 3%, Extinct 2%.`;
}

function syncVictoryHud() {
  els.victoryCard.classList.toggle("is-hidden", !state.winner);
  if (!state.winner) {
    return;
  }

  els.victoryLabel.textContent = `${capitalize(state.winner)} wins`;
  els.victoryDetail.textContent = state.victoryReason || "The enemy king has fallen.";
}

function renderChoiceOptions() {
  els.powerupOptions.classList.remove("is-hidden");
  els.powerupOptions.replaceChildren();

  const choices = state.graveyard.filter((entry) => entry.team === state.pendingChoice.team);
  for (const entry of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.choiceAction = "select";
    button.dataset.choiceId = String(entry.id);
    button.textContent = `${describePiece(entry)} - ${PIECE_STATS[entry.type].hp} HP`;
    els.powerupOptions.append(button);
  }
}

function addLog(entry) {
  state.log.unshift(entry);
  if (state.log.length > 20) {
    state.log.length = 20;
  }
}

function updateFloatingText(dt) {
  state.shake = Math.max(0, state.shake - dt);
  state.floatingText = state.floatingText
    .map((item) => ({ ...item, y: item.y - 52 * dt, life: item.life - dt }))
    .filter((item) => item.life > 0);
  if (state.combatBanner) {
    state.combatBanner.timer -= dt;
    if (state.combatBanner.timer <= 0) {
      state.combatBanner = null;
    }
  }
}

function addFloatingText(text, x, y, color) {
  state.floatingText.push({ text, x, y, color, life: 0.85 });
}

function announcePowerup(piece, powerup, effect) {
  startAnnouncement(`${powerup.name} Retrieved`, `${describePiece(piece)} has ${powerup.name}. ${effect}`);
}

function startCombatBanner(title, detail) {
  state.combatBanner = {
    title,
    detail,
    timer: 0.9
  };
}

function startAnnouncement(title, detail) {
  state.announcement = {
    title,
    detail,
    timer: ANNOUNCEMENT_SECONDS
  };
}

function updateAnnouncement(dt) {
  if (!state.announcement) {
    return false;
  }

  state.announcement.timer = Math.max(0, state.announcement.timer - dt);
  if (state.announcement.timer === 0) {
    state.announcement = null;
    return false;
  }

  return true;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state.phase === "showoff") {
    drawShowoff();
  } else {
    drawBoard();
  }

  drawFloatingText();
  drawAnnouncement();
}

function drawBoard() {
  drawBackground();
  const board = getBoardRect();
  drawBoardPlinth(board);
  drawWoodFrame(board);

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      drawWoodSquare(board, x, y);
    }
  }

  drawCoordinates(board);
  drawMoveHighlights(board);
  drawPowerup(board);

  for (const piece of [...state.pieces].sort((a, b) => a.y - b.y || a.x - b.x)) {
    drawPiece(piece, board);
  }

  drawBoardBanner(board);
  drawVictoryIndicator(board);
}

function drawBoardPlinth(board) {
  const depth = 34;
  const frame = 64;
  const x = board.x - frame;
  const y = board.y - frame;
  const size = board.size + frame * 2;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
  ctx.beginPath();
  ctx.ellipse(board.x + board.size / 2, board.y + board.size + 50, board.size * 0.72, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  const side = ctx.createLinearGradient(0, y + size, 0, y + size + depth);
  side.addColorStop(0, "#7a4326");
  side.addColorStop(1, "#2b1710");
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + size - 4);
  ctx.lineTo(x + size - 10, y + size - 4);
  ctx.lineTo(x + size - 34, y + size + depth);
  ctx.lineTo(x + 34, y + size + depth);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 230, 174, 0.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 22, y + size + 5);
  ctx.lineTo(x + size - 22, y + size + 5);
  ctx.stroke();
  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createRadialGradient(480, 340, 80, 480, 480, 720);
  gradient.addColorStop(0, "#42534a");
  gradient.addColorStop(0.5, "#24372f");
  gradient.addColorStop(1, "#171512");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#f3d79c";
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-80, 90 + i * 74);
    ctx.lineTo(1040, -40 + i * 74);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function getBoardRect() {
  const margin = 116;
  const size = canvas.width - margin * 2;
  return {
    x: margin,
    y: margin,
    size,
    cell: size / BOARD_SIZE
  };
}

function drawWoodFrame(board) {
  const frame = 54;
  const x = board.x - frame;
  const y = board.y - frame;
  const size = board.size + frame * 2;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 20;

  const frameGradient = ctx.createLinearGradient(x, y, x + size, y + size);
  frameGradient.addColorStop(0, BOARD_THEME.frameLight);
  frameGradient.addColorStop(0.35, BOARD_THEME.frame);
  frameGradient.addColorStop(1, BOARD_THEME.frameDark);
  ctx.fillStyle = frameGradient;
  roundRect(x, y, size, size, 8);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255, 230, 174, 0.32)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.strokeStyle = "rgba(45, 23, 14, 0.72)";
  ctx.lineWidth = 12;
  ctx.strokeRect(board.x - 12, board.y - 12, board.size + 24, board.size + 24);

  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#2b1710";
  ctx.lineWidth = 2;
  for (let i = 0; i < 22; i += 1) {
    const offset = i * 28;
    ctx.beginPath();
    ctx.moveTo(x + offset, y + 10);
    ctx.bezierCurveTo(x + offset + 34, y + size * 0.3, x + offset - 18, y + size * 0.62, x + offset + 28, y + size - 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawWoodSquare(board, x, y) {
  const sx = board.x + x * board.cell;
  const sy = board.y + y * board.cell;
  const isLight = (x + y) % 2 === 0;
  const grain = ctx.createLinearGradient(sx, sy, sx + board.cell, sy + board.cell);
  grain.addColorStop(0, isLight ? "#f8e6b1" : "#b96b38");
  grain.addColorStop(0.5, isLight ? BOARD_THEME.light : BOARD_THEME.dark);
  grain.addColorStop(1, isLight ? "#ddb776" : "#6f351e");

  ctx.fillStyle = grain;
  ctx.fillRect(sx, sy, board.cell, board.cell);

  ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 231, 179, 0.08)";
  ctx.fillRect(sx, sy, board.cell, 3);
  ctx.fillRect(sx, sy, 3, board.cell);
  ctx.fillStyle = isLight ? "rgba(92, 50, 26, 0.18)" : "rgba(29, 16, 10, 0.28)";
  ctx.fillRect(sx, sy + board.cell - 4, board.cell, 4);
  ctx.fillRect(sx + board.cell - 4, sy, 4, board.cell);

  ctx.globalAlpha = isLight ? 0.13 : 0.18;
  ctx.strokeStyle = isLight ? "#8b542f" : "#f5d7a1";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const gy = sy + 12 + i * (board.cell / 5) + ((x * 11 + y * 7 + i * 5) % 9);
    ctx.beginPath();
    ctx.moveTo(sx + 8, gy);
    ctx.bezierCurveTo(sx + board.cell * 0.35, gy - 8, sx + board.cell * 0.62, gy + 7, sx + board.cell - 8, gy - 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawCoordinates(board) {
  ctx.save();
  ctx.font = "800 19px Georgia, serif";
  ctx.fillStyle = "rgba(255, 238, 188, 0.86)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.48)";
  ctx.shadowBlur = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    ctx.fillText(String.fromCharCode(65 + i), board.x + i * board.cell + board.cell / 2, board.y + board.size + 28);
    ctx.fillText(String.fromCharCode(65 + i), board.x + i * board.cell + board.cell / 2, board.y - 28);
    ctx.fillText(String(8 - i), board.x - 28, board.y + i * board.cell + board.cell / 2);
    ctx.fillText(String(8 - i), board.x + board.size + 28, board.y + i * board.cell + board.cell / 2);
  }

  ctx.restore();
}

function drawMoveHighlights(board) {
  const selected = getPieceById(state.pieces, state.selectedId);
  if (!selected) {
    return;
  }

  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 6;
  ctx.strokeRect(board.x + selected.x * board.cell + 5, board.y + selected.y * board.cell + 5, board.cell - 10, board.cell - 10);

  if (!canViewPieceMoves(selected)) {
    return;
  }

  for (const move of state.legalMoves) {
    const cx = board.x + move.x * board.cell + board.cell / 2;
    const cy = board.y + move.y * board.cell + board.cell / 2;
    ctx.fillStyle = move.capture ? BOARD_THEME.capture : BOARD_THEME.move;
    ctx.beginPath();
    ctx.arc(cx, cy, move.capture ? board.cell * 0.34 : board.cell * 0.18, 0, Math.PI * 2);
    ctx.fill();

    if (move.capture) {
      ctx.strokeStyle = "rgba(255, 248, 232, 0.85)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

function drawPowerup(board) {
  if (!POWERUPS_ENABLED) {
    return;
  }

  if (!state.powerup) {
    return;
  }

  const definition = getPowerupDefinition(state.powerup.type);
  const cx = board.x + state.powerup.x * board.cell + board.cell / 2;
  const cy = board.y + state.powerup.y * board.cell + board.cell / 2;
  const pulse = 1 + Math.sin(performance.now() / 180) * 0.08;

  ctx.save();
  ctx.shadowColor = definition.color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = "rgba(23, 21, 18, 0.84)";
  ctx.strokeStyle = definition.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, board.cell * 0.28 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.fillStyle = definition.color;
  ctx.font = `900 ${Math.round(board.cell * 0.28)}px Inter, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(definition.icon, cx, cy + 1);

  ctx.fillStyle = "rgba(23, 21, 18, 0.82)";
  roundRect(cx - board.cell * 0.36, cy + board.cell * 0.28, board.cell * 0.72, 20, 6);
  ctx.fill();
  ctx.fillStyle = "#fff8e8";
  ctx.font = "700 12px Inter, Arial, sans-serif";
  ctx.fillText(definition.name, cx, cy + board.cell * 0.28 + 10);
  ctx.restore();
}

function drawPiece(piece, board) {
  const cx = board.x + piece.x * board.cell + board.cell / 2;
  const cy = board.y + piece.y * board.cell + board.cell * 0.58;
  const scale = board.cell / 96;
  const stat = PIECE_STATS[piece.type];
  const colors = getPieceColors(piece.team);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 14 / scale;
  ctx.shadowOffsetY = 8 / scale;

  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, 25, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "transparent";
  drawCarvedPieceBody(piece.type, colors);
  drawBoardWeaponIcon(piece.type, colors);
  drawPieceCrest(stat.short, colors);
  ctx.restore();
}

function getPieceColors(team) {
  return team === TEAM.WHITE
    ? { main: "#d99c52", light: "#ffe6ad", dark: "#8c552e", ink: "#2d1b12", stroke: "#fff1c3" }
    : { main: "#643719", light: "#a76735", dark: "#25130d", ink: "#fff1c3", stroke: "#d18a4d" };
}

function drawCarvedPieceBody(type, colors) {
  const body = ctx.createLinearGradient(-28, -70, 30, 28);
  body.addColorStop(0, colors.light);
  body.addColorStop(0.48, colors.main);
  body.addColorStop(1, colors.dark);
  ctx.fillStyle = body;
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.ellipse(0, 28, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 14, 23, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-14, 14);
  ctx.bezierCurveTo(-20, -12, -14, -46, -5, -58);
  ctx.lineTo(5, -58);
  ctx.bezierCurveTo(14, -46, 20, -12, 14, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawPieceTop(type, colors);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 5, -54);
    ctx.bezierCurveTo(i * 7 - 6, -30, i * 6 + 7, -6, i * 4, 14);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawPieceTop(type, colors) {
  ctx.fillStyle = colors.light;
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 3;

  if (type === "pawn") {
    ctx.beginPath();
    ctx.arc(0, -66, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (type === "rook") {
    ctx.fillRect(-20, -77, 40, 20);
    ctx.strokeRect(-20, -77, 40, 20);
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(i * 14 - 4, -90, 8, 16);
      ctx.strokeRect(i * 14 - 4, -90, 8, 16);
    }
    return;
  }

  if (type === "horse") {
    ctx.beginPath();
    ctx.moveTo(-18, -54);
    ctx.bezierCurveTo(-8, -88, 25, -82, 12, -52);
    ctx.bezierCurveTo(4, -60, -6, -57, -18, -54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (type === "bishop") {
    ctx.beginPath();
    ctx.ellipse(0, -66, 17, 24, 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = colors.ink;
    ctx.beginPath();
    ctx.moveTo(-1, -84);
    ctx.lineTo(-1, -48);
    ctx.moveTo(-13, -68);
    ctx.lineTo(11, -68);
    ctx.stroke();
    return;
  }

  if (type === "queen") {
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.arc(i * 10, -84 - Math.abs(i) * 4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-24, -76);
    ctx.lineTo(24, -76);
    ctx.lineTo(16, -56);
    ctx.lineTo(-16, -56);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.arc(0, -68, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -92);
  ctx.lineTo(0, -48);
  ctx.moveTo(-13, -80);
  ctx.lineTo(13, -80);
  ctx.stroke();
}

function drawBoardWeaponIcon(type, colors) {
  ctx.save();
  ctx.translate(24, 12);
  ctx.rotate(-0.7);
  ctx.strokeStyle = colors.ink;
  ctx.fillStyle = colors.ink;
  ctx.lineWidth = 3;
  drawWeaponGlyph(type, 0, 0, 0.32, colors.ink);
  ctx.restore();
}

function drawPieceCrest(label, colors) {
  ctx.fillStyle = colors.ink;
  ctx.font = "700 20px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, -19);
}

function drawWeaponGlyph(type, x, y, scale = 1, color = "#fff8e8", target = ctx) {
  target.save();
  target.translate(x, y);
  target.scale(scale, scale);
  target.strokeStyle = color;
  target.fillStyle = color;
  target.lineWidth = 5;
  target.lineCap = "round";
  target.lineJoin = "round";

  if (type === "pawn") {
    target.beginPath();
    target.arc(-8, 0, 10, 0, Math.PI * 2);
    target.arc(12, 0, 10, 0, Math.PI * 2);
    target.fill();
  } else if (type === "rook") {
    target.beginPath();
    target.moveTo(-28, 18);
    target.lineTo(28, -24);
    target.stroke();
    target.beginPath();
    target.arc(32, -28, 13, 0, Math.PI * 2);
    target.fill();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      target.beginPath();
      target.moveTo(32 + Math.cos(angle) * 11, -28 + Math.sin(angle) * 11);
      target.lineTo(32 + Math.cos(angle) * 22, -28 + Math.sin(angle) * 22);
      target.stroke();
    }
  } else if (type === "horse") {
    target.beginPath();
    target.moveTo(-32, 20);
    target.lineTo(36, -36);
    target.stroke();
    target.beginPath();
    target.moveTo(36, -36);
    target.lineTo(22, -30);
    target.lineTo(30, -18);
    target.closePath();
    target.fill();
  } else if (type === "bishop") {
    target.beginPath();
    target.moveTo(0, -40);
    target.lineTo(0, 24);
    target.moveTo(-22, -14);
    target.lineTo(22, -14);
    target.stroke();
    target.beginPath();
    target.arc(0, -42, 7, 0, Math.PI * 2);
    target.fill();
  } else if (type === "queen") {
    target.beginPath();
    target.arc(0, -8, 32, -1.3, 1.35);
    target.stroke();
    target.beginPath();
    target.moveTo(26, -31);
    target.lineTo(40, -44);
    target.lineTo(34, -22);
    target.closePath();
    target.fill();
  } else {
    target.beginPath();
    target.moveTo(-30, 20);
    target.lineTo(24, -34);
    target.stroke();
    target.beginPath();
    target.moveTo(24, -34);
    target.lineTo(34, -48);
    target.lineTo(32, -24);
    target.closePath();
    target.fill();
    target.beginPath();
    target.arc(-24, 3, 19, 0, Math.PI * 2);
    target.stroke();
  }

  target.restore();
}

function drawPieceMark(label, cx, cy, radius, team) {
  ctx.fillStyle = team === TEAM.WHITE ? "#25211c" : "#fff8e8";
  ctx.font = `700 ${Math.round(radius * 1.08)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + 2);

  ctx.strokeStyle = team === TEAM.WHITE ? "rgba(37, 33, 28, 0.38)" : "rgba(255, 248, 232, 0.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHealthBar(x, y, width, height, hp, maxHp) {
  ctx.fillStyle = "rgba(31, 26, 23, 0.78)";
  roundRect(x, y, width, height, 4);
  ctx.fill();
  ctx.fillStyle = hp / maxHp > 0.45 ? "#68c284" : "#d64d43";
  roundRect(x, y, width * Math.max(0, hp / maxHp), height, 4);
  ctx.fill();
}

function drawManaBar(x, y, width, height, mana, maxMana) {
  ctx.fillStyle = "rgba(31, 26, 23, 0.78)";
  roundRect(x, y, width, height, 4);
  ctx.fill();
  ctx.fillStyle = mana >= maxMana ? "#ffd166" : "#8bd7ff";
  roundRect(x, y, width * Math.max(0, mana / maxMana), height, 4);
  ctx.fill();
}

function drawBoardBanner(board) {
  ctx.save();
  ctx.fillStyle = "rgba(31, 26, 23, 0.82)";
  roundRect(board.x, 16, board.size, 38, 12);
  ctx.fill();
  ctx.fillStyle = "#fff8e8";
  ctx.font = "700 18px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.winner ? `${capitalize(state.winner)} wins` : `${capitalize(state.currentTeam)} to move`, board.x + board.size / 2, 35);
  ctx.restore();
}

function drawVictoryIndicator(board) {
  if (!state.winner) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(23, 21, 18, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelWidth = board.size * 0.78;
  const panelX = board.x + (board.size - panelWidth) / 2;
  const panelY = board.y + board.size * 0.28;
  const winnerColor = state.winner === TEAM.WHITE ? "#ffe6ad" : "#a76735";

  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "rgba(46, 29, 21, 0.94)";
  roundRect(panelX, panelY, panelWidth, 190, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = winnerColor;
  ctx.font = "900 72px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VICTORY", board.x + board.size / 2, panelY + 66);

  ctx.fillStyle = "#fff8e8";
  ctx.font = "800 30px Inter, Arial, sans-serif";
  ctx.fillText(`${capitalize(state.winner)} wins`, board.x + board.size / 2, panelY + 122);

  ctx.fillStyle = "#c9bfa9";
  ctx.font = "700 18px Inter, Arial, sans-serif";
  ctx.fillText(state.victoryReason || "The enemy king has fallen.", board.x + board.size / 2, panelY + 158);
  ctx.restore();
}

function drawShowoff() {
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 24 : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 18 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#2e1d15");
  gradient.addColorStop(0.52, "#4d3c2b");
  gradient.addColorStop(1, "#171512");
  ctx.fillStyle = gradient;
  ctx.fillRect(-40, -40, canvas.width + 80, canvas.height + 80);

  drawArenaBackdrop();
  drawArenaFloor();

  const fighters = Object.values(state.showoff.fighters).sort((a, b) => a.y - b.y);
  for (const fighter of fighters) {
    drawFighter(fighter);
  }

  drawDuelHeader();
  drawCombatBanner();
  drawShowdownStateBanner();
  ctx.restore();
}

function drawArenaBackdrop() {
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.strokeStyle = "#f2dfbb";
  ctx.lineWidth = 3;

  for (let i = 0; i < 8; i += 1) {
    const x = 130 + i * 100;
    ctx.beginPath();
    ctx.moveTo(x, 270);
    ctx.lineTo(x + 42, 210);
    ctx.lineTo(x + 84, 270);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255, 209, 102, 0.16)";
  roundRect(220, 110, 520, 108, 20);
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.font = "800 52px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("SHOWDOWN", 480, 180);
  ctx.restore();
}

function drawArenaFloor() {
  ctx.fillStyle = "#2a2420";
  ctx.fillRect(80, ARENA.floorY + 48, 800, 86);

  ctx.strokeStyle = "rgba(255, 248, 232, 0.24)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(110 + i * 105, ARENA.floorY + 50);
    ctx.lineTo(60 + i * 125, ARENA.floorY + 134);
    ctx.stroke();
  }
}

function drawFighter(fighter) {
  const piece = getPieceById(state.pieces, fighter.id);
  const frame = getFighterFrame(fighter);
  const sprite = getShowdownSprite(piece, frame);
  const jumpHeight = fighter.z ?? 0;
  const viewX = getShowdownViewX(fighter.x);
  const viewFacing = shouldFlipShowdownPerspective() ? -fighter.facing : fighter.facing;
  const spriteX = -SHOWDOWN_SPRITE_WIDTH / 2;
  const spriteY = -SHOWDOWN_SPRITE_FLOOR_Y;

  ctx.save();
  ctx.translate(viewX, fighter.y);
  if (isStampeding(fighter)) {
    drawStampedeDashEffect(fighter, viewX, jumpHeight);
    ctx.restore();
    return;
  }

  ctx.scale(viewFacing, 1);

  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(0, 70, Math.max(42, 82 - jumpHeight * 0.18), Math.max(10, 20 - jumpHeight * 0.04), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -jumpHeight);

  if (fighter.attackTimer > 0) {
    drawAttackTrail(fighter);
  }

  drawFighterAfterimages(fighter, sprite, spriteX, spriteY);
  ctx.drawImage(sprite, spriteX, spriteY, SHOWDOWN_SPRITE_WIDTH, SHOWDOWN_SPRITE_HEIGHT);

  if ((fighter.criticalFlash ?? 0) > 0) {
    const alpha = Math.min(0.72, (fighter.criticalFlash ?? 0) / 0.5);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(214, 37, 43, ${alpha})`;
    ctx.fillRect(spriteX - 6, spriteY - 4, SHOWDOWN_SPRITE_WIDTH + 12, SHOWDOWN_SPRITE_HEIGHT + 8);
    ctx.globalCompositeOperation = "source-over";
  }

  if (fighter.hitFlash > 0) {
    ctx.globalAlpha = fighter.hitFlash / 0.22;
    ctx.strokeStyle = (fighter.criticalFlash ?? 0) > 0 ? "#ff2f3d" : "#ffd166";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(0, -54, 54, 78, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.scale(viewFacing, 1);
  drawStunEffect(fighter);
  drawPassiveIndicator(fighter);
  ctx.fillStyle = "#fff8e8";
  ctx.font = "700 18px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(describePiece(piece), 0, -94);
  drawHealthBar(-68, -78, 136, 12, piece.hp, piece.maxHp);
  drawManaBar(-68, -61, 136, 8, piece.mana ?? 0, MAX_MANA);
  ctx.restore();
}

function drawStunEffect(fighter) {
  const timer = fighter.stunTimer ?? 0;
  if (timer <= 0) {
    return;
  }

  const alpha = clamp(timer / 0.35, 0.28, 1);
  const phase = performance.now() / 130;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ffd166";
  ctx.fillStyle = "rgba(255, 209, 102, 0.88)";
  ctx.lineWidth = 3;
  ctx.translate(0, -178);
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i += 1) {
    const angle = phase + i * ((Math.PI * 2) / 3);
    const x = Math.cos(angle) * 34;
    const y = Math.sin(angle) * 10;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPassiveIndicator(fighter) {
  const label = getPassiveIndicatorLabel(fighter);
  if (!label) {
    return;
  }

  ctx.save();
  ctx.font = "800 12px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.min(172, Math.max(86, ctx.measureText(label).width + 22));
  const x = -width / 2;
  const y = -137;
  ctx.fillStyle = "rgba(29, 22, 18, 0.86)";
  ctx.strokeStyle = "rgba(255, 209, 102, 0.62)";
  ctx.lineWidth = 2;
  roundRect(x, y, width, 24, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  ctx.fillText(label, 0, y + 12);
  ctx.restore();
}

function getPassiveIndicatorLabel(fighter) {
  if ((fighter.passiveFlashTimer ?? 0) > 0 && fighter.passiveFlashLabel) {
    return fighter.passiveFlashLabel;
  }

  if ((fighter.plusDamageTimer ?? 0) > 0) {
    return "Plus Damage";
  }
  if ((fighter.speedTimer ?? 0) > 0) {
    return "Speed";
  }
  if ((fighter.intimidateTimer ?? 0) > 0) {
    return "Intimidated";
  }
  if ((fighter.dominanceTimer ?? 0) > 0) {
    return "Dominance";
  }
  return "";
}

function drawFighterAfterimages(fighter, sprite, spriteX, spriteY) {
  const attacking = fighter.attackTimer > 0;
  const dashing = (fighter.dashTimer ?? 0) > 0 && (fighter.moveBlend ?? 0) > 0.15;
  if (!attacking && !dashing) {
    return;
  }

  const count = attacking ? 2 : 3;
  const direction = attacking ? -fighter.facing : -Math.sign(fighter.facing || 1);
  for (let i = count; i >= 1; i -= 1) {
    ctx.save();
    ctx.globalAlpha = attacking ? 0.1 * i : 0.075 * i;
    ctx.translate(direction * i * (attacking ? 14 : 22), i * 2);
    ctx.drawImage(sprite, spriteX, spriteY, SHOWDOWN_SPRITE_WIDTH, SHOWDOWN_SPRITE_HEIGHT);
    ctx.restore();
  }
}

function drawStampedeDashEffect(fighter, viewX, jumpHeight) {
  if (!isStampeding(fighter)) {
    return;
  }

  const trailAlpha = clamp((fighter.stampedeTrailTimer ?? 0) / STAMPEDE_TRAIL_SECONDS, 0.35, 1);
  const from = getShowdownViewX(fighter.stampedeTrailFrom ?? fighter.x);
  const to = getShowdownViewX(fighter.stampedeTrailTo ?? fighter.x);
  const start = Math.min(from, to) - viewX - 116;
  const end = Math.max(from, to) - viewX + 116;
  const elapsed = performance.now() / 30;

  ctx.save();
  ctx.translate(0, -jumpHeight);
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.18 + trailAlpha * 0.62;

  for (let i = 0; i < 34; i += 1) {
    const wobble = Math.sin(elapsed + i * 1.37);
    const y = -134 + (i % 14) * 7 + wobble * 2.5;
    const inset = 8 + ((i * 17) % 72);
    const lineStart = start + inset * 0.5;
    const lineEnd = end - inset;
    ctx.strokeStyle = i % 4 === 0 ? "rgba(255, 248, 232, 0.58)" : i % 3 === 0 ? "rgba(0, 0, 0, 0.72)" : "rgba(185, 185, 185, 0.62)";
    ctx.lineWidth = i % 5 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(lineStart, y);
    ctx.lineTo(lineEnd, y + wobble * 1.8);
    ctx.stroke();
  }

  ctx.globalAlpha = Math.min(1, trailAlpha + 0.25);
  ctx.fillStyle = "#2767ff";
  ctx.fillRect(start + (end - start) * 0.42, -78, 6, 9);
  ctx.fillStyle = "#ff1f2f";
  ctx.fillRect(start + (end - start) * 0.56, -82, 7, 8);
  ctx.restore();
}

function getShowdownViewX(x) {
  if (shouldFlipShowdownPerspective() && state.phase === "showoff") {
    return canvas.width - x;
  }

  return x;
}

function shouldFlipShowdownPerspective() {
  return isOnlineGuest();
}

function getFighterFrame(fighter) {
  if (fighter.fallen) {
    return `defeated-fall-${Math.min(3, Math.floor((fighter.fallTimer ?? 0) * 8))}`;
  }

  if (fighter.victoryPose) {
    return `victory-wave-${Math.floor((fighter.victoryTimer ?? 0) * 8) % 4}`;
  }

  if ((fighter.stunTimer ?? 0) > 0 || (fighter.criticalFlash ?? 0) > 0.08 || (fighter.hitFlash ?? 0) > 0.1) {
    return "hit-stagger";
  }

  if ((fighter.stampedeTimer ?? 0) > 0) {
    return `run-${Math.floor((fighter.motionTime ?? 0) * 16) % 4}`;
  }

  if ((fighter.ultimateTimer ?? 0) > 0) {
    return "ultimate-cast";
  }

  if (fighter.attackTimer > 0) {
    const progress = 1 - fighter.attackTimer / ARENA.attackDuration;
    if (progress < 0.24) {
      return "attack-windup";
    }
    if (progress < 0.52) {
      return "attack-swing";
    }
    if (progress < 0.78) {
      return "attack-strike";
    }
    return "attack-recover";
  }

  if (fighter.block) {
    return fighter.blockTimer > 0.12 ? "block-brace" : "block-guard";
  }

  if ((fighter.z ?? 0) > 4) {
    return (fighter.vz ?? 0) > 0 ? "jump-rise" : "jump-fall";
  }

  if ((fighter.moveBlend ?? 0) > 0.05) {
    return `run-${Math.floor((fighter.motionTime ?? 0) * 12) % 4}`;
  }

  return "idle";
}

function getShowdownSprite(piece, frame) {
  const key = `${piece.team}-${piece.type}-${frame}`;
  if (spriteCache.has(key)) {
    return spriteCache.get(key);
  }

  const sprite = document.createElement("canvas");
  sprite.width = SHOWDOWN_SPRITE_WIDTH;
  sprite.height = SHOWDOWN_SPRITE_HEIGHT;
  const spriteCtx = sprite.getContext("2d");
  drawShowdownSprite(spriteCtx, piece, frame);
  spriteCache.set(key, sprite);
  return sprite;
}

function drawShowdownSprite(spriteCtx, piece, frame) {
  const colors = getPieceColors(piece.team);
  const stat = PIECE_STATS[piece.type];
  const pose = getStickPose(frame);
  const attacking = frame.startsWith("attack");
  const blocking = frame.startsWith("block");
  const stickColor = "#050505";
  const jointColor = "#000000";

  spriteCtx.save();
  spriteCtx.translate(SHOWDOWN_SPRITE_WIDTH / 2, SHOWDOWN_SPRITE_BODY_Y + pose.bodyLift);
  spriteCtx.lineCap = "round";
  spriteCtx.lineJoin = "round";

  const aura = spriteCtx.createRadialGradient(0, -64, 10, 0, -64, 128);
  aura.addColorStop(0, blocking ? "rgba(119, 212, 142, 0.24)" : "rgba(255, 209, 102, 0.12)");
  aura.addColorStop(1, "rgba(255, 209, 102, 0)");
  spriteCtx.fillStyle = aura;
  spriteCtx.beginPath();
  spriteCtx.arc(0, -70, 122, 0, Math.PI * 2);
  spriteCtx.fill();

  spriteCtx.beginPath();
  spriteCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
  spriteCtx.ellipse(0, 49, 58, 13, 0, 0, Math.PI * 2);
  spriteCtx.fill();

  const limbStroke = blocking ? "#111111" : stickColor;

  // Bold stickman legs with GIF-like long strides.
  drawStickLimb(spriteCtx, pose.hip, pose.leftKnee, pose.leftFoot, 17, limbStroke);
  drawStickLimb(spriteCtx, pose.hip, pose.rightKnee, pose.rightFoot, 17, limbStroke);

  // Springy torso.
  drawStickLine(spriteCtx, pose.hip.x, pose.hip.y, pose.shoulder.x, pose.shoulder.y, 22, stickColor);

  // Arms and weapon reach.
  drawStickLimb(spriteCtx, pose.shoulder, pose.leftElbow, pose.leftHand, blocking ? 17 : 15, limbStroke);
  drawStickLimb(spriteCtx, pose.shoulder, pose.rightElbow, pose.rightHand, blocking ? 17 : 15, limbStroke);

  drawShowdownWeapon(spriteCtx, piece.type, pose, frame, colors);

  spriteCtx.fillStyle = jointColor;
  spriteCtx.strokeStyle = jointColor;
  spriteCtx.lineWidth = 3;
  spriteCtx.beginPath();
  spriteCtx.arc(pose.head.x, pose.head.y, 25, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.stroke();

  drawStickmanHeadgear(spriteCtx, piece.type, colors, pose.head);

  spriteCtx.fillStyle = "#fff8e8";
  spriteCtx.font = "900 20px Georgia, serif";
  spriteCtx.textAlign = "center";
  spriteCtx.textBaseline = "middle";
  spriteCtx.fillText(stat.short, pose.head.x, pose.head.y);

  if (blocking) {
    spriteCtx.strokeStyle = "rgba(119, 212, 142, 0.72)";
    spriteCtx.lineWidth = frame === "block-brace" ? 9 : 6;
    spriteCtx.beginPath();
    spriteCtx.arc(48, -50, 82, -0.95, 0.95);
    spriteCtx.stroke();
  }

  spriteCtx.restore();
}

function getStickPose(frame) {
  const pose = {
    bodyLift: 0,
    hip: { x: 0, y: -34 },
    shoulder: { x: 0, y: -104 },
    head: { x: 0, y: -132 },
    leftKnee: { x: -20, y: -2 },
    leftFoot: { x: -42, y: 38 },
    rightKnee: { x: 24, y: 0 },
    rightFoot: { x: 38, y: 38 },
    leftElbow: { x: -28, y: -72 },
    leftHand: { x: -52, y: -46 },
    rightElbow: { x: 33, y: -74 },
    rightHand: { x: 64, y: -58 },
    weaponStart: { x: 36, y: -70 },
    weaponEnd: { x: 92, y: -88 }
  };

  if (frame.startsWith("run-")) {
    const step = Number(frame.slice(4)) || 0;
    const phase = (step / 4) * Math.PI * 2;
    const swing = Math.sin(phase);
    const counter = Math.cos(phase);
    pose.bodyLift = -Math.abs(counter) * 4;
    pose.hip.x = swing * 7;
    pose.shoulder.x = pose.hip.x + 8;
    pose.head.x = pose.shoulder.x + 3;
    pose.leftKnee = { x: -18 - swing * 18, y: -4 + Math.abs(counter) * 8 };
    pose.leftFoot = { x: -44 - swing * 28, y: 38 - Math.max(0, counter) * 12 };
    pose.rightKnee = { x: 24 + swing * 18, y: -2 + Math.abs(counter) * 8 };
    pose.rightFoot = { x: 44 + swing * 28, y: 38 + Math.min(0, counter) * 12 };
    pose.leftElbow = { x: -30 + swing * 22, y: -76 };
    pose.leftHand = { x: -58 + swing * 34, y: -52 };
    pose.rightElbow = { x: 34 - swing * 22, y: -76 };
    pose.rightHand = { x: 66 - swing * 34, y: -58 };
    pose.weaponStart = { x: pose.rightHand.x - 12, y: pose.rightHand.y - 8 };
    pose.weaponEnd = { x: pose.rightHand.x + 36, y: pose.rightHand.y - 28 };
    return pose;
  }

  if (frame === "jump-rise" || frame === "jump-fall") {
    const fold = frame === "jump-rise" ? 1 : 0.55;
    pose.bodyLift = -10;
    pose.hip = { x: -4, y: -34 };
    pose.shoulder = { x: -14, y: -105 };
    pose.head = { x: -17, y: -133 };
    pose.leftKnee = { x: -38, y: 2 };
    pose.leftFoot = { x: -22, y: 30 - fold * 14 };
    pose.rightKnee = { x: 18, y: -2 };
    pose.rightFoot = { x: 52, y: 25 - fold * 20 };
    pose.leftElbow = { x: -56, y: -102 };
    pose.leftHand = { x: -38, y: -140 };
    pose.rightElbow = { x: 18, y: -100 };
    pose.rightHand = { x: 70, y: -126 };
    pose.weaponStart = { x: -40, y: -140 };
    pose.weaponEnd = { x: 62, y: -184 };
    return pose;
  }

  if (frame === "attack-windup") {
    pose.hip = { x: -10, y: -34 };
    pose.shoulder = { x: -28, y: -108 };
    pose.head = { x: -30, y: -136 };
    pose.leftKnee = { x: -38, y: -4 };
    pose.leftFoot = { x: -58, y: 38 };
    pose.rightKnee = { x: 16, y: -2 };
    pose.rightFoot = { x: 36, y: 38 };
    pose.leftElbow = { x: -68, y: -100 };
    pose.leftHand = { x: -80, y: -142 };
    pose.rightElbow = { x: -4, y: -120 };
    pose.rightHand = { x: 30, y: -156 };
    pose.weaponStart = { x: -78, y: -142 };
    pose.weaponEnd = { x: 74, y: -208 };
    return pose;
  }

  if (frame === "attack-swing") {
    pose.hip = { x: 4, y: -34 };
    pose.shoulder = { x: 24, y: -102 };
    pose.head = { x: 28, y: -130 };
    pose.leftKnee = { x: -16, y: -2 };
    pose.leftFoot = { x: -50, y: 38 };
    pose.rightKnee = { x: 42, y: 2 };
    pose.rightFoot = { x: 72, y: 30 };
    pose.leftElbow = { x: 8, y: -84 };
    pose.leftHand = { x: 42, y: -88 };
    pose.rightElbow = { x: 70, y: -94 };
    pose.rightHand = { x: 104, y: -74 };
    pose.weaponStart = { x: 54, y: -108 };
    pose.weaponEnd = { x: 138, y: -64 };
    return pose;
  }

  if (frame === "attack-strike") {
    pose.hip = { x: 10, y: -34 };
    pose.shoulder = { x: 38, y: -96 };
    pose.head = { x: 42, y: -123 };
    pose.leftKnee = { x: -10, y: 0 };
    pose.leftFoot = { x: -56, y: 38 };
    pose.rightKnee = { x: 52, y: -4 };
    pose.rightFoot = { x: 86, y: 22 };
    pose.leftElbow = { x: 38, y: -72 };
    pose.leftHand = { x: 82, y: -62 };
    pose.rightElbow = { x: 78, y: -80 };
    pose.rightHand = { x: 126, y: -58 };
    pose.weaponStart = { x: 82, y: -82 };
    pose.weaponEnd = { x: 156, y: -36 };
    return pose;
  }

  if (frame === "attack-recover") {
    pose.hip = { x: 7, y: -34 };
    pose.shoulder = { x: 18, y: -100 };
    pose.head = { x: 20, y: -128 };
    pose.leftKnee = { x: -18, y: -2 };
    pose.leftFoot = { x: -46, y: 38 };
    pose.rightKnee = { x: 46, y: 2 };
    pose.rightFoot = { x: 62, y: 38 };
    pose.leftElbow = { x: -4, y: -72 };
    pose.leftHand = { x: 20, y: -42 };
    pose.rightElbow = { x: 58, y: -70 };
    pose.rightHand = { x: 90, y: -42 };
    pose.weaponStart = { x: 46, y: -58 };
    pose.weaponEnd = { x: 126, y: -30 };
    return pose;
  }

  if (frame === "block-brace" || frame === "block-guard") {
    const brace = frame === "block-brace" ? 1 : 0;
    pose.hip = { x: -4, y: -34 };
    pose.shoulder = { x: -8, y: -103 };
    pose.head = { x: -10, y: -132 };
    pose.leftKnee = { x: -28, y: -2 };
    pose.leftFoot = { x: -54, y: 38 };
    pose.rightKnee = { x: 24, y: 0 };
    pose.rightFoot = { x: 54, y: 38 };
    pose.leftElbow = { x: 28, y: -88 };
    pose.leftHand = { x: 62 + brace * 6, y: -78 };
    pose.rightElbow = { x: 30, y: -68 };
    pose.rightHand = { x: 70 + brace * 8, y: -48 };
    pose.weaponStart = { x: 42, y: -88 };
    pose.weaponEnd = { x: 92, y: -130 };
    return pose;
  }

  if (frame.startsWith("defeated-fall")) {
    const step = Number(frame.split("-").pop()) || 0;
    if (step === 0) {
      pose.hip = { x: -18, y: -30 };
      pose.shoulder = { x: -52, y: -86 };
      pose.head = { x: -72, y: -102 };
      pose.leftKnee = { x: -44, y: 2 };
      pose.leftFoot = { x: -72, y: 38 };
      pose.rightKnee = { x: 10, y: -8 };
      pose.rightFoot = { x: 38, y: 38 };
      pose.leftElbow = { x: -82, y: -74 };
      pose.leftHand = { x: -104, y: -96 };
      pose.rightElbow = { x: -28, y: -104 };
      pose.rightHand = { x: -2, y: -128 };
      pose.weaponStart = { x: -16, y: -120 };
      pose.weaponEnd = { x: 48, y: -158 };
      return pose;
    }

    if (step === 1) {
      pose.hip = { x: -22, y: -10 };
      pose.shoulder = { x: 0, y: -46 };
      pose.head = { x: 28, y: -56 };
      pose.leftKnee = { x: -48, y: 18 };
      pose.leftFoot = { x: -82, y: 42 };
      pose.rightKnee = { x: 18, y: 16 };
      pose.rightFoot = { x: 62, y: 38 };
      pose.leftElbow = { x: -26, y: -22 };
      pose.leftHand = { x: -62, y: -8 };
      pose.rightElbow = { x: 28, y: -20 };
      pose.rightHand = { x: 68, y: -12 };
      pose.weaponStart = { x: 20, y: -18 };
      pose.weaponEnd = { x: 86, y: -10 };
      return pose;
    }

    pose.bodyLift = 10;
    pose.hip = { x: -42, y: 20 };
    pose.shoulder = { x: 12, y: 26 };
    pose.head = { x: 66, y: 20 };
    pose.leftKnee = { x: -70, y: 32 };
    pose.leftFoot = { x: -108, y: 42 };
    pose.rightKnee = { x: -18, y: 36 };
    pose.rightFoot = { x: 22, y: 44 };
    pose.leftElbow = { x: -8, y: 14 };
    pose.leftHand = { x: -48, y: 6 };
    pose.rightElbow = { x: 32, y: 36 };
    pose.rightHand = { x: 78, y: 38 };
    pose.weaponStart = { x: 8, y: 30 };
    pose.weaponEnd = { x: 90, y: 34 };
    return pose;
  }

  if (frame.startsWith("victory-wave")) {
    const step = Number(frame.split("-").pop()) || 0;
    const wave = Math.sin((step / 4) * Math.PI * 2);
    pose.bodyLift = -8 - Math.abs(wave) * 4;
    pose.hip = { x: 0, y: -34 };
    pose.shoulder = { x: 0, y: -110 };
    pose.head = { x: 0, y: -140 };
    pose.leftKnee = { x: -26, y: -2 };
    pose.leftFoot = { x: -54, y: 38 };
    pose.rightKnee = { x: 28, y: -2 };
    pose.rightFoot = { x: 56, y: 38 };
    pose.leftElbow = { x: -40, y: -130 };
    pose.leftHand = { x: -76 + wave * 10, y: -172 + Math.abs(wave) * 6 };
    pose.rightElbow = { x: 42, y: -130 };
    pose.rightHand = { x: 78 - wave * 10, y: -172 + Math.abs(wave) * 6 };
    pose.weaponStart = { x: pose.rightHand.x - 8, y: pose.rightHand.y + 8 };
    pose.weaponEnd = { x: pose.rightHand.x + 54, y: pose.rightHand.y - 28 };
    return pose;
  }

  if (frame === "hit-stagger") {
    pose.hip = { x: -12, y: -34 };
    pose.shoulder = { x: -38, y: -104 };
    pose.head = { x: -48, y: -130 };
    pose.leftKnee = { x: -46, y: 2 };
    pose.leftFoot = { x: -76, y: 38 };
    pose.rightKnee = { x: 18, y: -8 };
    pose.rightFoot = { x: 46, y: 38 };
    pose.leftElbow = { x: -74, y: -96 };
    pose.leftHand = { x: -94, y: -126 };
    pose.rightElbow = { x: -2, y: -108 };
    pose.rightHand = { x: 22, y: -138 };
    pose.weaponStart = { x: -8, y: -132 };
    pose.weaponEnd = { x: 60, y: -170 };
    return pose;
  }

  if (frame === "ultimate-cast") {
    pose.bodyLift = -4;
    pose.hip = { x: 0, y: -34 };
    pose.shoulder = { x: 0, y: -110 };
    pose.head = { x: 0, y: -140 };
    pose.leftElbow = { x: -56, y: -116 };
    pose.leftHand = { x: -90, y: -146 };
    pose.rightElbow = { x: 56, y: -116 };
    pose.rightHand = { x: 96, y: -146 };
    pose.weaponStart = { x: 42, y: -150 };
    pose.weaponEnd = { x: 112, y: -196 };
  }

  return pose;
}

function drawStickLine(target, x1, y1, x2, y2, width, color) {
  target.save();
  target.strokeStyle = color;
  target.lineWidth = width;
  target.lineCap = "round";
  target.lineJoin = "round";
  target.beginPath();
  target.moveTo(x1, y1);
  target.lineTo(x2, y2);
  target.stroke();
  target.restore();
}

function drawStickLimb(target, root, joint, end, width, color) {
  target.save();
  target.strokeStyle = color;
  target.fillStyle = color;
  target.lineWidth = width;
  target.lineCap = "round";
  target.lineJoin = "round";
  target.beginPath();
  target.moveTo(root.x, root.y);
  target.lineTo(joint.x, joint.y);
  target.lineTo(end.x, end.y);
  target.stroke();

  const jointRadius = Math.max(4, width * 0.34);
  for (const point of [joint, end]) {
    target.beginPath();
    target.arc(point.x, point.y, jointRadius, 0, Math.PI * 2);
    target.fill();
  }
  target.restore();
}

function drawShowdownWeapon(target, type, pose, frame, colors) {
  const attacking = frame.startsWith("attack");
  if (attacking && type !== "pawn") {
    drawSpriteWeaponSweep(target, type, pose, frame);
  }

  if (type === "pawn") {
    drawPawnFists(target, pose, frame);
    return;
  }

  if (type === "rook") {
    drawSpikeClubWeapon(target, pose.weaponStart, pose.weaponEnd, frame);
    return;
  }

  if (type === "horse") {
    drawSpearWeapon(target, pose.weaponStart, pose.weaponEnd, frame);
    return;
  }

  if (type === "bishop") {
    drawCrossWeapon(target, pose.weaponStart, pose.weaponEnd, frame);
    return;
  }

  if (type === "queen") {
    drawScytheWeapon(target, pose.weaponStart, pose.weaponEnd, frame);
    return;
  }

  drawSwordAndShieldWeapon(target, pose, frame, colors);
}

function drawPawnFists(target, pose, frame) {
  const attacking = frame.startsWith("attack");
  const fists = [
    { point: pose.leftHand, radius: attacking ? 9 : 8 },
    { point: pose.rightHand, radius: attacking ? 12 : 9 }
  ];

  target.save();
  for (const fist of fists) {
    target.fillStyle = "#050505";
    target.strokeStyle = attacking ? "rgba(255, 248, 232, 0.62)" : "rgba(255, 248, 232, 0.28)";
    target.lineWidth = 2.5;
    target.beginPath();
    target.arc(fist.point.x, fist.point.y, fist.radius, 0, Math.PI * 2);
    target.fill();
    target.stroke();
  }

  if (attacking) {
    target.strokeStyle = "rgba(255, 248, 232, 0.38)";
    target.lineWidth = 5;
    target.lineCap = "round";
    target.beginPath();
    target.moveTo(pose.rightHand.x - 34, pose.rightHand.y - 6);
    target.lineTo(pose.rightHand.x + 22, pose.rightHand.y + 6);
    target.stroke();
    target.beginPath();
    target.arc(pose.rightHand.x + 17, pose.rightHand.y + 3, 20, -0.4, 0.82);
    target.stroke();
  }
  target.restore();
}

function drawSpikeClubWeapon(target, start, end, frame) {
  const attacking = frame.startsWith("attack");
  drawOrientedWeapon(target, start, end, (weapon, length) => {
    const headStart = Math.max(22, length * 0.48);
    const headEnd = length + 12;
    weapon.lineCap = "round";
    weapon.lineJoin = "round";
    drawWeaponShaft(weapon, 0, headStart + 8, attacking ? 8 : 7);

    weapon.fillStyle = "#050505";
    weapon.strokeStyle = "#d8d8d8";
    weapon.lineWidth = 2.5;
    weapon.beginPath();
    weapon.moveTo(headStart, -12);
    weapon.lineTo(headStart + 7, -23);
    weapon.lineTo(headStart + 15, -14);
    weapon.lineTo(headStart + 25, -25);
    weapon.lineTo(headStart + 34, -13);
    weapon.lineTo(headEnd - 8, -17);
    weapon.lineTo(headEnd + 4, -6);
    weapon.lineTo(headEnd - 5, 3);
    weapon.lineTo(headEnd + 5, 13);
    weapon.lineTo(headEnd - 12, 16);
    weapon.lineTo(headStart + 34, 13);
    weapon.lineTo(headStart + 24, 25);
    weapon.lineTo(headStart + 15, 13);
    weapon.lineTo(headStart + 6, 22);
    weapon.lineTo(headStart, 11);
    weapon.closePath();
    weapon.fill();
    weapon.stroke();

    weapon.strokeStyle = "rgba(255, 248, 232, 0.38)";
    weapon.lineWidth = 3;
    weapon.beginPath();
    weapon.moveTo(headStart + 8, -7);
    weapon.lineTo(headEnd - 10, -10);
    weapon.stroke();
  });
}

function drawSpearWeapon(target, start, end, frame) {
  const attacking = frame.startsWith("attack");
  drawOrientedWeapon(target, start, end, (weapon, length) => {
    drawWeaponShaft(weapon, -8, length - 17, attacking ? 5 : 4);

    weapon.fillStyle = "#050505";
    weapon.strokeStyle = "#e0e0e0";
    weapon.lineWidth = 2.2;
    weapon.beginPath();
    weapon.moveTo(length + 19, 0);
    weapon.lineTo(length - 10, -12);
    weapon.lineTo(length - 2, 0);
    weapon.lineTo(length - 10, 12);
    weapon.closePath();
    weapon.fill();
    weapon.stroke();

    weapon.strokeStyle = "rgba(255, 248, 232, 0.42)";
    weapon.lineWidth = 2;
    weapon.beginPath();
    weapon.moveTo(4, -2);
    weapon.lineTo(length - 16, -2);
    weapon.stroke();
  });
}

function drawCrossWeapon(target, start, end, frame) {
  const attacking = frame.startsWith("attack");
  drawOrientedWeapon(target, start, end, (weapon, length) => {
    drawWeaponShaft(weapon, -8, length + 8, attacking ? 8 : 7);

    const barX = Math.max(24, length * 0.62);
    weapon.strokeStyle = "#050505";
    weapon.lineWidth = attacking ? 12 : 10;
    weapon.lineCap = "round";
    weapon.beginPath();
    weapon.moveTo(barX, -26);
    weapon.lineTo(barX, 26);
    weapon.stroke();

    weapon.strokeStyle = "rgba(255, 248, 232, 0.5)";
    weapon.lineWidth = 3;
    weapon.beginPath();
    weapon.moveTo(barX - 4, -20);
    weapon.lineTo(barX - 4, 20);
    weapon.stroke();
  });
}

function drawScytheWeapon(target, start, end, frame) {
  const attacking = frame.startsWith("attack");
  drawOrientedWeapon(target, start, end, (weapon, length) => {
    weapon.strokeStyle = "#050505";
    weapon.lineWidth = attacking ? 8 : 7;
    weapon.lineCap = "round";
    weapon.beginPath();
    weapon.moveTo(-8, 8);
    weapon.quadraticCurveTo(length * 0.44, -8, length * 0.82, 3);
    weapon.stroke();

    weapon.fillStyle = "#050505";
    weapon.strokeStyle = "#d8d8d8";
    weapon.lineWidth = 2.4;
    weapon.beginPath();
    weapon.moveTo(length * 0.58, -2);
    weapon.quadraticCurveTo(length * 0.82, -56, length + 48, -30);
    weapon.quadraticCurveTo(length + 8, -24, length * 0.78, 13);
    weapon.quadraticCurveTo(length * 0.7, 2, length * 0.58, -2);
    weapon.closePath();
    weapon.fill();
    weapon.stroke();

    weapon.strokeStyle = "rgba(255, 248, 232, 0.44)";
    weapon.lineWidth = 3;
    weapon.beginPath();
    weapon.moveTo(length * 0.76, -25);
    weapon.quadraticCurveTo(length * 0.96, -42, length + 24, -30);
    weapon.stroke();
  });
}

function drawSwordAndShieldWeapon(target, pose, frame, colors) {
  const blocking = frame.startsWith("block");
  const shieldPoint = blocking
    ? { x: (pose.leftHand.x + pose.rightHand.x) / 2 + 4, y: (pose.leftHand.y + pose.rightHand.y) / 2 - 8 }
    : { x: pose.leftHand.x - 4, y: pose.leftHand.y + 5 };

  if (!blocking) {
    drawShieldSilhouette(target, shieldPoint, 0.82, colors);
  }

  drawOrientedWeapon(target, pose.weaponStart, pose.weaponEnd, (weapon, length) => {
    weapon.fillStyle = "#050505";
    weapon.strokeStyle = "#d8d8d8";
    weapon.lineWidth = 2.3;
    weapon.lineJoin = "round";
    weapon.beginPath();
    weapon.moveTo(8, -4);
    weapon.lineTo(length - 13, -5);
    weapon.lineTo(length + 15, 0);
    weapon.lineTo(length - 13, 5);
    weapon.lineTo(8, 4);
    weapon.closePath();
    weapon.fill();
    weapon.stroke();

    weapon.strokeStyle = "#050505";
    weapon.lineWidth = 7;
    weapon.lineCap = "round";
    weapon.beginPath();
    weapon.moveTo(18, -16);
    weapon.lineTo(18, 16);
    weapon.stroke();
    weapon.beginPath();
    weapon.moveTo(-13, 0);
    weapon.lineTo(12, 0);
    weapon.stroke();
    weapon.fillStyle = "#050505";
    weapon.beginPath();
    weapon.arc(-17, 0, 6, 0, Math.PI * 2);
    weapon.fill();
  });

  if (blocking) {
    drawShieldSilhouette(target, shieldPoint, 1.14, colors);
  }
}

function drawShieldSilhouette(target, point, scale, colors) {
  target.save();
  target.translate(point.x, point.y);
  target.scale(scale, scale);
  target.fillStyle = "#050505";
  target.strokeStyle = "#d8d8d8";
  target.lineWidth = 3;
  target.beginPath();
  target.moveTo(0, -33);
  target.quadraticCurveTo(-25, -28, -30, -6);
  target.quadraticCurveTo(-22, 22, 0, 38);
  target.quadraticCurveTo(22, 22, 30, -6);
  target.quadraticCurveTo(24, -28, 0, -33);
  target.closePath();
  target.fill();
  target.stroke();

  target.strokeStyle = colors.light;
  target.globalAlpha = 0.38;
  target.lineWidth = 4;
  target.beginPath();
  target.moveTo(-10, -20);
  target.quadraticCurveTo(-17, 2, -2, 25);
  target.stroke();
  target.restore();
}

function drawSpriteWeaponSweep(target, type, pose, frame) {
  const start = pose.weaponStart;
  const end = pose.weaponEnd;
  const midX = (start.x + end.x) / 2;
  const scythe = type === "queen";
  const spear = type === "horse";
  const club = type === "rook";
  const midY = Math.min(start.y, end.y) - (scythe ? 72 : spear ? 14 : 48);

  target.save();
  target.globalAlpha = scythe ? 0.42 : 0.32;
  target.strokeStyle = "#f7f7f7";
  target.lineWidth = scythe ? 22 : club ? 19 : 14;
  target.lineCap = "round";
  target.beginPath();
  target.moveTo(start.x - (spear ? 10 : 26), start.y - (spear ? 4 : 18));
  target.quadraticCurveTo(midX, midY, end.x + (scythe ? 28 : 0), end.y + (scythe ? -16 : 0));
  target.stroke();

  target.globalAlpha = 0.48;
  target.strokeStyle = "#8a8a8a";
  target.lineWidth = spear ? 3 : 5;
  target.beginPath();
  target.moveTo(start.x - 16, start.y - 12);
  target.quadraticCurveTo(midX + 8, midY + 20, end.x + 8, end.y + 4);
  target.stroke();
  target.restore();
}

function drawOrientedWeapon(target, start, end, drawLocal) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));

  target.save();
  target.translate(start.x, start.y);
  target.rotate(Math.atan2(dy, dx));
  drawLocal(target, length);
  target.restore();
}

function drawWeaponShaft(target, fromX, toX, width) {
  target.strokeStyle = "#050505";
  target.lineWidth = width;
  target.lineCap = "round";
  target.beginPath();
  target.moveTo(fromX, 0);
  target.lineTo(toX, 0);
  target.stroke();

  target.strokeStyle = "rgba(255, 248, 232, 0.28)";
  target.lineWidth = Math.max(2, width * 0.24);
  target.beginPath();
  target.moveTo(fromX + 4, -width * 0.18);
  target.lineTo(toX - 5, -width * 0.18);
  target.stroke();
}

function drawStickmanHeadgear(target, type, colors, head) {
  target.save();
  target.translate(head.x, head.y);
  target.strokeStyle = colors.stroke;
  target.fillStyle = colors.light;
  target.lineCap = "round";
  target.lineJoin = "round";
  target.lineWidth = 4;

  if (type === "pawn") {
    target.beginPath();
    target.arc(0, -30, 8, 0, Math.PI * 2);
    target.fill();
    target.stroke();
    target.restore();
    return;
  }

  if (type === "rook") {
    target.beginPath();
    target.rect(-24, -42, 48, 17);
    target.fill();
    target.stroke();
    for (let i = -1; i <= 1; i += 1) {
      target.beginPath();
      target.rect(i * 18 - 5, -52, 10, 15);
      target.fill();
      target.stroke();
    }
    target.restore();
    return;
  }

  if (type === "horse") {
    target.beginPath();
    target.moveTo(-18, -24);
    target.bezierCurveTo(-12, -58, 24, -58, 22, -28);
    target.bezierCurveTo(11, -35, -1, -35, -18, -24);
    target.closePath();
    target.fill();
    target.stroke();
    target.restore();
    return;
  }

  if (type === "bishop") {
    target.beginPath();
    target.ellipse(0, -36, 18, 23, 0.12, 0, Math.PI * 2);
    target.fill();
    target.stroke();
    target.strokeStyle = colors.ink;
    target.lineWidth = 3.5;
    target.beginPath();
    target.moveTo(0, -57);
    target.lineTo(0, -20);
    target.moveTo(-12, -43);
    target.lineTo(12, -43);
    target.stroke();
    target.restore();
    return;
  }

  if (type === "queen") {
    target.beginPath();
    target.moveTo(-29, -26);
    target.lineTo(-20, -48);
    target.lineTo(-7, -33);
    target.lineTo(0, -52);
    target.lineTo(8, -33);
    target.lineTo(20, -48);
    target.lineTo(29, -26);
    target.closePath();
    target.fill();
    target.stroke();
    target.restore();
    return;
  }

  target.beginPath();
  target.arc(0, -31, 9, 0, Math.PI * 2);
  target.fill();
  target.stroke();
  target.strokeStyle = colors.ink;
  target.lineWidth = 4;
  target.beginPath();
  target.moveTo(0, -58);
  target.lineTo(0, -22);
  target.moveTo(-13, -46);
  target.lineTo(13, -46);
  target.stroke();
  target.restore();
}

function drawSpriteTop(spriteCtx, type, colors) {
  spriteCtx.fillStyle = colors.light;
  spriteCtx.strokeStyle = colors.stroke;
  spriteCtx.lineWidth = 4;

  if (type === "pawn") {
    spriteCtx.beginPath();
    spriteCtx.arc(0, -132, 24, 0, Math.PI * 2);
    spriteCtx.fill();
    spriteCtx.stroke();
    return;
  }

  if (type === "rook") {
    spriteCtx.fillRect(-28, -146, 56, 28);
    spriteCtx.strokeRect(-28, -146, 56, 28);
    for (let i = -1; i <= 1; i += 1) {
      spriteCtx.fillRect(i * 20 - 6, -164, 12, 22);
      spriteCtx.strokeRect(i * 20 - 6, -164, 12, 22);
    }
    return;
  }

  if (type === "horse") {
    spriteCtx.beginPath();
    spriteCtx.moveTo(-24, -112);
    spriteCtx.bezierCurveTo(-10, -168, 42, -154, 20, -106);
    spriteCtx.bezierCurveTo(6, -120, -10, -118, -24, -112);
    spriteCtx.closePath();
    spriteCtx.fill();
    spriteCtx.stroke();
    return;
  }

  if (type === "bishop") {
    spriteCtx.beginPath();
    spriteCtx.ellipse(0, -132, 25, 36, 0.16, 0, Math.PI * 2);
    spriteCtx.fill();
    spriteCtx.stroke();
    spriteCtx.strokeStyle = colors.ink;
    spriteCtx.lineWidth = 4;
    spriteCtx.beginPath();
    spriteCtx.moveTo(0, -158);
    spriteCtx.lineTo(0, -106);
    spriteCtx.moveTo(-16, -132);
    spriteCtx.lineTo(16, -132);
    spriteCtx.stroke();
    return;
  }

  if (type === "queen") {
    for (let i = -2; i <= 2; i += 1) {
      spriteCtx.beginPath();
      spriteCtx.arc(i * 15, -160 - Math.abs(i) * 5, 8, 0, Math.PI * 2);
      spriteCtx.fill();
      spriteCtx.stroke();
    }
    spriteCtx.beginPath();
    spriteCtx.moveTo(-35, -148);
    spriteCtx.lineTo(35, -148);
    spriteCtx.lineTo(22, -116);
    spriteCtx.lineTo(-22, -116);
    spriteCtx.closePath();
    spriteCtx.fill();
    spriteCtx.stroke();
    return;
  }

  spriteCtx.beginPath();
  spriteCtx.arc(0, -134, 24, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.stroke();
  spriteCtx.strokeStyle = colors.ink;
  spriteCtx.lineWidth = 6;
  spriteCtx.beginPath();
  spriteCtx.moveTo(0, -172);
  spriteCtx.lineTo(0, -104);
  spriteCtx.moveTo(-20, -154);
  spriteCtx.lineTo(20, -154);
  spriteCtx.stroke();
}

function drawAttackTrail(fighter) {
  const progress = 1 - fighter.attackTimer / ARENA.attackDuration;
  ctx.globalAlpha = 0.45 * (1 - progress);
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(52, -76, 78, -0.85, 0.28 + progress * 0.72);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawDuelHeader() {
  const showoff = state.showoff;
  const timer = Math.ceil(showoff?.roundTimer ?? SHOWDOWN_ROUND_SECONDS);
  const attackerScore = showoff?.roundWins?.[showoff.attackerId] ?? 0;
  const defenderScore = showoff?.roundWins?.[showoff.defenderId] ?? 0;
  ctx.save();
  ctx.fillStyle = "rgba(31, 26, 23, 0.74)";
  roundRect(98, 32, 764, 62, 18);
  ctx.fill();
  ctx.fillStyle = "#fff8e8";
  ctx.font = "700 21px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = showoff?.started === false
    ? `Showdown starts in ${Math.ceil(showoff.introTimer ?? SHOWDOWN_INTRO_SECONDS)}`
    : `Round ${showoff?.round ?? 1}/3   ${timer}s   Score ${attackerScore}-${defenderScore}   First to 2 wins`;
  ctx.fillText(label, 480, 63);
  ctx.restore();
}

function drawShowdownStateBanner() {
  const showoff = state.showoff;
  if (!showoff) {
    return;
  }

  if (!showoff.started) {
    const attacker = getPieceById(state.pieces, showoff.attackerId);
    const defender = getPieceById(state.pieces, showoff.defenderId);
    const attackerName = attacker ? describePiece(attacker) : "Attacker";
    const defenderName = defender ? describePiece(defender) : "Defender";
    const countdown = Math.ceil(showoff.introTimer ?? SHOWDOWN_INTRO_SECONDS);
    drawShowdownBanner("SHOWDOWN INITIATED", `${attackerName} vs ${defenderName}`, `Combat starts in ${countdown}`);
    return;
  }

  if (showoff.ended) {
    const winner = getPieceById(state.pieces, showoff.roundWinnerId);
    const score = `${showoff.roundWins?.[showoff.attackerId] ?? 0}-${showoff.roundWins?.[showoff.defenderId] ?? 0}`;
    const title = showoff.finished ? "SHOWDOWN WON" : "ROUND FINISHED";
    const detail = winner ? `${describePiece(winner)} wins round ${showoff.round}` : `Round ${showoff.round} finished`;
    drawShowdownBanner(title, detail, `Score ${score}`);
  }
}

function drawCombatBanner() {
  if (!state.combatBanner) {
    return;
  }

  const alpha = Math.min(1, state.combatBanner.timer / 0.28);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#ff2f3d";
  ctx.font = "900 70px Georgia, serif";
  ctx.fillText(state.combatBanner.title, canvas.width / 2, 292);
  ctx.fillStyle = "#fff8e8";
  ctx.font = "900 22px Inter, Arial, sans-serif";
  ctx.fillText(state.combatBanner.detail, canvas.width / 2, 344);
  ctx.restore();
}

function drawShowdownBanner(title, detail, subdetail) {
  ctx.save();
  ctx.fillStyle = "rgba(23, 21, 18, 0.58)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const width = 700;
  const height = 190;
  const x = (canvas.width - width) / 2;
  const y = 242;
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 32;
  ctx.fillStyle = "rgba(46, 29, 21, 0.96)";
  roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffd166";
  ctx.font = "900 42px Georgia, serif";
  ctx.fillText(title, canvas.width / 2, y + 58);

  ctx.fillStyle = "#fff8e8";
  ctx.font = "800 25px Inter, Arial, sans-serif";
  ctx.fillText(detail, canvas.width / 2, y + 112);

  ctx.fillStyle = "#c9bfa9";
  ctx.font = "800 20px Inter, Arial, sans-serif";
  ctx.fillText(subdetail, canvas.width / 2, y + 152);
  ctx.restore();
}

function drawFloatingText() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const item of state.floatingText) {
    ctx.globalAlpha = Math.max(0, item.life / 0.85);
    ctx.fillStyle = item.color;
    ctx.font = "800 28px Inter, Arial, sans-serif";
    ctx.fillText(item.text, getShowdownViewX(item.x), item.y);
  }

  ctx.restore();
}

function drawAnnouncement() {
  if (!state.announcement) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(23, 21, 18, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const width = 650;
  const height = 170;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "rgba(46, 29, 21, 0.95)";
  roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#ffd166";
  ctx.font = "900 38px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.announcement.title, canvas.width / 2, y + 58);

  ctx.fillStyle = "#fff8e8";
  ctx.font = "700 20px Inter, Arial, sans-serif";
  wrapCanvasText(state.announcement.detail, canvas.width / 2, y + 104, width - 68, 26);
  ctx.restore();
}

function wrapCanvasText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }

  if (line) {
    ctx.fillText(line, x, currentY);
  }
}

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function toSquareName(x, y) {
  return `${String.fromCharCode(65 + x)}${8 - y}`;
}

function applyDamageBonus(baseDamage, bonus) {
  if (bonus === 0) {
    return baseDamage;
  }

  return roundDamage(baseDamage * (1 + bonus));
}

function getStrengthDamageBonus(piece) {
  return piece.strengthShowdowns > 0 ? 0.1 : 0;
}

function roundDamage(value) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPercent(value) {
  return value === 0 ? "Fixed" : `+${Math.round(value * 100)}%`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

boot();
