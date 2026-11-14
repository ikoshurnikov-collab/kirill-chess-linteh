/**
 * Sound synthesis (Web Audio API) and Kirill Voice / Speech Synthesis Engine
 * Supports all 40 live recorded Kirill audio files in /audio/ (.mp3, .m4a, .wav)
 * with single-trigger guard and anti-GC Russian SpeechSynthesis fallback.
 */

const FILE_SPEECH_RU: Record<string, string> = {
  a: 'а',
  b: 'бэ',
  c: 'цэ',
  d: 'дэ',
  e: 'е',
  f: 'эф',
  g: 'жэ',
  h: 'аш',
};

const RANK_SPEECH_RU: Record<string, string> = {
  '1': 'один',
  '2': 'два',
  '3': 'три',
  '4': 'четыре',
  '5': 'пять',
  '6': 'шесть',
  '7': 'семь',
  '8': 'восемь',
};

const PIECE_PREFIX_RU: Record<string, string> = {
  Кр: 'король',
  Ф: 'ферзь',
  Л: 'ладья',
  С: 'слон',
  К: 'конь',
};

/**
 * Cleans text for Russian SpeechSynthesis:
 * - Expands Russian chess piece notation before coordinates or captures:
 *   Крe6 -> "король е шесть", Кр:f8 -> "король бьёт эф восемь",
 *   Фh4 -> "ферзь аш четыре", Ф:f7# -> "ферзь бьёт эф семь мат",
 *   Лa1 -> "ладья а один", Лh8# -> "ладья аш восемь мат",
 *   Сc4 -> "слон цэ четыре", Сb5 -> "слон бэ пять",
 *   Кf3 -> "конь эф три", Кc6 -> "конь цэ шесть"
 * - Converts move pairs like "e2 → e4" into "е два на е четыре"
 * - Replaces "#" at the end of a move with " мат"
 * - Removes emojis and technical symbols
 */
