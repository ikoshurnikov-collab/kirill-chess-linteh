import React, { useEffect, useState } from 'react';
import { getTargetMap } from './curriculumData';
import {
  CreatorConfig,
  DEFAULT_GOOGLE_SCRIPT_URL,
  DEFAULT_ROBOKASSA_URL,
  GlobalAnalyticsSummary,
  PlayerProfile,
  TelemetryService,
  calculateTotalWins,
  getCompletedLessonsCount,
  getSubscriptionRemainingDays,
  isSubscriptionActive,
} from './telemetryAndStorage';

interface CreatorDashboardModalProps {
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfileSubscription: (newPremiumUntilMillis: number, triggerExpiredBanner?: boolean) => void;
}

/**
 * Creator Dashboard Modal (PIN 2828)
 * - Global analytics summary across all players from Google Sheets (4 global metric cards)
 * - Scrollable table of all players from Google Sheets with subscription status
 * - Google Sheet Webhook URL and Robokassa Invoice URL configuration
 * - 3 Subscription Lifecycle Test Buttons
 */
export const CreatorDashboardModal: React.FC<CreatorDashboardModalProps> = ({
  profile,
  onClose,
  onUpdateProfileSubscription,
}) => {
  const [config, setConfig] = useState<CreatorConfig>(() => TelemetryService.loadCreatorConfig());
  const [savedNotice, setSavedNotice] = useState('');
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalyticsSummary>(() =>
    TelemetryService.getCachedGlobalAnalytics(profile)
  );

  const totalWins = calculateTotalWins(profile.lessonWins);
  const completedLessons = getCompletedLessonsCount(profile.lessonWins, getTargetMap());

  useEffect(() => {
    let active = true;
    setGlobalAnalytics(TelemetryService.getCachedGlobalAnalytics(profile));
    setLoadingGlobal(true);
    TelemetryService.fetchGlobalAnalytics(profile)
      .then((fresh) => {
        if (active) {
          setGlobalAnalytics(fresh);
          setLoadingGlobal(false);
        }
      })
      .catch(() => {
        if (active) setLoadingGlobal(false);
      });
    return () => {
      active = false;
    };
  }, [profile]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    TelemetryService.saveCreatorConfig(config);
    setSavedNotice('Настройки телеметрии и Робокассы сохранены!');
    setTimeout(() => setSavedNotice(''), 2500);
  };

  const handleTestAndRefresh = async () => {
    setLoadingGlobal(true);
    await TelemetryService.sendEvent('creator_test_ping', profile);
    const fresh = await TelemetryService.fetchGlobalAnalytics(profile);
    setGlobalAnalytics(fresh);
    setConfig(TelemetryService.loadCreatorConfig());
    setLoadingGlobal(false);
    setSavedNotice('Сводка игроков успешно обновлена с Google Таблицы!');
    setTimeout(() => setSavedNotice(''), 2800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Кабинет Создателя"
    >
      <div className="w-full max-w-[440px] max-h-[92dvh] bg-[#131C2E] border-[1.5px] border-amber-500/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <div>
              <h2 className="text-sm font-extrabold text-white font-display">
                Кабинет Создателя
              </h2>
              <p className="text-[11px] text-amber-400">
                Кирилл • Линтех №28 г. Кирова • kirill-chess-linteh.ru
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть Кабинет Создателя"
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold border border-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scroll space-y-4 text-xs text-slate-200">
          {/* Global Analytics Summary + Players Table */}
          <div className="bg-[#0B1120] border-[1.5px] border-slate-800 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                Сводка глобальной аналитики
              </div>
              <span className="text-[10px] text-slate-400 font-mono-tabular">
                {loadingGlobal
                  ? 'Обновление...'
                  : globalAnalytics.fromCache
                  ? `Кэш • ${globalAnalytics.updatedAtFormatted}`
                  : `Онлайн • ${globalAnalytics.updatedAtFormatted}`}
              </span>
            </div>

            {/* 4 Global Metric Cards */}
            <div className="grid grid-cols-2 gap-2" data-testid="creator-global-metrics">
              <div className="p-2.5 rounded-lg bg-[#131C2E] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Всего аккаунтов в таблице</div>
                <div className="text-white font-extrabold text-base font-mono-tabular">
                  {globalAnalytics.totalAccounts}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#131C2E] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Активных подписок 50 ₽</div>
                <div className="text-emerald-400 font-extrabold text-base font-mono-tabular">
                  {globalAnalytics.activeSubscriptionsCount}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#131C2E] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Всего побед всех игроков</div>
                <div className="text-amber-400 font-extrabold text-base font-mono-tabular">
                  {globalAnalytics.totalVictoriesAll}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#131C2E] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Закрыто рубежей 30/30</div>
                <div className="text-sky-400 font-extrabold text-base font-mono-tabular">
                  {globalAnalytics.totalMastered30All}
                </div>
              </div>
            </div>

            {/* Compact Current Device Profile Strip */}
            <div className="px-2.5 py-2 rounded-lg bg-[#131C2E]/80 border border-slate-800 flex items-center justify-between gap-2 text-[11px]">
              <div className="truncate">
                <span className="text-slate-400">Это устройство:</span>{' '}
                <strong className="text-white">
                  {profile.badge} {profile.name}
                </strong>{' '}
                <span className="text-slate-400 font-mono-tabular">
                  ({totalWins} побед • {completedLessons}/29 ур.)
                </span>
              </div>
              <div className="shrink-0">
                {isSubscriptionActive(profile) ? (
                  <span className="text-emerald-400 font-bold font-mono-tabular">
                    👑 {getSubscriptionRemainingDays(profile)} дн.
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold">🔒 Замок</span>
                )}
              </div>
            </div>

            {/* Scrollable Players Table from Google Sheets */}
            <div className="space-y-1.5">
              <div className="text-slate-200 font-bold text-[11px] flex items-center justify-between">
                <span>📋 Список игроков из Google Таблицы</span>
                <span className="text-[10px] text-slate-400 font-mono-tabular">
                  Показано: {globalAnalytics.players.length}
                </span>
              </div>
              <div
                className="max-h-48 overflow-y-auto custom-scroll rounded-lg border border-slate-800 bg-[#131C2E]"
                data-testid="creator-players-table"
              >
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-[#0F172A] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-2 font-semibold">Игрок / Звание</th>
                      <th className="py-1.5 px-1.5 font-semibold text-right">Побед</th>
                      <th className="py-1.5 px-1.5 font-semibold text-right">Ур.</th>
                      <th className="py-1.5 px-2 font-semibold text-right">Статус / Активн.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {globalAnalytics.players.map((p) => (
                      <tr
                        key={p.id}
                        className={p.isLocalCurrent ? 'bg-amber-500/10' : 'hover:bg-slate-800/40'}
                      >
                        <td className="py-1.5 px-2 max-w-[138px]">
                          <div className="font-bold text-white truncate">
                            {p.name}
                            {p.isLocalCurrent ? ' (вы)' : ''}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {p.grade} • {p.rank}
                          </div>
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-amber-400 font-mono-tabular">
                          {p.victories}
                        </td>
                        <td className="py-1.5 px-1.5 text-right text-slate-200 font-mono-tabular">
                          {p.lessons}
                        </td>
                        <td className="py-1.5 px-2 text-right whitespace-nowrap">
                          <div>
                            {p.isPremiumActive ? (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-bold text-[10px] font-mono-tabular">
                                👑 {p.premiumDaysLeft || 30} дн.
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px]">
                                🆓 Беспл.
                              </span>
                            )}
                          </div>
                          <div className="text-[9.5px] text-slate-400 font-mono-tabular mt-0.5">
                            {p.lastSeenFormatted}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3 Subscription Lifecycle Test Buttons */}
          <div className="bg-[#0B1120] border-[1.5px] border-slate-800 rounded-xl p-3 space-y-2">
            <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              Тестирование цикла подписки (50 ₽ / 30 дней)
            </div>
            <p className="text-[11px] text-slate-400">
              Проверь работу автоматического замка по истечении 30 дней с полным сохранением набранного прогресса и побед:
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateProfileSubscription(Date.now() + 30 * 24 * 60 * 60 * 1000, false);
                  setSavedNotice('Тест: Подписка активирована на полные 30 дней!');
                }}
                className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                🟢 Активировать 30 дней
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateProfileSubscription(Date.now() + 20 * 60 * 60 * 1000, false);
                  setSavedNotice('Тест: Установлен остаток подписки — 1 день!');
                }}
                className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs border-b-4 border-amber-700 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                🟡 Остался 1 день
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateProfileSubscription(Date.now() - 5000, true);
                  setSavedNotice('Тест: 30 дней прошли — дебюты закрыты на замок 🔒 с сохранением прогресса!');
                }}
                className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs border-b-4 border-rose-800 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                🔴 30 дней прошли — отключить дебюты
              </button>
            </div>
          </div>

          {/* Google Sheet Webhook & Robokassa URL Configuration */}
          <form
            onSubmit={handleSaveConfig}
            className="bg-[#0B1120] border-[1.5px] border-slate-800 rounded-xl p-3 space-y-2.5"
          >
            <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              Телеметрия в Google Таблицу и Робокасса
            </div>
            <div>
              <label htmlFor="webhook-url" className="block text-[11px] text-slate-300 mb-1">
                URL вебхука Google Apps Script (Таблица Лиги):
              </label>
              <input
                id="webhook-url"
                type="url"
                value={config.googleSheetWebhookUrl}
                onChange={(e) => setConfig({ ...config, googleSheetWebhookUrl: e.target.value })}
                placeholder={DEFAULT_GOOGLE_SCRIPT_URL}
                className="w-full px-3 py-2 rounded-xl bg-[#131C2E] border border-slate-700 text-white text-[16px] font-mono-tabular"
              />
            </div>
            <div>
              <label htmlFor="robokassa-url" className="block text-[11px] text-slate-300 mb-1">
                Ссылка оплаты Робокассы / СБП (50 ₽):
              </label>
              <input
                id="robokassa-url"
                type="url"
                value={config.robokassaPaymentUrl}
                onChange={(e) => setConfig({ ...config, robokassaPaymentUrl: e.target.value })}
                placeholder={DEFAULT_ROBOKASSA_URL}
                className="w-full px-3 py-2 rounded-xl bg-[#131C2E] border border-slate-700 text-white text-[16px] font-mono-tabular"
              />
            </div>
            <div className="text-[11px] text-slate-400">
              Отправлено пакетов: <span className="font-mono-tabular font-bold text-white">{config.telemetryEventsSent}</span> • {config.lastSyncStatus}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs border-b-4 border-sky-800 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                💾 Сохранить
              </button>
              <button
                type="button"
                onClick={handleTestAndRefresh}
                disabled={loadingGlobal}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 font-bold text-xs border-b-4 border-slate-950 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                📡 Тест связи / Обновить
              </button>
            </div>
            {savedNotice && (
              <div className="text-emerald-400 font-semibold text-xs pt-1">{savedNotice}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
