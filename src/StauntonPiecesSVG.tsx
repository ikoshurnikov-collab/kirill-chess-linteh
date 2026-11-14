import React, { useState } from 'react';
import { PieceColor, PieceType } from './chessEngine';
import { CardIconSpec } from './curriculumData';

interface StauntonPieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
  goldTrim?: boolean;
}

/**
 * Canonical Staunton 2.5D chess pieces (viewBox="0 0 45 45" in Lichess cburnett style)
 * Each piece sits on an oval 2.5D pedestal with shadow and internal highlights.
 */
export const StauntonPieceSVG: React.FC<StauntonPieceProps> = ({
  type,
  color,
  className = 'w-full h-full',
  goldTrim = false,
}) => {
  const isWhite = color === 'w';
  const fillMain = isWhite ? '#FFFDF7' : '#1E293B';
  const fillShade = isWhite ? '#CBD5E1' : '#090D16';
  const strokeMain = goldTrim ? '#F59E0B' : isWhite ? '#1E293B' : '#090D16';
  const innerLine = goldTrim ? '#FDE68A' : isWhite ? '#334155' : '#94A3B8';
  const pedestalTop = goldTrim ? '#D97706' : isWhite ? '#E2E8F0' : '#334155';
  const pedestalSide = goldTrim ? '#78350F' : isWhite ? '#64748B' : '#090D16';

  return (
    <svg
      viewBox="0 0 45 45"
      className={className}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Soft Ground Shadow */}
      <ellipse cx="22.5" cy="41.2" rx="15.5" ry="3.6" fill="rgba(0,0,0,0.38)" />

      {/* 2.5D Oval Pedestal Base */}
      <path
        d="M 8.5 38.2 C 8.5 41.5, 36.5 41.5, 36.5 38.2 L 36.5 36.2 C 36.5 39.5, 8.5 39.5, 8.5 36.2 Z"
        fill={pedestalSide}
        stroke={strokeMain}
        strokeWidth="1.2"
      />
      <ellipse
        cx="22.5"
        cy="36.2"
        rx="14"
        ry="3.1"
        fill={pedestalTop}
        stroke={strokeMain}
        strokeWidth="1.3"
      />

      {/* PAWN (Пешка) */}
      {type === 'p' && (
        <g stroke={strokeMain} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 22.5,11 C 19.5,11 17,13.5 17,16.5 C 17,18.8 18.4,20.7 20.4,21.5 C 17.5,23 15.5,26.2 15,31 L 12,35.2 L 33,35.2 L 30,31 C 29.5,26.2 27.5,23 24.6,21.5 C 26.6,20.7 28,18.8 28,16.5 C 28,13.5 25.5,11 22.5,11 z"
            fill={fillMain}
          />
          {/* Volume shading */}
          <path
            d="M 23.5,12.2 C 25.5,13 26.5,14.8 26.5,16.5 C 26.5,18.5 25,20.2 23.5,21.2 C 26.2,23 28,26.5 28.5,31 L 30.8,34.4 L 32.2,34.4 L 29.6,30.8 C 29,26 27.2,22.8 24.4,21.4"
            fill={fillShade}
            stroke="none"
          />
          <path d="M 15.5,31.2 L 29.5,31.2" stroke={innerLine} strokeWidth="1.3" fill="none" />
          <path d="M 18.8,21.8 L 26.2,21.8" stroke={innerLine} strokeWidth="1.3" fill="none" />
          <circle cx="20.8" cy="15" r="1.4" fill={innerLine} stroke="none" opacity="0.55" />
        </g>
      )}

      {/* ROOK (Ладья) */}
      {type === 'r' && (
        <g stroke={strokeMain} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 11,35.2 L 14,31.5 L 31,31.5 L 34,35.2 Z"
            fill={fillMain}
          />
          <path
            d="M 14.5,31.5 L 14.5,18.5 L 30.5,18.5 L 30.5,31.5 Z"
            fill={fillMain}
          />
          <path
            d="M 26.5,18.5 L 30,18.5 L 30,31.5 L 26.5,31.5 Z"
            fill={fillShade}
            stroke="none"
          />
          <path
            d="M 12,18.5 L 14.5,16 L 30.5,16 L 33,18.5 Z"
            fill={fillMain}
          />
          <path
            d="M 12,16 L 12,10.5 L 16.5,10.5 L 16.5,13 L 20,13 L 20,10.5 L 25,10.5 L 25,13 L 28.5,13 L 28.5,10.5 L 33,10.5 L 33,16 Z"
            fill={fillMain}
          />
          <path d="M 14.5,21.5 L 30.5,21.5" stroke={innerLine} strokeWidth="1.3" fill="none" />
          <path d="M 14.5,29 L 30.5,29" stroke={innerLine} strokeWidth="1.3" fill="none" />
        </g>
      )}

      {/* KNIGHT (Конь) */}
      {type === 'n' && (
        <g stroke={strokeMain} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 22,10 C 32.5,11 38.5,18 38,35.2 L 15,35.2 C 15,26 25,28.5 23,18"
            fill={fillMain}
          />
          <path
            d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10"
            fill={fillMain}
          />
          {/* Mane volume shade */}
          <path
            d="M 28,13 C 33.5,16 36.2,23 36,34.4 L 32.5,34.4 C 33,24 30.5,17 26.5,14 Z"
            fill={fillShade}
            stroke="none"
          />
          <circle cx="15.2" cy="14.2" r="1.3" fill={innerLine} stroke="none" />
          <path d="M 9.8,25.5 C 10.8,24.5 12,24.5 12.5,25.5" stroke={innerLine} strokeWidth="1.2" fill="none" />
          <path d="M 15.5,32.5 L 36.5,32.5" stroke={innerLine} strokeWidth="1.3" fill="none" />
        </g>
      )}

      {/* BISHOP (Слон) */}
      {type === 'b' && (
        <g stroke={strokeMain} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 11,35.2 L 14.5,31.5 L 30.5,31.5 L 34,35.2 Z"
            fill={fillMain}
          />
          <path
            d="M 15,31.5 C 15,22 14,14.5 22.5,10.5 C 31,14.5 30,22 30,31.5 Z"
            fill={fillMain}
          />
          <path
            d="M 24,12.2 C 28.5,16 28.5,23 28.2,30.8 L 25.5,30.8 C 25.8,23 26,16.5 23,13 Z"
            fill={fillShade}
            stroke="none"
          />
          <circle cx="22.5" cy="8" r="2.3" fill={fillMain} />
          {/* Mitre cross */}
          <path d="M 20,17.5 L 25,17.5 M 22.5,15 L 22.5,20" stroke={innerLine} strokeWidth="1.5" fill="none" />
          <path d="M 15,28.5 C 19.5,27 25.5,27 30,28.5" stroke={innerLine} strokeWidth="1.3" fill="none" />
          <path d="M 14.5,31.5 L 30.5,31.5" stroke={innerLine} strokeWidth="1.3" fill="none" />
        </g>
      )}

      {/* QUEEN (Ферзь) */}
      {type === 'q' && (
        <g stroke={strokeMain} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 11.5,35.2 L 14,31 L 31,31 L 33.5,35.2 Z"
            fill={fillMain}
          />
          <path
            d="M 14,31 C 12,24 9,15.5 9,15.5 L 16.5,23 L 18,12.5 L 22.5,22.5 L 27,12.5 L 28.5,23 L 36,15.5 C 36,15.5 33,24 31,31 Z"
            fill={fillMain}
          />
          <circle cx="8.5" cy="14" r="1.8" fill={fillMain} />
          <circle cx="17.8" cy="10.8" r="1.8" fill={fillMain} />
          <circle cx="22.5" cy="9.8" r="2" fill={fillMain} />
          <circle cx="27.2" cy="10.8" r="1.8" fill={fillMain} />
          <circle cx="36.5" cy="14" r="1.8" fill={fillMain} />
          <path d="M 14,28 C 19,26.5 26,26.5 31,28" stroke={innerLine} strokeWidth="1.3" fill="none" />
          <path d="M 14,31 L 31,31" stroke={innerLine} strokeWidth="1.3" fill="none" />
        </g>
      )}

      {/* KING (Король) */}
      {type === 'k' && (
        <g stroke={strokeMain} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Royal Cross */}
          <path d="M 22.5,11.6 L 22.5,5.2 M 19.5,8 L 25.5,8" stroke={strokeMain} strokeWidth="2.1" fill="none" />
          <path
            d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25"
            fill={fillMain}
          />
          <path
            d="M 11.5,35.2 C 17,37 27,37 32.5,35.2 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,35.2 z"
            fill={fillMain}
          />
          <path d="M 11.5,29.5 C 17,27 27,27 32.5,30" stroke={innerLine} strokeWidth="1.3" fill="none" />
          <path d="M 11.5,32.8 C 17,30.5 27,30.5 32.5,32.8" stroke={innerLine} strokeWidth="1.3" fill="none" />
        </g>
      )}
    </svg>
  );
};

