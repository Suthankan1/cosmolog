import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export const ASTRONOMY_CONTEXT_STRINGS: string[] = [
  'Jupiter',
  'Saturn',
  'Mars',
  'Moon',
  'NASA',
  'APOD',
  'Hubble',
  'James Webb',
  'SpaceX',
  'Artemis',
  'telescope',
  'nebula',
  'galaxy',
  'observatory',
  'supernova',
  'celestial',
  'asteroid',
  'comet',
  'orbit',
  'constellation',
  'field note',
  'spectrum',
  'aurora',
];

export interface SpeechPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

export async function checkSpeechPermissions(): Promise<SpeechPermissionStatus> {
  try {
    const status = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    return {
      granted: Boolean(status.granted),
      canAskAgain: Boolean(status.canAskAgain),
    };
  } catch {
    return { granted: false, canAskAgain: true };
  }
}

export async function requestSpeechPermissions(): Promise<boolean> {
  try {
    const status = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return Boolean(status.granted);
  } catch {
    return false;
  }
}

export async function supportsOfflineRecognition(): Promise<boolean> {
  try {
    if (typeof ExpoSpeechRecognitionModule.supportsOnDeviceRecognition === 'function') {
      return Boolean(ExpoSpeechRecognitionModule.supportsOnDeviceRecognition());
    }
    return false;
  } catch {
    return false;
  }
}

export function cleanTranscript(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}