export function sanitizeForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text
    // 1. Castling notation
    .replace(/0-0-0|O-O-O/g, 'длинная рокировка')
    .replace(/0-0|O-O/g, 'короткая рокировка')
    // 2. Full move from square to square with optional Russian piece prefix (e.g. Фc8:f8+, e2 → e4, Лd1-d8#)
    .replace(
      /(^|[^А-Яа-яЁёA-Za-z0-9])(Кр|Ф|Л|С|К)?([a-h])([1-8])\s*(→|->|—|-|:)\s*([a-h])([1-8])([+#!]*)/g,
      (
        _match,
        lead: string,
        piece: string | undefined,
        f1: string,
        r1: string,
        sep: string,
        f2: string,
        r2: string,
        suffix: string
      ) => {
        const pieceWord = piece && PIECE_PREFIX_RU[piece] ? `${PIECE_PREFIX_RU[piece]} ` : '';
        const s1 = `${FILE_SPEECH_RU[f1.toLowerCase()] || f1} ${RANK_SPEECH_RU[r1] || r1}`;
        const s2 = `${FILE_SPEECH_RU[f2.toLowerCase()] || f2} ${RANK_SPEECH_RU[r2] || r2}`;
        const verb = sep === ':' ? 'бьёт' : 'на';
        const mateWord = suffix && suffix.includes('#') ? ' мат' : '';
        return `${lead}${pieceWord}${s1} ${verb} ${s2}${mateWord}`;
      }
    )
    // 3. Russian piece prefix + optional capture ":" + target square + optional "#" (e.g. Крe6, Кр:f8, Фh4, Ф:f7#, Лa1, Лh8#, Сc4, Сb5, Кf3, Кc6)
    .replace(
      /(^|[^А-Яа-яЁёA-Za-z0-9])(Кр|Ф|Л|С|К)(:)?([a-h])([1-8])([+#!]*)/g,
      (
        _match,
        lead: string,
        piece: string,
        colon: string | undefined,
        f: string,
        r: string,
        suffix: string
      ) => {
        const pieceWord = PIECE_PREFIX_RU[piece] || piece;
        const captureWord = colon === ':' ? ' бьёт ' : ' ';
        const sqWord = `${FILE_SPEECH_RU[f.toLowerCase()] || f} ${RANK_SPEECH_RU[r] || r}`;
        const mateWord = suffix && suffix.includes('#') ? ' мат' : '';
        return `${lead}${pieceWord}${captureWord}${sqWord}${mateWord}`;
      }
    )
    // 4. Standalone squares with optional "#" (e.g. e4, d5, h7#)
    .replace(/\b([a-h])([1-8])(#)?(?![a-zA-Z0-9])/gi, (_m, f: string, r: string, hash?: string) => {
      const sqWord = `${FILE_SPEECH_RU[f.toLowerCase()] || f} ${RANK_SPEECH_RU[r] || r}`;
      return hash === '#' ? `${sqWord} мат` : sqWord;
    })
    // 5. Remove emojis & variation selectors
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, ' ')
    .replace(/[«»"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

function buildCandidateAudioUrls(audioKey: string): string[] {
  const keys = [audioKey];
  if (audioKey.startsWith('prac_2_')) {
    keys.push(audioKey.replace('prac_2_', 'practice_2_'));
  } else if (audioKey.startsWith('practice_2_')) {
    keys.unshift(audioKey.replace('practice_2_', 'prac_2_'));
  }
  const urls: string[] = [];
  for (const k of keys) {
    urls.push(`/audio/${k}.mp3`, `/audio/${k}.m4a`, `/audio/${k}.wav`);
  }
  return urls;
}

class SoundAndSpeechEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private voiceEnabled = true;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechTimer: number | null = null;
  private useCustomMp3Files = true;
  private knownMissingKeys = new Set<string>();
  private unlocked = false;

  constructor() {
    try {
      const savedSound = localStorage.getItem('kirill_chess_sound');
      const savedVoice = localStorage.getItem('kirill_chess_voice');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';
      if (savedVoice !== null) this.voiceEnabled = savedVoice === 'true';
    } catch {
      // ignore storage errors
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public isSpeaking(): boolean {
    if (this.currentAudio && !this.currentAudio.paused) return true;
    if (this.currentUtterance) return true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      return true;
    }
    return false;
  }

  public setSoundEnabled(val: boolean): void {
    this.soundEnabled = val;
    try {
      localStorage.setItem('kirill_chess_sound', String(val));
    } catch {
      // ignore
    }
  }

  public setVoiceEnabled(val: boolean): void {
    this.voiceEnabled = val;
    try {
      localStorage.setItem('kirill_chess_voice', String(val));
    } catch {
      // ignore
    }
    if (!val) {
      this.stopSpeech();
    }
  }

  /**
   * Unlocks Web Audio API and warms up SpeechSynthesis voices on first user interaction.
   */
  public unlockAudio(): void {
    if (this.unlocked || typeof window === 'undefined') return;
    this.unlocked = true;
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // ignore
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playMoveWood(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.065);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playCaptureWood(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.11);

    gain.gain.setValueAtTime(0.34, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.115);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    [520, 390, 290].forEach((freq, idx) => {
      const start = now + 0.018 + idx * 0.022;
      const crackOsc = ctx.createOscillator();
      const crackGain = ctx.createGain();
      crackOsc.type = 'triangle';
      crackOsc.frequency.setValueAtTime(freq, start);
      crackOsc.frequency.exponentialRampToValueAtTime(95, start + 0.045);
      crackGain.gain.setValueAtTime(0.14, start);
      crackGain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
      crackOsc.connect(crackGain);
      crackGain.connect(ctx.destination);
      crackOsc.start(start);
      crackOsc.stop(start + 0.055);
    });
  }

  public playKingToppleImpact(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(125, now);
    thudOsc.frequency.exponentialRampToValueAtTime(38, now + 0.16);
    thudGain.gain.setValueAtTime(0.42, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.18);

    const bounceStart = now + 0.16;
    const bounceOsc = ctx.createOscillator();
    const bounceGain = ctx.createGain();
    bounceOsc.type = 'sine';
    bounceOsc.frequency.setValueAtTime(95, bounceStart);
    bounceOsc.frequency.exponentialRampToValueAtTime(44, bounceStart + 0.09);
    bounceGain.gain.setValueAtTime(0.22, bounceStart);
    bounceGain.gain.exponentialRampToValueAtTime(0.001, bounceStart + 0.1);
    bounceOsc.connect(bounceGain);
    bounceGain.connect(ctx.destination);
    bounceOsc.start(bounceStart);
    bounceOsc.stop(bounceStart + 0.11);
  }

  public playSelectTap(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.035);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playFanfare(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.27);
    });
  }

  public playWarning(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [220, 175].forEach((freq, idx) => {
      const start = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.13);
    });
  }

  public stopSpeech(): void {
    if (this.speechTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.speechTimer);
      this.speechTimer = null;
    }
    if (this.currentAudio) {
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.currentUtterance = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  private pickBestRussianVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const ruVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('ru'));
    if (ruVoices.length === 0) return null;

    const preferredOrder = ['google', 'yuri', 'milena', 'microsoft', 'pavel', 'irina'];
    for (const kw of preferredOrder) {
      const found = ruVoices.find((v) => v.name.toLowerCase().includes(kw));
      if (found) return found;
    }
    return ruVoices[0];
  }

  /**
   * Speaks Kirill's line:
   * - Respects voiceEnabled unless forceManual = true (when pressing "🔊 Речь")
   * - If audioKey is provided, tries /audio/${audioKey}.mp3 -> .m4a -> .wav (including prac_2_X / practice_2_X aliases)
   * - Uses a single-trigger fallbackTriggered guard so onerror + play().catch() never double-speak
   * - Launches SpeechSynthesis after a 45ms timer with window.speechSynthesis.resume() and retains this.currentUtterance
   */
  public speak(text: string, audioKey?: string, forceManual: boolean = false): void {
    if ((!this.voiceEnabled && !forceManual) || typeof window === 'undefined') return;
    this.stopSpeech();

    let fallbackTriggered = false;
    const speakTTS = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      if (!('speechSynthesis' in window)) return;
      const clean = sanitizeForSpeech(text);
      if (!clean) return;

      this.speechTimer = window.setTimeout(() => {
        this.speechTimer = null;
        try {
          window.speechSynthesis.resume();
        } catch {
          // ignore
        }
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = 'ru-RU';
        utter.pitch = 1.0;
        utter.rate = 0.98;
        const bestVoice = this.pickBestRussianVoice();
        if (bestVoice) utter.voice = bestVoice;

        utter.onend = () => {
          if (this.currentUtterance === utter) {
            this.currentUtterance = null;
          }
        };
        utter.onerror = () => {
          if (this.currentUtterance === utter) {
            this.currentUtterance = null;
          }
        };

        this.currentUtterance = utter;
        window.speechSynthesis.speak(utter);
      }, 45);
    };

    if (audioKey && this.useCustomMp3Files && !this.knownMissingKeys.has(audioKey)) {
      const candidates = buildCandidateAudioUrls(audioKey);
      const tryCandidate = (idx: number) => {
        if (fallbackTriggered) return;
        if (idx >= candidates.length) {
          this.knownMissingKeys.add(audioKey);
          speakTTS();
          return;
        }
        const audio = new Audio(candidates[idx]);
        this.currentAudio = audio;
        let nextTried = false;
        const handleFail = () => {
          if (nextTried || fallbackTriggered) return;
          nextTried = true;
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          tryCandidate(idx + 1);
        };
        audio.onended = () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
        };
        audio.onerror = handleFail;
        audio.play().catch(handleFail);
      };
      tryCandidate(0);
    } else {
      speakTTS();
    }
  }
}

export const soundEngine = new SoundAndSpeechEngine();
