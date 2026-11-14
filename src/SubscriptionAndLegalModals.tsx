import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_ROBOKASSA_URL,
  PlayerProfile,
  TelemetryService,
  calculateTotalWins,
  getPlayerRankTitle,
  getSubscriptionRemainingDays,
  isSubscriptionActive,
} from './telemetryAndStorage';

interface SubscriptionModalProps {
  profile: PlayerProfile;
  onClose: () => void;
  onActivateSubscription: (
    days: number,
    source: string,
    extra?: Record<string, unknown>
  ) => void;
  onOpenLegal: (initialTab?: 'requisites' | 'oferta' | 'privacy') => void;
}

export function buildRobokassaPaymentUrl(rawUrl: string, profileId: string): string {
  const cleanUrl = (rawUrl || DEFAULT_ROBOKASSA_URL).trim();
  // Invoice links (/merchant/Invoice/...) must remain 100% clean without query params
  if (cleanUrl.includes('/merchant/Invoice/')) {
    return cleanUrl;
  }
  const sep = cleanUrl.includes('?') ? '&' : '?';
  return `${cleanUrl}${sep}Shp_profileId=${encodeURIComponent(profileId)}`;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  profile,
  onClose,
  onActivateSubscription,
  onOpenLegal,
}) => {
  const hasPending = TelemetryService.hasRecentPendingPayment();
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [showParentalGate, setShowParentalGate] = useState(hasPending);
  const [parentAnswer, setParentAnswer] = useState('');
  const [parentGateError, setParentGateError] = useState('');
  const [parentGatePassed, setParentGatePassed] = useState(hasPending);
  const [paymentStarted, setPaymentStarted] = useState(hasPending);
  const [receiptCode, setReceiptCode] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState('');
  const receiptFormRef = useRef<HTMLFormElement | null>(null);

  const isActive = isSubscriptionActive(profile);
  const remainingDays = getSubscriptionRemainingDays(profile);
  const config = TelemetryService.loadCreatorConfig();
  const paymentHref = buildRobokassaPaymentUrl(config.robokassaPaymentUrl, profile.id);

  useEffect(() => {
    if (paymentStarted && receiptFormRef.current) {
      receiptFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [paymentStarted]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'LINTECH28' || clean === 'KIRILL50') {
      setPromoError('');
      setPromoSuccess('Код активации принят! Доступ на 30 дней открыт.');
      onActivateSubscription(30, `promo_${clean}`);
    } else {
      setPromoSuccess('');
      setPromoError('Код не найден. Проверь правильность ввода школьного промокода лицея.');
    }
  };

  const handleStartPayment = () => {
    setParentGateError('');
    setShowParentalGate(true);
  };

  const handleVerifyParentGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (parentAnswer.trim() === '56') {
      setParentGateError('');
      setParentGatePassed(true);
    } else {
      setParentGateError('Неверный ответ. Попроси родителей помочь с оплатой.');
    }
  };

  const handleClickRobokassaLink = () => {
    TelemetryService.markPaymentStarted();
    setPaymentStarted(true);
    setReceiptError('');
    TelemetryService.sendEvent('robokassa_payment_started', profile);
  };

  const handleVerifyReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const result = TelemetryService.verifyAndConsumeReceiptCode(receiptCode, profile);
    if (!result.ok || !result.normalizedCode) {
      setReceiptSuccess('');
      setReceiptError(result.error || 'Не удалось проверить номер операции.');
      return;
    }

    setReceiptError('');
    setReceiptSuccess(
      `✅ Оплата подтверждена (операция №${result.normalizedCode})! Полный доступ на 30 дней открыт!`
    );
    setReceiptCode('');
    onActivateSubscription(30, `robokassa_receipt_${result.normalizedCode}`, {
      receiptId: result.normalizedCode,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Подписка 50 рублей на 30 дней"
    >
      <div className="w-full max-w-[430px] max-h-[92dvh] bg-[#131C2E] border-[1.5px] border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">👑</span>
            <h2 className="text-base font-extrabold text-white font-display">
              Дружинная подписка • 50 ₽ / 30 дней
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно подписки"
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold border border-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto custom-scroll space-y-3 text-sm text-slate-200">
          {/* Status Box */}
          <div
            className={`p-2.5 rounded-xl border-[1.5px] text-xs sm:text-sm ${
              isActive
                ? 'bg-emerald-950/50 border-emerald-600/70 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/70 text-amber-100'
            }`}
          >
            {isActive ? (
              <div className="font-semibold">
                ✅ Подписка активна! Осталось дней: <span className="font-mono-tabular font-bold">{remainingDays}</span> из 30.
              </div>
            ) : profile.premiumUntilEpochMillis > 0 ? (
              <div>
                🔒 <strong>Срок 30 дней истёк.</strong> Платная практика и дебюты 30/30 закрыты на замок, но весь твой прогресс (<span className="font-mono-tabular font-bold">{calculateTotalWins(profile.lessonWins)}</span> побед) бережно сохранён!
              </div>
            ) : (
              <div>
                ⚡ Открыты бесплатно: <strong>Раздел 1. Теория (1.1–1.8)</strong> и <strong>Практика (2.1–2.2)</strong>.
              </div>
            )}
          </div>

          {/* What's included (compact when payment step is active so receipt field fits above the fold) */}
          {!paymentStarted && (
            <div className="bg-[#0B1120] border-[1.5px] border-slate-800 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Что открывает подписка за 50 ₽ на 30 дней:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                <li>• <strong>Практика 2.3–2.10 по С. Д. Иващенко:</strong> превращение пешки в Коня, рокировка с матом, Детский мат, Мат Легаля и партия Веричева — Вострецова (г. Киров, 1974 г.).</li>
                <li>• <strong>Все 11 уроков «Дебюты и Тактика 30/30» (3.1–3.11):</strong> Итальянка, Испанка, Шотландка за белых и за чёрных + комбинация Никонов — Хардин (г. Киров, 1981 г.).</li>
                <li>• <strong>Именная Грамота:</strong> официальный диплом для печати (после прохождения 8 уроков).</li>
                <li>• <strong>Честные правила без автосписаний:</strong> ровно 50 ₽ на 30 дней. Через 30 дней доступ сам встаёт на паузу с сохранением всех побед.</li>
              </ul>
            </div>
          )}

          {/* Robokassa / SBP Button with Parental Gate (UX-08) */}
          <div className="space-y-2">
            {!showParentalGate ? (
              <button
                type="button"
                onClick={handleStartPayment}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm border-b-4 border-amber-700 active:border-b-0 active:translate-y-[3px] transition-all duration-75 shadow-md"
              >
                ⚡ Оплатить 50 ₽ на 30 дней (Робокасса / СБП / Карта Мир)
              </button>
            ) : !parentGatePassed ? (
              <form
                onSubmit={handleVerifyParentGate}
                className="p-3 rounded-xl bg-slate-900 border-[1.5px] border-amber-500/60 space-y-2.5"
              >
                <div className="text-xs font-bold text-amber-400">
                  👨‍👩‍👦 Проверка для родителей перед переходом к оплате:
                </div>
                <label htmlFor="parent-gate-input" className="block text-xs text-slate-300">
                  Решите пример: <strong>7 × 8 = ?</strong>
                </label>
                <div className="flex gap-2">
                  <input
                    id="parent-gate-input"
                    data-testid="parental-gate-input"
                    type="text"
                    inputMode="numeric"
                    value={parentAnswer}
                    onChange={(e) => setParentAnswer(e.target.value)}
                    placeholder="Ответ"
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#131C2E] border border-slate-700 text-white text-[16px] font-mono-tabular"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs border-b-4 border-amber-700"
                  >
                    Далее
                  </button>
                </div>
                {parentGateError && (
                  <p className="text-xs text-rose-400 font-medium">{parentGateError}</p>
                )}
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border-[1.5px] border-amber-500/60 space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Платёжный шлюз <strong>Робокасса / СБП</strong> (ИП Кошурникова Е. С., ИНН <span className="font-mono-tabular">432001040930</span>, сумма <strong>50,00 ₽</strong> без НДС). Доступ откроется автоматически при возврате на сайт или по номеру чека ниже.
                </p>
                <a
                  href={paymentHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClickRobokassaLink}
                  data-testid="robokassa-pay-link"
                  className="flex items-center justify-center w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs text-center border-b-4 border-sky-800 active:border-b-0 active:translate-y-[2px] transition-all duration-75"
                >
                  🔗 Перейти на страницу оплаты Робокассы / СБП (50 ₽)
                </a>

                {paymentStarted && (
                  <form
                    ref={receiptFormRef}
                    onSubmit={handleVerifyReceipt}
                    data-testid="receipt-confirm-form"
                    className="pt-2.5 border-t border-slate-800 space-y-2"
                  >
                    <label
                      htmlFor="receipt-code-input"
                      className="block text-xs text-amber-200 leading-snug font-semibold"
                    >
                      Оплатили в другой вкладке или по QR-коду СБП? Введите последние 4–6 цифр номера чека/операции из банка или Робокассы для мгновенной активации:
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="receipt-code-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        value={receiptCode}
                        onChange={(e) => setReceiptCode(e.target.value)}
                        placeholder="4–6 цифр чека"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#131C2E] border-[1.5px] border-slate-700 text-white text-[16px] font-mono-tabular focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[2px] transition-all duration-75 shrink-0"
                      >
                        Активировать
                      </button>
                    </div>
                    {receiptError && (
                      <p className="text-xs text-rose-400 font-medium">{receiptError}</p>
                    )}
                    {receiptSuccess && (
                      <p className="text-xs text-emerald-400 font-semibold">{receiptSuccess}</p>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Promo activation code form (without visible secret codes in label) */}
          <form onSubmit={handleApplyPromo} className="bg-[#0B1120] border-[1.5px] border-slate-800 rounded-xl p-3 space-y-2">
            <label htmlFor="promo-input" className="block text-xs font-bold text-slate-300">
              Школьный промокод лицея:
            </label>
            <div className="flex gap-2">
              <input
                id="promo-input"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Введи промокод..."
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#131C2E] border-[1.5px] border-slate-700 text-white text-[16px] font-mono-tabular focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[3px] transition-all duration-75 shrink-0"
              >
                Применить
              </button>
            </div>
            {promoError && <p className="text-xs text-rose-400 font-medium">{promoError}</p>}
            {promoSuccess && <p className="text-xs text-emerald-400 font-semibold">{promoSuccess}</p>}
          </form>

          {/* Legal links */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onOpenLegal('requisites')}
              className="underline hover:text-amber-300"
            >
              🏛️ Реквизиты ИП Кошурниковой Е. С.
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('oferta')}
              className="underline hover:text-amber-300"
            >
              📜 Публичная оферта
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="underline hover:text-amber-300"
            >
              🔒 Политика 152-ФЗ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LegalDocumentsModalProps {
  initialTab?: 'requisites' | 'oferta' | 'privacy';
  onClose: () => void;
}

/**
 * Full Russian Federation Legal Documents & Exact Requisites of IP Koshurnikova E. S.
 */
export const LegalDocumentsModal: React.FC<LegalDocumentsModalProps> = ({
  initialTab = 'requisites',
  onClose,
}) => {
  const [tab, setTab] = useState<'requisites' | 'oferta' | 'privacy'>(initialTab);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Юридические документы и реквизиты ИП"
    >
      <div className="w-full max-w-[440px] max-h-[92dvh] bg-[#131C2E] border-[1.5px] border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-extrabold text-white font-display">
            Правовые документы • kirill-chess-linteh.ru
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть правовые документы"
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold border border-slate-700"
          >
            ✕
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#0B1120] border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setTab('requisites')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all ${
              tab === 'requisites'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-[#131C2E] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            🏛️ Реквизиты ИП
          </button>
          <button
            type="button"
            onClick={() => setTab('oferta')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all ${
              tab === 'oferta'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-[#131C2E] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            📜 Публичная оферта
          </button>
          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all ${
              tab === 'privacy'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-[#131C2E] text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            🔒 Политика 152-ФЗ
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto custom-scroll text-xs text-slate-200 leading-relaxed space-y-3">
          {tab === 'requisites' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#0B1120] border-[1.5px] border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold text-xs uppercase">
                  Официальные реквизиты Исполнителя
                </div>
                <div>
                  <span className="text-slate-400">Исполнитель:</span>{' '}
                  <strong className="text-white">Индивидуальный предприниматель Кошурникова Екатерина Сергеевна</strong>
                </div>
                <div>
                  <span className="text-slate-400">ИНН:</span>{' '}
                  <strong className="text-white font-mono-tabular">432001040930</strong>
                </div>
                <div>
                  <span className="text-slate-400">ОГРНИП:</span>{' '}
                  <strong className="text-white font-mono-tabular">3224350000016</strong>{' '}
                  <span className="text-slate-400 font-mono-tabular">(рег. номер: 3224350000016 / 422435000038740)</span>
                </div>
                <div>
                  <span className="text-slate-400">Адрес:</span>{' '}
                  <strong className="text-white">Россия, Кировская обл., гор. Киров, б-р Прогулочный, д. 17</strong>
                </div>
                <div>
                  <span className="text-slate-400">Телефон:</span>{' '}
                  <strong className="text-white font-mono-tabular">+7 (953) 677-12-35</strong>
                </div>
                <div>
                  <span className="text-slate-400">E-mail:</span>{' '}
                  <strong className="text-white font-mono-tabular">79536771235@yandex.ru / kattybuzi@gmail.com</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1120] border-[1.5px] border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold text-xs uppercase">
                  Банковские реквизиты
                </div>
                <div>
                  <span className="text-slate-400">Банк получателя:</span>{' '}
                  <strong className="text-white">АО «ТБАНК» (АО «ТИНЬКОФФ БАНК»)</strong>
                </div>
                <div>
                  <span className="text-slate-400">БИК:</span>{' '}
                  <strong className="text-white font-mono-tabular">044525974</strong>
                </div>
                <div>
                  <span className="text-slate-400">Корр. счёт:</span>{' '}
                  <strong className="text-white font-mono-tabular">30101810145250000974</strong>
                </div>
                <div>
                  <span className="text-slate-400">Расчётный счёт:</span>{' '}
                  <strong className="text-white font-mono-tabular">40802810800003002282</strong>
                </div>
              </div>
            </div>
          )}

          {tab === 'oferta' && (
            <div className="space-y-3 bg-[#0B1120] p-3.5 rounded-xl border-[1.5px] border-slate-800">
              <h3 className="font-bold text-white text-sm">
                ДОГОВОР ПУБЛИЧНОЙ ОФЕРТЫ о предоставлении доступа к обучающему веб-приложению «Шахматы от Кирилла»
              </h3>
              <p>
                <strong>1. Общие положения (ст. 435, 437 ГК РФ).</strong> Настоящий документ является официальным публичным предложением (офертой) Индивидуального предпринимателя Кошурниковой Екатерины Сергеевны (ИНН 432001040930, ОГРНИП 3224350000016), именуемой далее «Исполнитель», заключить договор на предоставление доступа к расширенным учебным материалам интерактивного веб-приложения «Шахматы от Кирилла» на официальном домене <strong>https://kirill-chess-linteh.ru</strong>.
              </p>
              <p>
                <strong>2. Предмет договора.</strong> Исполнитель предоставляет Пользователю (Заказчику) неисключительный доступ к платным разделам тренажёра (уроки практики 2.3–2.10 по сборнику С. Д. Иващенко, раздел «Дебюты и Тактика 30/30» 3.1–3.11 и формирование Именной Грамоты) сроком на <strong>30 (тридцать) календарных дней</strong>. Уроки Теории (1.1–1.8) и базовой Практики (2.1–2.2) предоставляются бесплатно.
              </p>
              <p>
                <strong>3. Стоимость и порядок оплаты.</strong> Стоимость доступа на 30 календарных дней составляет <strong>50 (пятьдесят) рублей 00 копеек</strong>, без НДС (применяется специальный налоговый режим НПД / УСН). Оплата производится единовременно через платёжный сервис Робокасса, Систему быстрых платежей (СБП) или банковской картой «Мир».
              </p>
              <p>
                <strong>4. Отсутствие скрытых автосписаний.</strong> В приложении <strong>не применяются автоматические рекуррентные списания</strong> средств с банковской карты Пользователя. Каждая оплата в размере 50 ₽ совершается Пользователем исключительно добровольно и самостоятельно.
              </p>
              <p>
                <strong>5. Автоматическая приостановка через 30 дней с сохранением прогресса.</strong> По истечении 30 календарных дней с момента оплаты доступ к разделам 2.3–2.10 и 3.1–3.11 автоматически приостанавливается (закрывается на замок 🔒). При этом весь набранный учебный прогресс и счётчик побед (`lessonWins`) сохраняются за Пользователем в полном объёме.
              </p>
              <p>
                <strong>6. Права и обязанности сторон.</strong> Исполнитель обеспечивает круглосуточную работоспособность веб-приложения и PWA в браузерах iOS, Android и ПК. Пользователь обязуется использовать материалы в личных образовательных целях.
              </p>
              <p>
                <strong>7. Порядок разрешения споров и возврата.</strong> Все вопросы и претензии направляются по электронному адресу <strong>79536771235@yandex.ru</strong> или <strong>kattybuzi@gmail.com</strong> либо по телефону <strong>+7 (953) 677-12-35</strong>. Срок рассмотрения обращения в претензионном порядке составляет <strong>10 (десять) рабочих дней</strong>.
              </p>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="space-y-3 bg-[#0B1120] p-3.5 rounded-xl border-[1.5px] border-slate-800">
              <h3 className="font-bold text-white text-sm">
                ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ (в соответствии с Федеральным законом РФ № 152-ФЗ «О персональных данных»)
              </h3>
              <p>
                <strong>1. Общие положения.</strong> Настоящая Политика определяет порядок обработки и защиты информации о Пользователях обучающего приложения «Шахматы от Кирилла» (`https://kirill-chess-linteh.ru`), оператором которого выступает ИП Кошурникова Екатерина Сергеевна (ИНН 432001040930, ОГРНИП 3224350000016, адрес: Россия, Кировская обл., гор. Киров, б-р Прогулочный, д. 17).
              </p>
              <p>
                <strong>2. Состав обрабатываемых данных.</strong> Приложение минимизирует сбор данных и не требует ввода паспортных данных, домашнего адреса или геолокации. Для работы игрового паспорта ратника и таблицы Лиги дружины используются: выбранное Пользователем игровое имя (псевдоним), возрастная категория («1–4 класс», «5–11 класс», «Взрослый новичок»), выбранный значок и статистика решённых шахматных задач.
              </p>
              <p>
                <strong>3. Цели обработки и хранение.</strong> Данные хранятся локально в браузере устройства Пользователя (`localStorage`) и передаются в обезличенном виде в сводную учебную таблицу проекта исключительно для отображения прогресса обучения и рейтинга Топ-10 Лиги дружины.
              </p>
              <p>
                <strong>4. Безопасность платежей.</strong> При оплате подписки 50 ₽ реквизиты банковских карт и СБП вводятся непосредственно на защищённой странице платёжного агрегатора Робокасса / АО «ТБАНК» и не передаются Исполнителю.
              </p>
              <p>
                <strong>5. Права Пользователя и контакты.</strong> Пользователь вправе в любой момент изменить своё игровое имя в разделе «Палата Воеводы» либо направить запрос на удаление данных по адресу <strong>79536771235@yandex.ru</strong> / <strong>kattybuzi@gmail.com</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface QRModalProps {
  onClose: () => void;
  canInstallPWA: boolean;
  onTriggerInstallPWA: () => void;
}

/**
 * Pure TypeScript ISO/IEC 18004 QR Code Matrix Generator (Version 3-L, 29x29 modules, Byte Mode, Mask 0)
 * Generates a 100% real, scannable offline QR code for https://kirill-chess-linteh.ru without external APIs.
 */
export function generateOfflineQrMatrix(text: string): boolean[][] {
  const size = 29; // Version 3 (29x29)
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunc: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunc[r][c] = true;
    }
  };

  // Finder pattern (7x7) + separator
  const drawFinder = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onOuterBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onOuterBorder || inInner));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment pattern for Version 3 at (22, 22)
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
      setFunctionModule(22 + dr, 22 + dc, dark);
    }
  }

  // Dark module and reserved format information areas
  setFunctionModule(size - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      if (!isFunc[8][i]) setFunctionModule(8, i, false);
      if (!isFunc[i][8]) setFunctionModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunc[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
    if (!isFunc[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
  }

  // Encode Byte Mode data (Version 3-L: 55 data bytes, 15 ECC bytes = 70 total codewords)
  const utf8Bytes = Array.from(new TextEncoder().encode(text));
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(utf8Bytes.length, 8);
  for (const b of utf8Bytes) pushBits(b, 8);
  pushBits(0, Math.min(4, 55 * 8 - bits.length)); // Terminator
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataBytes.push(byte);
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBytes.length < 55) {
    dataBytes.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // Reed-Solomon 15 ECC codewords over GF(256) with primitive polynomial 0x11d
  const gfMul = (x: number, y: number): number => {
    let r = 0;
    for (let i = 7; i >= 0; i--) {
      r = (r << 1) ^ ((r >>> 7) * 0x11d);
      r ^= ((y >>> i) & 1) * x;
    }
    return r;
  };

  const eccDegree = 15;
  let gen = [1];
  let root = 1;
  for (let i = 0; i < eccDegree; i++) {
    const nextGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      nextGen[j] ^= gen[j];
      nextGen[j + 1] ^= gfMul(gen[j], root);
    }
    gen = nextGen;
    root = gfMul(root, 0x02);
  }

  const ecc = new Array(eccDegree).fill(0);
  for (const b of dataBytes) {
    const factor = b ^ ecc[0];
    ecc.shift();
    ecc.push(0);
    for (let i = 0; i < eccDegree; i++) {
      ecc[i] ^= gfMul(gen[i + 1], factor);
    }
  }

  const allCodewords = [...dataBytes, ...ecc];
  const allBits: number[] = [];
  for (const cw of allCodewords) {
    for (let i = 7; i >= 0; i--) allBits.push((cw >>> i) & 1);
  }

  // Zigzag placement + Mask Pattern 0 ((r + c) % 2 === 0)
  let bitIdx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const upward = ((right + 1) & 2) === 0;
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunc[r][c]) {
          const darkBit = bitIdx < allBits.length ? allBits[bitIdx] === 1 : false;
          bitIdx++;
          const mask = (r + c) % 2 === 0;
          modules[r][c] = darkBit !== mask;
        }
      }
    }
  }

  // Format bits for Level L (01) + Mask 0 (000) -> 0x77c4 (15 bits)
  const formatBits = 0x77c4;
  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, ((formatBits >>> i) & 1) === 1);
  setFunctionModule(8, 7, ((formatBits >>> 6) & 1) === 1);
  setFunctionModule(8, 8, ((formatBits >>> 7) & 1) === 1);
  setFunctionModule(7, 8, ((formatBits >>> 8) & 1) === 1);
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, ((formatBits >>> i) & 1) === 1);

  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 1 - i, ((formatBits >>> i) & 1) === 1);
  }
  for (let i = 8; i < 15; i++) {
    setFunctionModule(size - 15 + i, 8, ((formatBits >>> i) & 1) === 1);
  }

  return modules;
}

const OFFLINE_KIRILL_QR_MATRIX = generateOfflineQrMatrix('https://kirill-chess-linteh.ru');

/**
 * QR Modal for https://kirill-chess-linteh.ru with 100% offline local SVG QR code (FE-06),
 * copy link, and iOS/Android install instructions
 */
export const QRModal: React.FC<QRModalProps> = ({
  onClose,
  canInstallPWA,
  onTriggerInstallPWA,
}) => {
  const [copied, setCopied] = useState(false);
  const officialUrl = 'https://kirill-chess-linteh.ru';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(officialUrl).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label="QR-код и установка приложения"
    >
      <div className="w-full max-w-[410px] max-h-[92dvh] bg-[#131C2E] border-[1.5px] border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-extrabold text-white font-display">
            📱 QR-код проекта и установка на телефон
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно QR-кода"
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold border border-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scroll space-y-3.5 text-center">
          {/* 100% Offline Local SVG Scannable QR Code for https://kirill-chess-linteh.ru (FE-06) */}
          <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl border-2 border-amber-500 shadow-lg flex items-center justify-center">
            <svg
              viewBox="0 0 33 33"
              shapeRendering="crispEdges"
              className="w-full h-full select-none"
              role="img"
              aria-label="QR-код https://kirill-chess-linteh.ru"
              data-testid="offline-qr-svg"
            >
              <rect width="33" height="33" fill="#FFFFFF" />
              {OFFLINE_KIRILL_QR_MATRIX.map((row, rIdx) =>
                row.map((isDark, cIdx) =>
                  isDark ? (
                    <rect
                      key={`${rIdx}-${cIdx}`}
                      x={cIdx + 2}
                      y={rIdx + 2}
                      width={1}
                      height={1}
                      fill="#0B1120"
                    />
                  ) : null
                )
              )}
            </svg>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400">Официальный домен проекта Линтех №28:</div>
            <div className="text-sm font-bold text-amber-400 font-mono-tabular">
              https://kirill-chess-linteh.ru
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs border-b-4 border-amber-700 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
            >
              {copied ? '✅ Ссылка скопирована!' : '📋 Скопировать ссылку'}
            </button>
            {canInstallPWA && (
              <button
                type="button"
                onClick={onTriggerInstallPWA}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
              >
                📲 Установить PWA
              </button>
            )}
          </div>

          {/* iOS & Android Instructions */}
          <div className="text-left bg-[#0B1120] border-[1.5px] border-slate-800 rounded-xl p-3 space-y-2 text-xs text-slate-300">
            <div className="font-bold text-white">Как добавить иконку на экран «Домой»:</div>
            <div>
              🍎 <strong>iPhone (iOS Safari):</strong> нажми кнопку <strong>«Поделиться»</strong> внизу браузера Safari и выбери <strong>«На экран Домой»</strong>.
            </div>
            <div>
              🤖 <strong>Android (Chrome):</strong> нажми меню <strong>«⋮»</strong> в правом верхнем углу и выбери <strong>«Установить приложение»</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DiplomaModalProps {
  profile: PlayerProfile;
  completedLessonsCount: number;
  onClose: () => void;
}

/**
 * Official Printable Diploma Modal (window.print())
 */
export const DiplomaModal: React.FC<DiplomaModalProps> = ({
  profile,
  completedLessonsCount,
  onClose,
}) => {
  const totalWins = calculateTotalWins(profile.lessonWins);
  const rank = getPlayerRankTitle(totalWins);
  const dateStr = new Date().toLocaleDateString('ru-RU');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Именная Грамота"
    >
      <div className="w-full max-w-[430px] max-h-[92dvh] bg-[#131C2E] border-[1.5px] border-amber-500 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-extrabold text-amber-400 font-display">
            📜 Именная Грамота Дружины
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть грамоту"
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold border border-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scroll space-y-4">
          {/* Printable Certificate Area */}
          <div
            id="printable-diploma"
            className="p-5 rounded-xl bg-amber-50 text-slate-900 border-4 border-double border-amber-700 text-center space-y-2.5 shadow-inner"
          >
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-900">
              Лицей информационных технологий «Линтех №28» г. Кирова
            </div>
            <div className="text-xl font-extrabold text-slate-950 font-display">
              ПОЧЁТНАЯ ГРАМОТА
            </div>
            <div className="text-xs text-slate-700">награждается ратник шахматной дружины</div>
            <div className="text-lg font-extrabold text-amber-900 border-b-2 border-amber-700/60 pb-1 inline-block px-4">
              {profile.badge} {profile.name}
            </div>
            <div className="text-xs text-slate-800 leading-relaxed">
              Категория: <strong>{profile.category}</strong> • Воинское звание: <strong>{rank}</strong>
              <br />
              За успешное освоение курса «Шахматы от Кирилла», прохождение <strong>{completedLessonsCount}</strong> уроков и одержанные <strong>{totalWins}</strong> боевых побед!
            </div>
            <div className="pt-3 flex items-center justify-between text-[10px] text-slate-700 border-t border-amber-700/30">
              <span>г. Киров • {dateStr}</span>
              <span className="font-bold">Автор проекта: Кирилл (4 класс, Линтех №28)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm border-b-4 border-amber-700 active:border-b-0 active:translate-y-[3px] transition-all duration-75"
          >
            🖨️ Распечатать грамоту (PDF / Принтер)
          </button>
        </div>
      </div>
    </div>
  );
};
