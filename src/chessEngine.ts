export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type Square = string; // 'a1' .. 'h8'

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export type BoardMap = Record<Square, ChessPiece>;

export interface ArrowOverlay {
  from: Square;
  to: Square;
  color: 'green' | 'red' | 'gold';
}

export interface AppleBadgeOverlay {
  square: Square;
  label: string; // e.g. '🍎1', '🍎3', '🍎5', '🍎9', '👑'
}

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const PIECE_APPLE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

export const PIECE_NAMES_RU: Record<PieceType, string> = {
  p: 'Пешка',
  r: 'Ладья',
  n: 'Конь',
  b: 'Слон',
  q: 'Ферзь',
  k: 'Король',
};

export const PIECE_NOTATION_RU: Record<PieceType, string> = {
  p: '',
  r: 'Л',
  n: 'К',
  b: 'С',
  q: 'Ф',
  k: 'Кр',
};

export function squareToCoords(sq: Square): { file: number; rank: number } | null {
  if (!sq || sq.length !== 2) return null;
  const file = FILES.indexOf(sq[0] as (typeof FILES)[number]);
  const rank = RANKS.indexOf(sq[1] as (typeof RANKS)[number]);
  if (file === -1 || rank === -1) return null;
  return { file, rank };
}

export function coordsToSquare(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES[file]}${RANKS[rank]}`;
}

export function isLightSquare(sq: Square): boolean {
  const coords = squareToCoords(sq);
  if (!coords) return false;
  return (coords.file + coords.rank) % 2 === 1;
}

export function cloneBoard(board: BoardMap): BoardMap {
  const next: BoardMap = {};
  for (const [k, v] of Object.entries(board)) {
    if (v) next[k] = { ...v };
  }
  return next;
}

/**
 * Parses compact diagram setup string like:
 * "w:Kh1,Re1,Bf6,Pc7;b:Ke8,Rf8,Be6,Pb7,Pf7,Pg7,Ph7"
 */
export function parseCompactSetup(setup: string): BoardMap {
  const board: BoardMap = {};
  const parts = setup.split(';').map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const [colorPrefix, listStr] = part.split(':').map((s) => s.trim());
    const color: PieceColor = colorPrefix === 'b' ? 'b' : 'w';
    if (!listStr) continue;
    const items = listStr.split(',').map((s) => s.trim()).filter(Boolean);
    for (const item of items) {
      if (item.length === 3) {
        const pChar = item[0].toLowerCase() as PieceType;
        const sq = item.slice(1).toLowerCase();
        if (['p', 'r', 'n', 'b', 'q', 'k'].includes(pChar) && squareToCoords(sq)) {
          board[sq] = { type: pChar, color };
        }
      } else if (item.length === 2) {
        const sq = item.toLowerCase();
        if (squareToCoords(sq)) {
          board[sq] = { type: 'p', color };
        }
      }
    }
  }
  return board;
}

export function createInitialBoard(): BoardMap {
  return parseCompactSetup(
    'w:Ra1,Nb1,Bc1,Qd1,Ke1,Bf1,Ng1,Rh1,Pa2,Pb2,Pc2,Pd2,Pe2,Pf2,Pg2,Ph2;' +
    'b:Ra8,Nb8,Bc8,Qd8,Ke8,Bf8,Ng8,Rh8,Pa7,Pb7,Pc7,Pd7,Pe7,Pf7,Pg7,Ph7'
  );
}

export function isSquareAttacked(board: BoardMap, targetSq: Square, byColor: PieceColor): boolean {
  const target = squareToCoords(targetSq);
  if (!target) return false;

  for (const [sq, piece] of Object.entries(board)) {
    if (!piece || piece.color !== byColor) continue;
    const from = squareToCoords(sq);
    if (!from) continue;

    const df = target.file - from.file;
    const dr = target.rank - from.rank;
    const adf = Math.abs(df);
    const adr = Math.abs(dr);

    if (piece.type === 'p') {
      const dir = byColor === 'w' ? 1 : -1;
      if (dr === dir && adf === 1) return true;
    } else if (piece.type === 'n') {
      if ((adf === 1 && adr === 2) || (adf === 2 && adr === 1)) return true;
    } else if (piece.type === 'k') {
      if (adf <= 1 && adr <= 1 && (adf + adr > 0)) return true;
    } else if (piece.type === 'r' || piece.type === 'b' || piece.type === 'q') {
      const isOrtho = df === 0 || dr === 0;
      const isDiag = adf === adr && adf > 0;
      if (piece.type === 'r' && !isOrtho) continue;
      if (piece.type === 'b' && !isDiag) continue;
      if (piece.type === 'q' && !isOrtho && !isDiag) continue;
      if (df === 0 && dr === 0) continue;

      const stepF = Math.sign(df);
      const stepR = Math.sign(dr);
      let curF = from.file + stepF;
      let curR = from.rank + stepR;
      let blocked = false;
      while (curF !== target.file || curR !== target.rank) {
        const midSq = coordsToSquare(curF, curR);
        if (midSq && board[midSq]) {
          blocked = true;
          break;
        }
        curF += stepF;
        curR += stepR;
      }
      if (!blocked) return true;
    }
  }

  return false;
}

export function findKingSquare(board: BoardMap, color: PieceColor): Square | null {
  for (const [sq, piece] of Object.entries(board)) {
    if (piece && piece.color === color && piece.type === 'k') {
      return sq;
    }
  }
  return null;
}

export function isInCheck(board: BoardMap, color: PieceColor): boolean {
  const kingSq = findKingSquare(board, color);
  if (!kingSq) return false;
  const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingSq, enemyColor);
}

export function getPseudoLegalMoves(board: BoardMap, fromSq: Square): Square[] {
  const piece = board[fromSq];
  if (!piece) return [];
  const from = squareToCoords(fromSq);
  if (!from) return [];

  const moves: Square[] = [];
  const { file, rank } = from;
  const color = piece.color;
  const enemy: PieceColor = color === 'w' ? 'b' : 'w';

  const addIfValid = (f: number, r: number): boolean => {
    const sq = coordsToSquare(f, r);
    if (!sq) return false;
    const occ = board[sq];
    if (!occ) {
      moves.push(sq);
      return true;
    }
    if (occ.color !== color) {
      moves.push(sq);
    }
    return false;
  };

  if (piece.type === 'p') {
    const dir = color === 'w' ? 1 : -1;
    const startRank = color === 'w' ? 1 : 6;
    const oneStep = coordsToSquare(file, rank + dir);
    if (oneStep && !board[oneStep]) {
      moves.push(oneStep);
      const twoStep = coordsToSquare(file, rank + dir * 2);
      if (rank === startRank && twoStep && !board[twoStep]) {
        moves.push(twoStep);
      }
    }
    for (const df of [-1, 1]) {
      const capSq = coordsToSquare(file + df, rank + dir);
      if (capSq && board[capSq] && board[capSq].color === enemy) {
        moves.push(capSq);
      }
    }
  } else if (piece.type === 'n') {
    const jumps = [
      [1, 2], [2, 1], [2, -1], [1, -2],
      [-1, -2], [-2, -1], [-2, 1], [-1, 2],
    ];
    for (const [df, dr] of jumps) {
      addIfValid(file + df, rank + dr);
    }
  } else if (piece.type === 'k') {
    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        addIfValid(file + df, rank + dr);
      }
    }
    // Castling
    const homeRank = color === 'w' ? '1' : '8';
    if (fromSq === `e${homeRank}` && !piece.hasMoved) {
      // Short castling O-O
      const rookH = board[`h${homeRank}`];
      if (
        rookH &&
        rookH.type === 'r' &&
        rookH.color === color &&
        !rookH.hasMoved &&
        !board[`f${homeRank}`] &&
        !board[`g${homeRank}`] &&
        !isSquareAttacked(board, `f${homeRank}`, enemy) &&
        !isSquareAttacked(board, `g${homeRank}`, enemy)
      ) {
        moves.push(`g${homeRank}`);
      }
      // Long castling O-O-O
      const rookA = board[`a${homeRank}`];
      if (
        rookA &&
        rookA.type === 'r' &&
        rookA.color === color &&
        !rookA.hasMoved &&
        !board[`d${homeRank}`] &&
        !board[`c${homeRank}`] &&
        !board[`b${homeRank}`] &&
        !isSquareAttacked(board, `d${homeRank}`, enemy) &&
        !isSquareAttacked(board, `c${homeRank}`, enemy)
      ) {
        moves.push(`c${homeRank}`);
      }
    }
  } else {
    const dirs: Array<[number, number]> = [];
    if (piece.type === 'r' || piece.type === 'q') {
      dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    }
    if (piece.type === 'b' || piece.type === 'q') {
      dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }
    for (const [df, dr] of dirs) {
      let f = file + df;
      let r = rank + dr;
      while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
        if (!addIfValid(f, r)) break;
        f += df;
        r += dr;
      }
    }
  }

  return moves;
}

export function applyMove(
  board: BoardMap,
  fromSq: Square,
  toSq: Square,
  promotionPiece: PieceType = 'q'
): {
  board: BoardMap;
  captured?: ChessPiece;
  promotedTo?: PieceType;
  isCastling?: 'short' | 'long';
  notation: string;
} {
  const next = cloneBoard(board);
  const moving = next[fromSq];
  if (!moving) {
    return { board: next, notation: `${fromSq} → ${toSq}` };
  }

  const captured = next[toSq];
  delete next[fromSq];

  let isCastling: 'short' | 'long' | undefined;
  let promotedTo: PieceType | undefined;

  if (moving.type === 'k') {
    if ((fromSq === 'e1' && toSq === 'g1') || (fromSq === 'e8' && toSq === 'g8')) {
      const rank = fromSq[1];
      const rook = next[`h${rank}`];
      if (rook) {
        delete next[`h${rank}`];
        next[`f${rank}`] = { ...rook, hasMoved: true };
      }
      isCastling = 'short';
    } else if ((fromSq === 'e1' && toSq === 'c1') || (fromSq === 'e8' && toSq === 'c8')) {
      const rank = fromSq[1];
      const rook = next[`a${rank}`];
      if (rook) {
        delete next[`a${rank}`];
        next[`d${rank}`] = { ...rook, hasMoved: true };
      }
      isCastling = 'long';
    }
  }

  const targetRank = toSq[1];
  if (moving.type === 'p' && ((moving.color === 'w' && targetRank === '8') || (moving.color === 'b' && targetRank === '1'))) {
    promotedTo = promotionPiece;
    next[toSq] = { type: promotionPiece, color: moving.color, hasMoved: true };
  } else {
    next[toSq] = { ...moving, hasMoved: true };
  }

  let notation = `${PIECE_NOTATION_RU[moving.type]}${fromSq} → ${toSq}`;
  if (isCastling === 'short') notation = '0-0';
  if (isCastling === 'long') notation = '0-0-0';
  if (promotedTo) notation += PIECE_NOTATION_RU[promotedTo];

  return { board: next, captured, promotedTo, isCastling, notation };
}

export function getLegalMovesForSquare(board: BoardMap, fromSq: Square): Square[] {
  const piece = board[fromSq];
  if (!piece) return [];
  const pseudo = getPseudoLegalMoves(board, fromSq);
  const hasOwnKing = !!findKingSquare(board, piece.color);

  return pseudo.filter((toSq) => {
    const targetPiece = board[toSq];
    // Never capture a King directly
    if (targetPiece && targetPiece.type === 'k') return false;

    if (!hasOwnKing) return true;
    const { board: after } = applyMove(board, fromSq, toSq);
    return !isInCheck(after, piece.color);
  });
}

export function getAllLegalMoves(
  board: BoardMap,
  color: PieceColor
): Array<{ from: Square; to: Square }> {
  const all: Array<{ from: Square; to: Square }> = [];
  for (const [sq, piece] of Object.entries(board)) {
    if (piece && piece.color === color) {
      const legals = getLegalMovesForSquare(board, sq);
      for (const to of legals) {
        all.push({ from: sq, to });
      }
    }
  }
  return all;
}

export function isCheckmate(board: BoardMap, colorToMove: PieceColor): boolean {
  if (!isInCheck(board, colorToMove)) return false;
  return getAllLegalMoves(board, colorToMove).length === 0;
}

export function isStalemate(board: BoardMap, colorToMove: PieceColor): boolean {
  if (isInCheck(board, colorToMove)) return false;
  const hasPiece = Object.values(board).some((p) => p && p.color === colorToMove);
  if (!hasPiece) return false;
  return getAllLegalMoves(board, colorToMove).length === 0;
}

/**
 * Procedural generator for Practice 2.1 (Rook & Queen routes) and 2.2 (Bishop & Knight routes)
 * Guarantees 3 reachable apple targets within the move limit!
 */
export function generatePracticeTargets(
  mode: 'rook_queen' | 'bishop_knight',
  variantIndex: number
): {
  board: BoardMap;
  targets: Square[];
  maxMoves: number;
  startSquare: Square;
  pieceType: PieceType;
  titleHint: string;
} {
  if (mode === 'rook_queen') {
    const presets: Array<{
      pieceType: PieceType;
      startSquare: Square;
      targets: Square[];
      maxMoves: number;
      titleHint: string;
    }> = [
      {
        pieceType: 'r',
        startSquare: 'a1',
        targets: ['a6', 'f6', 'f2'],
        maxMoves: 4,
        titleHint: 'Ладья выходит на маршрут! Собери все 3 яблока за 4 хода по прямым линиям.',
      },
      {
        pieceType: 'q',
        startSquare: 'd1',
        targets: ['d5', 'h5', 'e8'],
        maxMoves: 4,
        titleHint: 'Ферзь сочетает прямые линии и диагонали! Собери 3 яблока за 4 хода.',
      },
      {
        pieceType: 'r',
        startSquare: 'd4',
        targets: ['d8', 'h8', 'h2'],
        maxMoves: 4,
        titleHint: 'Маршрут Ладьи из центра d4: собери 3 яблока не более чем за 4 хода.',
      },
      {
        pieceType: 'q',
        startSquare: 'a2',
        targets: ['f7', 'b7', 'b1'],
        maxMoves: 4,
        titleHint: 'Диагональный прорыв Ферзя! Собери все 3 яблока за 4 хода.',
      },
    ];
    const p = presets[variantIndex % presets.length];
    return {
      board: { [p.startSquare]: { type: p.pieceType, color: 'w' } },
      targets: [...p.targets],
      maxMoves: p.maxMoves,
      startSquare: p.startSquare,
      pieceType: p.pieceType,
      titleHint: p.titleHint,
    };
  } else {
    // Bishop targets are strictly on the SAME square color!
    const presets: Array<{
      pieceType: PieceType;
      startSquare: Square;
      targets: Square[];
      maxMoves: number;
      titleHint: string;
    }> = [
      {
        pieceType: 'b',
        startSquare: 'c1', // dark square
        targets: ['g5', 'e7', 'a3'], // all dark squares reachable sequentially
        maxMoves: 4,
        titleHint: 'Слон ходит только по своим клеткам! Собери все 3 яблока по диагоналям за 4 хода.',
      },
      {
        pieceType: 'n',
        startSquare: 'b1',
        targets: ['c3', 'e4', 'f6'],
        maxMoves: 4,
        titleHint: 'Конь скачет буквой «Г»! Собери 3 яблока за 4 прыжка.',
      },
      {
        pieceType: 'b',
        startSquare: 'f1', // light square
        targets: ['b5', 'e8', 'h5'], // all light squares
        maxMoves: 4,
        titleHint: 'Белопольный Слон: собери 3 яблока на светлых диагоналях за 4 хода.',
      },
      {
        pieceType: 'n',
        startSquare: 'g1',
        targets: ['f3', 'd4', 'c6'],
        maxMoves: 4,
        titleHint: 'Марш-бросок Коня: собери все 3 яблока точными прыжками буквы «Г»!',
      },
    ];
    const p = presets[variantIndex % presets.length];
    return {
      board: { [p.startSquare]: { type: p.pieceType, color: 'w' } },
      targets: [...p.targets],
      maxMoves: p.maxMoves,
      startSquare: p.startSquare,
      pieceType: p.pieceType,
      titleHint: p.titleHint,
    };
  }
}

/**
 * Helper for 2.10 Task 3 (Anti-Stalemate sparring: White Kc5, Qd5 vs Black Ka8)
 * Picks a legal move for Black King that stays alive as long as possible.
 */
export function getBlackSparringMove(board: BoardMap): { from: Square; to: Square } | null {
  const moves = getAllLegalMoves(board, 'b');
  if (moves.length === 0) return null;
  // Prefer moves toward center to make it realistic
  moves.sort((a, b) => {
    const ca = squareToCoords(a.to)!;
    const cb = squareToCoords(b.to)!;
    const distA = Math.abs(ca.file - 3.5) + Math.abs(ca.rank - 3.5);
    const distB = Math.abs(cb.file - 3.5) + Math.abs(cb.rank - 3.5);
    return distA - distB;
  });
  return moves[0];
}

// ============================================================================
// WIZARD CHESS 2.5D CHOREOGRAPHY & PHYSICS ENGINE HELPERS
// ============================================================================

export function easeInOutCubic(x: number): number {
  const clamped = Math.max(0, Math.min(1, x));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

export function calculateSquaresMoved(fromSq: Square, toSq: Square): number {
  const c1 = squareToCoords(fromSq);
  const c2 = squareToCoords(toSq);
  if (!c1 || !c2) return 1;
  return Math.max(Math.abs(c2.file - c1.file), Math.abs(c2.rank - c1.rank));
}

export function calculateMoveDurationMs(fromSq: Square, toSq: Square): number {
  const squaresMoved = calculateSquaresMoved(fromSq, toSq);
  return Math.round((0.38 + Math.max(0, squaresMoved - 1) * 0.065) * 1000);
}

export interface CheckmateToppleFrame {
  phase: 'stagger' | 'topple' | 'impact' | 'settled';
  angleDeg: number;
  boardShakePx: number;
  ringScale: number;
  ringOpacity: number;
}

/**
 * 3-Phase Checkmate Topple Physics for the defeated enemy King:
 * - Phase 1 (stagger, 0-300ms): double red-gold ring, King trembles rotateZ(sin(t) * 6deg)
 * - Phase 2 (topple, 300-950ms): gravity acceleration Math.pow(u, 2.25) to 84deg around bottom center
 * - Phase 3 (impact, 950-1350ms): damped crown bounce off the board + 2px board shake
 */
export function computeCheckmateToppleState(elapsedMs: number): CheckmateToppleFrame {
  if (elapsedMs <= 0) {
    return { phase: 'stagger', angleDeg: 0, boardShakePx: 0, ringScale: 1, ringOpacity: 1 };
  }
  if (elapsedMs < 300) {
    const t = (elapsedMs / 300) * Math.PI * 6;
    const angleDeg = Math.sin(t) * 6;
    const ringScale = 1 + 0.14 * Math.sin((elapsedMs / 300) * Math.PI * 2);
    return {
      phase: 'stagger',
      angleDeg,
      boardShakePx: 0,
      ringScale,
      ringOpacity: 1,
    };
  }
  if (elapsedMs < 950) {
    const u = Math.max(0, Math.min(1, (elapsedMs - 300) / 650));
    const angleDeg = Math.pow(u, 2.25) * 84;
    return {
      phase: 'topple',
      angleDeg,
      boardShakePx: 0,
      ringScale: 1.08,
      ringOpacity: 0.95,
    };
  }
  if (elapsedMs < 1350) {
    const u = Math.max(0, Math.min(1, (elapsedMs - 950) / 400));
    const bounce = Math.abs(Math.sin(u * Math.PI * 2.5)) * (1 - u) * 10;
    const angleDeg = 84 - bounce;
    const boardShakePx = Math.sin(u * Math.PI * 4) * (1 - u) * 2;
    return {
      phase: 'impact',
      angleDeg,
      boardShakePx,
      ringScale: 1.12,
      ringOpacity: 0.85 - u * 0.2,
    };
  }
  return {
    phase: 'settled',
    angleDeg: 84,
    boardShakePx: 0,
    ringScale: 1.05,
    ringOpacity: 0.65,
  };
}

export interface BystanderYieldSpec {
  square: Square;
  maxDxPx: number;
  maxDyPx: number;
  peakU: number;
}

/**
 * Computes which neighboring pieces ("Живые соседи" / bystanders yield) are within <= 1 square
 * of a long-range sliding piece's path (Bishop, Rook, Queen) and which direction (3-4px) they sway.
 */
export function computeBystanderYields(
  board: BoardMap,
  fromSq: Square,
  toSq: Square,
  movingPieceType: PieceType,
  isFlipped: boolean = false
): Record<Square, BystanderYieldSpec> {
  if (movingPieceType !== 'b' && movingPieceType !== 'r' && movingPieceType !== 'q') {
    return {};
  }
  const c1 = squareToCoords(fromSq);
  const c2 = squareToCoords(toSq);
  if (!c1 || !c2) return {};

  const vx = c2.file - c1.file;
  const vy = c2.rank - c1.rank;
  const segLenSq = vx * vx + vy * vy;
  if (segLenSq < 2) return {}; // Only multi-square slides have intermediate bystanders

  const result: Record<Square, BystanderYieldSpec> = {};
  const flipSign = isFlipped ? -1 : 1;

  for (const [sq, piece] of Object.entries(board)) {
    if (!piece || sq === fromSq || sq === toSq) continue;
    const cp = squareToCoords(sq);
    if (!cp) continue;

    // Project cp onto segment c1 -> c2
    const wx = cp.file - c1.file;
    const wy = cp.rank - c1.rank;
    const t = (wx * vx + wy * vy) / segLenSq;
    if (t <= 0.05 || t >= 0.95) continue;

    const projX = c1.file + t * vx;
    const projY = c1.rank + t * vy;
    const ox = cp.file - projX;
    const oy = cp.rank - projY;
    const dist = Math.hypot(ox, oy);

    if (dist > 0.01 && dist <= 1.05) {
      const ux = ox / dist;
      const uy = oy / dist;
      const magPx = 3.8; // 3-4px sway away from flight line
      // Convert file/rank offset to screen X/Y (rank increases upward on unflipped board, so screen Y is -uy)
      const maxDxPx = ux * magPx * flipSign;
      const maxDyPx = -uy * magPx * flipSign;
      result[sq] = {
        square: sq,
        maxDxPx,
        maxDyPx,
        peakU: t,
      };
    }
  }

  return result;
}

export interface ShatterFragment {
  id: number;
  vx: number;
  vy: number;
  gravity: number;
  rotDeg: number;
  sizePx: number;
  color: string;
}

/**
 * Generates 14-18 wooden/stone shatter fragments for a captured piece:
 * - White captured piece -> warm ivory/stone (#E6DFD0 / #FFFDF7)
 * - Black captured piece -> deep graphite/slate (#222630 / #334155)
 */
export function generateCaptureShatterParticles(
  capturedColor: PieceColor,
  count: number = 16
): ShatterFragment[] {
  const safeCount = Math.max(14, Math.min(18, count));
  const primaryColor = capturedColor === 'w' ? '#E6DFD0' : '#222630';
  const accentColor = capturedColor === 'w' ? '#FFFDF7' : '#334155';
  const fragments: ShatterFragment[] = [];

  for (let i = 0; i < safeCount; i++) {
    const angle = (i / safeCount) * Math.PI * 2 + (i % 3) * 0.18;
    const speed = 34 + (i % 4) * 11;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 22; // Initial upward burst before parabolic gravity pulls down
    fragments.push({
      id: i,
      vx,
      vy,
      gravity: 110,
      rotDeg: (i * 47) % 360,
      sizePx: 4 + (i % 3) * 1.5,
      color: i % 3 === 0 ? accentColor : primaryColor,
    });
  }

  return fragments;
}

