import React, { useEffect, useRef, useState } from 'react';
import {
  ActiveMoveChoreography,
  CaptureShatterEffect,
  CheckmateToppleEffect,
} from './ChessAppViewModel';
import {
  AppleBadgeOverlay,
  ArrowOverlay,
  BoardMap,
  ChessPiece,
  FILES,
  PieceColor,
  RANKS,
  Square,
  computeCheckmateToppleState,
  easeInOutCubic,
  isLightSquare,
  squareToCoords,
} from './chessEngine';
import { StauntonPieceSVG } from './StauntonPiecesSVG';

interface ChessBoard3DProps {
  board: BoardMap;
  playerColor: PieceColor;
  selectedSquare: Square | null;
  legalSquares: Square[];
  lastMove?: { from: Square; to: Square } | null;
  arrows?: ArrowOverlay[];
  appleBadges?: AppleBadgeOverlay[];
  targetApples?: Square[];
  cameraAngle?: '45' | '65';
  boardWoodTheme?: 'green' | 'walnut';
  // 5 Physical & Choreographic Mechanics Props
  activeMove?: ActiveMoveChoreography | null;
  captureShatter?: CaptureShatterEffect | null;
  checkmateTopple?: CheckmateToppleEffect | null;
  preMoveHighlight?: Square | null;
  onSquareTap: (sq: Square) => void;
  onMoveDragDrop?: (fromSq: Square, toSq: Square) => void;
}

interface BoardSquareProps {
  sq: Square;
  bgColor: string;
  piece?: ChessPiece;
  isSelected: boolean;
  isLegal: boolean;
  isTargetApple: boolean;
  badgeLabel?: string;
  isPreMoveHighlighted: boolean;
  isToppledKing: boolean;
  topplePhase?: string;
  toppleRingScale?: string;
  toppleRingOpacity?: number;
  kingToppleTransform: string;
  bystanderTransform: string;
  isHiddenByFlight: boolean;
  isBeingDragged: boolean;
  onSquareClick: (sq: Square) => void;
  onPiecePointerDown: (e: React.PointerEvent<HTMLButtonElement>, sq: Square) => void;
}

const BoardSquare = React.memo<BoardSquareProps>(
  ({
    sq,
    bgColor,
    piece,
    isSelected,
    isLegal,
    isTargetApple,
    badgeLabel,
    isPreMoveHighlighted,
    isToppledKing,
    topplePhase,
    toppleRingScale,
    toppleRingOpacity,
    kingToppleTransform,
    bystanderTransform,
    isHiddenByFlight,
    isBeingDragged,
    onSquareClick,
    onPiecePointerDown,
  }) => {
    return (
      <button
        type="button"
        onClick={() => onSquareClick(sq)}
        onPointerDown={(e) => onPiecePointerDown(e, sq)}
        aria-label={`Поле ${sq}${piece ? ` ${piece.color === 'w' ? 'белая' : 'чёрная'} фигура` : ''}`}
        data-square={sq}
        className="relative w-full h-full flex items-center justify-center p-0 m-0 border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 select-none touch-none"
        style={{ backgroundColor: bgColor }}
      >
        {/* 4. Pedagogical Pre-Move Highlight (420ms bright amber ring before opponent reply) */}
        {isPreMoveHighlighted && (
          <div
            className="absolute inset-0.5 rounded-full border-[3.5px] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.95)] animate-pulse pointer-events-none z-25"
            data-testid="pre-move-highlight"
          />
        )}

        {/* 1. Double Red-Gold Ring on Defeated King Square during Checkmate Topple */}
        {isToppledKing && toppleRingScale && (
          <div
            className="absolute inset-0.5 rounded-full pointer-events-none z-15 flex items-center justify-center"
            style={{
              transform: `scale(${toppleRingScale})`,
              opacity: toppleRingOpacity ?? 1,
            }}
            data-testid="checkmate-topple-ring"
          >
            <div className="w-full h-full rounded-full border-[3px] border-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.85)] flex items-center justify-center">
              <div className="w-[82%] h-[82%] rounded-full border-[2px] border-amber-400" />
            </div>
          </div>
        )}

        {/* Target Apple in Practice 2.1 / 2.2 */}
        {isTargetApple && !piece && (
          <div className="w-[72%] h-[72%] flex items-center justify-center animate-bounce pointer-events-none">
            <span className="text-xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">🍎</span>
          </div>
        )}

        {/* Chess Piece (84% size, anti-matryoshka, lifts on select, yields to sliders, topples on mate) */}
        {piece && !isHiddenByFlight && (
          <div
            className={`w-[84%] h-[84%] transition-transform duration-150 pointer-events-none ${
              isBeingDragged
                ? 'opacity-35 scale-95'
                : isSelected
                ? '-translate-y-2 scale-108 drop-shadow-[0_8px_6px_rgba(0,0,0,0.45)]'
                : ''
            }`}
            style={
              isToppledKing
                ? {
                    transformOrigin: 'bottom center',
                    transform: kingToppleTransform,
                    zIndex: 28,
                  }
                : bystanderTransform
                ? {
                    transform: bystanderTransform,
                  }
                : undefined
            }
            data-toppled={isToppledKing ? topplePhase : undefined}
          >
            <StauntonPieceSVG type={piece.type} color={piece.color} />
          </div>
        )}

        {/* Legal Move Indicator: Green Dot for quiet move, Green Ring for capture/apple */}
        {isLegal && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {piece || isTargetApple ? (
              <div className="w-[86%] h-[86%] rounded-full border-[4px] border-emerald-500/90 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            ) : (
              <div className="w-[32%] h-[32%] rounded-full bg-emerald-600/85 shadow-sm" />
            )}
          </div>
        )}

        {/* Apple Power Badge in Theory/Practice lessons */}
        {badgeLabel && (
          <div className="absolute -top-0.5 right-0 z-30 pointer-events-none bg-[#0B1120]/95 text-amber-300 border border-amber-500/70 rounded px-1 py-0 text-[9px] font-bold font-mono-tabular leading-tight shadow">
            {badgeLabel}
          </div>
        )}
      </button>
    );
  }
);
BoardSquare.displayName = 'BoardSquare';

