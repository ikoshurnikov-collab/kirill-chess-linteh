import {
  BoardMap,
  PIECE_APPLE_VALUES,
  PIECE_NAMES_RU,
  Square,
  applyMove,
  isInCheck,
  isSquareAttacked,
} from './chessEngine';
import { SequenceStep } from './curriculumData';

export interface MoveFeedback {
  isCorrect: boolean;
  kirillMessage: string;
  audioKey?: string;
}

const WIN_MESSAGES = [
  'Отличный ход! Так держать, настоящий ратник Линтеха №28!',
  'Точно в цель! Фигуры работают слаженно, как единая дружина.',
  'Браво! Чистый расчёт и блестящая техника!',
  'Мощный удар! Соперник не устоял перед твоим натиском.',
  'Превосходно! Ещё один шаг к званию Верховного Воеводы!',
];

const ERROR_PREFIXES = [
  'Постой, ратник!',
  'Не спеши с ходом!',
  'Внимание на доску!',
];

/**
 * Generates contextual, educational feedback from Kirill when a player makes a move
 * in Theory, Practice, or 30/30 Mastery mode.
 */
export function analyzePlayerMove(
  boardBefore: BoardMap,
  from: Square,
  to: Square,
  expectedStep: SequenceStep | null,
  winSeed: number = 0
): MoveFeedback {
  const movingPiece = boardBefore[from];
  if (!movingPiece) {
    return {
      isCorrect: false,
      kirillMessage: 'Выбери свою фигуру и сделай ход по правилам шахмат.',
      audioKey: 'err_1',
    };
  }

  if (expectedStep && from === expectedStep.playerFrom && to === expectedStep.playerTo) {
    const msg = WIN_MESSAGES[winSeed % WIN_MESSAGES.length];
    const audioIdx = (winSeed % 5) + 1;
    return {
      isCorrect: true,
      kirillMessage: msg,
      audioKey: `win_${audioIdx}`,
    };
  }

  // Analyze why the move wasn't the best one
  const { board: boardAfter, captured } = applyMove(boardBefore, from, to);
  const enemyColor = movingPiece.color === 'w' ? 'b' : 'w';
  const pieceName = PIECE_NAMES_RU[movingPiece.type];
  const errAudio = `err_${(winSeed % 3) + 1}`;
  const prefix = ERROR_PREFIXES[winSeed % ERROR_PREFIXES.length];

  // Check if moving piece was placed under direct attack
  if (isSquareAttacked(boardAfter, to, enemyColor)) {
    const val = PIECE_APPLE_VALUES[movingPiece.type];
    return {
      isCorrect: false,
      kirillMessage: `${prefix} Поле ${to} под боем соперника — не подставляй фигуру «${pieceName}» (🍎${val === 100 ? '👑' : val})! ${expectedStep ? expectedStep.kirillHint : ''}`,
      audioKey: errAudio,
    };
  }

  // Check if player captured a weaker piece when a stronger one was expected
  if (captured && expectedStep) {
    const expectedTarget = boardBefore[expectedStep.playerTo];
    if (expectedTarget && PIECE_APPLE_VALUES[expectedTarget.type] > PIECE_APPLE_VALUES[captured.type]) {
      return {
        isCorrect: false,
        kirillMessage: `${prefix} Ты забрал фигуру за 🍎${PIECE_APPLE_VALUES[captured.type]}, но на поле ${expectedStep.playerTo} есть куда более ценная цель (🍎${PIECE_APPLE_VALUES[expectedTarget.type]})!`,
        audioKey: errAudio,
      };
    }
  }

  if (isInCheck(boardBefore, movingPiece.color)) {
    return {
      isCorrect: false,
      kirillMessage: `${prefix} Твоему Королю шах! Сначала защити Короля.`,
      audioKey: errAudio,
    };
  }

  return {
    isCorrect: false,
    kirillMessage: `${prefix} В этой позиции сильнее другой план. ${expectedStep ? expectedStep.kirillHint : 'Попробуй ещё раз!'}`,
    audioKey: errAudio,
  };
}

export function getMasteryStageInfo(wins: number): {
  stageNumber: 1 | 2 | 3;
  stageTitle: string;
  showHintArrow: boolean;
  useRandomBranch: boolean;
  blitzSeconds: number | null;
} {
  if (wins < 10) {
    return {
      stageNumber: 1,
      stageTitle: 'Рубеж 1 (1–10): Стрелка-подсказка',
      showHintArrow: true,
      useRandomBranch: false,
      blitzSeconds: null,
    };
  }
  if (wins < 20) {
    return {
      stageNumber: 2,
      stageTitle: 'Рубеж 2 (11–20): По памяти + ветки',
      showHintArrow: false,
      useRandomBranch: true,
      blitzSeconds: null,
    };
  }
  return {
    stageNumber: 3,
    stageTitle: 'Рубеж 3 (21–30): Блиц 5 сек / ход',
    showHintArrow: false,
    useRandomBranch: true,
    blitzSeconds: 5,
  };
}
