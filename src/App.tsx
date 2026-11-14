import React, { useEffect, useRef, useState } from 'react';
import {
  AppleBadgeOverlay,
  ArrowOverlay,
  BoardMap,
  PieceColor,
  Square,
  applyMove,
  createInitialBoard,
  generatePracticeTargets,
  getBlackSparringMove,
  getLegalMovesForSquare,
  isCheckmate,
  isInCheck,
  isStalemate,
  parseCompactSetup,
} from './chessEngine';
import { ChessBoard3D } from './ChessBoard3D';
import {
  ActiveMoveChoreography,
  CaptureShatterEffect,
  CheckmateToppleEffect,
  ChessAppViewModel,
} from './ChessAppViewModel';
import { CreatorDashboardModal } from './CreatorDashboardModal';
import {
  CURRICULUM_LESSONS,
  LessonItem,
  LessonSection,
  LessonTaskVariant,
  getTargetMap,
} from './curriculumData';
import { analyzePlayerMove, getMasteryStageInfo } from './kirillAnalyzer';
import { soundEngine } from './soundAndSpeech';
import { CardIcon25D, KirillAvatarSVG } from './StauntonPiecesSVG';
import {
  DiplomaModal,
  LegalDocumentsModal,
  QRModal,
  SubscriptionModal,
} from './SubscriptionAndLegalModals';
import {
  AVAILABLE_BADGES,
  AgeCategory,
  PlayerProfile,
  TelemetryService,
  calculateTotalWins,
  getCompletedLessonsCount,
  getPlayerRankTitle,
  getSubscriptionRemainingDays,
  isRobokassaReturnUrl,
  isSubscriptionActive,
} from './telemetryAndStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function App() {
  // Profile state (UX-01: clean onboarding with 1-click Quick Start button, no ?autostart=1 bypass)
  const [profile, setProfile] = useState<PlayerProfile | null>(() =>
    TelemetryService.loadProfile()
  );

  // Onboarding form state
  const [onboardName, setOnboardName] = useState('');
  const [onboardCategory, setOnboardCategory] = useState<AgeCategory>('1–4 класс');
  const [onboardBadge, setOnboardBadge] = useState('🛡️');
  const [onboardError, setOnboardError] = useState('');

  // Navigation state
  const [mainTab, setMainTab] = useState<'lessons' | 'chamber' | 'league'>('lessons');
  const [lessonSection, setLessonSection] = useState<LessonSection>('theory');
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);

  // Board & Audio Preferences
  const [cameraAngle, setCameraAngle] = useState<'45' | '65'>('45');
  const [boardWoodTheme, setBoardWoodTheme] = useState<'green' | 'walnut'>('green');
  const [soundOn, setSoundOn] = useState(() => soundEngine.isSoundEnabled());
  const [voiceOn, setVoiceOn] = useState(() => soundEngine.isVoiceEnabled());

  // Modals state
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'requisites' | 'oferta' | 'privacy' | null>(null);
  const [showDiplomaModal, setShowDiplomaModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Edit passport inline state in Voivode Chamber
  const [editingPassport, setEditingPassport] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBadge, setEditBadge] = useState('🛡️');

  // Expired subscription & Robokassa payment confirmation banners
  const [expiredBannerVisible, setExpiredBannerVisible] = useState(false);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(null);
  const robokassaRedirectHandledRef = useRef(false);

  // PWA Install prompt state
  const [deferredPWA, setDeferredPWA] = useState<BeforeInstallPromptEvent | null>(null);

  // Active Lesson Play State
  const [theorySlideIdx, setTheorySlideIdx] = useState(0);
  const [inTheoryTask, setInTheoryTask] = useState(false);
  const [board, setBoard] = useState<BoardMap>({});
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalSquares, setLegalSquares] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [kirillText, setKirillText] = useState('');
  const [activeVariant, setActiveVariant] = useState<LessonTaskVariant | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [roundWon, setRoundWon] = useState(false);
  const [manualHintShown, setManualHintShown] = useState(false);

  // Wizard Chess 2.5D Choreography & Physical Effects State + Synchronous Move Lock (FE-02)
  const [activeMove, setActiveMove] = useState<ActiveMoveChoreography | null>(null);
  const [captureShatter, setCaptureShatter] = useState<CaptureShatterEffect | null>(null);
  const [checkmateTopple, setCheckmateTopple] = useState<CheckmateToppleEffect | null>(null);
  const [preMoveHighlight, setPreMoveHighlight] = useState<Square | null>(null);
  const choreoTimeoutsRef = useRef<number[]>([]);
  const isMoveLockedRef = useRef<boolean>(false);

  // Procedural Practice 2.1 / 2.2 state
  const [targetApples, setTargetApples] = useState<Square[]>([]);
  const [movesRemaining, setMovesRemaining] = useState<number>(4);

  // Blitz timer for Stage 3 (wins 20..29 in Mastery 30/30)
  const [blitzTimeLeft, setBlitzTimeLeft] = useState<number | null>(null);
  const blitzTimerRef = useRef<number | null>(null);

  // Lock iOS Safari pinch-to-zoom & multi-touch zoom + sync body data-state
  useEffect(() => {
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };
    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('gesturestart', preventGesture, { passive: false });
    window.addEventListener('gesturechange', preventGesture, { passive: false });
    window.addEventListener('gestureend', preventGesture, { passive: false });
    window.addEventListener('touchmove', preventMultiTouch, { passive: false });

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPWA(e as BeforeInstallPromptEvent);
    };
    const handleFirstUnlock = () => {
      soundEngine.unlockAudio();
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pointerdown', handleFirstUnlock, { passive: true });
    window.addEventListener('touchstart', handleFirstUnlock, { passive: true });

    return () => {
      window.removeEventListener('gesturestart', preventGesture);
      window.removeEventListener('gesturechange', preventGesture);
      window.removeEventListener('gestureend', preventGesture);
      window.removeEventListener('touchmove', preventMultiTouch);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pointerdown', handleFirstUnlock);
      window.removeEventListener('touchstart', handleFirstUnlock);
    };
  }, []);

  // FE-01: Hardware Back Button (History API pushState / popstate)
  const hasOverlayOrLesson = Boolean(
    activeLesson ||
      showQRModal ||
      showSettingsModal ||
      showSubscriptionModal ||
      legalModalTab ||
      showDiplomaModal ||
      showCreatorModal
  );

  useEffect(() => {
    if (!hasOverlayOrLesson) return;
    try {
      window.history.pushState({ kirillSubView: true }, '');
    } catch {
      // ignore in restricted environments
    }
  }, [
    activeLesson?.id,
    showQRModal,
    showSettingsModal,
    showSubscriptionModal,
    legalModalTab,
    showDiplomaModal,
    showCreatorModal,
  ]);

  useEffect(() => {
    const handlePopState = () => {
      if (showCreatorModal) {
        setShowCreatorModal(false);
        return;
      }
      if (legalModalTab) {
        setLegalModalTab(null);
        return;
      }
      if (showDiplomaModal) {
        setShowDiplomaModal(false);
        return;
      }
      if (showSubscriptionModal) {
        setShowSubscriptionModal(false);
        return;
      }
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return;
      }
      if (showQRModal) {
        setShowQRModal(false);
        return;
      }
      if (activeLesson) {
        soundEngine.stopSpeech();
        clearChoreoState();
        setActiveLesson(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    activeLesson,
    showQRModal,
    showSettingsModal,
    showSubscriptionModal,
    legalModalTab,
    showDiplomaModal,
    showCreatorModal,
  ]);

  const [, setSheetSyncTick] = useState(0);

  useEffect(() => {
    document.body.dataset.state = profile ? 'playing' : 'title';
  }, [profile]);

  // Automatic Robokassa Success URL return handler (?robokassa_paid=success or OutSum + InvId/SignatureValue)
  useEffect(() => {
    if (robokassaRedirectHandledRef.current) return;
    if (typeof window === 'undefined') return;
    const check = isRobokassaReturnUrl(window.location.search);
    if (!check.matched) return;

    robokassaRedirectHandledRef.current = true;
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch {
      // ignore in restricted environments
    }
    TelemetryService.clearPendingPaymentTimestamp();

    const currentProfile =
      profile ||
      TelemetryService.loadProfile() ||
      TelemetryService.createProfile('Ратник', '1–4 класс', '🛡️');

    const base = Math.max(Date.now(), currentProfile.premiumUntilEpochMillis || 0);
    const updated: PlayerProfile = {
      ...currentProfile,
      premiumUntilEpochMillis: base + 30 * 24 * 60 * 60 * 1000,
    };
    setProfile(updated);
    setExpiredBannerVisible(false);
    TelemetryService.saveProfile(updated);
    TelemetryService.sendEvent('subscription_activated', updated, {
      days: 30,
      source: 'robokassa_redirect',
      ...(check.outSum ? { outSum: check.outSum } : {}),
      ...(check.invId ? { invId: check.invId } : {}),
    });
    soundEngine.playFanfare();
    setPaymentSuccessNotice(
      '✅ Оплата 50 ₽ через Робокассу успешно получена! Полный доступ к Практике и Дебютам 30/30 открыт на 30 дней!'
    );
  }, []);

  useEffect(() => {
    if (!profile) return;
    TelemetryService.syncRemoteLeagueFromSheet().then(() => {
      setSheetSyncTick((t) => t + 1);
    });
  }, [profile?.id, mainTab]);

  // Check subscription expiration automatically (QA-01: ServiceWorker showNotification inside try/catch)
  useEffect(() => {
    if (!profile) return;
    if (
      profile.premiumUntilEpochMillis > 0 &&
      Date.now() > profile.premiumUntilEpochMillis &&
      profile.expiredNoticeShownForEpoch !== profile.premiumUntilEpochMillis
    ) {
      setExpiredBannerVisible(true);
      const updated: PlayerProfile = {
        ...profile,
        expiredNoticeShownForEpoch: profile.premiumUntilEpochMillis,
      };
      setProfile(updated);
      TelemetryService.saveProfile(updated);

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          navigator.serviceWorker?.ready
            .then((reg) =>
              reg.showNotification('Шахматы от Кирилла', {
                body: 'Срок подписки 30 дней истёк. Дебюты закрыты на замок, но весь ваш прогресс сохранён!',
              })
            )
            .catch(() => {});
        } catch {
          // ignore on unsupported mobile browsers
        }
      }
    }
  }, [profile]);

  const clearChoreoState = () => {
    for (const tid of choreoTimeoutsRef.current) {
      window.clearTimeout(tid);
    }
    choreoTimeoutsRef.current = [];
    isMoveLockedRef.current = false;
    setActiveMove(null);
    setCaptureShatter(null);
    setCheckmateTopple(null);
    setPreMoveHighlight(null);
  };

  const scheduleChoreo = (fn: () => void, delayMs: number) => {
    const tid = window.setTimeout(fn, delayMs);
    choreoTimeoutsRef.current.push(tid);
    return tid;
  };

  // Manage Blitz 5s Timer in Mastery Stage 3 (wins 20..29) (QA-02: scheduleChoreo stores 900ms reset timer)
  useEffect(() => {
    if (blitzTimerRef.current) {
      window.clearInterval(blitzTimerRef.current);
      blitzTimerRef.current = null;
    }

    if (!activeLesson || activeLesson.section !== 'mastery' || roundWon) {
      setBlitzTimeLeft(null);
      return;
    }

    const currentWins = profile?.lessonWins[activeLesson.id] || 0;
    const stageInfo = getMasteryStageInfo(currentWins);
    if (!stageInfo.blitzSeconds) {
      setBlitzTimeLeft(null);
      return;
    }

    setBlitzTimeLeft(stageInfo.blitzSeconds);
    blitzTimerRef.current = window.setInterval(() => {
      setBlitzTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 0.2) {
          if (blitzTimerRef.current) window.clearInterval(blitzTimerRef.current);
          soundEngine.playWarning();
          const msg =
            '⏰ Время блица (5 секунд) вышло! В Рубеже 3 нужно ходить молниеносно. Попробуй снова!';
          setKirillText(msg);
          soundEngine.speak(msg, 'blitz_timeout');
          // QA-02: Reset current variant position via scheduleChoreo so exiting clears it
          scheduleChoreo(() => {
            initLessonPosition(activeLesson, currentWins);
          }, 900);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      if (blitzTimerRef.current) {
        window.clearInterval(blitzTimerRef.current);
        blitzTimerRef.current = null;
      }
    };
  }, [activeLesson, stepIdx, roundWon]);

  const maybeTriggerKingTopple = (
    boardState: BoardMap,
    defeatedColor: PieceColor,
    isMateTaskStep: boolean
  ) => {
    if (isMateTaskStep || isCheckmate(boardState, defeatedColor)) {
      const topple = ChessAppViewModel.triggerCheckmateTopple(boardState, defeatedColor);
      if (topple) {
        setCheckmateTopple(topple);
        // Phase 3 (950ms): single heavy wooden king impact sound on the board (QA-04)
        scheduleChoreo(() => {
          soundEngine.playKingToppleImpact();
        }, 950);
      }
    }
  };

  // Initialize a lesson or next round (UX-05: do not auto-force TTS synthesis on screen open)
  const initLessonPosition = (lesson: LessonItem, currentWinsCount?: number) => {
    const wins = currentWinsCount ?? (profile?.lessonWins[lesson.id] || 0);
    clearChoreoState();
    setSelectedSquare(null);
    setLegalSquares([]);
    setLastMove(null);
    setRoundWon(false);
    setManualHintShown(false);

    if (lesson.section === 'theory' && lesson.theorySlides && lesson.theorySlides.length > 0) {
      setTheorySlideIdx(0);
      setInTheoryTask(false);
      const slide0 = lesson.theorySlides[0];
      setBoard(parseCompactSetup(slide0.setup));
      setKirillText(slide0.kirillText);
      setActiveVariant(null);
      setTargetApples([]);
      return;
    }

    if (lesson.proceduralMode) {
      const gen = generatePracticeTargets(lesson.proceduralMode, wins);
      setBoard(gen.board);
      setTargetApples(gen.targets);
      setMovesRemaining(gen.maxMoves);
      setActiveVariant(null);
      setStepIdx(0);
      setKirillText(gen.titleHint);
      return;
    }

    const variants = lesson.variants || [];
    if (variants.length === 0) return;

    let chosenVariant = variants[wins % variants.length];
    if (lesson.section === 'mastery') {
      const stage = getMasteryStageInfo(wins);
      if (!stage.useRandomBranch) {
        chosenVariant = variants[wins % variants.length];
      } else {
        chosenVariant = variants[(wins * 3 + 1) % variants.length];
      }
    }

    let startBoard =
      chosenVariant.setup === 'INITIAL'
        ? createInitialBoard()
        : parseCompactSetup(chosenVariant.setup);

    let introLastMove: { from: Square; to: Square } | null = null;
    if (chosenVariant.introMoves && chosenVariant.introMoves.length > 0) {
      for (const m of chosenVariant.introMoves) {
        startBoard = applyMove(startBoard, m.from, m.to).board;
        introLastMove = { from: m.from, to: m.to };
      }
    }

    setActiveVariant(chosenVariant);
    setStepIdx(0);
    setBoard(startBoard);
    setLastMove(introLastMove);
    setTargetApples([]);

    const firstHint = chosenVariant.steps[0]?.kirillHint || lesson.subtitle;
    setKirillText(firstHint);
  };

  const handleOpenLesson = (lesson: LessonItem) => {
    if (!lesson.isFree && !isSubscriptionActive(profile)) {
      soundEngine.playWarning();
      setShowSubscriptionModal(true);
      return;
    }
    if (profile && profile.lastLessonId !== lesson.id) {
      const updated: PlayerProfile = { ...profile, lastLessonId: lesson.id };
      setProfile(updated);
      TelemetryService.saveProfile(updated);
    }
    setActiveLesson(lesson);
    initLessonPosition(lesson);
  };

  const handleTheorySlideChange = (nextIdx: number) => {
    if (!activeLesson || !activeLesson.theorySlides) return;
    if (nextIdx < 0) return;
    clearChoreoState();

    if (nextIdx >= activeLesson.theorySlides.length) {
      if (activeLesson.theoryFinalTask) {
        setInTheoryTask(true);
        const task = activeLesson.theoryFinalTask;
        setActiveVariant(task);
        setStepIdx(0);
        setBoard(parseCompactSetup(task.setup));
        setSelectedSquare(null);
        setLegalSquares([]);
        setLastMove(null);
        const hint = task.steps[0]?.kirillHint || 'Сделай проверочный ход на доске!';
        setKirillText(hint);
      }
      return;
    }

    setInTheoryTask(false);
    setTheorySlideIdx(nextIdx);
    const slide = activeLesson.theorySlides[nextIdx];
    setBoard(parseCompactSetup(slide.setup));
    setSelectedSquare(null);
    setLegalSquares([]);
    setLastMove(null);
    setKirillText(slide.kirillText);
  };

  const recordLessonWin = (lesson: LessonItem, customWinMsg?: string) => {
    if (!profile) return;
    const prevWins = profile.lessonWins[lesson.id] || 0;
    const nextWins = prevWins + 1;
    const updated: PlayerProfile = {
      ...profile,
      lastLessonId: lesson.id,
      lessonWins: {
        ...profile.lessonWins,
        [lesson.id]: nextWins,
      },
    };
    setProfile(updated);
    TelemetryService.saveProfile(updated);
    TelemetryService.sendEvent('lesson_win', updated, {
      lessonId: lesson.id,
      lessonCode: lesson.code,
      lessonWins: nextWins,
    });

    setRoundWon(true);
    isMoveLockedRef.current = false;
    soundEngine.playFanfare();
    const winMsg =
      customWinMsg ||
      (nextWins >= lesson.targetWins
        ? `🏆 Рубеж взят (${nextWins} / ${lesson.targetWins})! Урок «${lesson.title}» полностью покорился тебе!`
        : `✅ Победа засчитана (${nextWins} / ${lesson.targetWins})! Нажми «Следующий раунд» для продолжения.`);
    setKirillText(winMsg);
    soundEngine.speak(winMsg, `win_${(nextWins % 5) + 1}`);
  };

  // Shared move executor for both Tap-to-Move and Drag-and-Drop (UX-06, UX-07, FE-02)
  const executeBoardMove = (fromSq: Square, toSq: Square) => {
    if (!activeLesson || roundWon || preMoveHighlight || isMoveLockedRef.current) return;

    const activePlayerColor: PieceColor = activeVariant?.playerColor || activeLesson.playerColor;
    const enemyColor: PieceColor = activePlayerColor === 'w' ? 'b' : 'w';
    const isBlitzMode = blitzTimeLeft !== null;

    setSelectedSquare(null);
    setLegalSquares([]);

    // Case A: Procedural Practice 2.1 & 2.2 (collect 3 target apples within move limit)
    if (activeLesson.proceduralMode) {
      isMoveLockedRef.current = true;
      const moveChoreo = ChessAppViewModel.createMoveChoreography(
        board,
        fromSq,
        toSq,
        activePlayerColor,
        undefined,
        isBlitzMode
      );
      setActiveMove(moveChoreo);
      scheduleChoreo(() => {
        isMoveLockedRef.current = false;
      }, moveChoreo?.durationMs || 260);

      const { board: nextBoard } = applyMove(board, fromSq, toSq);
      const remainingApples = targetApples.filter((a) => a !== toSq);
      const nextMovesLeft = movesRemaining - 1;
      const ateApple = remainingApples.length < targetApples.length;

      if (ateApple) {
        soundEngine.playCaptureWood();
        scheduleChoreo(
          () =>
            setCaptureShatter(
              ChessAppViewModel.spawnCaptureShatter(toSq, 'b', undefined, isBlitzMode)
            ),
          Math.max(0, (moveChoreo?.durationMs || 380) - 90)
        );
      } else {
        soundEngine.playMoveWood();
      }

      setBoard(nextBoard);
      setLastMove({ from: fromSq, to: toSq });
      setTargetApples(remainingApples);
      setMovesRemaining(nextMovesLeft);

      if (remainingApples.length === 0) {
        recordLessonWin(
          activeLesson,
          '🍎 Все 3 яблока собраны точным маршрутом! Отличная техника!'
        );
      } else if (nextMovesLeft <= 0) {
        soundEngine.playWarning();
        const failMsg = `Ходы закончились, а на доске осталось яблок: ${remainingApples.length}. Попробуй более короткий маршрут!`;
        setKirillText(failMsg);
        soundEngine.speak(failMsg, 'err_1');
        scheduleChoreo(() => {
          initLessonPosition(activeLesson);
        }, 1100);
      } else {
        setKirillText(
          `Осталось собрать яблок: ${remainingApples.length} • Ходов в запасе: ${nextMovesLeft}.`
        );
      }
      return;
    }

    // Case B: Open Check Defense (Lesson 2.5 - any legal move escaping check wins!)
    if (activeVariant?.openCheckDefense) {
      const { board: nextBoard, captured } = applyMove(board, fromSq, toSq);
      if (!isInCheck(nextBoard, activePlayerColor)) {
        isMoveLockedRef.current = true;
        const moveChoreo = ChessAppViewModel.createMoveChoreography(
          board,
          fromSq,
          toSq,
          activePlayerColor,
          undefined,
          isBlitzMode
        );
        setActiveMove(moveChoreo);
        if (captured) {
          soundEngine.playCaptureWood();
          scheduleChoreo(
            () =>
              setCaptureShatter(
                ChessAppViewModel.spawnCaptureShatter(toSq, captured.color, undefined, isBlitzMode)
              ),
            Math.max(0, (moveChoreo?.durationMs || 380) - 90)
          );
        } else {
          soundEngine.playMoveWood();
        }
        setBoard(nextBoard);
        setLastMove({ from: fromSq, to: toSq });
        recordLessonWin(
          activeLesson,
          '🛡️ Король надёжно защищён от шаха! Отличное решение!'
        );
      } else {
        soundEngine.playWarning();
        setKirillText('Король всё ещё под шахом! Выбери другой ход.');
      }
      return;
    }

    // Case C: Free Sparring Anti-Stalemate (Lesson 2.10 Task 3)
    if (activeVariant?.sparringAntiStalemate) {
      isMoveLockedRef.current = true;
      const moveChoreo = ChessAppViewModel.createMoveChoreography(
        board,
        fromSq,
        toSq,
        activePlayerColor,
        undefined,
        isBlitzMode
      );
      setActiveMove(moveChoreo);
      const { board: afterWhite, captured } = applyMove(board, fromSq, toSq);
      if (captured) {
        soundEngine.playCaptureWood();
        scheduleChoreo(
          () =>
            setCaptureShatter(
              ChessAppViewModel.spawnCaptureShatter(toSq, captured.color, undefined, isBlitzMode)
            ),
          Math.max(0, (moveChoreo?.durationMs || 380) - 90)
        );
      } else {
        soundEngine.playMoveWood();
      }
      setBoard(afterWhite);
      setLastMove({ from: fromSq, to: toSq });

      if (isCheckmate(afterWhite, 'b')) {
        maybeTriggerKingTopple(afterWhite, 'b', true);
        recordLessonWin(
          activeLesson,
          '🏆 Чистый мат Королём и Ферзём без пата! Блестящая победа!'
        );
        return;
      }
      if (isStalemate(afterWhite, 'b')) {
        soundEngine.playWarning();
        const staleMsg =
          'Ой! Чёрному Королю некуда ходить, а шаха нет — это ПАТ (ничья)! Попробуй ещё раз и оставь Королю клетку или дай мат.';
        setKirillText(staleMsg);
        soundEngine.speak(staleMsg, 'err_2');
        scheduleChoreo(() => initLessonPosition(activeLesson), 1500);
        return;
      }

      const blackReply = getBlackSparringMove(afterWhite);
      if (blackReply) {
        const flightWait = moveChoreo?.durationMs || 380;
        scheduleChoreo(() => {
          setPreMoveHighlight(blackReply.from);
          scheduleChoreo(() => {
            setPreMoveHighlight(null);
            const replyChoreo = ChessAppViewModel.createMoveChoreography(
              afterWhite,
              blackReply.from,
              blackReply.to,
              activePlayerColor,
              undefined,
              isBlitzMode
            );
            setActiveMove(replyChoreo);
            const { board: afterBlack, captured: bCap } = applyMove(
              afterWhite,
              blackReply.from,
              blackReply.to
            );
            if (bCap) {
              soundEngine.playCaptureWood();
              scheduleChoreo(
                () =>
                  setCaptureShatter(
                    ChessAppViewModel.spawnCaptureShatter(
                      blackReply.to,
                      bCap.color,
                      undefined,
                      isBlitzMode
                    )
                  ),
                Math.max(0, (replyChoreo?.durationMs || 380) - 90)
              );
            } else {
              soundEngine.playMoveWood();
            }
            setBoard(afterBlack);
            setLastMove(blackReply);
            setKirillText(
              'Чёрный Король пытается ускользнуть! Зажми его и поставь мат без пата.'
            );
            scheduleChoreo(() => {
              isMoveLockedRef.current = false;
            }, replyChoreo?.durationMs || 260);
          }, ChessAppViewModel.PRE_MOVE_HIGHLIGHT_MS);
        }, flightWait);
      } else {
        isMoveLockedRef.current = false;
      }
      return;
    }

    // Case D: Standard Step-by-Step Sequence (Theory Final Task, Practice Ivashchenko, Mastery 30/30)
    const currentStep = activeVariant?.steps[stepIdx] || null;
    const currentWins = profile?.lessonWins[activeLesson.id] || 0;
    const feedback = analyzePlayerMove(board, fromSq, toSq, currentStep, currentWins + stepIdx);

    if (!feedback.isCorrect || !currentStep) {
      soundEngine.playWarning();
      setKirillText(feedback.kirillMessage);
      soundEngine.speak(feedback.kirillMessage, feedback.audioKey);
      return;
    }

    // Correct move! Lock synchronous double-tap and launch 2.5D flight choreography
    isMoveLockedRef.current = true;
    const moveChoreo = ChessAppViewModel.createMoveChoreography(
      board,
      fromSq,
      toSq,
      activePlayerColor,
      undefined,
      isBlitzMode
    );
    setActiveMove(moveChoreo);

    const { board: afterPlayer, captured } = applyMove(
      board,
      fromSq,
      toSq,
      currentStep.promotionPiece || 'q'
    );
    if (captured) {
      soundEngine.playCaptureWood();
      scheduleChoreo(
        () =>
          setCaptureShatter(
            ChessAppViewModel.spawnCaptureShatter(toSq, captured.color, undefined, isBlitzMode)
          ),
        Math.max(0, (moveChoreo?.durationMs || 200) - 70)
      );
    } else {
      soundEngine.playMoveWood();
    }

    setBoard(afterPlayer);
    setLastMove({ from: fromSq, to: toSq });
    setManualHintShown(false);

    const isLastStep = !activeVariant || stepIdx >= activeVariant.steps.length - 1;
    const isMateStep =
      isLastStep &&
      (currentStep.kirillHint.includes('#') ||
        currentStep.kirillHint.toLowerCase().includes('мат') ||
        activeLesson.id === 'theory_1_8' ||
        activeLesson.id === 'practice_2_3' ||
        activeLesson.id === 'practice_2_7' ||
        activeLesson.id === 'practice_2_8' ||
        activeLesson.id === 'practice_2_9' ||
        activeLesson.id === 'mastery_3_2' ||
        activeLesson.id === 'mastery_3_3');

    if (currentStep.replyFrom && currentStep.replyTo) {
      const rFrom = currentStep.replyFrom;
      const rTo = currentStep.replyTo;
      const playerFlightMs = moveChoreo?.durationMs || 200;
      const preHighlightMs = isBlitzMode ? 180 : ChessAppViewModel.PRE_MOVE_HIGHLIGHT_MS;

      // 1) Wait for player piece flight, then show pedagogical preMoveHighlight
      scheduleChoreo(() => {
        setPreMoveHighlight(rFrom);
        // 2) After amber ring, launch opponent piece flight
        scheduleChoreo(() => {
          setPreMoveHighlight(null);
          const replyChoreo = ChessAppViewModel.createMoveChoreography(
            afterPlayer,
            rFrom,
            rTo,
            activePlayerColor,
            undefined,
            isBlitzMode
          );
          setActiveMove(replyChoreo);

          const { board: afterReply, captured: rCap } = applyMove(afterPlayer, rFrom, rTo);
          if (rCap) {
            soundEngine.playCaptureWood();
            scheduleChoreo(
              () =>
                setCaptureShatter(
                  ChessAppViewModel.spawnCaptureShatter(rTo, rCap.color, undefined, isBlitzMode)
                ),
              Math.max(0, (replyChoreo?.durationMs || 200) - 70)
            );
          } else {
            soundEngine.playMoveWood();
          }
          setBoard(afterReply);
          setLastMove({ from: rFrom, to: rTo });

          if (isLastStep) {
            maybeTriggerKingTopple(afterReply, enemyColor, false);
            recordLessonWin(activeLesson, currentStep.replyText || feedback.kirillMessage);
          } else {
            const nextStep = activeVariant!.steps[stepIdx + 1];
            setStepIdx(stepIdx + 1);
            setKirillText(nextStep.kirillHint);
            scheduleChoreo(() => {
              isMoveLockedRef.current = false;
            }, Math.min(180, replyChoreo?.durationMs || 180));
          }
        }, preHighlightMs);
      }, playerFlightMs);
    } else {
      if (isLastStep) {
        maybeTriggerKingTopple(afterPlayer, enemyColor, isMateStep);
        recordLessonWin(activeLesson, feedback.kirillMessage);
      } else {
        const nextStep = activeVariant!.steps[stepIdx + 1];
        setStepIdx(stepIdx + 1);
        setKirillText(nextStep.kirillHint);
        isMoveLockedRef.current = false;
      }
    }
  };

  // Handle tap on a chessboard square (Tap-to-Move)
  const handleSquareTap = (sq: Square) => {
    if (!activeLesson || roundWon || preMoveHighlight || isMoveLockedRef.current) return;

    // If still viewing theory slides, advance to final task on tap
    if (activeLesson.section === 'theory' && !inTheoryTask) {
      if (activeLesson.theorySlides && theorySlideIdx < activeLesson.theorySlides.length - 1) {
        handleTheorySlideChange(theorySlideIdx + 1);
      } else {
        handleTheorySlideChange(activeLesson.theorySlides?.length || 0);
      }
      return;
    }

    const activePlayerColor: PieceColor = activeVariant?.playerColor || activeLesson.playerColor;

    // 1) If a square is already selected and user taps a legal destination square -> execute move!
    if (selectedSquare && legalSquares.includes(sq)) {
      executeBoardMove(selectedSquare, sq);
      return;
    }

    // 2) Otherwise, check if the tapped square contains a friendly piece to select
    const piece = board[sq];
    if (piece && piece.color === activePlayerColor) {
      soundEngine.playSelectTap();
      setSelectedSquare(sq);
      setLegalSquares(getLegalMovesForSquare(board, sq));
    } else {
      setSelectedSquare(null);
      setLegalSquares([]);
    }
  };

  // Handle Drag-and-Drop move (UX-07)
  const handleMoveDragDrop = (fromSq: Square, toSq: Square) => {
    if (!activeLesson || roundWon || preMoveHighlight || isMoveLockedRef.current) return;
    if (activeLesson.section === 'theory' && !inTheoryTask) return;
    const legals = getLegalMovesForSquare(board, fromSq);
    if (legals.includes(toSq)) {
      executeBoardMove(fromSq, toSq);
    }
  };

  // Compute active arrows & apple badges for ChessBoard3D
  const getActiveOverlays = (): {
    arrows: ArrowOverlay[];
    appleBadges: AppleBadgeOverlay[];
  } => {
    if (!activeLesson) return { arrows: [], appleBadges: [] };

    if (activeLesson.section === 'theory' && !inTheoryTask && activeLesson.theorySlides) {
      const slide = activeLesson.theorySlides[theorySlideIdx];
      return {
        arrows: slide?.arrows || [],
        appleBadges: slide?.appleBadges || [],
      };
    }

    const step = activeVariant?.steps[stepIdx];
    if (!step) return { arrows: [], appleBadges: [] };

    const wins = profile?.lessonWins[activeLesson.id] || 0;
    let showArrows = true;
    if (activeLesson.section === 'mastery') {
      const stage = getMasteryStageInfo(wins);
      showArrows = stage.showHintArrow || manualHintShown;
    } else if (activeLesson.section === 'practice') {
      showArrows = Boolean(step.arrows && step.arrows.length > 0) || manualHintShown;
    }

    let arrows: ArrowOverlay[] = [];
    if (showArrows) {
      if (step.arrows && step.arrows.length > 0) {
        arrows = step.arrows;
      } else {
        arrows = [{ from: step.playerFrom, to: step.playerTo, color: 'green' }];
      }
    }

    return {
      arrows,
      appleBadges: step.appleBadges || [],
    };
  };

  // Handle Onboarding Form Submit
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = onboardName.trim();
    if (!trimmed) {
      setOnboardError('Введи имя или нажми «Быстрый старт» ниже!');
      return;
    }
    const created = TelemetryService.createProfile(trimmed, onboardCategory, onboardBadge);
    setProfile(created);
    soundEngine.playFanfare();
  };

  // UX-01: 1-Click Quick Start without typing name
  const handleQuickStart = () => {
    const quickName = onboardName.trim() || 'Ратник';
    const created = TelemetryService.createProfile(quickName, onboardCategory, onboardBadge);
    setProfile(created);
    soundEngine.playFanfare();
  };

  // Activate Subscription
  const handleActivateSubscription = (
    days: number,
    source: string,
    extra?: Record<string, unknown>
  ) => {
    if (!profile) return;
    const base = Math.max(Date.now(), profile.premiumUntilEpochMillis || 0);
    const receiptId = typeof extra?.receiptId === 'string' ? extra.receiptId : undefined;
    const existingReceipts = profile.usedReceiptIds || [];
    const updated: PlayerProfile = {
      ...profile,
      premiumUntilEpochMillis: base + days * 24 * 60 * 60 * 1000,
      usedReceiptIds:
        receiptId && !existingReceipts.includes(receiptId)
          ? [...existingReceipts, receiptId]
          : existingReceipts,
    };
    setProfile(updated);
    setExpiredBannerVisible(false);
    TelemetryService.saveProfile(updated);
    TelemetryService.sendEvent('subscription_activated', updated, { days, source, ...extra });
    soundEngine.playFanfare();
    if (source.startsWith('robokassa_')) {
      setPaymentSuccessNotice(
        '✅ Оплата 50 ₽ через Робокассу успешно получена! Полный доступ к Практике и Дебютам 30/30 открыт на 30 дней!'
      );
    }
  };

  const handleCreatorSubscriptionTest = (newPremiumUntilMillis: number, triggerExpiredBanner?: boolean) => {
    if (!profile) return;
    const updated: PlayerProfile = {
      ...profile,
      premiumUntilEpochMillis: newPremiumUntilMillis,
    };
    setProfile(updated);
    TelemetryService.saveProfile(updated);
    if (triggerExpiredBanner) {
      setExpiredBannerVisible(true);
      soundEngine.playWarning();
    } else {
      setExpiredBannerVisible(false);
      soundEngine.playFanfare();
    }
  };

  // Total wins and completed lessons
  const totalWins = profile ? calculateTotalWins(profile.lessonWins) : 0;
  const completedLessonsCount = profile
    ? getCompletedLessonsCount(profile.lessonWins, getTargetMap())
    : 0;
  const subActive = isSubscriptionActive(profile);

  // =========================================================================
  // SCREEN 1: WELCOME ONBOARDING SCREEN (UX-01 Quick Start + FE-05 Keyboard Scroll)
  // =========================================================================
  if (!profile) {
    return (
      <div className="w-full max-w-[460px] h-[100dvh] max-h-[100dvh] mx-auto flex flex-col justify-between overflow-y-auto custom-scroll bg-[#0B1120] border-x border-slate-800/90 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-2.5 text-center">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#131C2E] border-[1.5px] border-slate-800">
            <KirillAvatarSVG className="w-11 h-11" />
            <div className="text-left">
              <h1 className="text-lg font-extrabold text-white font-display leading-tight">
                Шахматы от Кирилла
              </h1>
              <p className="text-xs text-amber-400 font-medium">
                Линтех №28 г. Кирова • kirill-chess-linteh.ru
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#131C2E] border-[1.5px] border-slate-800 text-xs text-slate-200 leading-relaxed text-left">
            👋 Привет! Я <strong>Кирилл</strong>, ученик 4 класса Лицея информационных технологий №28 г. Кирова. Нажми <strong>«Быстрый старт»</strong> или впиши своё имя в Паспорт ратника!
          </div>
        </div>

        {/* UX-01: Prominent 1-Click Quick Start Button */}
        <div className="my-2 space-y-3">
          <button
            type="button"
            onClick={handleQuickStart}
            data-quickstart="true"
            className="w-full h-12 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm border-b-4 border-amber-700 active:border-b-0 active:translate-y-[3px] transition-all duration-75 shadow-lg flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>Быстрый старт (без ввода имени)</span>
          </button>

          <form onSubmit={handleCreateProfile} className="space-y-3 bg-[#131C2E]/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <label htmlFor="player-name-input" className="block text-xs font-bold text-slate-300 mb-1">
                Или введи своё имя для Паспорта ратника:
              </label>
              <input
                id="player-name-input"
                type="text"
                value={onboardName}
                onChange={(e) => {
                  setOnboardName(e.target.value);
                  setOnboardError('');
                }}
                placeholder="Введи имя (например, Александр)"
                maxLength={24}
                className="w-full px-3.5 py-2 rounded-xl bg-[#131C2E] border-[1.5px] border-slate-700 text-white text-[16px] focus:outline-none focus:border-amber-400"
              />
              {onboardError && (
                <p className="text-xs text-rose-400 font-semibold mt-1">{onboardError}</p>
              )}
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-300 mb-1">
                Выбери свою категорию:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['1–4 класс', '5–11 класс', 'Взрослый новичок'] as AgeCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setOnboardCategory(cat)}
                    className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-bold border-[1.5px] transition-all ${
                      onboardCategory === cat
                        ? 'bg-amber-500 text-slate-950 border-amber-400 border-b-4 border-b-amber-700'
                        : 'bg-[#131C2E] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-300 mb-1">
                Выбери боевой значок:
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {AVAILABLE_BADGES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setOnboardBadge(b)}
                    aria-label={`Значок ${b}`}
                    className={`h-10 rounded-xl text-lg flex items-center justify-center border-[1.5px] transition-all ${
                      onboardBadge === b
                        ? 'bg-amber-500/20 border-amber-400 scale-105'
                        : 'bg-[#131C2E] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              data-start="true"
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[3px] transition-all duration-75 shadow-md"
            >
              ⚔️ Вступить в дружину с именем
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setLegalModalTab('requisites')}
            className="underline hover:text-slate-200"
          >
            Реквизиты ИП Кошурниковой Е. С.
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setLegalModalTab('oferta')}
            className="underline hover:text-slate-200"
          >
            Оферта
          </button>
        </div>

        {legalModalTab && (
          <LegalDocumentsModal
            initialTab={legalModalTab}
            onClose={() => setLegalModalTab(null)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: LESSON PLAY SCREEN (Fits strictly in 100dvh with ZERO scroll!)
  // =========================================================================
  if (activeLesson) {
    const lessonWins = profile.lessonWins[activeLesson.id] || 0;
    const { arrows, appleBadges } = getActiveOverlays();
    const activePlayerColor: PieceColor = activeVariant?.playerColor || activeLesson.playerColor;
    const stageInfo =
      activeLesson.section === 'mastery' ? getMasteryStageInfo(lessonWins) : null;
    const isMutedAll = !soundOn && !voiceOn;

    return (
      <div className="w-full max-w-[460px] h-[100dvh] max-h-[100dvh] mx-auto flex flex-col justify-between overflow-hidden bg-[#0B1120] border-x border-slate-800/90 relative">
        {/* Top Compact Lesson Header (shrink-0) */}
        <header className="h-12 px-2.5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between gap-1.5 shrink-0 pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            onClick={() => {
              soundEngine.stopSpeech();
              clearChoreoState();
              setActiveLesson(null);
            }}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#131C2E] hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 border-b-2 active:translate-y-[1px] shrink-0 flex items-center"
          >
            ← К урокам
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="text-xs font-extrabold text-white truncate font-display">
              {activeLesson.title}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {activeLesson.section === 'theory' && !inTheoryTask && activeLesson.theorySlides
                ? `Слайд ${theorySlideIdx + 1} из ${activeLesson.theorySlides.length}`
                : stageInfo
                ? stageInfo.stageTitle
                : activeVariant?.title || 'Боевая задача'}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {blitzTimeLeft !== null && (
              <span
                className={`px-2 py-1 rounded-lg text-xs font-extrabold font-mono-tabular border ${
                  blitzTimeLeft <= 2
                    ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/70'
                }`}
              >
                ⏱ {blitzTimeLeft.toFixed(1)}с
              </span>
            )}
            {/* UX-04: Quick Sound/Voice Mute Toggle in Lesson Header */}
            <button
              type="button"
              onClick={() => {
                const nextState = isMutedAll;
                setSoundOn(nextState);
                setVoiceOn(nextState);
                soundEngine.setSoundEnabled(nextState);
                soundEngine.setVoiceEnabled(nextState);
              }}
              aria-label={isMutedAll ? 'Включить звук и голос' : 'Выключить звук и голос'}
              data-testid="lesson-mute-toggle"
              className="min-w-[40px] min-h-[40px] px-1.5 rounded-lg bg-[#131C2E] hover:bg-slate-800 text-slate-100 border border-slate-700 text-xs font-bold flex items-center justify-center"
            >
              {isMutedAll ? '🔇' : '🔊'}
            </button>
            <button
              type="button"
              onClick={() => setCameraAngle(cameraAngle === '45' ? '65' : '45')}
              aria-label="Переключить наклон доски 2.5D"
              className="min-h-[40px] px-2 py-1 rounded-lg bg-[#131C2E] text-amber-400 border border-slate-700 text-[11px] font-extrabold font-mono-tabular flex items-center justify-center"
            >
              {cameraAngle}°
            </button>
            <span className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 text-xs font-extrabold font-mono-tabular">
              {lessonWins}/{activeLesson.targetWins}
            </span>
          </div>
        </header>

        {/* Progress Bar Strip (shrink-0) */}
        <div className="h-1.5 w-full bg-slate-900 shrink-0 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.round((lessonWins / activeLesson.targetWins) * 100))}%`,
            }}
          />
        </div>

        {/* Center 2.5D Tournament Chessboard Area */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-1 overflow-hidden">
          <ChessBoard3D
            board={board}
            playerColor={activePlayerColor}
            selectedSquare={selectedSquare}
            legalSquares={legalSquares}
            lastMove={lastMove}
            arrows={arrows}
            appleBadges={appleBadges}
            targetApples={targetApples}
            cameraAngle={cameraAngle}
            boardWoodTheme={boardWoodTheme}
            onSquareTap={handleSquareTap}
            onMoveDragDrop={handleMoveDragDrop}
            activeMove={activeMove}
            captureShatter={captureShatter}
            checkmateTopple={checkmateTopple}
            preMoveHighlight={preMoveHighlight}
          />
        </div>

        {/* Strictly Fixed-Height Kirill Coach Card (h-[108px] shrink-0 so board NEVER shifts!) */}
        <div className="px-3 shrink-0">
          <div className="h-[108px] w-full rounded-2xl bg-[#131C2E] border-[1.5px] border-slate-700 p-2.5 flex items-start gap-2.5 overflow-hidden shadow-md">
            <div className="shrink-0 flex flex-col items-center gap-1">
              <KirillAvatarSVG className="w-10 h-10" />
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlockAudio();
                  if (soundEngine.isSpeaking()) {
                    soundEngine.stopSpeech();
                  } else {
                    soundEngine.speak(kirillText, activeLesson.audioKey, true);
                  }
                }}
                aria-label="Озвучить подсказку Кирилла"
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 font-bold border border-slate-700"
              >
                🔊 Речь
              </button>
            </div>
            {/* UX-03: No inner scrollbar for theory slides, readable 13.5px-14px text */}
            <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col justify-center">
              <div className="text-[11px] font-bold text-amber-400 leading-tight mb-0.5 flex items-center justify-between">
                <span>Кирилл • Воевода Линтеха №28</span>
                {activePlayerColor === 'b' && (
                  <span className="text-[10px] text-sky-300 font-mono-tabular">
                    Доска за чёрных ▼
                  </span>
                )}
              </div>
              <p
                className={`${
                  activeLesson.section === 'theory'
                    ? 'text-[13.5px] sm:text-[14px]'
                    : 'text-xs sm:text-[13px]'
                } text-slate-100 leading-snug font-normal line-clamp-4`}
              >
                {kirillText}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Tactile Action Controls (shrink-0, UX-04 min-h-[44px]) */}
        <div className="px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] bg-[#0B1120] shrink-0">
          {roundWon ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentW = profile.lessonWins[activeLesson.id] || 0;
                  initLessonPosition(activeLesson, currentW);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                ✅ Следующий раунд ({Math.min(lessonWins + 1, activeLesson.targetWins)} / {activeLesson.targetWins})
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.stopSpeech();
                  clearChoreoState();
                  setActiveLesson(null);
                }}
                className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-[#131C2E] hover:bg-slate-800 text-slate-200 font-bold text-xs border-[1.5px] border-slate-700 border-b-4 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                В меню
              </button>
            </div>
          ) : activeLesson.section === 'theory' && !inTheoryTask && activeLesson.theorySlides ? (
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={theorySlideIdx === 0}
                onClick={() => handleTheorySlideChange(theorySlideIdx - 1)}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#131C2E] disabled:opacity-40 text-slate-200 font-bold text-xs border-[1.5px] border-slate-700 border-b-4 active:border-b-0 active:translate-y-[3px] transition-all duration-75 shrink-0"
              >
                ⬅️ Слайд
              </button>
              <button
                type="button"
                onClick={() => handleTheorySlideChange(theorySlideIdx + 1)}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm border-b-4 border-amber-700 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                {theorySlideIdx < activeLesson.theorySlides.length - 1
                  ? 'Далее ➡️'
                  : '🎯 К задаче'}
              </button>
              {theorySlideIdx < activeLesson.theorySlides.length - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    handleTheorySlideChange(activeLesson.theorySlides?.length || 0)
                  }
                  data-testid="skip-to-theory-task"
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[3px] transition-all duration-75 shrink-0"
                >
                  К задаче ⏭
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => initLessonPosition(activeLesson)}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-[#131C2E] hover:bg-slate-800 text-slate-200 font-bold text-xs border-[1.5px] border-slate-700 border-b-4 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                🔄 Сбросить позицию
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualHintShown(true);
                  const step = activeVariant?.steps[stepIdx];
                  if (step) {
                    const msg = `💡 Подсказка: сделай ход ${step.playerFrom} → ${step.playerTo}. ${step.kirillHint}`;
                    setKirillText(msg);
                    soundEngine.speak(msg);
                  }
                }}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border-[1.5px] border-amber-500/60 border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                💡 Показать ход
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 3: MAIN APP SHELL (Header + Tab Content + Bottom Navigation)
  // =========================================================================
  const filteredLessons = CURRICULUM_LESSONS.filter((l) => l.section === lessonSection);
  const leagueData = TelemetryService.getLeagueTop10(profile);

  // UX-02: Determine the lesson for the "⚡ Продолжить обучение" pinned card
  const continueLesson: LessonItem =
    (profile.lastLessonId
      ? CURRICULUM_LESSONS.find((l) => l.id === profile.lastLessonId)
      : undefined) ||
    CURRICULUM_LESSONS.find(
      (l) =>
        (l.isFree || subActive) &&
        (profile.lessonWins[l.id] || 0) < l.targetWins
    ) ||
    CURRICULUM_LESSONS[0];
  const continueWins = profile.lessonWins[continueLesson.id] || 0;

  return (
    <div className="w-full max-w-[460px] h-[100dvh] max-h-[100dvh] mx-auto flex flex-col overflow-hidden bg-[#0B1120] border-x border-slate-800/90 relative">
      {/* Top Header (h-14 px-3 flex items-center justify-between border-b border-slate-800 bg-[#0F172A]) */}
      <header className="h-14 px-3 flex items-center justify-between gap-1.5 border-b border-slate-800 bg-[#0F172A] shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 min-w-0">
          <KirillAvatarSVG className="w-9 h-9 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[13.5px] sm:text-sm font-extrabold text-white leading-tight whitespace-nowrap font-display">
              Шахматы от Кирилла
            </h1>
            <p className="text-[11px] text-amber-400 font-medium leading-tight whitespace-nowrap">
              Линтех №28 г. Кирова
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div
            className="px-2 py-1 rounded-xl bg-[#131C2E] border border-slate-700 text-xs font-extrabold text-amber-400 font-mono-tabular flex items-center gap-1"
            title="Всего побед ратника"
          >
            <span>🏆</span>
            <span>{totalWins}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowQRModal(true)}
            aria-label="Открыть QR-код проекта"
            className="h-9 px-2 rounded-xl bg-[#131C2E] hover:bg-slate-800 text-slate-100 font-bold text-xs border border-slate-700 border-b-2 active:translate-y-[1px] flex items-center gap-1"
          >
            📱 QR
          </button>
          <button
            type="button"
            onClick={() => {
              setPinError('');
              setShowSettingsModal(true);
            }}
            aria-label="Открыть настройки"
            className="h-9 px-2 rounded-xl bg-[#131C2E] hover:bg-slate-800 text-slate-100 font-bold text-sm border border-slate-700 border-b-2 active:translate-y-[1px] flex items-center justify-center"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Robokassa Payment Success Notification Banner */}
      {paymentSuccessNotice && (
        <div
          data-testid="robokassa-success-banner"
          className="mx-3 mt-2 p-2.5 rounded-xl bg-emerald-950/90 border-[1.5px] border-emerald-500/90 flex items-start justify-between gap-2 shrink-0"
        >
          <div className="text-[11.5px] text-emerald-100 font-semibold leading-snug">
            {paymentSuccessNotice}
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessNotice(null)}
            aria-label="Закрыть уведомление об оплате"
            className="w-7 h-7 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-600/60"
          >
            ✕
          </button>
        </div>
      )}

      {/* Expired Subscription Banner */}
      {expiredBannerVisible && !subActive && (
        <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-950/80 border-[1.5px] border-amber-500/80 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-amber-100 leading-snug">
            🔒 <strong>Срок 30 дней истёк.</strong> Дебюты и платная практика закрыты на замок, все твои <strong>{totalWins}</strong> побед сохранены!
          </div>
          <button
            type="button"
            onClick={() => setShowSubscriptionModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-[11px] shrink-0"
          >
            Продлить 50 ₽
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* TAB 1: LESSONS (1. Теория, 2. Практика, 3. Дебюты) */}
        {mainTab === 'lessons' && (
          <>
            {/* UX-02: Compact Pinned "⚡ Продолжить обучение" Card */}
            <div className="px-3 pt-2 pb-1 bg-[#0B1120] shrink-0">
              <button
                type="button"
                onClick={() => handleOpenLesson(continueLesson)}
                data-testid="continue-learning-card"
                className="w-full px-3 py-2 rounded-xl bg-[#131C2E] hover:bg-slate-800/90 border-[1.5px] border-amber-500/70 border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-[2px] transition-all duration-75 flex items-center justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                    ⚡ Продолжить обучение
                  </div>
                  <div className="text-xs font-extrabold text-white truncate font-display">
                    {continueLesson.title}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="px-2 py-1 rounded-lg bg-[#0B1120] border border-slate-700 text-[11px] font-extrabold text-emerald-400 font-mono-tabular">
                    {continueWins}/{continueLesson.targetWins}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-xs">
                    В бой →
                  </span>
                </div>
              </button>
            </div>

            {/* 3 Section Selector Buttons */}
            <div className="grid grid-cols-3 gap-1.5 px-3 py-2 bg-[#0B1120] border-b border-slate-800/80 shrink-0">
              <button
                type="button"
                onClick={() => setLessonSection('theory')}
                className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-extrabold border-[1.5px] transition-all duration-75 ${
                  lessonSection === 'theory'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 border-b-4 border-b-amber-700'
                    : 'bg-[#131C2E] text-slate-300 border-slate-800 border-b-4 border-b-slate-950 hover:text-white'
                }`}
              >
                1. Теория
              </button>
              <button
                type="button"
                onClick={() => setLessonSection('practice')}
                className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-extrabold border-[1.5px] transition-all duration-75 ${
                  lessonSection === 'practice'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 border-b-4 border-b-amber-700'
                    : 'bg-[#131C2E] text-slate-300 border-slate-800 border-b-4 border-b-slate-950 hover:text-white'
                }`}
              >
                2. Практика
              </button>
              <button
                type="button"
                onClick={() => setLessonSection('mastery')}
                className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-extrabold border-[1.5px] transition-all duration-75 ${
                  lessonSection === 'mastery'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 border-b-4 border-b-amber-700'
                    : 'bg-[#131C2E] text-slate-300 border-slate-800 border-b-4 border-b-slate-950 hover:text-white'
                }`}
              >
                3. Дебюты
              </button>
            </div>

            {/* Scrollable Lesson Cards List */}
            <div className="flex-1 overflow-y-auto custom-scroll py-2.5 space-y-2.5">
              {filteredLessons.map((lesson) => {
                const wins = profile.lessonWins[lesson.id] || 0;
                const isCompleted = wins >= lesson.targetWins;
                const isLocked = !lesson.isFree && !subActive;
                const progressPct = Math.min(100, Math.round((wins / lesson.targetWins) * 100));

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => handleOpenLesson(lesson)}
                    className={`w-[calc(100%-24px)] mx-3 p-3 rounded-2xl text-left border-[1.5px] border-b-4 active:border-b-0 active:translate-y-[3px] transition-all duration-75 flex items-start gap-3 ${
                      isCompleted
                        ? 'bg-[#131C2E] border-emerald-600/80 border-b-emerald-800'
                        : isLocked
                        ? 'bg-[#131C2E]/90 border-slate-800 border-b-slate-950'
                        : 'bg-[#131C2E] border-slate-700/90 border-b-slate-950 hover:border-slate-600'
                    }`}
                  >
                    {/* Left 52x52 2.5D Staunton Piece Illustration */}
                    <CardIcon25D
                      spec={lesson.iconSpec}
                      completed={isCompleted}
                      lessonCode={lesson.code}
                      section={lesson.section}
                    />

                    {/* Right Text & Progress */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-white leading-snug font-display">
                          {lesson.title}
                        </h3>
                        <span className="text-[11px] font-bold text-amber-400 shrink-0 font-mono-tabular">
                          {isLocked ? '🔒 50 ₽' : isCompleted ? '✅' : lesson.badgeText}
                        </span>
                      </div>

                      {/* Full 2-3 line description without truncation */}
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {lesson.subtitle}
                      </p>

                      {/* Progress bar and wins / targetWins */}
                      <div className="pt-1 flex items-center gap-2.5">
                        <div className="flex-1 h-2 rounded-full bg-[#0B1120] overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-200 font-mono-tabular shrink-0">
                          {wins} / {lesson.targetWins}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: VOIVODE CHAMBER (🏛️ Палата Воеводы) */}
        {mainTab === 'chamber' && (
          <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3">
            {/* Warrior Passport Card */}
            <div className="p-3.5 rounded-2xl bg-[#131C2E] border-[1.5px] border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B1120] border-[1.5px] border-amber-500/70 flex items-center justify-center text-2xl">
                    {profile.badge}
                  </div>
                  <div>
                    <div className="text-xs text-amber-400 font-bold">
                      {getPlayerRankTitle(totalWins)}
                    </div>
                    <h2 className="text-base font-extrabold text-white font-display">
                      {profile.name}
                    </h2>
                    <div className="text-[11px] text-slate-400">
                      {profile.category} • Побед: <span className="font-mono-tabular font-bold text-slate-200">{totalWins}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditName(profile.name);
                    setEditBadge(profile.badge);
                    setEditingPassport(!editingPassport);
                  }}
                  aria-label="Изменить имя и значок ратника"
                  className="px-3 py-2 rounded-xl bg-[#0B1120] hover:bg-slate-800 text-xs font-bold text-amber-300 border border-slate-700"
                >
                  ✏️ Имя
                </button>
              </div>

              {editingPassport && (
                <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800 space-y-2.5">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Новое имя ратника"
                    maxLength={24}
                    className="w-full px-3 py-2 rounded-xl bg-[#131C2E] border border-slate-700 text-white text-[16px]"
                  />
                  <div className="grid grid-cols-8 gap-1">
                    {AVAILABLE_BADGES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setEditBadge(b)}
                        className={`h-9 rounded-lg text-base flex items-center justify-center border ${
                          editBadge === b
                            ? 'bg-amber-500/20 border-amber-400'
                            : 'bg-[#131C2E] border-slate-800'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated: PlayerProfile = {
                        ...profile,
                        name: editName.trim() || profile.name,
                        badge: editBadge,
                      };
                      setProfile(updated);
                      TelemetryService.saveProfile(updated);
                      TelemetryService.sendEvent('profile_updated', updated);
                      setEditingPassport(false);
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs border-b-4 border-emerald-800"
                  >
                    Сохранить паспорт
                  </button>
                </div>
              )}
            </div>

            {/* Subscription Status & Printable Diploma Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubscriptionModal(true)}
                className="p-3 rounded-2xl bg-[#131C2E] border-[1.5px] border-slate-700 border-b-4 border-b-slate-950 active:border-b-0 active:translate-y-[3px] text-left space-y-1"
              >
                <div className="text-xs font-bold text-amber-400">⚡ Подписка 50 ₽</div>
                <div className="text-xs text-white font-bold">
                  {subActive
                    ? `Активна (${getSubscriptionRemainingDays(profile)} дн.)`
                    : 'Открыть 30 дней'}
                </div>
                <div className="text-[10px] text-slate-400">Робокасса / СБП</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (completedLessonsCount < 8) {
                    soundEngine.playWarning();
                    return;
                  }
                  soundEngine.speak(
                    'Поздравляю с получением Именной Грамоты шахматной дружины!',
                    'voice_diploma'
                  );
                  setShowDiplomaModal(true);
                }}
                className={`p-3 rounded-2xl border-[1.5px] border-b-4 active:border-b-0 active:translate-y-[3px] text-left space-y-1 ${
                  completedLessonsCount >= 8
                    ? 'bg-[#131C2E] border-amber-500/80 border-b-amber-800'
                    : 'bg-[#131C2E]/70 border-slate-800 border-b-slate-950 opacity-85'
                }`}
              >
                <div className="text-xs font-bold text-amber-400">
                  {completedLessonsCount >= 8 ? '📜 Именная Грамота' : '🔒 Именная Грамота'}
                </div>
                <div className="text-xs text-white font-bold">
                  {completedLessonsCount >= 8 ? 'Открыть и распечатать' : `Ещё ${8 - completedLessonsCount} ур. до диплома`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono-tabular">
                  Уроков: {completedLessonsCount} / 8
                </div>
              </button>
            </div>

            {/* Matrix 30/30 */}
            <div className="p-3.5 rounded-2xl bg-[#131C2E] border-[1.5px] border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-display">
                  🎯 Матрица автоматизма 30/30
                </h3>
                <span className="text-[11px] text-slate-400 font-mono-tabular">11 рубежей</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CURRICULUM_LESSONS.filter((l) => l.section === 'mastery').map((m) => {
                  const w = profile.lessonWins[m.id] || 0;
                  const done = w >= 30;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleOpenLesson(m)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        done
                          ? 'bg-emerald-950/60 border-emerald-500/80'
                          : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 truncate">{m.title}</div>
                      <div className="text-xs font-extrabold text-white font-mono-tabular mt-0.5">
                        {w} / 30
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Awards Grid (QA-03: fixed 'practice_2_10' key) */}
            <div className="p-3.5 rounded-2xl bg-[#131C2E] border-[1.5px] border-slate-700 space-y-2.5">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-display">
                🏅 Боевые награды дружины
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-2.5 rounded-xl border ${
                    completedLessonsCount >= 1
                      ? 'bg-[#0B1120] border-amber-500/60 text-white'
                      : 'bg-[#0B1120]/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="font-bold">🍎 Первый шаг</div>
                  <div className="text-[11px] text-slate-400">Пройти 1-й урок теории</div>
                </div>
                <div
                  className={`p-2.5 rounded-xl border ${
                    completedLessonsCount >= 8
                      ? 'bg-[#0B1120] border-amber-500/60 text-white'
                      : 'bg-[#0B1120]/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="font-bold">📜 Знаток Устава</div>
                  <div className="text-[11px] text-slate-400">Пройти 8 уроков курса</div>
                </div>
                <div
                  className={`p-2.5 rounded-xl border ${
                    (profile.lessonWins['practice_2_10'] || 0) >= 1 ||
                    (profile.lessonWins['mastery_3_10'] || 0) >= 1
                      ? 'bg-[#0B1120] border-amber-500/60 text-white'
                      : 'bg-[#0B1120]/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="font-bold">🏰 Гордость Вятки</div>
                  <div className="text-[11px] text-slate-400">Кировские партии 1974 и 1981</div>
                </div>
                <div
                  className={`p-2.5 rounded-xl border ${
                    totalWins >= 30
                      ? 'bg-[#0B1120] border-amber-500/60 text-white'
                      : 'bg-[#0B1120]/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="font-bold">👑 Мастер 30/30</div>
                  <div className="text-[11px] text-slate-400">Одержать 30 боевых побед</div>
                </div>
              </div>
            </div>

            {/* Legal Footer Links */}
            <div className="pt-1 pb-2 flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setLegalModalTab('requisites')}
                className="underline hover:text-amber-300"
              >
                Реквизиты ИП
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setLegalModalTab('oferta')}
                className="underline hover:text-amber-300"
              >
                Публичная оферта
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setLegalModalTab('privacy')}
                className="underline hover:text-amber-300"
              >
                Политика 152-ФЗ
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SQUAD LEAGUE TOP-10 (🏆 Лига дружины) */}
        {mainTab === 'league' && (
          <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3">
            {/* Motivational Rank Banner */}
            <div className="p-3.5 rounded-2xl bg-[#131C2E] border-[1.5px] border-amber-500/80 text-xs text-slate-100 leading-relaxed shadow">
              {leagueData.nextRival ? (
                <div>
                  🏆 <strong>Твоё место: #{leagueData.userPlace}</strong> • До обгона соперника{' '}
                  <strong className="text-amber-400">{leagueData.nextRival.name}</strong> осталось{' '}
                  <strong className="font-mono-tabular text-emerald-400">
                    {leagueData.winsToOvertake}
                  </strong>{' '}
                  побед!
                </div>
              ) : (
                <div>
                  👑 <strong>Твоё место: #1</strong> • Ты возглавляешь Лигу Дружины Линтеха №28!
                </div>
              )}
            </div>

            {/* Top-10 Table */}
            <div className="rounded-2xl bg-[#131C2E] border-[1.5px] border-slate-700 overflow-hidden">
              <div className="px-3.5 py-2.5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-white uppercase tracking-wider font-display">
                  Топ-10 Лиги Дружины
                </h2>
                <span className="text-[11px] text-amber-400 font-bold">Победы</span>
              </div>

              <div className="divide-y divide-slate-800/90">
                {leagueData.top10.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`px-3.5 py-2.5 flex items-center justify-between gap-2 ${
                      entry.isCurrentUser ? 'bg-amber-500/15' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 text-xs font-extrabold font-mono-tabular ${
                          idx === 0
                            ? 'text-amber-400'
                            : idx === 1
                            ? 'text-slate-300'
                            : idx === 2
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-base shrink-0">{entry.badge}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {entry.name} {entry.isCurrentUser && '(Ты)'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {entry.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-extrabold text-amber-400 font-mono-tabular shrink-0">
                      {entry.totalWins} побед
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar (shrink-0) */}
      <nav
        aria-label="Основная навигация"
        className="h-16 px-2.5 bg-[#0F172A] border-t border-slate-800 grid grid-cols-3 gap-1.5 items-center shrink-0 pb-[env(safe-area-inset-bottom)]"
      >
        <button
          type="button"
          onClick={() => setMainTab('lessons')}
          className={`h-11 px-2 rounded-xl font-extrabold text-[11px] whitespace-nowrap flex items-center justify-center gap-1 border-[1.5px] transition-all ${
            mainTab === 'lessons'
              ? 'bg-amber-500 text-slate-950 border-amber-400 border-b-4 border-b-amber-700'
              : 'bg-[#131C2E] text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          <span>♟️</span>
          <span>Уроки</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('chamber')}
          className={`h-11 px-2 rounded-xl font-extrabold text-[11px] whitespace-nowrap flex items-center justify-center gap-1 border-[1.5px] transition-all ${
            mainTab === 'chamber'
              ? 'bg-amber-500 text-slate-950 border-amber-400 border-b-4 border-b-amber-700'
              : 'bg-[#131C2E] text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          <span>🏛️</span>
          <span>Палата Воеводы</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('league')}
          className={`h-11 px-2 rounded-xl font-extrabold text-[11px] whitespace-nowrap flex items-center justify-center gap-1 border-[1.5px] transition-all ${
            mainTab === 'league'
              ? 'bg-amber-500 text-slate-950 border-amber-400 border-b-4 border-b-amber-700'
              : 'bg-[#131C2E] text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          <span>🏆</span>
          <span>Лига дружины</span>
        </button>
      </nav>

      {/* =====================================================================
          MODALS
      ===================================================================== */}
      {showQRModal && (
        <QRModal
          onClose={() => setShowQRModal(false)}
          canInstallPWA={!!deferredPWA}
          onTriggerInstallPWA={async () => {
            if (deferredPWA) {
              await deferredPWA.prompt();
              setDeferredPWA(null);
            }
          }}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          profile={profile}
          onClose={() => setShowSubscriptionModal(false)}
          onActivateSubscription={handleActivateSubscription}
          onOpenLegal={(tab) => {
            setShowSubscriptionModal(false);
            setLegalModalTab(tab || 'requisites');
          }}
        />
      )}

      {legalModalTab && (
        <LegalDocumentsModal
          initialTab={legalModalTab}
          onClose={() => setLegalModalTab(null)}
        />
      )}

      {showDiplomaModal && (
        <DiplomaModal
          profile={profile}
          completedLessonsCount={completedLessonsCount}
          onClose={() => setShowDiplomaModal(false)}
        />
      )}

      {showCreatorModal && (
        <CreatorDashboardModal
          profile={profile}
          onClose={() => setShowCreatorModal(false)}
          onUpdateProfileSubscription={handleCreatorSubscriptionTest}
        />
      )}

      {/* Settings Modal (⚙️) */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Настройки приложения"
        >
          <div className="w-full max-w-[420px] max-h-[92dvh] bg-[#131C2E] border-[1.5px] border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-extrabold text-white font-display">
                ⚙️ Настройки • Шахматы от Кирилла
              </h2>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Закрыть настройки"
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold border border-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scroll space-y-3.5 text-xs text-slate-200">
              {/* Sound & Voice Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !soundOn;
                    setSoundOn(next);
                    soundEngine.setSoundEnabled(next);
                  }}
                  className={`min-h-[44px] py-2.5 px-3 rounded-xl font-bold border-[1.5px] ${
                    soundOn
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                      : 'bg-[#0B1120] border-slate-800 text-slate-400'
                  }`}
                >
                  {soundOn ? '🔊 Звуки фигур: ВКЛ' : '🔇 Звуки фигур: ВЫКЛ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceOn;
                    setVoiceOn(next);
                    soundEngine.setVoiceEnabled(next);
                  }}
                  className={`min-h-[44px] py-2.5 px-3 rounded-xl font-bold border-[1.5px] ${
                    voiceOn
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                      : 'bg-[#0B1120] border-slate-800 text-slate-400'
                  }`}
                >
                  {voiceOn ? '🎙️ Голос Кирилла: ВКЛ' : '🔕 Голос Кирилла: ВЫКЛ'}
                </button>
              </div>

              {/* 2.5D Board Tilt & Wood Theme */}
              <div className="bg-[#0B1120] border-[1.5px] border-slate-800 rounded-xl p-3 space-y-2">
                <div className="font-bold text-slate-300">Вид турнирной доски 2.5D:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraAngle('45')}
                    className={`min-h-[40px] py-2 rounded-lg font-bold border ${
                      cameraAngle === '45'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-[#131C2E] text-slate-300 border-slate-700'
                    }`}
                  >
                    Наклон 45° (2.5D)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraAngle('65')}
                    className={`min-h-[40px] py-2 rounded-lg font-bold border ${
                      cameraAngle === '65'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-[#131C2E] text-slate-300 border-slate-700'
                    }`}
                  >
                    Наклон 65° (Прямой)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoardWoodTheme('green')}
                    className={`min-h-[40px] py-2 rounded-lg font-bold border ${
                      boardWoodTheme === 'green'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-[#131C2E] text-slate-300 border-slate-700'
                    }`}
                  >
                    Клетки: Изумруд
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoardWoodTheme('walnut')}
                    className={`min-h-[40px] py-2 rounded-lg font-bold border ${
                      boardWoodTheme === 'walnut'
                        ? 'bg-amber-700 text-white border-amber-500'
                        : 'bg-[#131C2E] text-slate-300 border-slate-700'
                    }`}
                  >
                    Клетки: Орех
                  </button>
                </div>
              </div>

              {/* Legal Docs Button */}
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setLegalModalTab('requisites');
                }}
                className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-[#0B1120] hover:bg-slate-900 text-slate-200 font-bold border-[1.5px] border-slate-800 text-left flex items-center justify-between"
              >
                <span>🏛️ Реквизиты ИП Кошурниковой Е. С. и Оферта</span>
                <span>→</span>
              </button>

              {/* Creator Dashboard PIN (BE-03: no visible PIN hint in placeholder or error) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pinInput.trim() === '2828') {
                    setPinInput('');
                    setPinError('');
                    setShowSettingsModal(false);
                    setShowCreatorModal(true);
                  } else {
                    setPinError('Неверный ПИН-код доступа.');
                  }
                }}
                className="bg-[#0B1120] border-[1.5px] border-slate-800 rounded-xl p-3 space-y-2"
              >
                <label htmlFor="creator-pin-input" className="block font-bold text-amber-400">
                  📊 Вход в «Кабинет Создателя» (ПИН-код):
                </label>
                <div className="flex gap-2">
                  <input
                    id="creator-pin-input"
                    type="password"
                    inputMode="numeric"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Введите ПИН-код"
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#131C2E] border border-slate-700 text-white text-[16px] font-mono-tabular"
                  />
                  <button
                    type="submit"
                    aria-label="Войти в Кабинет Создателя"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold border-b-4 border-amber-700 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
                  >
                    Войти
                  </button>
                </div>
                {pinError && <p className="text-rose-400 text-[11px]">{pinError}</p>}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