const LESSON_MINI_BADGE_MAP: Record<string, string> = {
  '1.7': '⚖️',
  '1.8': '🏆',
  '2.1': '🎯',
  '2.2': '🎯',
  '2.3': '👑',
  '2.4': '🏰',
  '2.5': '🛡️',
  '2.6': '🎯',
  '2.7': '⚡',
  '2.8': '⚔️',
  '2.9': '🏛️',
  '2.10': '🤝',
  '3.1': '⚔️',
  '3.2': '📌',
  '3.3': '🚀',
  '3.4': 'c4',
  '3.5': 'b5',
  '3.6': 'd4',
  '3.7': 'f6',
  '3.8': 'a6',
  '3.9': 'd5',
  '3.10': '★',
  '3.11': '👑',
};

/**
 * 52x52 2.5D Card Icon Composition for Lesson Cards in Sections 1, 2, and 3.
 * Strictly renders ONE large, centered 2.5D Staunton piece on a circular pedestal
 * with section-themed glow and an optional 16x16px corner mini-badge.
 */
export const CardIcon25D: React.FC<{
  spec: CardIconSpec;
  completed?: boolean;
  lessonCode?: string;
  section?: 'theory' | 'practice' | 'mastery';
}> = ({ spec, completed = false, lessonCode, section }) => {
  const isBlackTheme = spec.pieceColor === 'b';
  const resolvedSection =
    section ||
    (lessonCode?.startsWith('1.')
      ? 'theory'
      : lessonCode?.startsWith('2.')
      ? 'practice'
      : lessonCode?.startsWith('3.')
      ? 'mastery'
      : 'theory');

  const miniBadge =
    (lessonCode && LESSON_MINI_BADGE_MAP[lessonCode]) ||
    (spec.secondaryPiece ? '★' : undefined);

  const pedestalGlowClass = isBlackTheme
    ? 'bg-amber-500/30 border-amber-400/80'
    : resolvedSection === 'practice'
    ? 'bg-emerald-500/25 border-emerald-400/60'
    : resolvedSection === 'mastery'
    ? 'bg-amber-500/25 border-amber-400/65'
    : 'bg-sky-500/25 border-sky-400/60';

  return (
    <div
      className={`w-[52px] h-[52px] shrink-0 rounded-xl flex items-center justify-center relative overflow-hidden border-[1.5px] ${
        completed
          ? 'bg-emerald-950/70 border-emerald-500/80'
          : isBlackTheme
          ? 'bg-[#090D16] border-amber-500/80'
          : 'bg-[#0B1120] border-slate-700'
      }`}
    >
      {/* Circular 2.5D pedestal glow at the bottom of the 52x52 icon */}
      <div
        className={`absolute bottom-1.5 w-9 h-2.5 rounded-full border ${pedestalGlowClass}`}
      />

      {/* Strictly ONE large, centered 2.5D Staunton piece */}
      <div className="w-[42px] h-[42px] relative z-10 flex items-center justify-center">
        <StauntonPieceSVG
          type={spec.primaryPiece}
          color={spec.pieceColor === 'b' ? 'b' : 'w'}
          goldTrim={isBlackTheme || spec.goldTrim}
        />
      </div>

      {/* Neat 16x16px corner mini-badge for lessons with an accent or secondary concept */}
      {miniBadge && (
        <span
          className={`absolute bottom-0.5 right-0.5 z-20 w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-extrabold leading-none border font-mono-tabular ${
            isBlackTheme
              ? 'bg-amber-500 text-slate-950 border-amber-300'
              : 'bg-[#131C2E]/95 text-amber-300 border-slate-600'
          }`}
        >
          {miniBadge}
        </span>
      )}
    </div>
  );
};

