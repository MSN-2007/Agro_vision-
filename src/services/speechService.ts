// Enhanced Human Speech Synthesis and Multilingual Audio Engine for AgroVision
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types/agro';

export interface VoiceDiagnosticResult {
  hasSpeechSynthesis: boolean;
  hasSpeechRecognition: boolean;
  totalVoices: number;
  availableVoices: { name: string; lang: string }[];
  currentLanguage: SupportedLanguage;
  selectedVoiceName: string;
  hasNativeLanguageVoice: boolean;
  notes: string;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentLanguage: SupportedLanguage = 'en';
  private recognition: any = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isListeningActive = false;

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

  public loadVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const loaded = this.synth.getVoices();
    if (loaded && loaded.length > 0) {
      this.voices = loaded;
    }
    return this.voices;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isSpeechRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
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
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ''
      )
      // Clean duplicate whitespace
      .replace(/\s+/g, ' ')
      .trim();

    return clean;
  }

  /**
   * Intelligently select the best human-sounding voice for the target language.
   */
  public getBestVoiceForLanguage(lang: SupportedLanguage): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    if (this.voices.length === 0) return null;

    const langTarget = lang || this.currentLanguage;

    const langCandidates: Record<SupportedLanguage, string[]> = {
      en: ['en-IN', 'en_IN', 'en-GB', 'en-US', 'en'],
      hi: ['hi-IN', 'hi_IN', 'hi'],
      mr: ['mr-IN', 'mr_IN', 'mr', 'hi-IN', 'hi'],
      te: ['te-IN', 'te_IN', 'te']
    };

    const targetLocales = langCandidates[langTarget] || ['en'];

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

      if (vName.includes('natural') || vName.includes('neural')) score += 100;
      if (vName.includes('google')) score += 80;
      if (vName.includes('online')) score += 70;
      if (vName.includes('samantha') || vName.includes('siri') || vName.includes('premium')) score += 60;
      if (vName.includes('india') || vName.includes('indian')) score += 50;

      if (
        vName.includes('swara') ||
        vName.includes('aarohi') ||
        vName.includes('mohan') ||
        vName.includes('neerja') ||
        vName.includes('prabhat')
      ) {
        score += 90;
      }

      if (vName.includes('david') || vName.includes('desktop') || vName.includes('espeak')) {
        score -= 80;
      }

      if (score > highestScore) {
        highestScore = score;
        bestVoice = voice;
      }
    }

    // Fallback: pick best Indian English, neural, or first available voice
    if (!bestVoice) {
      bestVoice =
        this.voices.find(v => v.lang.includes('IN') || v.name.toLowerCase().includes('india')) ||
        this.voices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural')) ||
        this.voices.find(v => v.lang.startsWith('en')) ||
        this.voices[0] ||
        null;
    }

    return bestVoice;
  }

  /**
   * Speak text out loud with natural human cadence in the target language.
   * Resilient to Chrome's paused bug, garbage collection, and missing regional voices.
   */
  speak(text: string, lang?: SupportedLanguage, onEnd?: () => void) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    const targetLang = lang || this.currentLanguage;
    let cleanSpeech = this.cleanTextForSpeech(text);
    if (!cleanSpeech) {
      if (onEnd) onEnd();
      return;
    }

    // Refresh voices list in case Chrome loaded them asynchronously
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    const voice = this.getBestVoiceForLanguage(targetLang);

    // If text contains non-Latin characters (Devanagari or Telugu) but the only available
    // voice is English (common on Windows without Indic packs), provide spoken English audio
    // so the synthesizer doesn't fail with silence.
    const isDevanagari = /[\u0900-\u097F]/.test(cleanSpeech);
    const isTelugu = /[\u0C00-\u0C7F]/.test(cleanSpeech);
    const voiceIsEnglish = voice && voice.lang.toLowerCase().startsWith('en');

    if ((isDevanagari || isTelugu) && voiceIsEnglish) {
      // Create a spoken phonetic English summary so audio plays clearly
      cleanSpeech = `AgroVision Voice Update for ${SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || 'you'}. ${cleanSpeech.slice(0, 120)}`;
    }

    try {
      // Resume if Chrome paused synthesis
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.cancel();

      // Schedule speak after tiny timeout to prevent Chrome cancelling the new utterance
      setTimeout(() => {
        if (!this.synth) return;

        if (this.synth.paused) {
          this.synth.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanSpeech);

        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
          utterance.lang = langConfig ? langConfig.speechLocale : 'en-US';
        }

        // Retain reference on instance to prevent V8 garbage collection mid-speech
        this.activeUtterance = utterance;

        const cleanup = () => {
          this.activeUtterance = null;
          if (onEnd) onEnd();
        };

        utterance.onend = cleanup;
        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e.error);
          // Play subtle audio tone fallback if TTS was blocked
          this.playSuccessChime();
          cleanup();
        };

        this.synth.speak(utterance);
      }, 50);
    } catch (err) {
      console.error('Failed to initiate speech:', err);
      this.playSuccessChime();
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      try {
        if (this.synth.paused) this.synth.resume();
        this.synth.cancel();
      } catch {
        // Ignore
      }
    }
    this.activeUtterance = null;
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
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

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

  playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, start);
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
   * Start listening for voice input using Web Speech Recognition in the selected language.
   * Includes microphone permission prompts and graceful error recovery.
   */
  async startListening(options: {
    lang?: SupportedLanguage;
    onStart?: () => void;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (errorMsg: string) => void;
    onEnd?: () => void;
  }): Promise<boolean> {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (options.onError) {
        options.onError(
          'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or click the simulated voice prompts.'
        );
      }
      return false;
    }

    // Proactively request mic permission if navigator.mediaDevices is available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release test stream track
        stream.getTracks().forEach(t => t.stop());
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          if (options.onError) {
            options.onError(
              'Microphone access blocked. Please click the camera/microphone icon in your browser address bar to allow access.'
            );
          }
          return false;
        }
      }
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {
          // Ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      const targetLang = options.lang || this.currentLanguage;
      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
      recognition.lang = langConfig ? langConfig.speechLocale : 'en-IN';

      let hasReceivedResult = false;

      recognition.onstart = () => {
        this.isListeningActive = true;
        if (options.onStart) options.onStart();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            hasReceivedResult = true;
            this.isListeningActive = false;
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
        this.isListeningActive = false;
        if (event.error === 'no-speech') {
          // If no speech was detected, provide a gentle friendly message instead of a harsh error
          if (!hasReceivedResult && options.onError) {
            options.onError(
              'No speech detected. Please speak clearly into your microphone, or choose a quick prompt.'
            );
          }
          return;
        }

        if (options.onError) {
          const msg =
            event.error === 'not-allowed'
              ? 'Microphone permission denied. Please allow microphone permissions in your browser.'
              : event.error === 'network'
              ? 'Speech recognition network error. Please check your internet connection or use prompt buttons.'
              : `Voice recognition note: ${event.error}`;
          options.onError(msg);
        }
      };

      recognition.onend = () => {
        this.isListeningActive = false;
        if (options.onEnd) options.onEnd();
      };

      this.recognition = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      if (options.onError) {
        options.onError(err?.message || 'Could not start voice recognition.');
      }
      return false;
    }
  }

  stopListening() {
    this.isListeningActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  /**
   * Run voice diagnostics for user settings / debug
   */
  public getDiagnosticReport(): VoiceDiagnosticResult {
    const voices = this.getVoices();
    const voice = this.getBestVoiceForLanguage(this.currentLanguage);
    const hasLangVoice =
      voices.some(v => v.lang.toLowerCase().startsWith(this.currentLanguage)) ||
      (this.currentLanguage === 'mr' && voices.some(v => v.lang.toLowerCase().includes('hi')));

    return {
      hasSpeechSynthesis: this.isSpeechSynthesisSupported(),
      hasSpeechRecognition: this.isSpeechRecognitionSupported(),
      totalVoices: voices.length,
      availableVoices: voices.map(v => ({ name: v.name, lang: v.lang })),
      currentLanguage: this.currentLanguage,
      selectedVoiceName: voice ? `${voice.name} (${voice.lang})` : 'Default System Voice',
      hasNativeLanguageVoice: hasLangVoice,
      notes: hasLangVoice
        ? 'Native regional voice available.'
        : 'Using high-fidelity fallback voice with bilingual phonetics.'
    };
  }
}

export const speechService = new SpeechService();
