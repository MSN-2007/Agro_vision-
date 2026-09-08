// Enhanced Human Speech Synthesis and Multilingual Audio Engine for AgroVision
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types/agro';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentLanguage: SupportedLanguage = 'en';
  private recognition: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const loaded = this.synth.getVoices();
    if (loaded && loaded.length > 0) {
      this.voices = loaded;
    }
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Cleans text to eliminate robotic stammering caused by markdown, backticks, emojis, and symbols
   */
  private cleanTextForSpeech(text: string): string {
    let clean = text
      // Remove task action machine tags
      .replace(/\[TASK_ACTION:\s*\{.*?\}\]/gs, '')
      // Remove URLs
      .replace(/https?:\/\/\S+/g, '')
      // Remove code blocks and backticks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown headers, bold, italics, strikethrough
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      // Remove bullet points and lists
      .replace(/^[\s*-+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // Replace units with natural spoken words
      .replace(/\bkm\/h\b/gi, ' kilometres per hour')
      .replace(/°C\b/g, ' degrees Celsius')
      .replace(/%/g, ' percent')
      .replace(/\bNPK\b/g, 'N P K')
      .replace(/\bCV\b/g, 'computer vision')
      .replace(/\bGPS\b/g, 'G P S')
      // Remove emojis
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Clean duplicate whitespace
      .replace(/\s+/g, ' ')
      .trim();

    return clean;
  }

  /**
   * Intelligently select the best human-sounding voice for the target language.
   * Prioritizes Neural, Natural, Google, Microsoft Online, and Indian-accented voices.
   */
  public getBestVoiceForLanguage(lang: SupportedLanguage): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    if (this.voices.length === 0) return null;

    const langTarget = lang || this.currentLanguage;

    // Language prefix candidates
    const langCandidates: Record<SupportedLanguage, string[]> = {
      en: ['en-IN', 'en_IN', 'en-GB', 'en-US', 'en'],
      hi: ['hi-IN', 'hi_IN', 'hi'],
      mr: ['mr-IN', 'mr_IN', 'mr', 'hi-IN', 'hi'], // Marathi (falls back to Devanagari Hindi neural if Marathi is missing)
      te: ['te-IN', 'te_IN', 'te']
    };

    const targetLocales = langCandidates[langTarget] || ['en'];

    // Score voices based on naturalness and language match
    let bestVoice: SpeechSynthesisVoice | null = null;
    let highestScore = -999;

    for (const voice of this.voices) {
      const vLang = (voice.lang || '').replace('_', '-').toLowerCase();
      const vName = (voice.name || '').toLowerCase();

      let score = 0;
      let matchedLang = false;

      for (let i = 0; i < targetLocales.length; i++) {
        const candidate = targetLocales[i].toLowerCase();
        if (vLang === candidate || vLang.startsWith(candidate.split('-')[0])) {
          score += (targetLocales.length - i) * 60;
          matchedLang = true;
          break;
        }
      }

      if (!matchedLang) continue;

      // Natural / Neural human quality bonuses
      if (vName.includes('natural') || vName.includes('neural')) score += 100;
      if (vName.includes('google')) score += 80;
      if (vName.includes('online')) score += 70;
      if (vName.includes('samantha') || vName.includes('siri') || vName.includes('premium')) score += 60;
      if (vName.includes('india') || vName.includes('indian')) score += 50;

      // Specific known high-quality regional voices
      if (vName.includes('swara') || vName.includes('aarohi') || vName.includes('mohan') || vName.includes('neerja') || vName.includes('prabhat')) {
        score += 90;
      }

      // Penalize old mechanical/robotic desktop synthesizers
      if (vName.includes('david') || vName.includes('desktop') || vName.includes('espeak')) {
        score -= 80;
      }

      if (score > highestScore) {
        highestScore = score;
        bestVoice = voice;
      }
    }

    // Fallback: If no language-specific voice was found (e.g. Marathi missing on some Windows builds), pick best Indian English or available neural voice
    if (!bestVoice) {
      bestVoice =
        this.voices.find(v => v.lang.includes('IN') || v.name.toLowerCase().includes('india')) ||
        this.voices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural')) ||
        this.voices[0];
    }

    return bestVoice;
  }

  /**
   * Speak text out loud with natural human cadence in the target language (Marathi, Hindi, Telugu, English)
   */
  speak(text: string, lang?: SupportedLanguage, onEnd?: () => void) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    const targetLang = lang || this.currentLanguage;
    const cleanSpeech = this.cleanTextForSpeech(text);
    if (!cleanSpeech) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(cleanSpeech);

      // Human cadence tuning:
      // Slightly lower rate gives natural conversational breathing room instead of robotic speed
      utterance.rate = 0.92;
      // Warm, natural pitch
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
      if (langConfig) {
        utterance.lang = langConfig.speechLocale;
      }

      const voice = this.getBestVoiceForLanguage(targetLang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      this.synth.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Play futuristic wake sound for "Hey Vision"
   */
  playWakeChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio failure if user has not interacted
    }
  }

  /**
   * Play camera shutter chime when smart glasses take a photo
   */
  playShutterChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  /**
   * Play confirmation beep for saving observation / task
   */
  playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playNote(523.25, now, 0.12); // C5
      playNote(659.25, now + 0.1, 0.18); // E5
    } catch {
      // Ignore
    }
  }

  /**
   * Start listening for voice input using Web Speech Recognition in the selected language
   */
  startListening(options: {
    lang?: SupportedLanguage;
    onStart?: () => void;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (errorMsg: string) => void;
    onEnd?: () => void;
  }): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (options.onError) {
        options.onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      }
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set speech recognition locale according to selected language
      const targetLang = options.lang || this.currentLanguage;
      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
      recognition.lang = langConfig ? langConfig.speechLocale : 'en-IN';

      recognition.onstart = () => {
        if (options.onStart) options.onStart();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            options.onResult(transcript, true);
            return;
          } else {
            interim += transcript;
          }
        }
        if (interim) {
          options.onResult(interim, false);
        }
      };

      recognition.onerror = (event: any) => {
        if (options.onError) {
          options.onError(
            event.error === 'not-allowed'
              ? 'Microphone permission denied.'
              : `Speech error: ${event.error}`
          );
        }
      };

      recognition.onend = () => {
        if (options.onEnd) options.onEnd();
      };

      this.recognition = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      if (options.onError) {
        options.onError(err?.message || 'Could not start voice recognition.');
      }
      return false;
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
  }
}

export const speechService = new SpeechService();
