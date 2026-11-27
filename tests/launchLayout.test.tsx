import { fireEvent, render, screen } from '@testing-library/react-native';
import RootLayout from '../app/_layout';
import { useFonts } from 'expo-font';

let mockRestoring = true;
const mockDispatch = jest.fn();
jest.mock('../src/store', () => ({
  store: {},
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector?: (state: any) => any) => {
    const state = { auth: { user: null, isAuthenticated: false, isInitialSessionLoading: mockRestoring } };
    return selector ? selector(state) : state.auth;
  },
}));
jest.mock('react-redux', () => ({ Provider: ({ children }: React.PropsWithChildren) => children }));
jest.mock('../src/store/archiveLifecycle', () => ({ useArchiveLifecycle: jest.fn() }));
jest.mock('../src/store/slices/authSlice', () => ({ restoreSessionThunk: () => 'restore' }));
jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: async () => {}, hideAsync: async () => {} }));
jest.mock('expo-router', () => ({ Stack: Object.assign(() => null, { Screen: () => null, Protected: () => null }) }));
jest.mock('../src/components/common/BrandReveal', () => {
  const { Text } = jest.requireActual('react-native');
  return { BrandReveal: ({ destinationReady, onFinish }: { destinationReady: boolean; onFinish: () => void }) =>
    <Text onPress={onFinish}>{destinationReady ? 'Destination ready' : 'Waiting'}</Text> };
});

it.each([true, false])('waits for both local boots and route layout (fonts first %s)', async fontsFirst => {
  mockRestoring = fontsFirst;
  jest.mocked(useFonts).mockReturnValue([fontsFirst, null]);
  const view = await render(<RootLayout />);
  expect(mockDispatch).toHaveBeenCalledWith('restore');
  expect(screen.getByText('Waiting')).toBeTruthy();
  expect(screen.queryByTestId('launch-destination', { includeHiddenElements: true })).toBeNull();
  mockRestoring = false;
  jest.mocked(useFonts).mockReturnValue([true, null]);
  await view.rerender(<RootLayout />);
  const route = screen.getByTestId('launch-destination', { includeHiddenElements: true });
  expect(route.props.pointerEvents).toBe('none');
  await fireEvent(route, 'layout', {});
  await fireEvent.press(screen.getByText('Destination ready'));
  expect(screen.getByTestId('launch-destination').props.pointerEvents).toBe('auto');
});
