export const BOARD_SIZE = 8;

export const TEAM = {
  WHITE: "white",
  BLACK: "black"
};

export const PIECE_STATS = {
  pawn: { name: "Pawn", short: "P", hp: 100, value: 1, weapon: "Fists", damageBonus: 0 },
  rook: { name: "Rook", short: "R", hp: 115, value: 5, weapon: "Spike Club", damageBonus: 0.04 },
  horse: { name: "Horse", short: "H", hp: 120, value: 3, weapon: "Javelin", damageBonus: 0.05 },
  bishop: { name: "Bishop", short: "B", hp: 130, value: 3, weapon: "Cross", damageBonus: 0.07 },
  queen: { name: "Queen", short: "Q", hp: 150, value: 9, weapon: "Scythe", damageBonus: 0.12 },
  king: { name: "King", short: "K", hp: 200, value: 100, weapon: "Sword & Shield", damageBonus: 0.15 }
};

const BACK_RANK = ["rook", "horse", "bishop", "queen", "king", "bishop", "horse", "rook"];

export function createInitialPieces() {
  let nextId = 1;
  const pieces = [];

  for (let x = 0; x < BOARD_SIZE; x += 1) {
    pieces.push(createPiece(nextId++, TEAM.BLACK, BACK_RANK[x], x, 0));
    pieces.push(createPiece(nextId++, TEAM.BLACK, "pawn", x, 1));
    pieces.push(createPiece(nextId++, TEAM.WHITE, "pawn", x, 6));
    pieces.push(createPiece(nextId++, TEAM.WHITE, BACK_RANK[x], x, 7));
  }

  return pieces;
}

function createPiece(id, team, type, x, y) {
  const stat = PIECE_STATS[type];
  return {
    id,
    team,
    type,
    x,
    y,
    hp: stat.hp,
    maxHp: stat.hp,
    mana: 0,
    smashShowdowns: 0,
    hasMoved: false
  };
}

export function otherTeam(team) {
  return team === TEAM.WHITE ? TEAM.BLACK : TEAM.WHITE;
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
}

export function getPieceAt(pieces, x, y) {
  return pieces.find((piece) => piece.x === x && piece.y === y) ?? null;
}

export function getPieceById(pieces, id) {
  return pieces.find((piece) => piece.id === id) ?? null;
}

export function describePiece(piece) {
  const stat = PIECE_STATS[piece.type];
  return `${capitalize(piece.team)} ${stat.name}`;
}

export function getLegalMoves(pieces, piece) {
  if (!piece) {
    return [];
  }

  switch (piece.type) {
    case "pawn":
      return getPawnMoves(pieces, piece);
    case "rook":
      return getSlidingMoves(pieces, piece, [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]);
    case "bishop":
      return getSlidingMoves(pieces, piece, [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ]);
    case "queen":
      return getSlidingMoves(pieces, piece, [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ]);
    case "horse":
      return getJumpMoves(pieces, piece, [
        [1, 2],
        [2, 1],
        [2, -1],
        [1, -2],
        [-1, -2],
        [-2, -1],
        [-2, 1],
        [-1, 2]
      ]);
    case "king":
      return getJumpMoves(pieces, piece, [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
        [1, -1]
      ]);
    default:
      return [];
  }
}

export function getAllLegalMoves(pieces, team) {
  return pieces
    .filter((piece) => piece.team === team)
    .flatMap((piece) => getLegalMoves(pieces, piece).map((move) => ({ ...move, pieceId: piece.id })));
}

export function getWinner(pieces) {
  const whiteKing = pieces.some((piece) => piece.team === TEAM.WHITE && piece.type === "king");
  const blackKing = pieces.some((piece) => piece.team === TEAM.BLACK && piece.type === "king");

  if (!whiteKing) {
    return TEAM.BLACK;
  }

  if (!blackKing) {
    return TEAM.WHITE;
  }

  return null;
}

function getPawnMoves(pieces, piece) {
  const direction = piece.team === TEAM.WHITE ? -1 : 1;
  const startRow = piece.team === TEAM.WHITE ? 6 : 1;
  const moves = [];
  const oneY = piece.y + direction;

  if (inBounds(piece.x, oneY) && !getPieceAt(pieces, piece.x, oneY)) {
    moves.push(createMove(piece.x, oneY, null));

    const twoY = piece.y + direction * 2;
    if (piece.y === startRow && !piece.hasMoved && inBounds(piece.x, twoY) && !getPieceAt(pieces, piece.x, twoY)) {
      moves.push(createMove(piece.x, twoY, null));
    }
  }

  for (const dx of [-1, 1]) {
    const targetX = piece.x + dx;
    const targetY = piece.y + direction;
    const target = getPieceAt(pieces, targetX, targetY);

    if (target && target.team !== piece.team) {
      moves.push(createMove(targetX, targetY, target));
    }
  }

  return moves;
}

function getSlidingMoves(pieces, piece, directions) {
  const moves = [];

  for (const [dx, dy] of directions) {
    let x = piece.x + dx;
    let y = piece.y + dy;

    while (inBounds(x, y)) {
      const target = getPieceAt(pieces, x, y);

      if (!target) {
        moves.push(createMove(x, y, null));
      } else {
        if (target.team !== piece.team) {
          moves.push(createMove(x, y, target));
        }
        break;
      }

      x += dx;
      y += dy;
    }
  }

  return moves;
}

function getJumpMoves(pieces, piece, offsets) {
  const moves = [];

  for (const [dx, dy] of offsets) {
    const x = piece.x + dx;
    const y = piece.y + dy;

    if (!inBounds(x, y)) {
      continue;
    }

    const target = getPieceAt(pieces, x, y);
    if (!target || target.team !== piece.team) {
      moves.push(createMove(x, y, target));
    }
  }

  return moves;
}

function createMove(x, y, target) {
  return {
    x,
    y,
    capture: Boolean(target),
    targetId: target?.id ?? null
  };
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