/**
 * 2.5D Tournament Chessboard (`ChessBoard3D.tsx`) with Wizard Chess 2.5D Staunton Choreography
 * + Simultaneous Tap-to-Move and Drag-and-Drop (UX-07) + Memoized 64 Squares (FE-03).
 */
export const ChessBoard3D: React.FC<ChessBoard3DProps> = ({
  board,
  playerColor,
  selectedSquare,
  legalSquares,
  lastMove,
  arrows = [],
  appleBadges = [],
  targetApples = [],
  cameraAngle = '45',
  boardWoodTheme = 'green',
  activeMove = null,
  captureShatter = null,
  checkmateTopple = null,
  preMoveHighlight = null,
  onSquareTap,
  onMoveDragDrop,
}) => {
  const isFlipped = playerColor === 'b';
  const gridRef = useRef<HTMLDivElement | null>(null);
  const suppressNextClickRef = useRef(false);

  // Drag-and-Drop state (UX-07)
  const [dragState, setDragState] = useState<{
    fromSq: Square;
    piece: ChessPiece;
    startX: number;
    startY: number;
    x: number;
    y: number;
    isDragging: boolean;
  } | null>(null);

  // Animation clock tick (60fps while any choreography effect is active)
  const [animNow, setAnimNow] = useState<number>(() =>
    typeof performance !== 'undefined' ? performance.now() : Date.now()
  );

  useEffect(() => {
    const hasActiveMove =
      activeMove !== null &&
      animNow - activeMove.startedAt <= activeMove.durationMs + 32;
    const hasActiveShatter =
      captureShatter !== null &&
      animNow - captureShatter.startedAt <= captureShatter.durationMs + 32;
    const hasActiveTopple =
      checkmateTopple !== null &&
      animNow - checkmateTopple.startedAt <= 1400;

    if (!hasActiveMove && !hasActiveShatter && !hasActiveTopple) {
      return;
    }

    let rafId = 0;
    const step = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      setAnimNow(now);

      const stillMoving =
        activeMove !== null && now - activeMove.startedAt <= activeMove.durationMs + 32;
      const stillShattering =
        captureShatter !== null &&
        now - captureShatter.startedAt <= captureShatter.durationMs + 32;
      const stillToppling =
        checkmateTopple !== null && now - checkmateTopple.startedAt <= 1400;

      if (stillMoving || stillShattering || stillToppling) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [activeMove, captureShatter, checkmateTopple]);

  // Global pointermove / pointerup listeners while a piece is being dragged
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      if (dist > 6 || dragState.isDragging) {
        setDragState((prev) =>
          prev
            ? {
                ...prev,
                x: e.clientX,
                y: e.clientY,
                isDragging: true,
              }
            : null
        );
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragState.isDragging) {
        suppressNextClickRef.current = true;
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 60);

        const elem = document.elementFromPoint(e.clientX, e.clientY);
        const sqBtn = elem?.closest?.('[data-square]') as HTMLElement | null;
        const targetSq = sqBtn?.getAttribute('data-square') as Square | null;

        if (targetSq && targetSq !== dragState.fromSq) {
          if (onMoveDragDrop) {
            onMoveDragDrop(dragState.fromSq, targetSq);
          } else {
            onSquareTap(targetSq);
          }
        }
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, onMoveDragDrop, onSquareTap]);

  const handlePiecePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, sq: Square) => {
      const p = board[sq];
      if (!p || p.color !== playerColor) return;
      if (selectedSquare !== sq) {
        onSquareTap(sq);
      }
      setDragState({
        fromSq: sq,
        piece: p,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        isDragging: false,
      });
    },
    [board, playerColor, selectedSquare, onSquareTap]
  );

  const handleSquareClick = React.useCallback(
    (sq: Square) => {
      if (suppressNextClickRef.current) return;
      onSquareTap(sq);
    },
    [onSquareTap]
  );

  // Display order of files and ranks (true 180° rotation when flipped, never mirrored!)
  const displayRanks = isFlipped ? [...RANKS] : [...RANKS].reverse();
  const displayFiles = isFlipped ? [...FILES].reverse() : [...FILES];

  const lightSqColor = '#EEEED2';
  const darkSqColor = boardWoodTheme === 'walnut' ? '#B58863' : '#769656';

  const getSquareGridIndex = (sq: Square): { colIdx: number; rowIdx: number } | null => {
    const coords = squareToCoords(sq);
    if (!coords) return null;
    const colIdx = isFlipped ? 7 - coords.file : coords.file;
    const rowIdx = isFlipped ? coords.rank : 7 - coords.rank;
    return { colIdx, rowIdx };
  };

  // Convert square to 0..800 SVG coordinate center (each square is 100x100)
  const getSquareCenterSvg = (sq: Square): { x: number; y: number } | null => {
    const idx = getSquareGridIndex(sq);
    if (!idx) return null;
    return {
      x: idx.colIdx * 100 + 50,
      y: idx.rowIdx * 100 + 50,
    };
  };

  // Compute active move normalized progress u in [0..1]
  let moveLinearProgress = 1;
  let moveEasedU = 1;
  let isMoveInFlight = false;
  if (activeMove) {
    const elapsed = Math.max(0, animNow - activeMove.startedAt);
    if (elapsed < activeMove.durationMs) {
      moveLinearProgress = elapsed / activeMove.durationMs;
      moveEasedU = easeInOutCubic(moveLinearProgress);
      isMoveInFlight = true;
    }
  }

  // Compute Checkmate Topple frame state
  const toppleFrame = checkmateTopple
    ? computeCheckmateToppleState(Math.max(0, animNow - checkmateTopple.startedAt))
    : null;

  const boardShakeY = toppleFrame ? toppleFrame.boardShakePx : 0;
  const rotateDeg = cameraAngle === '45' ? 'rotateX(18deg)' : 'rotateX(7deg)';

  return (
    <div
      className="w-[calc(100%-16px)] max-w-[380px] aspect-square mx-auto select-none touch-none relative flex items-center justify-center py-0.5"
      data-testid="chessboard-container"
    >
      <div
        className="w-full h-full relative transition-transform duration-150"
        style={{
          transform: `perspective(1100px) ${rotateDeg} translateY(${boardShakeY}px)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Outer Dark Walnut Frame (#3B1E08) */}
        <div className="w-full h-full rounded-2xl bg-[#3B1E08] p-[18px] border-[1.5px] border-[#5C3414] shadow-[0_14px_24px_rgba(0,0,0,0.65)] relative flex flex-col">
          {/* Top File Coordinates (subtle) */}
          <div className="absolute top-[2px] left-[18px] right-[18px] h-[14px] grid grid-cols-8 items-center text-center pointer-events-none">
            {displayFiles.map((f) => (
              <span
                key={`top-${f}`}
                className="text-[10px] font-bold text-amber-200/70 font-mono-tabular leading-none"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Bottom File Coordinates (a-h) */}
          <div className="absolute bottom-[2px] left-[18px] right-[18px] h-[14px] grid grid-cols-8 items-center text-center pointer-events-none">
            {displayFiles.map((f) => (
              <span
                key={`bot-${f}`}
                className="text-[11px] font-bold text-amber-100 font-mono-tabular leading-none"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Left Rank Coordinates (1-8) */}
          <div className="absolute left-[3px] top-[18px] bottom-[18px] w-[13px] grid grid-rows-8 items-center text-center pointer-events-none">
            {displayRanks.map((r) => (
              <span
                key={`left-${r}`}
                className="text-[11px] font-bold text-amber-100 font-mono-tabular leading-none"
              >
                {r}
              </span>
            ))}
          </div>

          {/* Right Rank Coordinates (1-8) */}
          <div className="absolute right-[3px] top-[18px] bottom-[18px] w-[13px] grid grid-rows-8 items-center text-center pointer-events-none">
            {displayRanks.map((r) => (
              <span
                key={`right-${r}`}
                className="text-[10px] font-bold text-amber-200/70 font-mono-tabular leading-none"
              >
                {r}
              </span>
            ))}
          </div>

          {/* Inner Brass Hairline Frame & 8x8 Grid */}
          <div
            ref={gridRef}
            className="w-full h-full rounded-lg overflow-hidden border-[1.5px] border-amber-500/60 relative grid grid-cols-8 grid-rows-8 bg-[#1E293B]"
          >
            {displayRanks.map((rankStr) =>
              displayFiles.map((fileStr) => {
                const sq: Square = `${fileStr}${rankStr}`;
                const isLight = isLightSquare(sq);
                const piece = board[sq];
                const isSelected = selectedSquare === sq;
                const isLegal = legalSquares.includes(sq);
                const isLastMove = lastMove?.from === sq || lastMove?.to === sq;
                const isTargetApple = targetApples.includes(sq);
                const badge = appleBadges.find((b) => b.square === sq);
                const isPreMoveHighlighted = preMoveHighlight === sq;
                const isToppledKing =
                  checkmateTopple !== null && checkmateTopple.kingSquare === sq;

                // Hide stationary piece on destination/source square while it is actively flying
                const isHiddenByFlight =
                  isMoveInFlight &&
                  activeMove !== null &&
                  (sq === activeMove.from ||
                    sq === activeMove.to ||
                    Boolean(
                      activeMove.castlingRook &&
                        (sq === activeMove.castlingRook.from ||
                          sq === activeMove.castlingRook.to)
                    ));

                // Compute bystander yield displacement ("Живые соседи")
                let bystanderTransform = '';
                if (isMoveInFlight && activeMove && activeMove.bystanders[sq]) {
                  const spec = activeMove.bystanders[sq];
                  const bell = Math.exp(
                    -Math.pow((moveEasedU - spec.peakU) / 0.22, 2)
                  );
                  const dx = (spec.maxDxPx * bell).toFixed(2);
                  const dy = (spec.maxDyPx * bell).toFixed(2);
                  const tilt = (spec.maxDxPx * bell * 1.35).toFixed(2);
                  bystanderTransform = `translate(${dx}px, ${dy}px) rotateZ(${tilt}deg)`;
                }

                // Compute Checkmate Topple transform for the defeated King
                let kingToppleTransform = '';
                if (isToppledKing && toppleFrame) {
                  kingToppleTransform = `rotateZ(${toppleFrame.angleDeg.toFixed(1)}deg)`;
                }

                let bgColor = isLight ? lightSqColor : darkSqColor;
                if (isSelected) {
                  bgColor = '#FACC15'; // Golden highlight on selected square
                } else if (isLastMove) {
                  bgColor = isLight ? '#F5F682' : '#B9CA43';
                }

                return (
                  <BoardSquare
                    key={sq}
                    sq={sq}
                    bgColor={bgColor}
                    piece={piece}
                    isSelected={isSelected}
                    isLegal={isLegal}
                    isTargetApple={isTargetApple}
                    badgeLabel={badge?.label}
                    isPreMoveHighlighted={isPreMoveHighlighted}
                    isToppledKing={isToppledKing}
                    topplePhase={toppleFrame?.phase}
                    toppleRingScale={toppleFrame ? toppleFrame.ringScale.toFixed(2) : undefined}
                    toppleRingOpacity={toppleFrame?.ringOpacity}
                    kingToppleTransform={kingToppleTransform}
                    bystanderTransform={bystanderTransform}
                    isHiddenByFlight={isHiddenByFlight}
                    isBeingDragged={Boolean(dragState?.isDragging && dragState.fromSq === sq)}
                    onSquareClick={handleSquareClick}
                    onPiecePointerDown={handlePiecePointerDown}
                  />
                );
              })
            )}

            {/* 3. Flying Piece & Simultaneous Castling Rook Layer */}
            {isMoveInFlight && activeMove && (() => {
              const startIdx = getSquareGridIndex(activeMove.from);
              const endIdx = getSquareGridIndex(activeMove.to);
              if (!startIdx || !endIdx) return null;

              const curCol =
                startIdx.colIdx + (endIdx.colIdx - startIdx.colIdx) * moveEasedU;
              const curRow =
                startIdx.rowIdx + (endIdx.rowIdx - startIdx.rowIdx) * moveEasedU;

              const sinArc = Math.sin(moveEasedU * Math.PI);
              const zLiftPx = activeMove.isKnightJump ? sinArc * 28 : sinArc * 6;
              const scaleVal = activeMove.isKnightJump ? 1 + 0.18 * sinArc : 1.04;

              return (
                <>
                  {/* Main Flying Piece */}
                  <div
                    className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center pointer-events-none z-35"
                    style={{
                      left: `${curCol * 12.5}%`,
                      top: `${curRow * 12.5}%`,
                      transform: `translateY(${-zLiftPx}px) scale(${scaleVal.toFixed(3)})`,
                      filter: activeMove.isKnightJump
                        ? `drop-shadow(0 ${Math.round(4 + zLiftPx * 0.45)}px 6px rgba(0,0,0,0.55))`
                        : 'drop-shadow(0 5px 5px rgba(0,0,0,0.4))',
                    }}
                    data-testid="flying-piece"
                  >
                    <div className="w-[84%] h-[84%]">
                      <StauntonPieceSVG
                        type={activeMove.piece.type}
                        color={activeMove.piece.color}
                      />
                    </div>
                  </div>

                  {/* Simultaneous Castling Rook with 18px Arc Jump over King */}
                  {activeMove.castlingRook && (() => {
                    const rStart = getSquareGridIndex(activeMove.castlingRook.from);
                    const rEnd = getSquareGridIndex(activeMove.castlingRook.to);
                    if (!rStart || !rEnd) return null;
                    const rCol =
                      rStart.colIdx + (rEnd.colIdx - rStart.colIdx) * moveEasedU;
                    const rRow =
                      rStart.rowIdx + (rEnd.rowIdx - rStart.rowIdx) * moveEasedU;
                    const rookLiftPx = Math.sin(moveEasedU * Math.PI) * 18;

                    return (
                      <div
                        className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center pointer-events-none z-35"
                        style={{
                          left: `${rCol * 12.5}%`,
                          top: `${rRow * 12.5}%`,
                          transform: `translateY(${-rookLiftPx}px) scale(${(
                            1 +
                            0.1 * sinArc
                          ).toFixed(3)})`,
                          filter: `drop-shadow(0 ${Math.round(
                            3 + rookLiftPx * 0.4
                          )}px 5px rgba(0,0,0,0.5))`,
                        }}
                        data-testid="castling-rook-arc"
                      >
                        <div className="w-[84%] h-[84%]">
                          <StauntonPieceSVG
                            type={activeMove.castlingRook.piece.type}
                            color={activeMove.castlingRook.piece.color}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </>
              );
            })()}

            {/* 2. Capture Shatter Effect Layer (Golden-Fiery Impact Ring + 16 Parabolic Fragments) */}
            {captureShatter && (() => {
              const elapsed = Math.max(0, animNow - captureShatter.startedAt);
              if (elapsed > captureShatter.durationMs) return null;
              const sqIdx = getSquareGridIndex(captureShatter.square);
              if (!sqIdx) return null;

              const progress = elapsed / captureShatter.durationMs;
              const tSec = elapsed / 1000;
              const ringOpacity = Math.max(0, 1 - progress * 1.8);
              const ringScale = 0.55 + progress * 1.15;
              const fragOpacity = Math.max(0, 1 - Math.pow(progress, 1.35));

              return (
                <div
                  className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center pointer-events-none z-40"
                  style={{
                    left: `${sqIdx.colIdx * 12.5}%`,
                    top: `${sqIdx.rowIdx * 12.5}%`,
                  }}
                  data-testid="capture-shatter-effect"
                >
                  {/* Golden-Fiery Impact Ring */}
                  {ringOpacity > 0 && (
                    <div
                      className="absolute inset-1 rounded-full border-[3px] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)]"
                      style={{
                        transform: `scale(${ringScale.toFixed(2)})`,
                        opacity: ringOpacity,
                      }}
                    />
                  )}

                  {/* 14-18 Parabolic Wooden/Stone Fragments (#E6DFD0 or #222630) */}
                  {captureShatter.fragments.map((frag) => {
                    const dx = frag.vx * tSec;
                    const dy = frag.vy * tSec + 0.5 * frag.gravity * tSec * tSec;
                    const rot = frag.rotDeg + elapsed * 0.45;
                    return (
                      <div
                        key={frag.id}
                        className="absolute rounded-[2px] border border-black/40"
                        style={{
                          width: `${frag.sizePx}px`,
                          height: `${frag.sizePx}px`,
                          backgroundColor: frag.color,
                          transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(
                            1
                          )}px) rotate(${rot.toFixed(0)}deg)`,
                          opacity: fragOpacity,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })()}

            {/* Vector Arrows SVG Layer (pointer-events-none) */}
            {arrows.length > 0 && (
              <svg
                viewBox="0 0 800 800"
                className="absolute inset-0 w-full h-full pointer-events-none z-25"
              >
                <defs>
                  <marker
                    id="arrow-green"
                    markerWidth="4.5"
                    markerHeight="4.5"
                    refX="2.8"
                    refY="2.25"
                    orient="auto"
                  >
                    <polygon points="0 0, 4.5 2.25, 0 4.5" fill="#16A34A" />
                  </marker>
                  <marker
                    id="arrow-red"
                    markerWidth="4.5"
                    markerHeight="4.5"
                    refX="2.8"
                    refY="2.25"
                    orient="auto"
                  >
                    <polygon points="0 0, 4.5 2.25, 0 4.5" fill="#DC2626" />
                  </marker>
                  <marker
                    id="arrow-gold"
                    markerWidth="4.5"
                    markerHeight="4.5"
                    refX="2.8"
                    refY="2.25"
                    orient="auto"
                  >
                    <polygon points="0 0, 4.5 2.25, 0 4.5" fill="#F59E0B" />
                  </marker>
                </defs>
                {arrows.map((arr, idx) => {
                  const start = getSquareCenterSvg(arr.from);
                  const end = getSquareCenterSvg(arr.to);
                  if (!start || !end) return null;

                  const dx = end.x - start.x;
                  const dy = end.y - start.y;
                  const len = Math.hypot(dx, dy);
                  if (len === 0) return null;

                  // Shorten start and end slightly so arrow tip sits cleanly inside target square
                  const offsetStart = 18;
                  const offsetEnd = 26;
                  const x1 = start.x + (dx / len) * offsetStart;
                  const y1 = start.y + (dy / len) * offsetStart;
                  const x2 = end.x - (dx / len) * offsetEnd;
                  const y2 = end.y - (dy / len) * offsetEnd;

                  const strokeColor =
                    arr.color === 'green'
                      ? '#16A34A'
                      : arr.color === 'red'
                      ? '#DC2626'
                      : '#F59E0B';

                  return (
                    <g key={`${arr.from}-${arr.to}-${idx}`} opacity="0.9">
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#0B1120"
                        strokeWidth="22"
                        strokeLinecap="round"
                        opacity="0.35"
                      />
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={strokeColor}
                        strokeWidth="16"
                        strokeLinecap="round"
                        markerEnd={`url(#arrow-${arr.color})`}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Massive Front 3D Wooden Slab Edge (16px height, #241104 with brass vein) */}
        <div
          className="w-[calc(100%-8px)] mx-auto h-[14px] -mt-[3px] rounded-b-xl bg-[#241104] border-x border-b border-[#140902] shadow-[0_10px_18px_rgba(0,0,0,0.8)] relative overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          {/* Brass vein */}
          <div className="w-full h-[2px] bg-amber-500/55 mt-[4px]" />
        </div>
      </div>

      {/* Floating Piece Preview during Drag-and-Drop (UX-07) */}
      {dragState && dragState.isDragging && (
        <div
          className="fixed w-12 h-12 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_10px_10px_rgba(0,0,0,0.65)] scale-115"
          style={{
            left: `${dragState.x}px`,
            top: `${dragState.y - 14}px`,
          }}
          data-testid="dragging-piece-preview"
        >
          <StauntonPieceSVG type={dragState.piece.type} color={dragState.piece.color} />
        </div>
      )}
    </div>
  );
};
