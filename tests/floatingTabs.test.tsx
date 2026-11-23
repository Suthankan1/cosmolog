import { act, render, screen } from '@testing-library/react-native';
import { Keyboard, Platform } from 'react-native';
import TabLayout from '../app/(tabs)/_layout';

jest.mock('expo-glass-effect', () => ({}));
jest.mock('expo-router/js-tabs', () => {
  const { Text: Label } = jest.requireActual('react-native');
  function Tabs({ tabBar }: { tabBar: (props: object) => React.ReactNode }) {
    return tabBar({});
  }
  Tabs.Screen = function Screen() { return null; };
  return { Tabs, BottomTabBar: () => <Label>Destinations</Label> };
});

it('removes the tabs from accessibility while typing and restores them after dismissal', async () => {
  const subscribe = jest.spyOn(Keyboard, 'addListener');
  try {
    await render(<TabLayout />);
    expect(screen.getByText('Destinations')).toBeTruthy();
    const change = async (event: string) => {
      const listener = subscribe.mock.calls.find(([name]) => name === event)![1];
      await act(() => listener({} as Parameters<typeof listener>[0]));
    };
    await change(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow');
    expect(screen.queryByText('Destinations')).toBeNull();
    await change(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide');
    expect(screen.getByText('Destinations')).toBeTruthy();
  } finally {
    subscribe.mockRestore();
  }
});
