/**
 * Accessible Read Aloud Speech Synthesis Service (F11)
 *
 * Coordinates speech synthesis using expo-speech with:
 * - Bounded text chunking (splits long articles cleanly by sentences).
 * - Rate selection (0.8x, 1.0x, 1.25x, 1.5x) with safe defaults.
 * - Stale callback cancellation via session tokens.
 * - Mutual coordination with speech recognition (no acoustic feedback).
 * - Stop on screen blur, route change, or logout.
 * - Disclosures regarding iOS silent mode and publisher summary limits.
 */

import * as Speech from 'expo-speech';

export type NarrationStatus = 'idle' | 'speaking' | 'paused' | 'stopped' | 'error';

export interface NarrationState {
  status: NarrationStatus;
  title: string | null;
  currentChunkIndex: number;
  totalChunks: number;
  rate: number;
  voiceId: string | null;
  error: string | null;
}

export interface NarrationOptions {
  rate?: number;
  voiceId?: string | null;
  language?: string;
  onChunkChange?: (chunkIndex: number, totalChunks: number) => void;
  onFinished?: () => void;
  onError?: (error: string) => void;
}

// Bounded sentence chunker ensuring chunks stay under ~350 characters
export function chunkTextForNarration(text: string, maxChunkLength = 350): string[] {
  const normalized = text.trim().replace(/\r\n/g, '\n');
  if (!normalized) return [];

  // Split by paragraphs first
  const rawParagraphs = normalized.split(/\n\s*\n/);
  const chunks: string[] = [];

  for (const para of rawParagraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (trimmedPara.length <= maxChunkLength) {
      chunks.push(trimmedPara);
      continue;
    }

    // Split long paragraphs by sentence boundaries (. ! ?)
    const sentences = trimmedPara.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [trimmedPara];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if ((currentChunk + ' ' + trimmedSentence).trim().length <= maxChunkLength) {
        currentChunk = (currentChunk + ' ' + trimmedSentence).trim();
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        if (trimmedSentence.length <= maxChunkLength) {
          currentChunk = trimmedSentence;
        } else {
          // Fallback: split very long sentence by words
          const words = trimmedSentence.split(/\s+/);
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + ' ' + word).trim().length <= maxChunkLength) {
              wordChunk = (wordChunk + ' ' + word).trim();
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = word;
            }
          }
          currentChunk = wordChunk;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }
  }

  return chunks;
}

class NarrationService {
  private state: NarrationState = {
    status: 'idle',
    title: null,
    currentChunkIndex: 0,
    totalChunks: 0,
    rate: 1.0,
    voiceId: null,
    error: null,
  };

  private activeSessionId = 0;
  private currentChunks: string[] = [];
  private listeners: Set<(state: NarrationState) => void> = new Set();
  private options: NarrationOptions = {};

  // External stop hook for voice recognition to coordinate without mutual audio feedback
  private recognitionStopper: (() => void) | null = null;

  public registerRecognitionStopper(stopper: () => void) {
    this.recognitionStopper = stopper;
  }

  public unregisterRecognitionStopper() {
    this.recognitionStopper = null;
  }

  public getState(): NarrationState {
    return { ...this.state };
  }

  public subscribe(listener: (state: NarrationState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      listener(currentState);
    }
  }

