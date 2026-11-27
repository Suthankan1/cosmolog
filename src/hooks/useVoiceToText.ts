import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import {
  ASTRONOMY_CONTEXT_STRINGS,
  cleanTranscript,
  requestSpeechPermissions,
  supportsOfflineRecognition,
} from '../services/voice/speechService';
import { narrationController } from '../services/voice/narrationService';

export interface UseVoiceToTextOptions {
  onTranscriptChange: (text: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  lang?: string;
  continuous?: boolean;
  addsPunctuation?: boolean;
  contextualStrings?: string[];
  preferOffline?: boolean;
}

export interface UseVoiceToTextReturn {
  isListening: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearError: () => void;
}

export function useVoiceToText({
  onTranscriptChange,
  onError,
  lang = 'en-US',
  continuous = false,
  addsPunctuation = true,
  contextualStrings = ASTRONOMY_CONTEXT_STRINGS,
  preferOffline = false,
}: UseVoiceToTextOptions): UseVoiceToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const onTranscriptRef = useRef(onTranscriptChange);
  const onErrorRef = useRef(onError);
  const listeningRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscriptChange;
    onErrorRef.current = onError;
    listeningRef.current = isListening;
  }, [onTranscriptChange, onError, isListening]);

  useSpeechRecognitionEvent('start', () => {
    if (!mountedRef.current) return;
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    if (!mountedRef.current) return;
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (!mountedRef.current) return;
    const rawTranscript = event.results[0]?.transcript ?? '';
    const cleaned = cleanTranscript(rawTranscript);
    if (cleaned) {
      onTranscriptRef.current(cleaned, Boolean(event.isFinal));
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (!mountedRef.current) return;
    setIsListening(false);
    // 'no-speech' happens when the user pauses or stops speaking, which is normal
    if (event.error === 'no-speech') {
      return;
    }
    const message =
      event.message ||
      (event.error === 'not-allowed'
        ? 'Microphone access was denied.'
        : event.error === 'network'
        ? 'Network error during speech recognition.'
        : 'Could not recognize speech. Please try again.');
    setError(message);
    onErrorRef.current?.(message);
  });

  const startListening = useCallback(async () => {
    try {
      // Coordinate with Read Aloud: stop any ongoing narration before starting microphone listening
      await narrationController.stop();

      setError(null);
      const hasPermission = await requestSpeechPermissions();
      if (!hasPermission) {
        const permError = 'Microphone permission is required for voice input.';
        setError(permError);
        onErrorRef.current?.(permError);
        return;
      }

      const onDeviceSupported = await supportsOfflineRecognition();
      const requiresOnDevice = preferOffline && onDeviceSupported;

      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous,
        addsPunctuation,
        contextualStrings,
        ...(requiresOnDevice ? { requiresOnDeviceRecognition: true } : {}),
      });
    } catch (err: unknown) {
      setIsListening(false);
      const message = err instanceof Error ? err.message : 'Failed to start speech recognition.';
      setError(message);
      onErrorRef.current?.(message);
    }
  }, [lang, continuous, addsPunctuation, contextualStrings, preferOffline]);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Ignore errors when stopping
    } finally {
      setIsListening(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (listeningRef.current) {
        try {
          ExpoSpeechRecognitionModule.abort();
        } catch {
          // Ignore errors on unmount
        }
      }
    };
  }, []);

  return {
    isListening,
    error,
    startListening,
    stopListening,
    clearError,
  };
}
