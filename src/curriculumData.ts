import {
  AppleBadgeOverlay,
  ArrowOverlay,
  PieceColor,
  PieceType,
  Square,
} from './chessEngine';

export type LessonSection = 'theory' | 'practice' | 'mastery';

export interface CardIconSpec {
  primaryPiece: PieceType;
  secondaryPiece?: PieceType;
  pieceColor: PieceColor;
  goldTrim?: boolean;
}

export interface TheorySlide {
  kirillText: string;
  setup: string; // compact board setup
  arrows?: ArrowOverlay[];
  appleBadges?: AppleBadgeOverlay[];
}

export interface SequenceStep {
  playerFrom: Square;
  playerTo: Square;
  promotionPiece?: PieceType;
  kirillHint: string; // 1-line clear prompt for this move
  replyFrom?: Square;
  replyTo?: Square;
  replyText?: string;
  arrows?: ArrowOverlay[];
  appleBadges?: AppleBadgeOverlay[];
}

export interface LessonTaskVariant {
  id: string;
  title: string;
  setup: string; // 'INITIAL' or compact setup string
  playerColor: PieceColor;
  introMoves?: Array<{ from: Square; to: Square }>; // e.g., White's 1.e2-e4 before Black responds
  steps: SequenceStep[];
  openCheckDefense?: boolean; // For 2.5: any legal move escaping check wins
  sparringAntiStalemate?: boolean; // For 2.10 task 3: mate the lone Black king without stalemate
}

export interface LessonItem {
  id: string;
  code: string; // e.g. '1.1', '2.3', '3.10'
  section: LessonSection;
  title: string;
  subtitle: string;
  badgeText: string;
  isFree: boolean;
  targetWins: number;
  playerColor: PieceColor;
  audioKey: string;
  iconSpec: CardIconSpec;
  // Theory specific
  theorySlides?: TheorySlide[];
  theoryFinalTask?: LessonTaskVariant;
  // Practice procedural mode
  proceduralMode?: 'rook_queen' | 'bishop_knight';
  // Tasks / Branches for Practice & Mastery 30/30
  variants?: LessonTaskVariant[];
}

