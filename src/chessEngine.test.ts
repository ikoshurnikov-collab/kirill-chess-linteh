import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMove,
  calculateMoveDurationMs,
  calculateSquaresMoved,
  computeBystanderYields,
  computeCheckmateToppleState,
  createInitialBoard,
  easeInOutCubic,
  generateCaptureShatterParticles,
  generatePracticeTargets,
  getLegalMovesForSquare,
  isCheckmate,
  isLightSquare,
  isStalemate,
  parseCompactSetup,
} from './chessEngine';
import { ChessAppViewModel } from './ChessAppViewModel';
import { CURRICULUM_LESSONS } from './curriculumData';
import { sanitizeForSpeech } from './soundAndSpeech';
import {
  BUILTIN_SCHOOL_COMPETITORS,
  DEFAULT_GOOGLE_SCRIPT_URL,
  DEFAULT_GOOGLE_SHEET_WEBHOOK_URL,
  DEFAULT_ROBOKASSA_URL,
  isRobokassaReturnUrl,
  isSubscriptionActive,
  normalizeRobokassaConfigUrl,
  parseGlobalAnalyticsResponse,
  PlayerProfile,
  TelemetryService,
  validateRobokassaReceiptCode,
} from './telemetryAndStorage';
import {
  buildRobokassaPaymentUrl,
  generateOfflineQrMatrix,
} from './SubscriptionAndLegalModals';

test('curriculum contains all 29 lessons across 3 sections', () => {
  assert.equal(CURRICULUM_LESSONS.length, 29);
  const theory = CURRICULUM_LESSONS.filter((l) => l.section === 'theory');
  const practice = CURRICULUM_LESSONS.filter((l) => l.section === 'practice');
  const mastery = CURRICULUM_LESSONS.filter((l) => l.section === 'mastery');
  assert.equal(theory.length, 8);
  assert.equal(practice.length, 10);
  assert.equal(mastery.length, 11);
});

test('all curriculum lesson steps are legal chess moves on their board setups', () => {
  for (const lesson of CURRICULUM_LESSONS) {
    const variants = [
      ...(lesson.theoryFinalTask ? [lesson.theoryFinalTask] : []),
      ...(lesson.variants || []),
    ];
    for (const v of variants) {
      let board = v.setup === 'INITIAL' ? createInitialBoard() : parseCompactSetup(v.setup);
      if (v.introMoves) {
        for (const intro of v.introMoves) {
          const legals = getLegalMovesForSquare(board, intro.from);
          assert.ok(
            legals.includes(intro.to),
            `Lesson ${lesson.code} (${v.id}) intro move ${intro.from}->${intro.to} must be legal`
          );
          board = applyMove(board, intro.from, intro.to).board;
        }
      }
      for (let i = 0; i < v.steps.length; i++) {
        const step = v.steps[i];
        const legals = getLegalMovesForSquare(board, step.playerFrom);
        assert.ok(
          legals.includes(step.playerTo),
          `Lesson ${lesson.code} (${v.id}) step ${i + 1}: ${step.playerFrom}->${step.playerTo} must be legal (got [${legals.join(',')}])`
        );
        board = applyMove(board, step.playerFrom, step.playerTo, step.promotionPiece).board;
        if (step.replyFrom && step.replyTo) {
          assert.ok(
            board[step.replyFrom],
            `Lesson ${lesson.code} (${v.id}) step ${i + 1} reply: piece must exist at ${step.replyFrom}`
          );
          board = applyMove(board, step.replyFrom, step.replyTo).board;
        }
      }
    }
  }
});