/**
 * Kirill's Avatar (4th grade student at Lintech #28, Kirov).
 * Statically loads /kirill-avatar.jpg (public/kirill-avatar.jpg) in a circular frame;
 * if the file is not yet placed in public/ (onError), smoothly renders the built-in
 * vector SVG portrait of Kirill in glasses.
 */
export const KirillAvatarSVG: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/kirill-avatar.jpg"
        alt="Кирилл — автор проекта, Линтех №28"
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover border-[1.5px] border-amber-400 bg-[#1E293B] shrink-0 select-none`}
      />
    );
  }

  return (
    <svg viewBox="0 0 48 48" className={`${className} shrink-0`} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
      {/* Lintech Jacket Collar */}
      <path d="M 10 42 C 12 33, 36 33, 38 42 C 34 45, 14 45, 10 42 Z" fill="#0284C7" />
      <path d="M 20 34.5 L 24 41.5 L 28 34.5 Z" fill="#F8FAFC" />
      {/* Face */}
      <circle cx="24" cy="22" r="10.5" fill="#FDE68A" />
      {/* Hair */}
      <path
        d="M 13.5 20 C 13.5 11.5, 34.5 11.5, 34.5 20 C 31 15.2, 18 15.2, 13.5 20 Z"
        fill="#78350F"
      />
      {/* Glasses */}
      <rect
        x="15.8"
        y="19"
        width="6.8"
        height="4.8"
        rx="1.4"
        fill="rgba(255,255,255,0.28)"
        stroke="#0F172A"
        strokeWidth="1.4"
      />
      <rect
        x="25.4"
        y="19"
        width="6.8"
        height="4.8"
        rx="1.4"
        fill="rgba(255,255,255,0.28)"
        stroke="#0F172A"
        strokeWidth="1.4"
      />
      <path d="M 22.6 21.2 L 25.4 21.2" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
      {/* Eyes & Friendly Smile */}
      <circle cx="19.2" cy="21.4" r="1.2" fill="#0F172A" />
      <circle cx="28.8" cy="21.4" r="1.2" fill="#0F172A" />
      <path
        d="M 20 26.5 C 22 28.5, 26 28.5, 28 26.5"
        stroke="#0F172A"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Small Gold Crown Pin */}
      <path d="M 31 11 L 33 7 L 35.5 9.5 L 38 7 L 40 11 Z" fill="#F59E0B" />
    </svg>
  );
};
