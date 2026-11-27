/**
 * useReadAloud Hook (F11)
 *
 * Provides React lifecycle bindings for narrationController:
 * - Subscribes to live state.
 * - Automatically stops narration when the screen unmounts or blurs.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  narrationController,
  NarrationOptions,
  NarrationState,
} from '../services/voice/narrationService';

export interface UseReadAloudReturn {
  state: NarrationState;
  isSpeaking: boolean;
  isPaused: boolean;
  isBusy: boolean;
  rate: number;
  currentChunkIndex: number;
  totalChunks: number;
  error: string | null;
  play: (title: string, text: string, options?: NarrationOptions) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  togglePlayPause: (title: string, text: string, options?: NarrationOptions) => Promise<void>;
  setRate: (rate: number) => void;
}

export function useReadAloud(autoStopOnUnmount = true): UseReadAloudReturn {
  const [state, setState] = useState<NarrationState>(narrationController.getState());

  useEffect(() => {
    const unsubscribe = narrationController.subscribe(newState => {
      setState(newState);
    });
    return () => {
      unsubscribe();
      if (autoStopOnUnmount) {
        void narrationController.stop();
      }
    };
  }, [autoStopOnUnmount]);

  const play = useCallback(
    async (title: string, text: string, options?: NarrationOptions) => {
      await narrationController.start(title, text, options);
    },
    []
  );

  const pause = useCallback(async () => {
    await narrationController.pause();
  }, []);

  const resume = useCallback(async () => {
    await narrationController.resume();
  }, []);

  const stop = useCallback(async () => {
    await narrationController.stop();
  }, []);

  const setRate = useCallback((rate: number) => {
    narrationController.setRate(rate);
  }, []);

  const togglePlayPause = useCallback(
    async (title: string, text: string, options?: NarrationOptions) => {
      if (state.status === 'speaking') {
        await narrationController.pause();
      } else if (state.status === 'paused') {
        await narrationController.resume();
      } else {
        await narrationController.start(title, text, options);
      }
    },
    [state.status]
  );

  return {
    state,
    isSpeaking: state.status === 'speaking',
    isPaused: state.status === 'paused',
    isBusy: state.status === 'speaking' || state.status === 'paused',
    rate: state.rate,
    currentChunkIndex: state.currentChunkIndex,
    totalChunks: state.totalChunks,
    error: state.error,
    play,
    pause,
    resume,
    stop,
    togglePlayPause,
    setRate,
  };
}