  public async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      if (typeof Speech.getAvailableVoicesAsync === 'function') {
        return await Speech.getAvailableVoicesAsync();
      }
      return [];
    } catch {
      return [];
    }
  }

  public isSpeaking(): boolean {
    return this.state.status === 'speaking';
  }

  public isPaused(): boolean {
    return this.state.status === 'paused';
  }

  public isBusy(): boolean {
    return this.state.status === 'speaking' || this.state.status === 'paused';
  }

  public async start(
    title: string,
    text: string,
    options: NarrationOptions = {}
  ): Promise<void> {
    // 1. If voice recognition is currently listening, stop it first to prevent feedback
    if (this.recognitionStopper) {
      try {
        this.recognitionStopper();
      } catch {
        // Ignore
      }
    }

    // 2. Stop any existing playback and increment session token
    await this.stop();
    this.activeSessionId++;
    const sessionId = this.activeSessionId;

    this.options = options;
    const rate = options.rate ?? this.state.rate ?? 1.0;
    const voiceId = options.voiceId ?? this.state.voiceId;

    const chunks = chunkTextForNarration(text);
    if (chunks.length === 0) {
      this.state = {
        ...this.state,
        status: 'error',
        error: 'No text available to read aloud.',
      };
      this.notify();
      options.onError?.('No text available to read aloud.');
      return;
    }

    this.currentChunks = chunks;
    this.state = {
      status: 'speaking',
      title,
      currentChunkIndex: 0,
      totalChunks: chunks.length,
      rate,
      voiceId,
      error: null,
    };
    this.notify();

    await this.speakChunk(0, sessionId);
  }

  private async speakChunk(index: number, sessionId: number): Promise<void> {
    if (sessionId !== this.activeSessionId) return;
    if (index >= this.currentChunks.length) {
      this.state = {
        ...this.state,
        status: 'idle',
        currentChunkIndex: this.currentChunks.length,
      };
      this.notify();
      this.options.onFinished?.();
      return;
    }

    this.state = {
      ...this.state,
      currentChunkIndex: index,
      status: 'speaking',
    };
    this.notify();
    this.options.onChunkChange?.(index, this.currentChunks.length);

    const chunkText = this.currentChunks[index];
    const language = this.options.language || 'en-US';

    try {
      Speech.speak(chunkText, {
        language,
        rate: this.state.rate,
        voice: this.state.voiceId ?? undefined,
        onDone: () => {
          if (sessionId !== this.activeSessionId) return;
          void this.speakChunk(index + 1, sessionId);
        },
        onStopped: () => {
          if (sessionId !== this.activeSessionId) return;
          this.state = { ...this.state, status: 'stopped' };
          this.notify();
        },
        onError: (err: unknown) => {
          if (sessionId !== this.activeSessionId) return;
          const msg = err instanceof Error ? err.message : 'Speech synthesis encountered an error.';
          this.state = { ...this.state, status: 'error', error: msg };
          this.notify();
          this.options.onError?.(msg);
        },
      });
    } catch (err: unknown) {
      if (sessionId !== this.activeSessionId) return;
      const msg = err instanceof Error ? err.message : 'Speech synthesis failed to launch.';
      this.state = { ...this.state, status: 'error', error: msg };
      this.notify();
      this.options.onError?.(msg);
    }
  }

  public async pause(): Promise<void> {
    if (this.state.status !== 'speaking') return;

    try {
      if (typeof Speech.pause === 'function') {
        await Speech.pause();
        this.state = { ...this.state, status: 'paused' };
        this.notify();
      } else {
        // Platform does not support native pause; fallback to stop
        await this.stop();
      }
    } catch {
      await this.stop();
    }
  }

  public async resume(): Promise<void> {
    if (this.state.status !== 'paused') return;

    try {
      if (typeof Speech.resume === 'function') {
        await Speech.resume();
        this.state = { ...this.state, status: 'speaking' };
        this.notify();
      } else {
        // Fallback: resume from current chunk index
        const sessionId = this.activeSessionId;
        await this.speakChunk(this.state.currentChunkIndex, sessionId);
      }
    } catch {
      await this.stop();
    }
  }

  public async stop(): Promise<void> {
    this.activeSessionId++;
    try {
      await Speech.stop();
    } catch {
      // Ignore errors when already stopped
    }
    this.state = {
      ...this.state,
      status: 'idle',
      currentChunkIndex: 0,
      totalChunks: 0,
      title: null,
      error: null,
    };
    this.notify();
  }

  public setRate(rate: number): void {
    const validRate = Math.min(Math.max(rate, 0.5), 2.0);
    this.state = { ...this.state, rate: validRate };
    this.notify();
  }
}

export const narrationController = new NarrationService();