test('castling rules enforce attacked transit squares in Lesson 2.4', () => {
  // Task 3: f1 attacked by bishop on a6 -> e1->c1 is legal, e1->g1 is blocked
  const b1 = parseCompactSetup('w:Ke1,Ra1,Rh1,Pa2,Pb2,Pc2,Pg2,Ph2;b:Ke8,Ba6');
  const moves1 = getLegalMovesForSquare(b1, 'e1');
  assert.ok(moves1.includes('c1'), 'Long castling e1->c1 should be legal');
  assert.ok(!moves1.includes('g1'), 'Short castling e1->g1 should be illegal because f1 is attacked by Ba6');

  // Task 4: d1 attacked by rook on d8 -> e1->g1 is legal, e1->c1 is blocked
  const b2 = parseCompactSetup('w:Ke1,Ra1,Rh1,Pa2,Pb2,Pf2,Pg2,Ph2;b:Kg8,Rd8');
  const moves2 = getLegalMovesForSquare(b2, 'e1');
  assert.ok(moves2.includes('g1'), 'Short castling e1->g1 should be legal');
  assert.ok(!moves2.includes('c1'), 'Long castling e1->c1 should be illegal because d1 is attacked by Rd8');
});

test('Kirov 1974 Verichev-Vostretsova game produces true stalemate after Qxg4+ Kxg4', () => {
  const board = parseCompactSetup('w:Kh1,Qe6;b:Kh4,Qf2,Ng5,Pg6,Ph5');
  const afterQ = applyMove(board, 'e6', 'g4').board;
  const afterK = applyMove(afterQ, 'h4', 'g4').board;
  assert.equal(isStalemate(afterK, 'w'), true, 'White should be in stalemate after Kxg4');
});

test('Kirov 1981 Nikonov-Khardin game delivers decisive back-rank attack after Qxf8+ Kxf8 Rh8#', () => {
  const board = parseCompactSetup('w:Ke1,Qc8,Rh1,Pa3,Pb2,Pc2,Pe4,Pf2;b:Kg8,Rf8,Qg5,Ng7,Pa5,Pb5,Pf7,Pg6');
  const afterQ = applyMove(board, 'c8', 'f8').board;
  const afterK = applyMove(afterQ, 'g8', 'f8').board;
  const afterR = applyMove(afterK, 'h1', 'h8').board;
  assert.equal(afterR.h8?.type, 'r');
  assert.equal(afterR.h8?.color, 'w');
});

test('Bishop procedural targets in 2.2 are strictly on the same square color as the Bishop', () => {
  for (let v = 0; v < 4; v++) {
    const gen = generatePracticeTargets('bishop_knight', v);
    if (gen.pieceType === 'b') {
      const startColor = isLightSquare(gen.startSquare);
      for (const t of gen.targets) {
        assert.equal(
          isLightSquare(t),
          startColor,
          `Target ${t} must match Bishop square color on ${gen.startSquare}`
        );
      }
    }
  }
});

test('sanitizeForSpeech converts chess moves, Russian piece abbreviations, captures, checkmates, and strips emojis', () => {
  const res = sanitizeForSpeech('🍎 Ходи пешкой e2 → e4 и побеждай!');
  assert.ok(res.includes('е два на е четыре'), `Expected "е два на е четыре" in "${res}"`);
  assert.ok(!res.includes('🍎'), 'Should strip apple emoji');

  assert.equal(sanitizeForSpeech('Крe6'), 'король е шесть');
  assert.equal(sanitizeForSpeech('Кр:f8'), 'король бьёт эф восемь');
  assert.equal(sanitizeForSpeech('Фh4'), 'ферзь аш четыре');
  assert.equal(sanitizeForSpeech('Ф:f7#'), 'ферзь бьёт эф семь мат');
  assert.equal(sanitizeForSpeech('Лa1'), 'ладья а один');
  assert.equal(sanitizeForSpeech('Лh8#'), 'ладья аш восемь мат');
  assert.equal(sanitizeForSpeech('Сc4'), 'слон цэ четыре');
  assert.equal(sanitizeForSpeech('Сb5'), 'слон бэ пять');
  assert.equal(sanitizeForSpeech('Кf3'), 'конь эф три');
  assert.equal(sanitizeForSpeech('Кc6'), 'конь цэ шесть');
});

