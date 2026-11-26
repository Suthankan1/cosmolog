import { renderHook, act } from '@testing-library/react-native';
import { useVoiceToText } from '../src/hooks/useVoiceToText';
import {
  checkSpeechPermissions,
  cleanTranscript,
  requestSpeechPermissions,
  supportsOfflineRecognition,
} from '../src/services/voice/speechService';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

describe('Speech Service & useVoiceToText Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__mockSpeechRecognition.clear();
  });

  describe('speechService utilities', () => {
    it('checks speech permissions successfully', async () => {
      const perms = await checkSpeechPermissions();
      expect(perms.granted).toBe(true);
      expect(ExpoSpeechRecognitionModule.getPermissionsAsync).toHaveBeenCalled();
    });

    it('requests speech permissions successfully', async () => {
      const granted = await requestSpeechPermissions();
      expect(granted).toBe(true);
      expect(ExpoSpeechRecognitionModule.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('checks offline recognition capability', async () => {
      const supported = await supportsOfflineRecognition();
      expect(supported).toBe(true);
    });

    it('cleans transcripts with excess whitespace correctly', () => {
      expect(cleanTranscript('  Jupiter   observation  note  ')).toBe(
        'Jupiter observation note'
      );
    });
  });

  describe('useVoiceToText hook lifecycle', () => {
    it('starts listening and updates state when startListening is called', async () => {
      const onTranscript = jest.fn();
      const { result, unmount } = await renderHook(() =>
        useVoiceToText({ onTranscriptChange: onTranscript })
      );

      expect(result.current.isListening).toBe(false);

      await act(async () => {
        await result.current.startListening();
      });

      expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalled();
      expect(result.current.isListening).toBe(true);
      expect(result.current.error).toBeNull();

      await act(async () => {
        result.current.stopListening();
      });
      await unmount();
    });

    it('emits transcribed text via onTranscriptChange when result event is fired', async () => {
      const onTranscript = jest.fn();
      const { result, unmount } = await renderHook(() =>
        useVoiceToText({ onTranscriptChange: onTranscript })
      );

      await act(async () => {
        await result.current.startListening();
      });

      await act(async () => {
        (global as any).__mockSpeechRecognition.emit('result', {
          isFinal: false,
          results: [{ transcript: 'Saturn rings' }],
        });
      });

      expect(onTranscript).toHaveBeenCalledWith('Saturn rings', false);

      await act(async () => {
        (global as any).__mockSpeechRecognition.emit('result', {
          isFinal: true,
          results: [{ transcript: 'Saturn rings observation complete.' }],
        });
      });

      expect(onTranscript).toHaveBeenCalledWith(
        'Saturn rings observation complete.',
        true
      );

      await act(async () => {
        result.current.stopListening();
      });
      await unmount();
    });

    it('stops listening when stopListening is invoked', async () => {
      const onTranscript = jest.fn();
      const { result, unmount } = await renderHook(() =>
        useVoiceToText({ onTranscriptChange: onTranscript })
      );

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);

      await act(async () => {
        result.current.stopListening();
      });

      expect(ExpoSpeechRecognitionModule.stop).toHaveBeenCalled();
      expect(result.current.isListening).toBe(false);

      await unmount();
    });

    it('handles permission rejection gracefully', async () => {
      (
        ExpoSpeechRecognitionModule.requestPermissionsAsync as jest.Mock
      ).mockResolvedValueOnce({ granted: false, status: 'denied', canAskAgain: false });

      const onError = jest.fn();
      const { result, unmount } = await renderHook(() =>
        useVoiceToText({
          onTranscriptChange: jest.fn(),
          onError,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(false);
      expect(result.current.error).toBe(
        'Microphone permission is required for voice input.'
      );
      expect(onError).toHaveBeenCalledWith(
        'Microphone permission is required for voice input.'
      );

      await unmount();
    });
  });
});
