import { CURRICULUM_LESSONS, getTargetMap } from './curriculumData';

export type AgeCategory = '1–4 класс' | '5–11 класс' | 'Взрослый новичок';

export interface PlayerProfile {
  id: string;
  name: string;
  category: AgeCategory;
  badge: string;
  createdAt: number;
  lessonWins: Record<string, number>;
  premiumUntilEpochMillis: number;
  expiredNoticeShownForEpoch?: number;
  lastLessonId?: string;
  usedReceiptIds?: string[];
}

export interface LeagueCompetitor {
  id: string;
  name: string;
  category: string;
  badge: string;
  totalWins: number;
  isCurrentUser?: boolean;
}

export interface CreatorConfig {
  googleSheetWebhookUrl: string;
  robokassaPaymentUrl: string;
  telemetryEventsSent: number;
  lastSyncStatus: string;
}

export interface GlobalPlayerRow {
  id: string;
  name: string;
  grade: string;
  rank: string;
  victories: number;
  lessons: number;
  isPremiumActive: boolean;
  premiumDaysLeft: number;
  lastSeenFormatted: string;
  isLocalCurrent?: boolean;
}

export interface GlobalAnalyticsSummary {
  totalAccounts: number;
  activeSubscriptionsCount: number;
  totalVictoriesAll: number;
  totalMastered30All: number;
  players: GlobalPlayerRow[];
  updatedAtFormatted: string;
  fromCache?: boolean;
}

const STORAGE_PROFILE_KEY = 'kirill_chess_profile_v1';
const STORAGE_CONFIG_KEY = 'kirill_chess_creator_config_v1';
const STORAGE_REMOTE_PLAYERS_KEY = 'kirill_chess_remote_players_v1';
export const STORAGE_PENDING_PAYMENT_TS_KEY = 'kirill_pending_payment_ts';
const STORAGE_USED_RECEIPTS_KEY = 'kirill_used_receipt_ids_v1';
const STORAGE_GLOBAL_ANALYTICS_CACHE_KEY = 'kirill_global_analytics_cache_v1';

export const PENDING_PAYMENT_MAX_AGE_MS = 60 * 60 * 1000; // 60 minutes

export const DEFAULT_GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxrmalRa5tnBWWyAJxh6xBxb0OniShPMke2DjgbELkKpXp_fuFCzcHju4DI6JQY4NBk/exec';
export const DEFAULT_GOOGLE_SHEET_WEBHOOK_URL = DEFAULT_GOOGLE_SCRIPT_URL;

export const DEFAULT_ROBOKASSA_URL =
  'https://auth.robokassa.ru/merchant/Invoice/A1pM0mgJf0uQ3K_4d3pQhA';

const LEGACY_ROBOKASSA_SUBSTRINGS = ['XNDiboy', '6-Dqt0yQRka-LJR6f0ZFkQ'];

export function normalizeRobokassaConfigUrl(rawUrl?: string | null): {
  url: string;
  migrated: boolean;
} {
  const trimmed = (rawUrl || '').trim();
  if (
    !trimmed ||
    LEGACY_ROBOKASSA_SUBSTRINGS.some((legacy) => trimmed.includes(legacy))
  ) {
    return { url: DEFAULT_ROBOKASSA_URL, migrated: trimmed !== DEFAULT_ROBOKASSA_URL };
  }
  return { url: trimmed, migrated: false };
}

export const BUILTIN_SCHOOL_COMPETITORS: LeagueCompetitor[] = [
  { id: 'lintech_1', name: 'Кирилл • 4 класс', category: 'Линтех №28 • Создатель', badge: '👑', totalWins: 180 },
  { id: 'lintech_2', name: 'Артём • 4 класс', category: 'Линтех №28', badge: '⚔️', totalWins: 142 },
  { id: 'lintech_3', name: 'София • 5 класс', category: 'Линтех №28', badge: '🛡️', totalWins: 118 },
  { id: 'lintech_4', name: 'Максим • 4 класс', category: 'Линтех №28', badge: '🦅', totalWins: 95 },
  { id: 'lintech_5', name: 'Дарья • 3 класс', category: 'Линтех №28', badge: '🌟', totalWins: 74 },
  { id: 'lintech_6', name: 'Илья • 6 класс', category: 'Линтех №28', badge: '🏰', totalWins: 56 },
  { id: 'lintech_7', name: 'Егор • 4 класс', category: 'Линтех №28', badge: '🐎', totalWins: 38 },
  { id: 'lintech_8', name: 'Алиса • 2 класс', category: 'Линтех №28', badge: '🍎', totalWins: 21 },
  { id: 'lintech_9', name: 'Матвей • 1 класс', category: 'Линтех №28', badge: '♟️', totalWins: 9 },
];