test('all 29 curriculum lessons have exact audioKey identifiers for recorded Kirill audio', () => {
  const keys = CURRICULUM_LESSONS.map((l) => l.audioKey);
  for (let i = 1; i <= 8; i++) assert.ok(keys.includes(`theory_1_${i}`));
  for (let i = 1; i <= 10; i++) assert.ok(keys.includes(`prac_2_${i}`));
  for (let i = 1; i <= 11; i++) assert.ok(keys.includes(`mastery_3_${i}`));
});

test('subscription expiration logic locks premium when Date.now() > premiumUntilEpochMillis', () => {
  const profile: PlayerProfile = {
    id: 'p1',
    name: 'Кирилл',
    category: '1–4 класс',
    badge: '👑',
    createdAt: 1000,
    lessonWins: { mastery_3_4: 15 },
    premiumUntilEpochMillis: 5000,
  };
  assert.equal(isSubscriptionActive(profile, 4000), true);
  assert.equal(isSubscriptionActive(profile, 6000), false);
  // Progress under lock is preserved
  assert.equal(profile.lessonWins.mastery_3_4, 15);
});

test('Wizard Chess mechanics: easeInOutCubic and distance-scaled move duration formula', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(0.5), 0.5);
  assert.equal(easeInOutCubic(1), 1);

  assert.equal(calculateSquaresMoved('e2', 'e4'), 2);
  assert.equal(calculateMoveDurationMs('e2', 'e3'), 380);
  assert.equal(calculateMoveDurationMs('a1', 'a8'), Math.round((0.38 + 6 * 0.065) * 1000));
});

test('Wizard Chess mechanics: 3-phase checkmate King topple state machine', () => {
  const stagger = computeCheckmateToppleState(150);
  assert.equal(stagger.phase, 'stagger');
  assert.equal(stagger.ringOpacity, 1);

  const topple = computeCheckmateToppleState(625);
  assert.equal(topple.phase, 'topple');
  assert.ok(topple.angleDeg > 10 && topple.angleDeg < 84);

  const impact = computeCheckmateToppleState(1050);
  assert.equal(impact.phase, 'impact');
  assert.ok(Math.abs(impact.boardShakePx) <= 2);

  const settled = computeCheckmateToppleState(1500);
  assert.equal(settled.phase, 'settled');
  assert.equal(settled.angleDeg, 84);
});

test('Wizard Chess mechanics: capture shatter fragments and bystander yields', () => {
  const whiteShards = generateCaptureShatterParticles('w', 16);
  const blackShards = generateCaptureShatterParticles('b', 16);
  assert.equal(whiteShards.length, 16);
  assert.ok(whiteShards.some((s) => s.color === '#E6DFD0'));
  assert.ok(blackShards.some((s) => s.color === '#222630'));

  const board = parseCompactSetup('w:Ke1,Rd1,Pc3,Pe4;b:Ke8,Rd6');
  const yields = computeBystanderYields(board, 'd1', 'd6', 'r', false);
  const yieldValues = Object.values(yields);
  assert.ok(yieldValues.length >= 2, 'Pieces adjacent to d-file should yield as Rook slides d1->d6');
  for (const y of yieldValues) {
    const mag = Math.hypot(y.maxDxPx, y.maxDyPx);
    assert.ok(mag >= 2.5 && mag <= 4.1, `Bystander yield magnitude ${mag} should be ~3-4px`);
  }
});

test('Wizard Chess mechanics: simultaneous castling choreography and preMoveHighlight constant', () => {
  assert.equal(ChessAppViewModel.PRE_MOVE_HIGHLIGHT_MS, 420);
  assert.equal(ChessAppViewModel.CAPTURE_SHATTER_MS, 650);

  const board = parseCompactSetup('w:Ke1,Ra1,Rh1;b:Ke8');
  const shortCastle = ChessAppViewModel.createMoveChoreography(board, 'e1', 'g1', 'w', 1000);
  assert.ok(shortCastle?.castlingRook, 'Short castling e1->g1 must include simultaneous Rook h1->f1');
  assert.equal(shortCastle?.castlingRook?.from, 'h1');
  assert.equal(shortCastle?.castlingRook?.to, 'f1');

  const longCastle = ChessAppViewModel.createMoveChoreography(board, 'e1', 'c1', 'w', 1000);
  assert.ok(longCastle?.castlingRook, 'Long castling e1->c1 must include simultaneous Rook a1->d1');
  assert.equal(longCastle?.castlingRook?.from, 'a1');
  assert.equal(longCastle?.castlingRook?.to, 'd1');
});