export const CURRICULUM_LESSONS: LessonItem[] = [
  // =========================================================================
  // РАЗДЕЛ 1. ТЕОРИЯ «УСТАВ ДРУЖИНЫ» (8 уроков: 1.1–1.8, БЕСПЛАТНО)
  // =========================================================================
  {
    id: 'theory_1_1',
    code: '1.1',
    section: 'theory',
    title: '1.1 «Пешка»',
    subtitle: 'Ходит вперёд, рубит наискосок и превращается в Ферзя на последнем ряду.',
    badgeText: '🍎 1',
    isFree: true,
    targetWins: 1,
    playerColor: 'w',
    audioKey: 'theory_1_1',
    iconSpec: { primaryPiece: 'p', pieceColor: 'w' },
    theorySlides: [
      {
        kirillText: 'Привет! Я Кирилл из Линтеха №28. Пешка стоит 1 яблоко силы (🍎1) и смело шагает только вперёд на одну клетку, а со старта — сразу на две!',
        setup: 'w:Pe2,Pd4;b:Pe7',
        arrows: [
          { from: 'e2', to: 'e4', color: 'green' },
          { from: 'd4', to: 'd5', color: 'gold' },
        ],
        appleBadges: [{ square: 'e2', label: '🍎1' }, { square: 'd4', label: '🍎1' }],
      },
      {
        kirillText: 'Пешка шагает прямо, а вот рубит фигуры соперника только наискосок на одну клетку вперёд!',
        setup: 'w:Pd4;b:Pc5,Pe5',
        arrows: [
          { from: 'd4', to: 'c5', color: 'red' },
          { from: 'd4', to: 'e5', color: 'red' },
        ],
        appleBadges: [{ square: 'd4', label: '🍎1' }],
      },
      {
        kirillText: 'Главный секрет пешки: дойдя до последней 8-й горизонтали, она превращается в могучего Ферзя (🍎9)! Проверим это в деле.',
        setup: 'w:Pa7,Ke1;b:Ke8',
        arrows: [{ from: 'a7', to: 'a8', color: 'green' }],
        appleBadges: [{ square: 'a7', label: '🍎1' }, { square: 'a8', label: '🍎9' }],
      },
    ],
    theoryFinalTask: {
      id: 't_1_1_final',
      title: 'Превращение пешки',
      setup: 'w:Pa7,Ke1;b:Kg8',
      playerColor: 'w',
      steps: [
        {
          playerFrom: 'a7',
          playerTo: 'a8',
          promotionPiece: 'q',
          kirillHint: 'Твой ход! Проведи пешку a7 → a8 и преврати её в Ферзя.',
          arrows: [{ from: 'a7', to: 'a8', color: 'green' }],
          appleBadges: [{ square: 'a7', label: '🍎1' }],
        },
      ],
    },
  },
  {
    id: 'theory_1_2',
    code: '1.2',
    section: 'theory',
    title: '1.2 «Ладья»',
    subtitle: 'Дальнобойная фигура: ходит по прямым дорогам — вертикалям и горизонталям.',
    badgeText: '🍎 5',
    isFree: true,
    targetWins: 1,
    playerColor: 'w',
    audioKey: 'theory_1_2',
    iconSpec: { primaryPiece: 'r', pieceColor: 'w' },
    theorySlides: [
      {
        kirillText: 'Тяжёлая боевая башня — Ладья! Её сила равна 5 яблокам (🍎5). Она контролирует прямые линии через всю доску.',
        setup: 'w:Rd4',
        arrows: [
          { from: 'd4', to: 'd8', color: 'green' },
          { from: 'd4', to: 'd1', color: 'green' },
          { from: 'd4', to: 'a4', color: 'gold' },
          { from: 'd4', to: 'h4', color: 'gold' },
        ],
        appleBadges: [{ square: 'd4', label: '🍎5' }],
      },
      {
        kirillText: 'В открытой вертикали Ладья молниеносно врывается в лагерь соперника на 8-й ряд и атакует всё на своём пути.',
        setup: 'w:Rd1,Kg1;b:Kg8,Pa7',
        arrows: [{ from: 'd1', to: 'd8', color: 'red' }],
        appleBadges: [{ square: 'd1', label: '🍎5' }],
      },
      {
        kirillText: 'Сделай проверочный ход Ладьёй через всю вертикаль: с поля d1 на поле d8!',
        setup: 'w:Rd1,Kg1;b:Kh7,Ph6',
        arrows: [{ from: 'd1', to: 'd8', color: 'green' }],
        appleBadges: [{ square: 'd1', label: '🍎5' }],
      },
    ],
    theoryFinalTask: {
      id: 't_1_2_final',
      title: 'Удар по открытой линии',
      setup: 'w:Rd1,Kg1;b:Kh7,Ph6',
      playerColor: 'w',
      steps: [
        {
          playerFrom: 'd1',
          playerTo: 'd8',
          kirillHint: 'Отправь Ладью по прямой вертикали: d1 → d8!',
          arrows: [{ from: 'd1', to: 'd8', color: 'green' }],
          appleBadges: [{ square: 'd1', label: '🍎5' }],
        },
      ],
    },
  },
  {
    id: 'theory_1_3',
    code: '1.3',
    section: 'theory',
    title: '1.3 «Слон»',
    subtitle: 'Ходит наискосок по диагоналям только своего цвета.',
    badgeText: '🍎 3',
    isFree: true,
    targetWins: 1,
    playerColor: 'w',
    audioKey: 'theory_1_3',
    iconSpec: { primaryPiece: 'b', pieceColor: 'w' },
    theorySlides: [
      {
        kirillText: 'Слон — меткий лучник дружины стоимостью в 3 яблока (🍎3). Он скользит наискосок по диагоналям на любое число свободных клеток.',
        setup: 'w:Bd4',
        arrows: [
          { from: 'd4', to: 'h8', color: 'green' },
          { from: 'd4', to: 'a7', color: 'gold' },
          { from: 'd4', to: 'g1', color: 'gold' },
        ],
        appleBadges: [{ square: 'd4', label: '🍎3' }],
      },
      {
        kirillText: 'У каждого игрока два Слона: белопольный ходит только по светлым клеткам, а чернопольный — только по тёмным.',
        setup: 'w:Bc1,Bf1',
        arrows: [
          { from: 'c1', to: 'h6', color: 'green' },
          { from: 'f1', to: 'a6', color: 'gold' },
        ],
        appleBadges: [{ square: 'c1', label: '🍎3' }, { square: 'f1', label: '🍎3' }],
      },
      {
        kirillText: 'Порази мишень на большой диагонали! Перемести Слона с клетки b2 на клетку g7.',
        setup: 'w:Bb2,Kg1;b:Pg7,Kh8',
        arrows: [{ from: 'b2', to: 'g7', color: 'green' }],
        appleBadges: [{ square: 'b2', label: '🍎3' }],
      },
    ],
    theoryFinalTask: {
      id: 't_1_3_final',
      title: 'Дальний выстрел Слона',
      setup: 'w:Bb2,Kg1;b:Pg7,Kh6',
      playerColor: 'w',
      steps: [
        {
          playerFrom: 'b2',
          playerTo: 'g7',
          kirillHint: 'Проведи Слона по большой диагонали: b2 → g7!',
          arrows: [{ from: 'b2', to: 'g7', color: 'green' }],
          appleBadges: [{ square: 'b2', label: '🍎3' }],
        },
      ],
    },
  },
  {
    id: 'theory_1_4',
    code: '1.4',
    section: 'theory',
    title: '1.4 «Конь»',
    subtitle: 'Скачет буквой «Г» и единственный умеет перепрыгивать через другие фигуры.',
    badgeText: '🍎 3',
    isFree: true,
    targetWins: 1,
    playerColor: 'w',
    audioKey: 'theory_1_4',
    iconSpec: { primaryPiece: 'n', pieceColor: 'w' },
    theorySlides: [
      {
        kirillText: 'Конь стоит 3 яблока (🍎3) и прыгает буквой «Г»: две клетки прямо и одна вбок! При каждом прыжке Конь меняет цвет клетки.',
        setup: 'w:Nd4',
        arrows: [
          { from: 'd4', to: 'f5', color: 'green' },
          { from: 'd4', to: 'e6', color: 'gold' },
          { from: 'd4', to: 'c6', color: 'gold' },
          { from: 'd4', to: 'b5', color: 'green' },
        ],
        appleBadges: [{ square: 'd4', label: '🍎3' }],
      },
      {
        kirillText: 'Конь — единственная фигура в шахматах, которая перепрыгивает через своих и чужих ратников в самом начале партии!',
        setup: 'w:Ng1,Pf2,Pg2,Ph2,Ke1;b:Ke8',
        arrows: [{ from: 'g1', to: 'f3', color: 'green' }],
        appleBadges: [{ square: 'g1', label: '🍎3' }],
      },
      {
        kirillText: 'Выведи Коня в бой! Сделай прыжок через пешки: g1 → f3.',
        setup: 'w:Ng1,Pf2,Pg2,Ph2,Ke1;b:Ke8',
        arrows: [{ from: 'g1', to: 'f3', color: 'green' }],
        appleBadges: [{ square: 'g1', label: '🍎3' }],
      },
    ],
    theoryFinalTask: {
      id: 't_1_4_final',
      title: 'Боевой прыжок Коня',
      setup: 'w:Ng1,Pf2,Pg2,Ph2,Ke1;b:Ke8',
      playerColor: 'w',
      steps: [
        {
          playerFrom: 'g1',
          playerTo: 'f3',
          kirillHint: 'Прыгни Конём буквой «Г» ближе к центру: g1 → f3!',
          arrows: [{ from: 'g1', to: 'f3', color: 'green' }],
          appleBadges: [{ square: 'g1', label: '🍎3' }],
        },
      ],
    },
  },
  {
    id: 'theory_1_5',
    code: '1.5',
    section: 'theory',
    title: '1.5 «Ферзь»',
    subtitle: 'Самая сильная фигура: бьёт по прямым линиям и диагоналям в любую сторону.',
    badgeText: '🍎 9',
    isFree: true,
    targetWins: 1,
    playerColor: 'w',
    audioKey: 'theory_1_5',
    iconSpec: { primaryPiece: 'q', pieceColor: 'w' },
    theorySlides: [
      {
        kirillText: 'Ферзь — главный богатырь войска! Его мощь равна целым 9 яблокам (🍎9). Он соединил в себе силу Ладьи и Слона.',
        setup: 'w:Qd4',
        arrows: [
          { from: 'd4', to: 'd8', color: 'green' },
          { from: 'd4', to: 'h8', color: 'gold' },
          { from: 'd4', to: 'h4', color: 'green' },
          { from: 'd4', to: 'a1', color: 'gold' },
        ],
        appleBadges: [{ square: 'd4', label: '🍎9' }],
      },
      {
        kirillText: 'Береги Ферзя и не подставляй его под удар мелких фигур! Но когда открыта диагональ — Ферзь атакует стремительно.',
        setup: 'w:Qd1,Ke1;b:Ke8,Ph5',
        arrows: [{ from: 'd1', to: 'h5', color: 'red' }],
        appleBadges: [{ square: 'd1', label: '🍎9' }],
      },
      {
        kirillText: 'Выведи Ферзя по открытой диагонали! Сделай ход: d1 → h5.',
        setup: 'w:Qd1,Ke1,Pe4;b:Ke8,Pe5',
        arrows: [{ from: 'd1', to: 'h5', color: 'green' }],
        appleBadges: [{ square: 'd1', label: '🍎9' }],
      },
    ],
    theoryFinalTask: {
      id: 't_1_5_final',
      title: 'Выход Ферзя на фланг',
      setup: 'w:Qd1,Ke1,Pe4;b:Ke8,Pe5',
      playerColor: 'w',
      steps: [
        {
          playerFrom: 'd1',
          playerTo: 'h5',
          kirillHint: 'Выведи Ферзя по диагонали: d1 → h5!',
          arrows: [{ from: 'd1', to: 'h5', color: 'green' }],
          appleBadges: [{ square: 'd1', label: '🍎9' }],
        },
      ],
    },
  },
  {
    id: 'theory_1_6',
    code: '1.6',
    section: 'theory',
    title: '1.6 «Король»',
    subtitle: 'Главная фигура партии: шагает на одну соседнюю клетку и не может вставать под бой.',
    badgeText: '👑 Князь',
    isFree: true,
    targetWins: 1,
    playerColor: 'w',
    audioKey: 'theory_1_6',
    iconSpec: { primaryPiece: 'k', pieceColor: 'w' },
    theorySlides: [
      {
        kirillText: 'Король (👑) бесценен! Без него партия сразу заканчивается. Он ходит степенно — ровно на одну соседнюю клетку в любую сторону.',
        setup: 'w:Ke4',
        arrows: [
          { from: 'e4', to: 'e5', color: 'green' },
          { from: 'e4', to: 'f5', color: 'gold' },
          { from: 'e4', to: 'd3', color: 'gold' },
        ],
        appleBadges: [{ square: 'e4', label: '👑' }],
      },
      {
        kirillText: 'Железный закон шахмат: Король никогда не имеет права вставать на клетку под боем чужой фигуры! Линия d простреливается Ладьёй d8.',
        setup: 'w:Ke1;b:Rd8,Kg8',
        arrows: [
          { from: 'd8', to: 'd1', color: 'red' },
          { from: 'e1', to: 'f2', color: 'green' },
        ],
        appleBadges: [{ square: 'e1', label: '👑' }, { square: 'd8', label: '🍎5' }],
      },
      {
        kirillText: 'Сделай безопасный шаг Королём на свободную от обстрела клетку: e1 → f2!',
        setup: 'w:Ke1;b:Rd8,Kg8',
        arrows: [{ from: 'e1', to: 'f2', color: 'green' }],
        appleBadges: [{ square: 'e1', label: '👑' }],
      },
    ],
    theoryFinalTask: {
      id: 't_1_6_final',
      title: 'Безопасный шаг Короля',
      setup: 'w:Ke1;b:Rd8,Kg8',
      playerColor: 'w',
      steps: [
        {
          playerFrom: 'e1',
          playerTo: 'f2',
          kirillHint: 'Линия d под прицелом Ладьи! Шагни Королём: e1 → f2.',
          arrows: [
            { from: 'd8', to: 'd1', color: 'red' },
            { from: 'e1', to: 'f2', color: 'green' },
          ],
          appleBadges: [{ square: 'e1', label: '👑' }],
        },
      ],
    },
  },
  {
    id: 'theory_1_7',
    code: '1.7',
    section: 'theory',
    title: '1.7 «Ценность фигур и размен»',
    subtitle: 'Сколько стоит каждая фигура и кого выгоднее рубить при размене.',
    badgeText: '🍎 1..9',
    isFree: true,
    targetWins: 1,
    playerColor: 'w',
    audioKey: 'theory_1_7',
    iconSpec: { primaryPiece: 'n', secondaryPiece: 'r', pieceColor: 'w' },
    theorySlides: [
      {
        kirillText: 'Запомни шкалу силы в яблоках: Пешка = 🍎1, Конь и Слон = 🍎3, Ладья = 🍎5, Ферзь = 🍎9. Кто срубит больше яблок, тот получает перевес!',
        setup: 'w:Pa2,Nb2,Bc2,Rd2,Qe2,Kf2',
        appleBadges: [
          { square: 'a2', label: '🍎1' },
          { square: 'b2', label: '🍎3' },
          { square: 'c2', label: '🍎3' },
          { square: 'd2', label: '🍎5' },
          { square: 'e2', label: '🍎9' },
          { square: 'f2', label: '👑' },
        ],
      },
      {
        kirillText: 'Наш Конь на d4 (🍎3) может срубить пешку b5 (🍎1) или Ладью f5 (🍎5). Конечно, забрать Ладью за 5 яблок намного выгоднее!',
        setup: 'w:Nd4,Kg1;b:Pb5,Rf5,Kg8',
        arrows: [
          { from: 'd4', to: 'b5', color: 'gold' },
          { from: 'd4', to: 'f5', color: 'green' },
        ],
        appleBadges: [
          { square: 'd4', label: '🍎3' },
          { square: 'b5', label: '🍎1' },
          { square: 'f5', label: '🍎5' },
        ],
      },
      {
        kirillText: 'Проведи выгодную охоту! Сруби Конём Ладью за 5 яблок: d4 → f5.',
        setup: 'w:Nd4,Kg1;b:Pb5,Rf5,Kg8',
        arrows: [{ from: 'd4', to: 'f5', color: 'green' }],
        appleBadges: [
          { square: 'd4', label: '🍎3' },
          { square: 'b5', label: '🍎1' },
          { square: 'f5', label: '🍎5' },
        ],
      },
    ],
    theoryFinalTask: {
      id: 't_1_7_final',
      title: 'Выгодное взятие по яблокам',
      setup: 'w:Nd4,Kg1;b:Pb5,Rf5,Kg8',
      playerColor: 'w',
      steps: [
        {
          playerFrom: 'd4',
          playerTo: 'f5',
          kirillHint: 'Выбери самую ценную добычу (🍎5): ходи Конём d4 → f5!',
          arrows: [{ from: 'd4', to: 'f5', color: 'green' }],
          appleBadges: [
            { square: 'd4', label: '🍎3' },
            { square: 'b5', label: '🍎1' },
            { square: 'f5', label: '🍎5' },
          ],
        },
      ],
    },
  },
  {
    id: 'theory_1_8',
    code: '1.8',
    section: 'theory',
    title: '1.8 «Шах, Мат, Пат и этапы игры»',
    subtitle: 'Чем победный мат отличается от ничейного пата и из каких частей состоит партия.',
    badgeText: '🏆 Мат',
    isFree: true,
    targetWins: 1,
    playerColor: 'w',
    audioKey: 'theory_1_8',
    iconSpec: { primaryPiece: 'r', secondaryPiece: 'k', pieceColor: 'w' },
    theorySlides: [
      {
        kirillText: 'Вся партия делится на 3 этапа: 1) Дебют (вывод фигур и рокировка), 2) Миттельшпиль (главная битва в центре) и 3) Эндшпиль (развязка и проведение пешек).',
        setup: 'w:Ke6,Ra1;b:Ke8',
        appleBadges: [{ square: 'e6', label: '👑' }, { square: 'a1', label: '🍎5' }, { square: 'e8', label: '👑' }],
      },
      {
        kirillText: 'ШАХ — это нападение на Короля. МАТ — когда Королю объявлен шах и ему некуда уйти (это победа!). А ПАТ — когда шаха нет, но ходить некуда (ничья!).',
        setup: 'w:Ke6,Ra1;b:Ke8',
        arrows: [{ from: 'a1', to: 'a8', color: 'red' }],
        appleBadges: [{ square: 'a1', label: '🍎5' }, { square: 'e8', label: '👑' }],
      },
      {
        kirillText: 'Поставь свой первый чистый Мат Ладьёй по 8-му ряду: сделай ход a1 → a8#!',
        setup: 'w:Ke6,Ra1;b:Ke8',
        arrows: [{ from: 'a1', to: 'a8', color: 'green' }],
        appleBadges: [{ square: 'a1', label: '🍎5' }, { square: 'e8', label: '👑' }],
      },
    ],
    theoryFinalTask: {
      id: 't_1_8_final',
      title: 'Линейный мат в 1 ход',
      setup: 'w:Ke6,Ra1;b:Ke8',
      playerColor: 'w',
      steps: [
        {
          playerFrom: 'a1',
          playerTo: 'a8',
          kirillHint: 'Объяви победный Мат Ладьёй по восьмой горизонтали: a1 → a8#!',
          arrows: [{ from: 'a1', to: 'a8', color: 'green' }],
          appleBadges: [{ square: 'a1', label: '🍎5' }, { square: 'e8', label: '👑' }],
        },
      ],
    },
  },

  // =========================================================================
  // РАЗДЕЛ 2. ПРАКТИКА «БОЕВОЕ СЛАЖИВАНИЕ» (10 уроков: 2.1–2.10)
  // =========================================================================
  {
    id: 'prac_2_1',
    code: '2.1',
    section: 'practice',
    title: '2.1 «Маршруты Ладьи и Ферзя»',
    subtitle: 'Свободный выбор маршрута: собери все 3 яблока-мишени на доске за 4 хода.',
    badgeText: '🍎 Маршрут',
    isFree: true,
    targetWins: 4,
    playerColor: 'w',
    audioKey: 'prac_2_1',
    iconSpec: { primaryPiece: 'q', secondaryPiece: 'r', pieceColor: 'w' },
    proceduralMode: 'rook_queen',
  },
  {
    id: 'prac_2_2',
    code: '2.2',
    section: 'practice',
    title: '2.2 «Маневры Слона и прыжки Коня»',
    subtitle: 'Собери 3 яблока-мишени диагоналями Слона (по клеткам одного цвета) и прыжками Коня.',
    badgeText: '🍎 Маневр',
    isFree: true,
    targetWins: 4,
    playerColor: 'w',
    audioKey: 'prac_2_2',
    iconSpec: { primaryPiece: 'b', secondaryPiece: 'n', pieceColor: 'w' },
    proceduralMode: 'bishop_knight',
  },
  {
    id: 'prac_2_3',
    code: '2.3',
    section: 'practice',
    title: '2.3 «Прорыв и превращение пешки»',
    subtitle: 'Задачи по сборнику С. Д. Иващенко (стр. 23–26): превращение пешки в Ферзя или хитрого Коня с матом!',
    badgeText: '♟️→👑',
    isFree: false,
    targetWins: 4,
    playerColor: 'w',
    audioKey: 'prac_2_3',
    iconSpec: { primaryPiece: 'p', secondaryPiece: 'q', pieceColor: 'w' },
    variants: [
      {
        id: 'iv_111',
        title: 'Диаграмма №111 (С. Д. Иващенко, стр. 23)',
        setup: 'w:Kh1,Re1,Bf6,Pc7;b:Ke8,Rf8,Be6,Pb7,Pf7,Pg7,Ph7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'c7',
            playerTo: 'c8',
            promotionPiece: 'q',
            kirillHint: 'Диаграмма №111 Иващенко: проведи пешку c7 → c8Ф# с матом!',
            arrows: [{ from: 'c7', to: 'c8', color: 'green' }],
          },
        ],
      },
      {
        id: 'iv_110',
        title: 'Диаграмма №110 (С. Д. Иващенко, стр. 23)',
        setup: 'w:Kh2,Rg8,Pb7,Pd5,Pg2,Ph3;b:Kd7,Rc7,Qe7,Pd6,Ph7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'b7',
            playerTo: 'b8',
            promotionPiece: 'n',
            kirillHint: 'Диаграмма №110 Иващенко: хитрое превращение в КОНЯ b7 → b8К#!',
            arrows: [{ from: 'b7', to: 'b8', color: 'green' }],
          },
        ],
      },
      {
        id: 'iv_131',
        title: 'Диаграмма №131 (С. Д. Иващенко, стр. 26)',
        setup: 'w:Ka3,Nb3,Re7,Pb7;b:Ka7,Nd7,Bg1',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'b7',
            playerTo: 'b8',
            promotionPiece: 'q',
            kirillHint: 'Диаграмма №131 Иващенко: преврати пешку в Ферзя b7 → b8Ф#!',
            arrows: [{ from: 'b7', to: 'b8', color: 'green' }],
          },
        ],
      },
      {
        id: 'iv_136',
        title: 'Диаграмма №136 (С. Д. Иващенко, стр. 26)',
        setup: 'w:Ke4,Qa2,Na8,Pd7;b:Kb7,Nc8,Pc7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'd7',
            playerTo: 'd8',
            promotionPiece: 'n',
            kirillHint: 'Диаграмма №136 Иващенко: превращение в КОНЯ d7 → d8К#!',
            arrows: [{ from: 'd7', to: 'd8', color: 'green' }],
          },
        ],
      },
    ],
  },
  {
    id: 'prac_2_4',
    code: '2.4',
    section: 'practice',
    title: '2.4 «Короткая и длинная рокировка»',
    subtitle: 'Мат длинной рокировкой (№122 Иващенко) и выбор безопасной стороны при обстреле полей.',
    badgeText: '0-0 / 0-0-0',
    isFree: false,
    targetWins: 4,
    playerColor: 'w',
    audioKey: 'prac_2_4',
    iconSpec: { primaryPiece: 'k', secondaryPiece: 'r', pieceColor: 'w' },
    variants: [
      {
        id: 'iv_122',
        title: 'Диаграмма №122 Иващенко, стр. 25 (1. 0-0-0#)',
        setup: 'w:Ke1,Ra1,Bg6,Nf7;b:Kd7,Qe7,Nc6,Pd5',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e1',
            playerTo: 'c1',
            kirillHint: 'Диаграмма №122 Иващенко: объяви мат длинной рокировкой e1 → c1 (0-0-0#)!',
            arrows: [{ from: 'e1', to: 'c1', color: 'green' }],
          },
        ],
      },
      {
        id: 'castle_short',
        title: 'Классическая короткая рокировка (O-O)',
        setup: 'w:Ke1,Rh1,Pf2,Pg2,Ph2;b:Ke8,Pa7,Pb7,Pc7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e1',
            playerTo: 'g1',
            kirillHint: 'Спрячь Короля в крепость короткой рокировкой: e1 → g1 (0-0)!',
            arrows: [{ from: 'e1', to: 'g1', color: 'green' }],
          },
        ],
      },
      {
        id: 'castle_f1_attacked',
        title: 'Поле f1 под прицелом слона a6',
        setup: 'w:Ke1,Ra1,Rh1,Pa2,Pb2,Pc2,Pg2,Ph2;b:Ke8,Ba6',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e1',
            playerTo: 'c1',
            kirillHint: 'Поле f1 бито слоном a6! Сделай длинную рокировку e1 → c1 (0-0-0).',
            arrows: [
              { from: 'a6', to: 'f1', color: 'red' },
              { from: 'e1', to: 'c1', color: 'green' },
            ],
          },
        ],
      },
      {
        id: 'castle_d1_attacked',
        title: 'Поле d1 под ударом ладьи d8',
        setup: 'w:Ke1,Ra1,Rh1,Pa2,Pb2,Pf2,Pg2,Ph2;b:Kg8,Rd8',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e1',
            playerTo: 'g1',
            kirillHint: 'Поле d1 под боем ладьи d8! Выполни короткую рокировку e1 → g1 (0-0).',
            arrows: [
              { from: 'd8', to: 'd1', color: 'red' },
              { from: 'e1', to: 'g1', color: 'green' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'prac_2_5',
    code: '2.5',
    section: 'practice',
    title: '2.5 «Три способа защиты от шаха»',
    subtitle: 'Открытая практика: выбери любой легальный ход, спасающий Короля (срубить, перекрыться или отойти).',
    badgeText: '🛡️ Защита',
    isFree: false,
    targetWins: 4,
    playerColor: 'w',
    audioKey: 'prac_2_5',
    iconSpec: { primaryPiece: 'k', secondaryPiece: 'b', pieceColor: 'w' },
    variants: [
      {
        id: 'check_def_1',
        title: 'Защита №1: Срубить атакующую фигуру',
        setup: 'w:Kg1,Nd4,Pf2,Pg2,Ph2;b:Kg8,Re2',
        playerColor: 'w',
        openCheckDefense: true,
        steps: [
          {
            playerFrom: 'd4',
            playerTo: 'e2',
            kirillHint: 'Королю шах от ладьи e2! Спаси Короля (лучше всего срубить ладью Конём d4 → e2).',
            arrows: [{ from: 'e2', to: 'g1', color: 'red' }],
          },
        ],
      },
      {
        id: 'check_def_2',
        title: 'Защита №2: Перекрыть линию шаха щитом',
        setup: 'w:Ke1,Bc4,Pf2,Pg2;b:Kg8,Re8',
        playerColor: 'w',
        openCheckDefense: true,
        steps: [
          {
            playerFrom: 'c4',
            playerTo: 'e2',
            kirillHint: 'Шах по открытой линии e! Перекройся Слоном c4 → e2 или отойди Королём.',
            arrows: [{ from: 'e8', to: 'e1', color: 'red' }],
          },
        ],
      },
      {
        id: 'check_def_3',
        title: 'Защита №3: Отойти Королём в укрытие',
        setup: 'w:Ke1,Pa2,Pb2;b:Kg8,Qa5',
        playerColor: 'w',
        openCheckDefense: true,
        steps: [
          {
            playerFrom: 'e1',
            playerTo: 'f1',
            kirillHint: 'Шах от ферзя a5! Сделай любой легальный ход, спасающий Короля.',
            arrows: [{ from: 'a5', to: 'e1', color: 'red' }],
          },
        ],
      },
      {
        id: 'check_def_4',
        title: 'Защита №4: Контрудар против шаха',
        setup: 'w:Kh1,Rc3,Pg2,Ph2;b:Kg8,Qb1',
        playerColor: 'w',
        openCheckDefense: true,
        steps: [
          {
            playerFrom: 'c3',
            playerTo: 'c1',
            kirillHint: 'Ферзь b1 объявил шах по 1-му ряду! Защити Короля Ладьёй c3 → c1.',
            arrows: [{ from: 'b1', to: 'h1', color: 'red' }],
          },
        ],
      },
    ],
  },
  {
    id: 'prac_2_6',
    code: '2.6',
    section: 'practice',
    title: '2.6 «Выгодный размен и охота»',
    subtitle: 'Выбери самое выгодное или незащищённое взятие по яблокам силы: Ладья и Ферзь вместо пешки.',
    badgeText: '🍎 Охота',
    isFree: false,
    targetWins: 4,
    playerColor: 'w',
    audioKey: 'prac_2_6',
    iconSpec: { primaryPiece: 'n', secondaryPiece: 'q', pieceColor: 'w' },
    variants: [
      {
        id: 'hunt_1',
        title: 'Охота Конём: Ладья (🍎5) или Пешка (🍎1)',
        setup: 'w:Kg1,Nd4;b:Kg8,Rf5,Pb5',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'd4',
            playerTo: 'f5',
            kirillHint: 'Выбери самое выгодное взятие по яблокам силы: Nd4 → f5 (🍎5)!',
            appleBadges: [{ square: 'f5', label: '🍎5' }, { square: 'b5', label: '🍎1' }],
          },
        ],
      },
      {
        id: 'hunt_2',
        title: 'Охота Слоном: Ферзь (🍎9) или Конь (🍎3)',
        setup: 'w:Kg1,Bc3;b:Kg8,Qf6,Na5',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'c3',
            playerTo: 'f6',
            kirillHint: 'Забери самую дорогую фигуру соперника: Bc3 → f6 (Ферзь 🍎9)!',
            appleBadges: [{ square: 'f6', label: '🍎9' }, { square: 'a5', label: '🍎3' }],
          },
        ],
      },
      {
        id: 'hunt_3',
        title: 'Охота Ладьёй: незащищённая цель',
        setup: 'w:Kg1,Rd1;b:Kg8,Qd6,Pb1,Bc2',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'd1',
            playerTo: 'd6',
            kirillHint: 'Сруби незащищённого Ферзя соперника по вертикали: Rd1 → d6 (🍎9)!',
            appleBadges: [{ square: 'd6', label: '🍎9' }, { square: 'b1', label: '🍎1' }],
          },
        ],
      },
      {
        id: 'hunt_4',
        title: 'Охота Ферзём: удар по 7-му ряду',
        setup: 'w:Kg1,Qe2;b:Kh8,Re7,Pb2',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e2',
            playerTo: 'e7',
            kirillHint: 'Забери незащищённую Ладью соперника: Qe2 → e7 (🍎5)!',
            appleBadges: [{ square: 'e7', label: '🍎5' }, { square: 'b2', label: '🍎1' }],
          },
        ],
      },
    ],
  },
  {
    id: 'prac_2_7',
    code: '2.7',
    section: 'practice',
    title: '2.7 «Мат в 1 ход: Ладья и Ферзь»',
    subtitle: '5 классических задач С. Д. Иващенко (1 класс, стр. 5–6): линейный и эполетный мат тяжёлыми фигурами.',
    badgeText: '🏆 Мат в 1',
    isFree: false,
    targetWins: 5,
    playerColor: 'w',
    audioKey: 'prac_2_7',
    iconSpec: { primaryPiece: 'r', secondaryPiece: 'q', pieceColor: 'w' },
    variants: [
      {
        id: 'iv_m1_1',
        title: 'Диаграмма №1 (С. Д. Иващенко, стр. 5)',
        setup: 'w:Ke6,Ra2;b:Ke8',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'a2',
            playerTo: 'a8',
            kirillHint: 'Диаграмма №1 Иващенко: поставь мат Ладьёй по 8-му ряду a2 → a8#!',
          },
        ],
      },
      {
        id: 'iv_m1_2',
        title: 'Диаграмма №2 (С. Д. Иващенко, стр. 5)',
        setup: 'w:Kd3,Rh7,Ra1;b:Ke8',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'a1',
            playerTo: 'a8',
            kirillHint: 'Диаграмма №2 Иващенко: линейный мат двумя Ладьями a1 → a8#!',
          },
        ],
      },
      {
        id: 'iv_m1_3',
        title: 'Диаграмма №3 (С. Д. Иващенко, стр. 5)',
        setup: 'w:Kf6,Qa2;b:Kf8,Pa7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'a2',
            playerTo: 'f7',
            kirillHint: 'Диаграмма №3 Иващенко: поставь мат Ферзём под защитой Короля a2 → f7#!',
          },
        ],
      },
      {
        id: 'iv_m1_5',
        title: 'Диаграмма №5 (С. Д. Иващенко, стр. 5)',
        setup: 'w:Kg1,Ra1,Pf2,Pg3;b:Kg8,Pf7,Pg7,Ph7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'a1',
            playerTo: 'a8',
            kirillHint: 'Диаграмма №5 Иващенко: мат по последней горизонтали a1 → a8#!',
          },
        ],
      },
      {
        id: 'iv_m1_8',
        title: 'Диаграмма №8 (С. Д. Иващенко, стр. 6)',
        setup: 'w:Kd6,Ne6,Rh7;b:Ke8,Qa1',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'h7',
            playerTo: 'e7',
            kirillHint: 'Диаграмма №8 Иващенко: мат Ладьёй при поддержке Коня h7 → e7#!',
          },
        ],
      },
    ],
  },
  {
    id: 'prac_2_8',
    code: '2.8',
    section: 'practice',
    title: '2.8 «Мат в 1 ход: Слон, Конь и Пешка»',
    subtitle: '4 задачи С. Д. Иващенко (стр. 5–8), включая спёртый мат Конём и знаменитую задачу Пола Морфи.',
    badgeText: '🐎 Мат в 1',
    isFree: false,
    targetWins: 4,
    playerColor: 'w',
    audioKey: 'prac_2_8',
    iconSpec: { primaryPiece: 'n', secondaryPiece: 'b', pieceColor: 'w' },
    variants: [
      {
        id: 'iv_m1_4',
        title: 'Диаграмма №4 (С. Д. Иващенко, стр. 5)',
        setup: 'w:Kg6,Bb2,Bh2;b:Kh8',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'h2',
            playerTo: 'e5',
            kirillHint: 'Диаграмма №4 Иващенко: поставь мат двумя Слонами h2 → e5#!',
          },
        ],
      },
      {
        id: 'iv_m1_18',
        title: 'Диаграмма №18 (С. Д. Иващенко, стр. 7)',
        setup: 'w:Kb3,Ra1,Na4;b:Ka8,Rb8,Rc8,Pa7,Pb7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'a4',
            playerTo: 'b6',
            kirillHint: 'Диаграмма №18 Иващенко: спёртый мат Конём в углу a4 → b6#!',
          },
        ],
      },
      {
        id: 'iv_m1_20',
        title: 'Диаграмма №20 (С. Д. Иващенко, стр. 7)',
        setup: 'w:Kh6,Nb7,Ne6;b:Ke8,Nd7,Ne7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'b7',
            playerTo: 'd6',
            kirillHint: 'Диаграмма №20 Иващенко: изящный мат двумя Конями b7 → d6#!',
          },
        ],
      },
      {
        id: 'iv_m1_21_morphy',
        title: 'Диаграмма №21 (Знаменитая задача Пола Морфи)',
        setup: 'w:Kc8,Pb6;b:Ka8,Bb8,Pa7,Pa6',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'b6',
            playerTo: 'b7',
            kirillHint: 'Знаменитая задача Пола Морфи (№21): поставь мат пешкой b6 → b7#!',
          },
        ],
      },
    ],
  },
  {
    id: 'prac_2_9',
    code: '2.9',
    section: 'practice',
    title: '2.9 «Детский мат и Мат Легаля»',
    subtitle: 'Удар по слабому полю f7, защита и контратака за чёрных, а также знаменитая ловушка Легаля.',
    badgeText: '⚡ Ловушки',
    isFree: false,
    targetWins: 4,
    playerColor: 'w',
    audioKey: 'prac_2_9',
    iconSpec: { primaryPiece: 'q', secondaryPiece: 'b', pieceColor: 'w' },
    variants: [
      {
        id: 'iv_49_scholar',
        title: 'Диаграмма №49 Иващенко, стр. 13 (Детский мат)',
        setup: 'w:Ke1,Bc4,Qf3,Pe4;b:Ke8,Bc5,Nc6,Pe5,Pf7,Pg7,Ph7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'f3',
            playerTo: 'f7',
            kirillHint: 'Диаграмма №49 Иващенко: атакуй слабую пешку f7 — Детский мат f3 → f7#!',
          },
        ],
      },
      {
        id: 'scholar_def_g6',
        title: 'Защита от Детского мата за чёрных (g7 → g6)',
        setup: 'w:Ke1,Bc4,Qh5,Pe4;b:Ke8,Nc6,Pe5,Pf7,Pg7,Ph7',
        playerColor: 'b',
        steps: [
          {
            playerFrom: 'g7',
            playerTo: 'g6',
            kirillHint: 'Ты играешь за чёрных! Перекрой диагональ Ферзю h5 ходом пешки g7 → g6.',
          },
        ],
      },
      {
        id: 'scholar_counter_nf6',
        title: 'Контратака против Детского мата за чёрных (g8 → f6)',
        setup: 'w:Ke1,Bc4,Qf3,Pe4;b:Ke8,Nc6,Ng8,Pe5,Pf7,Pg7,Ph7',
        playerColor: 'b',
        steps: [
          {
            playerFrom: 'g8',
            playerTo: 'f6',
            kirillHint: 'Защити поле f7 и выведи фигуру в бой: сыграй Конём g8 → f6!',
          },
        ],
      },
      {
        id: 'iv_48_legal',
        title: 'Диаграмма №48 Иващенко, стр. 12 (Мат Легаля)',
        setup: 'w:Ke1,Bc4,Nc3,Nf7,Pe4;b:Ke7,Bd1,Nc6,Pd6,Pf6',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'c3',
            playerTo: 'd5',
            kirillHint: 'Диаграмма №48 Иващенко (Мат Легаля): заверши комбинацию прыжком Коня c3 → d5#!',
          },
        ],
      },
    ],
  },
  {
    id: 'prac_2_10',
    code: '2.10',
    section: 'practice',
    title: '2.10 «Как избежать Пата»',
    subtitle: 'Историческая партия Веричева — Вострецова (г. Киров, 1974 г.), «бешеная ладья» и спарринг Анти-Пат.',
    badgeText: '⚖️ Анти-Пат',
    isFree: false,
    targetWins: 3,
    playerColor: 'w',
    audioKey: 'prac_2_10',
    iconSpec: { primaryPiece: 'q', secondaryPiece: 'k', pieceColor: 'w' },
    variants: [
      {
        id: 'kirov_1974_verichev',
        title: 'Веричева — Вострецова, г. Киров, 1974 г. (№738 Иващенко)',
        setup: 'w:Kh1,Qe6;b:Kh4,Qf2,Ng5,Pg6,Ph5',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e6',
            playerTo: 'g4',
            kirillHint: 'Партия Веричева — Вострецова (Киров, 1974 г.): спасись жертвой Ферзя e6 → g4+! После Кр:g4 — ПАТ!',
            replyFrom: 'h4',
            replyTo: 'g4',
            replyText: 'Чёрный король забирает Ферзя Крh4:g4 — и на доске чистый спасительный ПАТ! Гордость кировской школы!',
          },
        ],
      },
      {
        id: 'iv_703_mad_rook',
        title: 'Диаграмма №703 Иващенко, стр. 122 («Бешеная ладья»)',
        setup: 'w:Ka5,Rh4;b:Kc6,Qd1',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'h4',
            playerTo: 'c4',
            kirillHint: 'Диаграмма №703 («Бешеная ладья»): пожертвуй Ладью с шахом h4 → c4+ ради пата!',
            replyFrom: 'd1',
            replyTo: 'c4',
            replyText: 'После Фd1:c4 белому Королю a5 некуда ходить, а шаха нет — ничья патом!',
          },
        ],
      },
      {
        id: 'anti_stalemate_sparring',
        title: 'Свободный спарринг Анти-Пат (Мат Ферзём и Королём)',
        setup: 'w:Kc5,Qd5;b:Ka8',
        playerColor: 'w',
        sparringAntiStalemate: true,
        steps: [
          {
            playerFrom: 'd5',
            playerTo: 'b7',
            kirillHint: 'Свободный спарринг Анти-Пат: поставь мат чёрному Королю на a8, не угодив в пат! (например, Qd5 → b7#).',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // РАЗДЕЛ 3. «ТАКТИКА, ДЕБЮТЫ И ЭНДШПИЛЬ 30/30» (11 уроков: 3.1–3.11)
  // =========================================================================
  {
    id: 'mastery_3_1',
    code: '3.1',
    section: 'mastery',
    title: '3.1 «Тактика: Вилка»',
    subtitle: 'Двойной удар Ферзём, Конём и Пешкой по двум мишеням сразу (№151 и №223 Иващенко).',
    badgeText: '⚔️ 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'w',
    audioKey: 'mastery_3_1',
    iconSpec: { primaryPiece: 'n', secondaryPiece: 'q', pieceColor: 'w' },
    variants: [
      {
        id: 'fork_iv_151',
        title: 'Диаграмма №151 Иващенко (Ферзевая вилка)',
        setup: 'w:Kg1,Qh4;b:Kf6,Bg7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'h4',
            playerTo: 'd4',
            kirillHint: 'Двойной удар Ферзём: дай шах и напади на слона h4 → d4+!',
            replyFrom: 'f6',
            replyTo: 'e6',
            arrows: [
              { from: 'h4', to: 'd4', color: 'green' },
              { from: 'd4', to: 'f6', color: 'red' },
              { from: 'd4', to: 'g7', color: 'red' },
            ],
          },
          {
            playerFrom: 'd4',
            playerTo: 'g7',
            kirillHint: 'Забирай незащищённого слона: d4 → g7!',
            arrows: [{ from: 'd4', to: 'g7', color: 'green' }],
          },
        ],
      },
      {
        id: 'fork_iv_223',
        title: 'Диаграмма №223 Иващенко (Превращение с вилкой)',
        setup: 'w:Kg2,Pf7;b:Kh8,Qe6',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'f7',
            playerTo: 'f8',
            promotionPiece: 'n',
            kirillHint: 'Преврати пешку в Коня с вилкой на Короля и Ферзя: f7 → f8К+!',
            replyFrom: 'h8',
            replyTo: 'g7',
            arrows: [
              { from: 'f7', to: 'f8', color: 'green' },
              { from: 'f8', to: 'h8', color: 'red' },
              { from: 'f8', to: 'e6', color: 'red' },
            ],
          },
          {
            playerFrom: 'f8',
            playerTo: 'e6',
            kirillHint: 'Руби чёрного Ферзя Конём: f8 → e6!',
            arrows: [{ from: 'f8', to: 'e6', color: 'green' }],
          },
        ],
      },
      {
        id: 'fork_knight_d7',
        title: 'Коневая вилка на Короля e8 и Ферзя b6',
        setup: 'w:Kg1,Ne5,Pf2,Pg2,Ph2;b:Ke8,Qb6',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e5',
            playerTo: 'd7',
            kirillHint: 'Прыгни Конём с вилкой на Короля и Ферзя: e5 → d7+!',
            arrows: [
              { from: 'e5', to: 'd7', color: 'green' },
              { from: 'd7', to: 'e8', color: 'red' },
              { from: 'd7', to: 'b6', color: 'red' },
            ],
          },
        ],
      },
      {
        id: 'fork_pawn_e5',
        title: 'Пешечная вилка в центре (e4 → e5)',
        setup: 'w:Kg1,Pe4,Pd3,Pf2,Pg2,Ph2;b:Kg8,Bc5,Nf6',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e4',
            playerTo: 'e5',
            kirillHint: 'Атакуй пешкой сразу две фигуры (Слона c5 и Коня f6): e4 → e5!',
            arrows: [
              { from: 'e4', to: 'e5', color: 'green' },
              { from: 'e5', to: 'c5', color: 'red' },
              { from: 'e5', to: 'f6', color: 'red' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_2',
    code: '3.2',
    section: 'mastery',
    title: '3.2 «Тактика: Связка»',
    subtitle: 'Использование связанных фигур и пешек для матовой атаки и выигрыша материала.',
    badgeText: '📌 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'w',
    audioKey: 'mastery_3_2',
    iconSpec: { primaryPiece: 'b', secondaryPiece: 'r', pieceColor: 'w' },
    variants: [
      {
        id: 'pin_mate_h7',
        title: 'Мат на h7 при связанной пешке g7',
        setup: 'w:Kg1,Bb2,Qg6;b:Kh8,Pg7,Rf8',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'g6',
            playerTo: 'h7',
            kirillHint: 'Пешка g7 связана Слоном b2! Поставь мат Ферзём: g6 → h7#.',
            arrows: [
              { from: 'b2', to: 'h8', color: 'red' },
              { from: 'g6', to: 'h7', color: 'green' },
            ],
          },
        ],
      },
      {
        id: 'pin_knight_e6',
        title: 'Удар по связанному Коню e6',
        setup: 'w:Kg1,Bc4,Re1;b:Kg8,Ne6,Pf7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'e1',
            playerTo: 'e6',
            kirillHint: 'Конь e6 связан Слоном c4 (позади пешка f7 и Король g8)! Бей Ладьёй: e1 → e6.',
            arrows: [
              { from: 'c4', to: 'g8', color: 'red' },
              { from: 'e1', to: 'e6', color: 'green' },
            ],
          },
        ],
      },
      {
        id: 'pin_queen_d5',
        title: 'Связка Ферзя d5 Ладьёй по вертикали',
        setup: 'w:Kg1,Rd3,Bf4;b:Kd8,Qd5',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'd3',
            playerTo: 'd1',
            kirillHint: 'Свяжи чёрного Ферзя d5 на одной линии с Королём d8: сыграй Ладьёй d3 → d1!',
            arrows: [
              { from: 'd3', to: 'd1', color: 'green' },
              { from: 'd1', to: 'd8', color: 'red' },
            ],
          },
        ],
      },
      {
        id: 'pin_knight_f6',
        title: 'Атака связанного Коня f6',
        setup: 'w:Kg1,Bg5,Nd5;b:Kg8,Qd8,Nf6,Pg7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'd5',
            playerTo: 'f6',
            kirillHint: 'Конь f6 прикрывает Ферзя d8! Пробей оборону: d5 → f6+.',
            arrows: [
              { from: 'g5', to: 'd8', color: 'red' },
              { from: 'd5', to: 'f6', color: 'green' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_3',
    code: '3.3',
    section: 'mastery',
    title: '3.3 «Тактика: Батарея»',
    subtitle: 'Взаимодействие Слона и Ферзя по диагонали, вскрытый двойной шах и батарея двух Ладей.',
    badgeText: '🚀 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'w',
    audioKey: 'mastery_3_3',
    iconSpec: { primaryPiece: 'q', secondaryPiece: 'b', pieceColor: 'w' },
    variants: [
      {
        id: 'battery_iv_6',
        title: 'Диаграмма №6 Иващенко (Батарея Слон + Ферзь)',
        setup: 'w:Kg1,Ba1,Qb2;b:Kg8,Rf8,Pf7,Pg7,Ph7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'b2',
            playerTo: 'g7',
            kirillHint: 'Батарея Сa1 + Фb2 бьёт в одну точку! Поставь мат b2 → g7#.',
            arrows: [
              { from: 'a1', to: 'g7', color: 'gold' },
              { from: 'b2', to: 'g7', color: 'green' },
            ],
          },
        ],
      },
      {
        id: 'battery_iv_271',
        title: 'Диаграмма №271 Иващенко (Вскрытый двойной шах)',
        setup: 'w:Kg1,Rd1,Bd4;b:Kg8,Qd8,Pf7,Ph7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'd4',
            playerTo: 'g7',
            kirillHint: 'Вскрой батарею со Слона и Ладьи: дай шах d4 → g7+!',
            replyFrom: 'g8',
            replyTo: 'g7',
            arrows: [{ from: 'd4', to: 'g7', color: 'green' }],
          },
          {
            playerFrom: 'd1',
            playerTo: 'd8',
            kirillHint: 'Чёрный Ферзь остался без защиты! Забирай его Ладьёй: d1 → d8.',
            arrows: [{ from: 'd1', to: 'd8', color: 'green' }],
          },
        ],
      },
      {
        id: 'battery_two_rooks',
        title: 'Батарея двух Ладей по открытой вертикали d',
        setup: 'w:Kg1,Rd1,Rd7;b:Kg8,Pf7,Pg7,Ph7',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'd7',
            playerTo: 'd8',
            kirillHint: 'Две Ладьи сдвоены по линии d! Поставь мат по 8-му ряду: d7 → d8#.',
            arrows: [
              { from: 'd1', to: 'd8', color: 'gold' },
              { from: 'd7', to: 'd8', color: 'green' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_4',
    code: '3.4',
    section: 'mastery',
    title: '3.4 «Итальянская партия (За белых)»',
    subtitle: 'Классический удар по полю f7: 1.e4 e5 2.Кf3 Кc6 3.Сc4 и 3 ветки ответа чёрных до автоматизма.',
    badgeText: '🇮🇹 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'w',
    audioKey: 'mastery_3_4',
    iconSpec: { primaryPiece: 'b', secondaryPiece: 'n', pieceColor: 'w' },
    variants: [
      {
        id: 'italian_giuoco_piano',
        title: 'Ветка 1: Тихая итальянка (3...Сc5 4.c3 Кf6 5.d4)',
        setup: 'INITIAL',
        playerColor: 'w',
        steps: [
          { playerFrom: 'e2', playerTo: 'e4', kirillHint: '1. Захвати центр королевской пешкой: e2 → e4!', replyFrom: 'e7', replyTo: 'e5' },
          { playerFrom: 'g1', playerTo: 'f3', kirillHint: '2. Развей Коня с нападением на пешку e5: g1 → f3!', replyFrom: 'b8', replyTo: 'c6' },
          { playerFrom: 'f1', playerTo: 'c4', kirillHint: '3. Выведи Слона на прицел поля f7: f1 → c4!', replyFrom: 'f8', replyTo: 'c5' },
          { playerFrom: 'c2', playerTo: 'c3', kirillHint: '4. Тихая итальянка (3...Сc5): подготовь прорыв в центре c2 → c3!', replyFrom: 'g8', replyTo: 'f6' },
          { playerFrom: 'd2', playerTo: 'd4', kirillHint: '5. Нанеси главный удар по центру: d2 → d4!', arrows: [{ from: 'd2', to: 'd4', color: 'green' }] },
        ],
      },
      {
        id: 'italian_two_knights',
        title: 'Ветка 2: Защита двух коней (3...Кf6 4.d3 Сc5 5.0-0)',
        setup: 'INITIAL',
        playerColor: 'w',
        steps: [
          { playerFrom: 'e2', playerTo: 'e4', kirillHint: '1. Захвати центр пешкой: e2 → e4!', replyFrom: 'e7', replyTo: 'e5' },
          { playerFrom: 'g1', playerTo: 'f3', kirillHint: '2. Атакуй пешку e5 Конём: g1 → f3!', replyFrom: 'b8', replyTo: 'c6' },
          { playerFrom: 'f1', playerTo: 'c4', kirillHint: '3. Выведи итальянского Слона: f1 → c4!', replyFrom: 'g8', replyTo: 'f6' },
          { playerFrom: 'd2', playerTo: 'd3', kirillHint: '4. Защита двух коней (3...Кf6): укрепи пешку e4 ходом d2 → d3!', replyFrom: 'f8', replyTo: 'c5' },
          { playerFrom: 'e1', playerTo: 'g1', kirillHint: '5. Уведи Короля в безопасность короткой рокировкой: e1 → g1 (0-0)!', arrows: [{ from: 'e1', to: 'g1', color: 'green' }] },
        ],
      },
      {
        id: 'italian_cautious_d6',
        title: 'Ветка 3: Осторожная защита (3...d6 4.c3 Кf6 5.d4)',
        setup: 'INITIAL',
        playerColor: 'w',
        steps: [
          { playerFrom: 'e2', playerTo: 'e4', kirillHint: '1. Первый шаг в центр: e2 → e4!', replyFrom: 'e7', replyTo: 'e5' },
          { playerFrom: 'g1', playerTo: 'f3', kirillHint: '2. Выведи Коня в бой: g1 → f3!', replyFrom: 'b8', replyTo: 'c6' },
          { playerFrom: 'f1', playerTo: 'c4', kirillHint: '3. Поставь Слона на боевую диагональ: f1 → c4!', replyFrom: 'd7', replyTo: 'd6' },
          { playerFrom: 'c2', playerTo: 'c3', kirillHint: '4. Соперник сыграл 3...d6: готовь таран в центре ходом c2 → c3!', replyFrom: 'g8', replyTo: 'f6' },
          { playerFrom: 'd2', playerTo: 'd4', kirillHint: '5. Захвати полный контроль над центром: d2 → d4!', arrows: [{ from: 'd2', to: 'd4', color: 'green' }] },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_5',
    code: '3.5',
    section: 'mastery',
    title: '3.5 «Испанская партия (За белых)»',
    subtitle: 'Любимый дебют чемпионов мира: 1.e4 e5 2.Кf3 Кc6 3.Сb5 против Защиты Морфи и Берлина.',
    badgeText: '🇪🇸 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'w',
    audioKey: 'mastery_3_5',
    iconSpec: { primaryPiece: 'b', secondaryPiece: 'k', pieceColor: 'w' },
    variants: [
      {
        id: 'spanish_morphy',
        title: 'Ветка 1: Защита Морфи (3...a6 4.Сa4 Кf6 5.0-0)',
        setup: 'INITIAL',
        playerColor: 'w',
        steps: [
          { playerFrom: 'e2', playerTo: 'e4', kirillHint: '1. Открывай игру королевской пешкой: e2 → e4!', replyFrom: 'e7', replyTo: 'e5' },
          { playerFrom: 'g1', playerTo: 'f3', kirillHint: '2. Напади Конём на пешку e5: g1 → f3!', replyFrom: 'b8', replyTo: 'c6' },
          { playerFrom: 'f1', playerTo: 'b5', kirillHint: '3. Испанская партия! Атакуй защитника пешки e5: f1 → b5!', replyFrom: 'a7', replyTo: 'a6' },
          { playerFrom: 'b5', playerTo: 'a4', kirillHint: '4. Защита Морфи (3...a6): сохрани связку, отступив Слоном b5 → a4!', replyFrom: 'g8', replyTo: 'f6' },
          { playerFrom: 'e1', playerTo: 'g1', kirillHint: '5. Выполни короткую рокировку: e1 → g1 (0-0)!', arrows: [{ from: 'e1', to: 'g1', color: 'green' }] },
        ],
      },
      {
        id: 'spanish_berlin',
        title: 'Ветка 2: Берлинская защита (3...Кf6 4.0-0 Сc5 5.c3)',
        setup: 'INITIAL',
        playerColor: 'w',
        steps: [
          { playerFrom: 'e2', playerTo: 'e4', kirillHint: '1. Займи центр пешкой: e2 → e4!', replyFrom: 'e7', replyTo: 'e5' },
          { playerFrom: 'g1', playerTo: 'f3', kirillHint: '2. Развей Коня: g1 → f3!', replyFrom: 'b8', replyTo: 'c6' },
          { playerFrom: 'f1', playerTo: 'b5', kirillHint: '3. Испанский выход Слона: f1 → b5!', replyFrom: 'g8', replyTo: 'f6' },
          { playerFrom: 'e1', playerTo: 'g1', kirillHint: '4. Берлинская защита (3...Кf6): спокойно рокируй e1 → g1 (0-0)!', replyFrom: 'f8', replyTo: 'c5' },
          { playerFrom: 'c2', playerTo: 'c3', kirillHint: '5. Готовь центральное наступление d4 ходом пешки: c2 → c3!', arrows: [{ from: 'c2', to: 'c3', color: 'green' }] },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_6',
    code: '3.6',
    section: 'mastery',
    title: '3.6 «Шотландская партия (За белых)»',
    subtitle: 'Стремительное вскрытие центра: 1.e4 e5 2.Кf3 Кc6 3.d4 ed 4.К:d4 с активной фигурной игрой.',
    badgeText: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'w',
    audioKey: 'mastery_3_6',
    iconSpec: { primaryPiece: 'p', secondaryPiece: 'n', pieceColor: 'w' },
    variants: [
      {
        id: 'scotch_bc5',
        title: 'Ветка 1: Классическая (4...Сc5 5.Сe3)',
        setup: 'INITIAL',
        playerColor: 'w',
        steps: [
          { playerFrom: 'e2', playerTo: 'e4', kirillHint: '1. Выдвигай королевскую пешку: e2 → e4!', replyFrom: 'e7', replyTo: 'e5' },
          { playerFrom: 'g1', playerTo: 'f3', kirillHint: '2. Выводи Коня в бой: g1 → f3!', replyFrom: 'b8', replyTo: 'c6' },
          { playerFrom: 'd2', playerTo: 'd4', kirillHint: '3. Шотландский прорыв в центре: d2 → d4!', replyFrom: 'e5', replyTo: 'd4' },
          { playerFrom: 'f3', playerTo: 'd4', kirillHint: '4. Забери пешку Конём в самом центре: f3 → d4!', replyFrom: 'f8', replyTo: 'c5' },
          { playerFrom: 'c1', playerTo: 'e3', kirillHint: '5. На 4...Сc5 укрепи Коня в центре Слоном: c1 → e3!', arrows: [{ from: 'c1', to: 'e3', color: 'green' }] },
        ],
      },
      {
        id: 'scotch_nf6',
        title: 'Ветка 2: Острая (4...Кf6 5.К:c6 bc 6.e5)',
        setup: 'INITIAL',
        playerColor: 'w',
        steps: [
          { playerFrom: 'e2', playerTo: 'e4', kirillHint: '1. Ход в центр: e2 → e4!', replyFrom: 'e7', replyTo: 'e5' },
          { playerFrom: 'g1', playerTo: 'f3', kirillHint: '2. Конь атакует e5: g1 → f3!', replyFrom: 'b8', replyTo: 'c6' },
          { playerFrom: 'd2', playerTo: 'd4', kirillHint: '3. Вскрывай центр по-шотландски: d2 → d4!', replyFrom: 'e5', replyTo: 'd4' },
          { playerFrom: 'f3', playerTo: 'd4', kirillHint: '4. Бей пешку Конём: f3 → d4!', replyFrom: 'g8', replyTo: 'f6' },
          { playerFrom: 'd4', playerTo: 'c6', kirillHint: '5. На 4...Кf6 разменяй Коня: d4 → c6!', replyFrom: 'b7', replyTo: 'c6' },
          { playerFrom: 'e4', playerTo: 'e5', kirillHint: '6. Сразу атакуй чёрного Коня f6 пешкой: e4 → e5!', arrows: [{ from: 'e4', to: 'e5', color: 'green' }] },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_7',
    code: '3.7',
    section: 'mastery',
    title: '3.7 «Защита от Итальянки (За чёрных)»',
    subtitle: 'Контратака двух коней за чёрных (3...Кf6!) и отражение наскока 4.Кg5 ударом 4...d5! 5.ed Кa5!.',
    badgeText: '🛡️ Чёрные 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'b',
    audioKey: 'mastery_3_7',
    iconSpec: { primaryPiece: 'n', secondaryPiece: 'p', pieceColor: 'b', goldTrim: true },
    variants: [
      {
        id: 'black_ital_ng5',
        title: 'Ветка 1: Отражение атаки 4.Кg5 (4...d5! 5.ed Кa5!)',
        setup: 'INITIAL',
        playerColor: 'b',
        introMoves: [{ from: 'e2', to: 'e4' }],
        steps: [
          { playerFrom: 'e7', playerTo: 'e5', kirillHint: '1... Белые пошли 1.e4 — встречай их в центре: e7 → e5!', replyFrom: 'g1', replyTo: 'f3' },
          { playerFrom: 'b8', playerTo: 'c6', kirillHint: '2... Защити пешку e5 Конём: b8 → c6!', replyFrom: 'f1', replyTo: 'c4' },
          { playerFrom: 'g8', playerTo: 'f6', kirillHint: '3... Контратакуй Защитой двух коней: g8 → f6!', replyFrom: 'f3', replyTo: 'g5' },
          { playerFrom: 'd7', playerTo: 'd5', kirillHint: '4... Белые прыгнули 4.Кg5! Перекрой диагональ Слона c4 ударом: d7 → d5!', replyFrom: 'e4', replyTo: 'd5' },
          { playerFrom: 'c6', playerTo: 'a5', kirillHint: '5... Не бей на d5 Конём (там ловушка)! Напади на Слона c4 сбоку: c6 → a5!', arrows: [{ from: 'c6', to: 'a5', color: 'green' }] },
        ],
      },
      {
        id: 'black_ital_d3',
        title: 'Ветка 2: Спокойная игра (4.d3 Сc5 5.c3 d6)',
        setup: 'INITIAL',
        playerColor: 'b',
        introMoves: [{ from: 'e2', to: 'e4' }],
        steps: [
          { playerFrom: 'e7', playerTo: 'e5', kirillHint: '1... Отвечай по центру: e7 → e5!', replyFrom: 'g1', replyTo: 'f3' },
          { playerFrom: 'b8', playerTo: 'c6', kirillHint: '2... Выводи Коня на защиту e5: b8 → c6!', replyFrom: 'f1', replyTo: 'c4' },
          { playerFrom: 'g8', playerTo: 'f6', kirillHint: '3... Боевой выход второго Коня: g8 → f6!', replyFrom: 'd2', replyTo: 'd3' },
          { playerFrom: 'f8', playerTo: 'c5', kirillHint: '4... На 4.d3 выводи Слона на активную позицию: f8 → c5!', replyFrom: 'c2', replyTo: 'c3' },
          { playerFrom: 'd7', playerTo: 'd6', kirillHint: '5... Укрепи центр и открой дорогу белопольному Слону: d7 → d6!', arrows: [{ from: 'd7', to: 'd6', color: 'green' }] },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_8',
    code: '3.8',
    section: 'mastery',
    title: '3.8 «Защита от Испанки (За чёрных)»',
    subtitle: 'Железная защита Морфи за чёрных (3...a6!) против отступления Слона и разменного варианта.',
    badgeText: '🏰 Чёрные 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'b',
    audioKey: 'mastery_3_8',
    iconSpec: { primaryPiece: 'b', secondaryPiece: 'r', pieceColor: 'b', goldTrim: true },
    variants: [
      {
        id: 'black_span_ba4',
        title: 'Ветка 1: Главная линия (3...a6 4.Сa4 Кf6 5.0-0 Сe7)',
        setup: 'INITIAL',
        playerColor: 'b',
        introMoves: [{ from: 'e2', to: 'e4' }],
        steps: [
          { playerFrom: 'e7', playerTo: 'e5', kirillHint: '1... Держи центр пешкой: e7 → e5!', replyFrom: 'g1', replyTo: 'f3' },
          { playerFrom: 'b8', playerTo: 'c6', kirillHint: '2... Защити e5 Конём: b8 → c6!', replyFrom: 'f1', replyTo: 'b5' },
          { playerFrom: 'a7', playerTo: 'a6', kirillHint: '3... Защита Морфи! Сразу спроси испанского Слона: a7 → a6!', replyFrom: 'b5', replyTo: 'a4' },
          { playerFrom: 'g8', playerTo: 'f6', kirillHint: '4... Развивай Коня с контратакой пешки e4: g8 → f6!', replyFrom: 'e1', replyTo: 'g1' },
          { playerFrom: 'f8', playerTo: 'e7', kirillHint: '5... Подготовь рокировку надёжным ходом Слона: f8 → e7!', arrows: [{ from: 'f8', to: 'e7', color: 'green' }] },
        ],
      },
      {
        id: 'black_span_exchange',
        title: 'Ветка 2: Разменный вариант (4.С:c6 dc! 5.0-0 Сg4)',
        setup: 'INITIAL',
        playerColor: 'b',
        introMoves: [{ from: 'e2', to: 'e4' }],
        steps: [
          { playerFrom: 'e7', playerTo: 'e5', kirillHint: '1... Смело в центр: e7 → e5!', replyFrom: 'g1', replyTo: 'f3' },
          { playerFrom: 'b8', playerTo: 'c6', kirillHint: '2... Развей Коня: b8 → c6!', replyFrom: 'f1', replyTo: 'b5' },
          { playerFrom: 'a7', playerTo: 'a6', kirillHint: '3... Оттесни Слона ходом Морфи: a7 → a6!', replyFrom: 'b5', replyTo: 'c6' },
          { playerFrom: 'd7', playerTo: 'c6', kirillHint: '4... Белые разменялись на c6! Бей пешкой d, открывая ферзя и слона: d7 → c6!', replyFrom: 'e1', replyTo: 'g1' },
          { playerFrom: 'c8', playerTo: 'g4', kirillHint: '5... Свяжи белого Коня f3 активным выходом Слона: c8 → g4!', arrows: [{ from: 'c8', to: 'g4', color: 'green' }] },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_9',
    code: '3.9',
    section: 'mastery',
    title: '3.9 «Защита от Шотландки (За чёрных)»',
    subtitle: 'Чёткий перехват инициативы за чёрных: 3...ed! 4.К:d4 и контрудары 4...Сc5 5.Сe3 Фf6! и 4...Кf6.',
    badgeText: '⚡ Чёрные 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'b',
    audioKey: 'mastery_3_9',
    iconSpec: { primaryPiece: 'q', secondaryPiece: 'b', pieceColor: 'b', goldTrim: true },
    variants: [
      {
        id: 'black_scotch_bc5',
        title: 'Ветка 1: Атака на d4 и f2 (4...Сc5 5.Сe3 Фf6!)',
        setup: 'INITIAL',
        playerColor: 'b',
        introMoves: [{ from: 'e2', to: 'e4' }],
        steps: [
          { playerFrom: 'e7', playerTo: 'e5', kirillHint: '1... Встречай в центре: e7 → e5!', replyFrom: 'g1', replyTo: 'f3' },
          { playerFrom: 'b8', playerTo: 'c6', kirillHint: '2... Защити пешку e5 Конём: b8 → c6!', replyFrom: 'd2', replyTo: 'd4' },
          { playerFrom: 'e5', playerTo: 'd4', kirillHint: '3... Белые пошли 3.d4! Обязательно руби пешку: e5 → d4!', replyFrom: 'f3', replyTo: 'd4' },
          { playerFrom: 'f8', playerTo: 'c5', kirillHint: '4... Сразу атакуй центрального Коня d4 Слоном: f8 → c5!', replyFrom: 'c1', replyTo: 'e3' },
          { playerFrom: 'd8', playerTo: 'f6', kirillHint: '5... Усиль нажим на поле d4 и пешку f2 выходом Ферзя: d8 → f6!', arrows: [{ from: 'd8', to: 'f6', color: 'green' }] },
        ],
      },
      {
        id: 'black_scotch_nf6',
        title: 'Ветка 2: Связка Коня (4...Кf6 5.Кc3 Сb4!)',
        setup: 'INITIAL',
        playerColor: 'b',
        introMoves: [{ from: 'e2', to: 'e4' }],
        steps: [
          { playerFrom: 'e7', playerTo: 'e5', kirillHint: '1... Шаг в центр: e7 → e5!', replyFrom: 'g1', replyTo: 'f3' },
          { playerFrom: 'b8', playerTo: 'c6', kirillHint: '2... Развей Коня: b8 → c6!', replyFrom: 'd2', replyTo: 'd4' },
          { playerFrom: 'e5', playerTo: 'd4', kirillHint: '3... Разменяй центральную пешку: e5 → d4!', replyFrom: 'f3', replyTo: 'd4' },
          { playerFrom: 'g8', playerTo: 'f6', kirillHint: '4... Атакуй пешку e4 Конём: g8 → f6!', replyFrom: 'b1', replyTo: 'c3' },
          { playerFrom: 'f8', playerTo: 'b4', kirillHint: '5... На 5.Кc3 свяжи защитника пешки e4 Слоном: f8 → b4!', arrows: [{ from: 'f8', to: 'b4', color: 'green' }] },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_10',
    code: '3.10',
    section: 'mastery',
    title: '3.10 «Комбинация: Киров, 1981 г.»',
    subtitle: 'Гордость Вятки! Партия Никонов — Хардин, г. Киров, 1981 г. (№333 Иващенко, стр. 60): жертва Ферзя и мат.',
    badgeText: '🏅 Киров 1981',
    isFree: false,
    targetWins: 30,
    playerColor: 'w',
    audioKey: 'mastery_3_10',
    iconSpec: { primaryPiece: 'q', secondaryPiece: 'r', pieceColor: 'w' },
    variants: [
      {
        id: 'kirov_1981_nikonov',
        title: 'Партия Никонов — Хардин, г. Киров, 1981 г. (№333 Иващенко)',
        setup: 'w:Ke1,Qc8,Rh1,Pa3,Pb2,Pc2,Pe4,Pf2;b:Kg8,Rf8,Qg5,Ng7,Pa5,Pb5,Pf7,Pg6',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'c8',
            playerTo: 'f8',
            kirillHint: 'Партия Никонов — Хардин (Киров, 1981 г.): пожертвуй Ферзя 1. Фc8 → f8+!',
            replyFrom: 'g8',
            replyTo: 'f8',
            arrows: [{ from: 'c8', to: 'f8', color: 'green' }],
          },
          {
            playerFrom: 'h1',
            playerTo: 'h8',
            kirillHint: 'Заверши кировскую комбинацию сокрушительным матом Ладьёй: 2. Лh1 → h8#!',
            arrows: [{ from: 'h1', to: 'h8', color: 'green' }],
          },
        ],
      },
    ],
  },
  {
    id: 'mastery_3_11',
    code: '3.11',
    section: 'mastery',
    title: '3.11 «Эндшпиль: Король и пешка»',
    subtitle: 'Диаграмма №1045 С. Д. Иващенко (4 класс, стр. 179): оппозиция и прокладывание пути пешке Королём.',
    badgeText: '👑 30/30',
    isFree: false,
    targetWins: 30,
    playerColor: 'w',
    audioKey: 'mastery_3_11',
    iconSpec: { primaryPiece: 'k', secondaryPiece: 'p', pieceColor: 'w' },
    variants: [
      {
        id: 'iv_1045_endgame',
        title: 'Диаграмма №1045 (С. Д. Иващенко, 4 класс, стр. 179)',
        setup: 'w:Kd6,Pe5;b:Ke8',
        playerColor: 'w',
        steps: [
          {
            playerFrom: 'd6',
            playerTo: 'e6',
            kirillHint: 'Диаграмма №1045 Иващенко: займи ближнюю оппозицию Королём 1. d6 → e6!',
            replyFrom: 'e8',
            replyTo: 'f8',
            arrows: [{ from: 'd6', to: 'e6', color: 'green' }],
          },
          {
            playerFrom: 'e6',
            playerTo: 'd7',
            kirillHint: 'Обойди Короля с фланга, беря под контроль поле превращения e8: 2. e6 → d7!',
            replyFrom: 'f8',
            replyTo: 'f7',
            arrows: [{ from: 'e6', to: 'd7', color: 'green' }],
          },
          {
            playerFrom: 'e5',
            playerTo: 'e6',
            kirillHint: 'Дорога свободна! Двигай проходную пешку вперёд с шахом: 3. e5 → e6+!',
            arrows: [{ from: 'e5', to: 'e6', color: 'green' }],
          },
        ],
      },
    ],
  },
];

export function getTargetMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const lesson of CURRICULUM_LESSONS) {
    map[lesson.id] = lesson.targetWins;
  }
  return map;
}