export const AVAILABLE_BADGES = ['🛡️', '⚔️', '👑', '🦅', '🏰', '🐎', '🌟', '🔥'];

export function calculateTotalWins(lessonWins: Record<string, number>): number {
  return Object.values(lessonWins).reduce((sum, count) => sum + (Number(count) || 0), 0);
}

export function getCompletedLessonsCount(
  lessonWins: Record<string, number>,
  targetMap: Record<string, number>
): number {
  let completed = 0;
  for (const [lessonId, target] of Object.entries(targetMap)) {
    if ((lessonWins[lessonId] || 0) >= target) {
      completed++;
    }
  }
  return completed;
}

export function getMastered30Count(lessonWins: Record<string, number>): number {
  let mastered = 0;
  for (const lesson of CURRICULUM_LESSONS) {
    if (lesson.section === 'mastery' && (lessonWins[lesson.id] || 0) >= 30) {
      mastered++;
    }
  }
  return mastered;
}

export function isSubscriptionActive(profile: PlayerProfile | null, nowMillis: number = Date.now()): boolean {
  if (!profile) return false;
  return profile.premiumUntilEpochMillis > nowMillis;
}

export function getSubscriptionRemainingDays(profile: PlayerProfile | null, nowMillis: number = Date.now()): number {
  if (!profile || profile.premiumUntilEpochMillis <= nowMillis) return 0;
  return Math.ceil((profile.premiumUntilEpochMillis - nowMillis) / (1000 * 60 * 60 * 24));
}

export function getPlayerRankTitle(totalWins: number): string {
  if (totalWins >= 180) return 'Верховный Воевода';
  if (totalWins >= 100) return 'Старший Сотник';
  if (totalWins >= 50) return 'Конный Витязь';
  if (totalWins >= 20) return 'Десятник Дружины';
  if (totalWins >= 8) return 'Старший Ратник';
  return 'Младший Ратник';
}

/**
 * Checks whether URL query string represents a valid Robokassa Success URL redirect
 * (?robokassa_paid=success OR presence of OutSum + InvId / SignatureValue).
 */
export function isRobokassaReturnUrl(search: string): {
  matched: boolean;
  outSum?: string;
  invId?: string;
} {
  if (!search) return { matched: false };
  const normalized = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  const paidFlag = (params.get('robokassa_paid') || '').trim().toLowerCase() === 'success';
  const outSum = params.get('OutSum') || params.get('out_summ') || undefined;
  const invId = params.get('InvId') || params.get('inv_id') || undefined;
  const sig = params.get('SignatureValue') || params.get('crc') || undefined;

  if (paidFlag || Boolean(outSum && (invId || sig))) {
    return { matched: true, outSum, invId };
  }
  return { matched: false };
}

/**
 * Pure validation of a 4-12 digit bank/Robokassa receipt or operation code
 * with anti-abuse checks (must follow a payment click within 60 min, non-repeating digits, unused).
 */
