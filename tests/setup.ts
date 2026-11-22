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
    useSharedValue: (initial: any) => ({ value: initial }),
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
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});
