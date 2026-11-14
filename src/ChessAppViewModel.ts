import {
  BoardMap,
  BystanderYieldSpec,
  ChessPiece,
  PieceColor,
  ShatterFragment,
  Square,
  calculateMoveDurationMs,
  computeBystanderYields,
  findKingSquare,
  generateCaptureShatterParticles,
} from './chessEngine';

export interface ActiveMoveChoreography {
  id: string;
  from: Square;
  to: Square;
  piece: ChessPiece;
  durationMs: number;
  startedAt: number;
  isKnightJump: boolean;
  castlingRook?: {
    from: Square;
    to: Square;
    piece: ChessPiece;
  };
  bystanders: Record<Square, BystanderYieldSpec>;
}

export interface CaptureShatterEffect {
  id: string;
  square: Square;
  capturedColor: PieceColor;
  fragments: ShatterFragment[];
  startedAt: number;
  durationMs: number;
}

export interface CheckmateToppleEffect {
  id: string;
  kingSquare: Square;
  kingColor: PieceColor;
  startedAt: number;
}

/**
 * ChessAppViewModel — orchestrates the 5 physical & choreographic mechanics
 * (Wizard Chess style adapted for 2.5D Staunton pieces):
 * 1. triggerCheckmateTopple (3-phase stagger -> gravity topple 84deg -> crown bounce + 2px board shake)
 * 2. spawnCaptureShatter (golden-fiery ring + 14-18 parabolic fragments of #E6DFD0 or #222630 over 650ms)
 * 3. createMoveChoreography (easeInOutCubic duration, Knight parabolic 28px arc, Bystanders yield 3-4px, simultaneous Castling with 18px Rook arc)
 * 4. preMoveHighlight (420ms pedagogical amber ring on opponent's piece before reply flight)
 */
export class ChessAppViewModel {
  public static readonly PRE_MOVE_HIGHLIGHT_MS = 420;
  public static readonly CAPTURE_SHATTER_MS = 650;
  public static readonly BLITZ_CHOREO_MAX_MS = 200;

  public static createMoveChoreography(
    boardBefore: BoardMap,
    from: Square,
    to: Square,
    playerColorPerspective: PieceColor,
    nowMs: number = typeof performance !== 'undefined' ? performance.now() : Date.now(),
    isBlitzMode: boolean = false
  ): ActiveMoveChoreography | null {
    const piece = boardBefore[from];
    if (!piece) return null;

    const isFlipped = playerColorPerspective === 'b';
    const rawDurationMs = calculateMoveDurationMs(from, to);
    const durationMs = isBlitzMode
      ? Math.min(this.BLITZ_CHOREO_MAX_MS, rawDurationMs)
      : rawDurationMs;
    const isKnightJump = piece.type === 'n';
    const bystanders = computeBystanderYields(boardBefore, from, to, piece.type, isFlipped);

    let castlingRook: ActiveMoveChoreography['castlingRook'] = undefined;
    if (piece.type === 'k') {
      const rank = from[1];
      if ((from === 'e1' && to === 'g1') || (from === 'e8' && to === 'g8')) {
        const rookPiece = boardBefore[`h${rank}`];
        if (rookPiece) {
          castlingRook = {
            from: `h${rank}`,
            to: `f${rank}`,
            piece: { ...rookPiece },
          };
        }
      } else if ((from === 'e1' && to === 'c1') || (from === 'e8' && to === 'c8')) {
        const rookPiece = boardBefore[`a${rank}`];
        if (rookPiece) {
          castlingRook = {
            from: `a${rank}`,
            to: `d${rank}`,
            piece: { ...rookPiece },
          };
        }
      }
    }

    return {
      id: `move_${from}_${to}_${nowMs}`,
      from,
      to,
      piece: { ...piece },
      durationMs,
      startedAt: nowMs,
      isKnightJump,
      castlingRook,
      bystanders,
    };
  }

  public static spawnCaptureShatter(
    square: Square,
    capturedColor: PieceColor,
    nowMs: number = typeof performance !== 'undefined' ? performance.now() : Date.now(),
    isBlitzMode: boolean = false
  ): CaptureShatterEffect {
    return {
      id: `shatter_${square}_${nowMs}`,
      square,
      capturedColor,
      fragments: generateCaptureShatterParticles(capturedColor, 16),
      startedAt: nowMs,
      durationMs: isBlitzMode ? this.BLITZ_CHOREO_MAX_MS : this.CAPTURE_SHATTER_MS,
    };
  }

  public static triggerCheckmateTopple(
    boardAfter: BoardMap,
    defeatedColor: PieceColor,
    nowMs: number = typeof performance !== 'undefined' ? performance.now() : Date.now()
  ): CheckmateToppleEffect | null {
    const kingSquare = findKingSquare(boardAfter, defeatedColor);
    if (!kingSquare) return null;
    return {
      id: `topple_${kingSquare}_${nowMs}`,
      kingSquare,
      kingColor: defeatedColor,
      startedAt: nowMs,
    };
  }
}