export function validateRobokassaReceiptCode(
  rawCode: string,
  pendingPaymentTs: number | null,
  usedReceiptIds: string[],
  nowMillis: number = Date.now()
): { ok: boolean; normalizedCode?: string; error?: string } {
  if (
    pendingPaymentTs === null ||
    !Number.isFinite(pendingPaymentTs) ||
    nowMillis - pendingPaymentTs < 0 ||
    nowMillis - pendingPaymentTs > PENDING_PAYMENT_MAX_AGE_MS
  ) {
    return {
      ok: false,
      error:
        'Сначала нажми кнопку перехода к оплате Робокассы / СБП выше (сессия оплаты действует 60 минут).',
    };
  }

  const clean = rawCode.replace(/[\s-]+/g, '').trim();
  if (!/^\d{4,12}$/.test(clean)) {
    return {
      ok: false,
      error: 'Введи от 4 до 12 цифр номера чека или операции из банка / Робокассы.',
    };
  }

  if (/^(\d)\1+$/.test(clean)) {
    return {
      ok: false,
      error: 'Некорректный номер операции (одинаковые цифры вроде 0000 или 1111 не допускаются).',
    };
  }

  if (usedReceiptIds.includes(clean)) {
    return {
      ok: false,
      error: 'Этот номер чека/операции уже был использован ранее.',
    };
  }

  return { ok: true, normalizedCode: clean };
}

export function formatLastSeenRu(rawLastSeen: string): string {
  if (!rawLastSeen) return 'недавно';
  const parsedMs = Date.parse(rawLastSeen);
  if (!Number.isNaN(parsedMs)) {
    try {
      return new Date(parsedMs).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return rawLastSeen.slice(0, 16);
    }
  }
  return rawLastSeen.slice(0, 18);
}

/**
 * Parses Google Apps Script GET response into GlobalAnalyticsSummary and merges local profile state.
 */
export function parseGlobalAnalyticsResponse(
  data: unknown,
  localProfile?: PlayerProfile | null,
  nowMillis: number = Date.now()
): GlobalAnalyticsSummary {
  const obj = data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};

  const rawList: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(obj.recentUsers)
    ? obj.recentUsers
    : Array.isArray(obj.players)
    ? obj.players
    : Array.isArray(obj.rows)
    ? obj.rows
    : Array.isArray(obj.data)
    ? obj.data
    : [];

  const players: GlobalPlayerRow[] = [];
  rawList.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const rec = item as Record<string, unknown>;
    const name = String(rec.name || rec.playerName || 'Ратник').trim() || 'Ратник';
    const victories =
      Number(rec.victories ?? rec.totalVictories ?? rec.totalWins ?? rec.wins ?? 0) || 0;
    const lessons = Number(rec.lessons ?? rec.completedLessons ?? 0) || 0;
    const grade = String(rec.grade || rec.category || '').trim() || 'Участник';
    const rank = String(rec.rank || '').trim() || getPlayerRankTitle(victories);
    const premiumDaysLeft = Number(rec.premiumDaysLeft ?? 0) || 0;
    const isPremiumActive = Boolean(
      rec.isPremiumActive ??
        rec.premiumActive ??
        (premiumDaysLeft > 0 ||
          (typeof rec.subscriptionStatus === 'string' && rec.subscriptionStatus.includes('30')))
    );
    const rawLastSeen = String(rec.lastSeen || rec.timestamp || rec.updatedAt || '').trim();

    players.push({
      id: String(rec.profileId || rec.id || rec.playerId || `row_${idx}_${name}`),
      name,
      grade,
      rank,
      victories,
      lessons,
      isPremiumActive,
      premiumDaysLeft: isPremiumActive ? Math.max(1, premiumDaysLeft || 30) : 0,
      lastSeenFormatted: formatLastSeenRu(rawLastSeen),
    });
  });

  let localMastered30 = 0;
  if (localProfile) {
    const localWins = calculateTotalWins(localProfile.lessonWins);
    const localLessons = getCompletedLessonsCount(localProfile.lessonWins, getTargetMap());
    localMastered30 = getMastered30Count(localProfile.lessonWins);
    const localSubActive = isSubscriptionActive(localProfile, nowMillis);
    const localDaysLeft = getSubscriptionRemainingDays(localProfile, nowMillis);
    const localRank = getPlayerRankTitle(localWins);

    const existingIdx = players.findIndex(
      (p) => p.id === localProfile.id || p.name === localProfile.name
    );

    const localRow: GlobalPlayerRow = {
      id: localProfile.id,
      name: localProfile.name,
      grade: localProfile.category,
      rank: localRank,
      victories: existingIdx >= 0 ? Math.max(players[existingIdx].victories, localWins) : localWins,
      lessons: existingIdx >= 0 ? Math.max(players[existingIdx].lessons, localLessons) : localLessons,
      isPremiumActive: localSubActive || (existingIdx >= 0 && players[existingIdx].isPremiumActive),
      premiumDaysLeft: localSubActive
        ? localDaysLeft
        : existingIdx >= 0
        ? players[existingIdx].premiumDaysLeft
        : 0,
      lastSeenFormatted: 'сейчас в сети',
      isLocalCurrent: true,
    };

    if (existingIdx >= 0) {
      players[existingIdx] = localRow;
    } else {
      players.unshift(localRow);
    }
  }

  const activeFromRows = players.filter((p) => p.isPremiumActive).length;
  const victoriesFromRows = players.reduce((sum, p) => sum + p.victories, 0);

  const totalAccounts = Math.max(Number(obj.totalAccounts ?? 0) || 0, players.length);
  const activeSubscriptionsCount = Math.max(
    Number(obj.activeSubscriptionsCount ?? obj.totalPremiumAll ?? obj.activePremium ?? 0) || 0,
    activeFromRows
  );
  const totalVictoriesAll = Math.max(
    Number(obj.totalVictoriesAll ?? 0) || 0,
    victoriesFromRows
  );
  const totalMastered30All = Math.max(
    Number(obj.totalMastered30All ?? 0) || 0,
    localMastered30
  );

  return {
    totalAccounts,
    activeSubscriptionsCount,
    totalVictoriesAll,
    totalMastered30All,
    players,
    updatedAtFormatted: new Date(nowMillis).toLocaleTimeString('ru-RU'),
  };
}