test('Google Sheets webhook URL is preconfigured to the official Apps Script endpoint', () => {
  const expectedUrl =
    'https://script.google.com/macros/s/AKfycbxrmalRa5tnBWWyAJxh6xBxb0OniShPMke2DjgbELkKpXp_fuFCzcHju4DI6JQY4NBk/exec';
  assert.equal(DEFAULT_GOOGLE_SHEET_WEBHOOK_URL, expectedUrl);
  assert.equal(TelemetryService.loadCreatorConfig().googleSheetWebhookUrl, expectedUrl);
});

test('UX-06: Blitz mode caps piece flight and capture shatter duration at 200ms', () => {
  const board = parseCompactSetup('w:Ke1,Ra1;b:Ke8,Ra8');
  const normalFlight = ChessAppViewModel.createMoveChoreography(board, 'a1', 'a8', 'w', 1000, false);
  const blitzFlight = ChessAppViewModel.createMoveChoreography(board, 'a1', 'a8', 'w', 1000, true);
  assert.ok((normalFlight?.durationMs ?? 0) > 500);
  assert.equal(blitzFlight?.durationMs, ChessAppViewModel.BLITZ_CHOREO_MAX_MS);
  assert.equal(blitzFlight?.durationMs, 200);

  const normalShatter = ChessAppViewModel.spawnCaptureShatter('a8', 'b', 1000, false);
  const blitzShatter = ChessAppViewModel.spawnCaptureShatter('a8', 'b', 1000, true);
  assert.equal(normalShatter.durationMs, 650);
  assert.equal(blitzShatter.durationMs, 200);
});

test('BE-07: BUILTIN_SCHOOL_COMPETITORS are anonymized for 152-FZ compliance', () => {
  for (const c of BUILTIN_SCHOOL_COMPETITORS) {
    assert.ok(!/\([0-9][А-Я]\)/.test(c.name), `Competitor "${c.name}" should not contain class letter`);
    assert.ok(!/\s[А-Я]\./.test(c.name), `Competitor "${c.name}" should not contain surname initial`);
  }
});

test('FE-06: generateOfflineQrMatrix produces valid 29x29 ISO/IEC 18004 QR matrix with 7x7 finder patterns', () => {
  const matrix = generateOfflineQrMatrix('https://kirill-chess-linteh.ru');
  assert.equal(matrix.length, 29);
  assert.equal(matrix[0].length, 29);
  // Top-left 7x7 finder pattern outer corners and center
  assert.equal(matrix[0][0], true);
  assert.equal(matrix[0][6], true);
  assert.equal(matrix[6][0], true);
  assert.equal(matrix[3][3], true);
  // Top-right 7x7 finder pattern center
  assert.equal(matrix[3][25], true);
  // Bottom-left 7x7 finder pattern center
  assert.equal(matrix[25][3], true);
});

