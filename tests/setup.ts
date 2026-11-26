// Jest setup file for COSMOLOG tests
/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (comp: any) => comp,
    },
    useReducedMotion: () => false,
    useSharedValue: (initial: any) => require('react').useRef({ value: initial }).current,
    cancelAnimation: jest.fn(),
    interpolate: (_value: number, _input: number[], output: number[]) => output[0],
    useAnimatedStyle: (fn: () => any) => fn(),
    withTiming: (toValue: any, _config?: any, cb?: (finished: boolean) => void) => {
      if (cb) cb(true);
      return toValue;
    },
    withSpring: (toValue: any, _config?: any, cb?: (finished: boolean) => void) => {
      if (cb) cb(true);
      return toValue;
    },
    withSequence: (...anims: any[]) => anims[anims.length - 1],
    withDelay: (_delay: number, anim: any) => anim,
    Easing: {
      out: (fn: any) => fn,
      quad: (t: number) => t,
      back: (_s?: number) => (t: number) => t,
    },
    runOnJS: (fn: any) => fn,
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  useFocusEffect: (fn: any) => require('react').useEffect(fn, []),
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Mock expo-speech-recognition for Node / Jest test environments
const speechListeners: Record<string, ((event: any) => void)[]> = {};

(global as any).__mockSpeechRecognition = {
  emit: (event: string, payload: any) => {
    const list = [...(speechListeners[event] || [])];
    list.forEach((fn) => fn(payload));
  },
  clear: () => {
    Object.keys(speechListeners).forEach((k) => delete speechListeners[k]);
  },
};

jest.mock('expo-speech-recognition', () => {
  const React = require('react');
  return {
    ExpoSpeechRecognitionModule: {
      requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, status: 'granted', canAskAgain: true }),
      getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, status: 'granted', canAskAgain: true }),
      supportsOnDeviceRecognition: jest.fn().mockReturnValue(true),
      start: jest.fn(() => {
        const list = [...(speechListeners['start'] || [])];
        list.forEach((fn) => fn(null));
      }),
      stop: jest.fn(() => {
        const list = [...(speechListeners['end'] || [])];
        list.forEach((fn) => fn(null));
      }),
      abort: jest.fn(() => {
        // Abort cancels native session without emitting 'end' to listeners
      }),
    },
    useSpeechRecognitionEvent: (event: string, listener: (arg: any) => void) => {
      const listenerRef = React.useRef(listener);
      listenerRef.current = listener;
      React.useEffect(() => {
        const handler = (arg: any) => listenerRef.current(arg);
        if (!speechListeners[event]) {
          speechListeners[event] = [];
        }
        speechListeners[event].push(handler);
        return () => {
          speechListeners[event] = (speechListeners[event] || []).filter((fn) => fn !== handler);
        };
      }, [event]);
    },
  };
});