export class TelemetryService {
  public static loadProfile(): PlayerProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PlayerProfile;
    } catch {
      return null;
    }
  }

  public static saveProfile(profile: PlayerProfile): void {
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  public static createProfile(name: string, category: AgeCategory, badge: string): PlayerProfile {
    const profile: PlayerProfile = {
      id: 'player_' + Math.random().toString(36).slice(2, 10),
      name: name.trim() || 'Ратник',
      category,
      badge: badge || '🛡️',
      createdAt: Date.now(),
      lessonWins: {},
      premiumUntilEpochMillis: 0,
      lastLessonId: 'theory_1_1',
      usedReceiptIds: [],
    };
    this.saveProfile(profile);
    this.sendEvent('profile_created', profile);
    return profile;
  }

  public static markPaymentStarted(nowMillis: number = Date.now()): void {
    try {
      localStorage.setItem(STORAGE_PENDING_PAYMENT_TS_KEY, String(nowMillis));
    } catch {
      // ignore
    }
  }

  public static getPendingPaymentTimestamp(): number | null {
    try {
      const raw = localStorage.getItem(STORAGE_PENDING_PAYMENT_TS_KEY);
      if (!raw) return null;
      const num = Number(raw);
      return Number.isFinite(num) ? num : null;
    } catch {
      return null;
    }
  }

  public static clearPendingPaymentTimestamp(): void {
    try {
      localStorage.removeItem(STORAGE_PENDING_PAYMENT_TS_KEY);
    } catch {
      // ignore
    }
  }

  public static hasRecentPendingPayment(nowMillis: number = Date.now()): boolean {
    const ts = this.getPendingPaymentTimestamp();
    return (
      ts !== null &&
      nowMillis - ts >= 0 &&
      nowMillis - ts <= PENDING_PAYMENT_MAX_AGE_MS
    );
  }

  public static getUsedReceiptIds(profile?: PlayerProfile | null): string[] {
    const set = new Set<string>(profile?.usedReceiptIds || []);
    try {
      const raw = localStorage.getItem(STORAGE_USED_RECEIPTS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (typeof item === 'string') set.add(item);
          }
        }
      }
    } catch {
      // ignore
    }
    return Array.from(set);
  }

  public static verifyAndConsumeReceiptCode(
    rawCode: string,
    profile?: PlayerProfile | null,
    nowMillis: number = Date.now()
  ): { ok: boolean; normalizedCode?: string; error?: string } {
    const pendingTs = this.getPendingPaymentTimestamp();
    const usedIds = this.getUsedReceiptIds(profile);
    const check = validateRobokassaReceiptCode(rawCode, pendingTs, usedIds, nowMillis);
    if (!check.ok || !check.normalizedCode) {
      return check;
    }

    const updatedUsed = [...usedIds, check.normalizedCode];
    try {
      localStorage.setItem(STORAGE_USED_RECEIPTS_KEY, JSON.stringify(updatedUsed));
      localStorage.removeItem(STORAGE_PENDING_PAYMENT_TS_KEY);
    } catch {
      // ignore
    }
    return check;
  }

  public static loadCreatorConfig(): CreatorConfig {
    try {
      const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CreatorConfig;
        let changed = false;
        if (!parsed.googleSheetWebhookUrl) {
          parsed.googleSheetWebhookUrl = DEFAULT_GOOGLE_SCRIPT_URL;
          changed = true;
        }
        const normalizedRobo = normalizeRobokassaConfigUrl(parsed.robokassaPaymentUrl);
        if (normalizedRobo.migrated || parsed.robokassaPaymentUrl !== normalizedRobo.url) {
          parsed.robokassaPaymentUrl = normalizedRobo.url;
          changed = true;
        }
        if (changed) {
          localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      googleSheetWebhookUrl: DEFAULT_GOOGLE_SCRIPT_URL,
      robokassaPaymentUrl: DEFAULT_ROBOKASSA_URL,
      telemetryEventsSent: 0,
      lastSyncStatus: 'Синхронизация с Google Таблицей активна',
    };
  }

  public static saveCreatorConfig(config: CreatorConfig): void {
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }

  public static getCachedGlobalAnalytics(localProfile?: PlayerProfile | null): GlobalAnalyticsSummary {
    try {
      const raw = localStorage.getItem(STORAGE_GLOBAL_ANALYTICS_CACHE_KEY);
      if (raw) {
        const parsedJson = JSON.parse(raw);
        const summary = parseGlobalAnalyticsResponse(parsedJson, localProfile);
        return { ...summary, fromCache: true };
      }
    } catch {
      // ignore
    }
    return {
      ...parseGlobalAnalyticsResponse({}, localProfile),
      fromCache: true,
    };
  }

  public static async fetchGlobalAnalytics(
    localProfile?: PlayerProfile | null
  ): Promise<GlobalAnalyticsSummary> {
    const config = this.loadCreatorConfig();
    const url = config.googleSheetWebhookUrl || DEFAULT_GOOGLE_SCRIPT_URL;
    if (!url) {
      return this.getCachedGlobalAnalytics(localProfile);
    }

    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!res.ok) {
        return this.getCachedGlobalAnalytics(localProfile);
      }
      const data = await res.json();
      try {
        localStorage.setItem(STORAGE_GLOBAL_ANALYTICS_CACHE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
      return parseGlobalAnalyticsResponse(data, localProfile);
    } catch {
      return this.getCachedGlobalAnalytics(localProfile);
    }
  }

  public static getRemoteCompetitors(): LeagueCompetitor[] {
    try {
      const raw = localStorage.getItem(STORAGE_REMOTE_PLAYERS_KEY);
      if (raw) return JSON.parse(raw) as LeagueCompetitor[];
    } catch {
      // ignore
    }
    return [];
  }

  public static async syncRemoteLeagueFromSheet(): Promise<LeagueCompetitor[]> {
    const config = this.loadCreatorConfig();
    const url = config.googleSheetWebhookUrl || DEFAULT_GOOGLE_SCRIPT_URL;
    if (!url) return this.getRemoteCompetitors();

    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!res.ok) return this.getRemoteCompetitors();
      const data = await res.json();
      try {
        localStorage.setItem(STORAGE_GLOBAL_ANALYTICS_CACHE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
      const rawList: unknown[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.recentUsers)
        ? data.recentUsers
        : Array.isArray(data?.players)
        ? data.players
        : Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const parsed: LeagueCompetitor[] = [];
      for (const item of rawList) {
        if (!item || typeof item !== 'object') continue;
        const rec = item as Record<string, unknown>;
        const name = String(rec.name || rec.playerName || '').trim();
        if (!name) continue;
        const wins =
          Number(rec.victories ?? rec.totalVictories ?? rec.totalWins ?? rec.wins ?? rec.score ?? 0) || 0;
        parsed.push({
          id: String(rec.profileId || rec.id || rec.playerId || `sheet_${name}`),
          name,
          category: String(rec.grade || rec.category || 'Линтех №28'),
          badge: String(rec.badge || '🛡️'),
          totalWins: wins,
        });
      }

      if (parsed.length > 0) {
        localStorage.setItem(STORAGE_REMOTE_PLAYERS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return this.getRemoteCompetitors();
    }
  }

  public static getLeagueTop10(profile: PlayerProfile): {
    top10: LeagueCompetitor[];
    userPlace: number;
    nextRival: LeagueCompetitor | null;
    winsToOvertake: number;
  } {
    const userWins = calculateTotalWins(profile.lessonWins);
    const currentUserEntry: LeagueCompetitor = {
      id: profile.id,
      name: profile.name,
      category: profile.category,
      badge: profile.badge,
      totalWins: userWins,
      isCurrentUser: true,
    };

    const remotes = this.getRemoteCompetitors().filter(
      (r) => r.id !== profile.id && r.name !== profile.name
    );
    const combined = [...BUILTIN_SCHOOL_COMPETITORS, ...remotes, currentUserEntry];

    combined.sort((a, b) => {
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return a.isCurrentUser ? -1 : 1;
    });

    const userIdx = combined.findIndex((c) => c.isCurrentUser);
    const userPlace = userIdx + 1;
    const nextRival = userIdx > 0 ? combined[userIdx - 1] : null;
    const winsToOvertake = nextRival ? Math.max(1, nextRival.totalWins - userWins + 1) : 0;

    const top10 = combined.slice(0, 10);
    return { top10, userPlace, nextRival, winsToOvertake };
  }

  public static async sendEvent(
    eventType: string,
    profile: PlayerProfile,
    extra?: Record<string, unknown>
  ): Promise<void> {
    const config = this.loadCreatorConfig();
    const webhookUrl = config.googleSheetWebhookUrl || DEFAULT_GOOGLE_SCRIPT_URL;
    if (!webhookUrl) return;

    const totalWins = calculateTotalWins(profile.lessonWins);
    const completedLessons = getCompletedLessonsCount(profile.lessonWins, getTargetMap());
    const mastered30 = getMastered30Count(profile.lessonWins);
    const rank = getPlayerRankTitle(totalWins);
    const premiumActive = isSubscriptionActive(profile);
    const premiumDaysLeft = getSubscriptionRemainingDays(profile);
    const deviceModel =
      typeof navigator !== 'undefined' && navigator.userAgent
        ? navigator.userAgent.slice(0, 60)
        : 'Web Client';

    const payload = {
      action: 'upsert',
      timestamp: new Date().toISOString(),
      domain: 'kirill-chess-linteh.ru',
      event: eventType,
      eventType,
      profileId: profile.id,
      id: profile.id,
      playerId: profile.id,
      name: profile.name,
      playerName: profile.name,
      grade: profile.category,
      category: profile.category,
      rank,
      badge: profile.badge,
      totalVictories: totalWins,
      totalWins,
      wins: totalWins,
      completedLessons,
      mastered30,
      accuracy: 95,
      streakDays: 1,
      deviceModel,
      isPremiumActive: premiumActive,
      premiumActive,
      premiumDaysLeft,
      premiumUntilEpochMillis: profile.premiumUntilEpochMillis,
      lessonWins: profile.lessonWins,
      ...extra,
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      config.telemetryEventsSent += 1;
      config.lastSyncStatus = `Отправлено в Google Таблицу: ${new Date().toLocaleTimeString('ru-RU')}`;
      this.saveCreatorConfig(config);
    } catch {
      config.lastSyncStatus = 'Ошибка сети при синхронизации с таблицей';
      this.saveCreatorConfig(config);
    }
  }
}