test('Robokassa production Invoice URL stays clean without query params and migrates legacy links', () => {
  assert.equal(
    DEFAULT_ROBOKASSA_URL,
    'https://auth.robokassa.ru/merchant/Invoice/A1pM0mgJf0uQ3K_4d3pQhA'
  );
  assert.equal(DEFAULT_GOOGLE_SCRIPT_URL, DEFAULT_GOOGLE_SHEET_WEBHOOK_URL);
  assert.equal(
    TelemetryService.loadCreatorConfig().robokassaPaymentUrl,
    'https://auth.robokassa.ru/merchant/Invoice/A1pM0mgJf0uQ3K_4d3pQhA'
  );

  // Invoice URL must NOT have ?Shp_profileId=... appended
  assert.equal(
    buildRobokassaPaymentUrl(DEFAULT_ROBOKASSA_URL, 'player_abc123'),
    'https://auth.robokassa.ru/merchant/Invoice/A1pM0mgJf0uQ3K_4d3pQhA'
  );

  // Legacy links automatically migrate to the updated Invoice widget URL
  const migratedOld = normalizeRobokassaConfigUrl(
    'https://auth.robokassa.ru/merchant/Invoice/6-Dqt0yQRka-LJR6f0ZFkQ'
  );
  assert.equal(migratedOld.migrated, true);
  assert.equal(
    migratedOld.url,
    'https://auth.robokassa.ru/merchant/Invoice/A1pM0mgJf0uQ3K_4d3pQhA'
  );
});

test('Robokassa Success URL return detection and receipt code anti-abuse validation', () => {
  assert.equal(isRobokassaReturnUrl('?robokassa_paid=success').matched, true);
  assert.equal(
    isRobokassaReturnUrl('?OutSum=50.00&InvId=7788&SignatureValue=ABCDEF').matched,
    true
  );
  assert.equal(isRobokassaReturnUrl('?OutSum=50.00').matched, false);
  assert.equal(isRobokassaReturnUrl('?foo=bar').matched, false);

  const now = 100_000_000;
  // Reject if payment button was not clicked or session > 60 min old
  assert.equal(validateRobokassaReceiptCode('482917', null, [], now).ok, false);
  assert.equal(
    validateRobokassaReceiptCode('482917', now - 61 * 60 * 1000, [], now).ok,
    false
  );

  // Reject identical digits (0000, 111111) or too short
  assert.equal(validateRobokassaReceiptCode('0000', now - 5000, [], now).ok, false);
  assert.equal(validateRobokassaReceiptCode('111111', now - 5000, [], now).ok, false);
  assert.equal(validateRobokassaReceiptCode('123', now - 5000, [], now).ok, false);

  // Accept valid 4-12 digit receipt and reject reuse
  const valid = validateRobokassaReceiptCode('482917', now - 5000, [], now);
  assert.equal(valid.ok, true);
  assert.equal(valid.normalizedCode, '482917');
  assert.equal(
    validateRobokassaReceiptCode('482917', now - 5000, ['482917'], now).ok,
    false
  );
});

test('parseGlobalAnalyticsResponse parses Google Apps Script recentUsers and merges local profile', () => {
  const now = 200_000_000;
  const localProfile: PlayerProfile = {
    id: 'p_kirill_test',
    name: 'Кирилл Тест',
    category: '1–4 класс',
    badge: '👑',
    createdAt: 1000,
    lessonWins: { theory_1_1: 1, mastery_3_1: 30 },
    premiumUntilEpochMillis: now + 30 * 24 * 60 * 60 * 1000,
  };

  const sheetData = {
    totalAccounts: 17,
    totalVictoriesAll: 40,
    totalMastered30All: 2,
    recentUsers: [
      {
        name: 'Артём',
        grade: '4 класс',
        rank: 'Старший Ратник',
        victories: 12,
        lessons: 5,
        isPremiumActive: true,
        premiumDaysLeft: 25,
        lastSeen: 'Thu Nov 12 2026 22:32:44 GMT+0300',
      },
      {
        name: 'Ратник',
        grade: '',
        rank: '',
        victories: 0,
        lessons: 0,
        lastSeen: 'Thu Nov 12 2026 00:29:51 GMT+0300',
      },
    ],
  };

  const summary = parseGlobalAnalyticsResponse(sheetData, localProfile, now);
  assert.equal(summary.totalAccounts, 17);
  assert.equal(summary.activeSubscriptionsCount, 2);
  assert.equal(summary.totalVictoriesAll, 43);
  assert.equal(summary.totalMastered30All, 2);
  assert.equal(summary.players.length, 3);
  assert.equal(summary.players[0].isLocalCurrent, true);
  assert.equal(summary.players[0].isPremiumActive, true);
});



