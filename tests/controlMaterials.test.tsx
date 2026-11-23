import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { FloatingSurface } from '../src/components/common/FloatingSurface';
import { Button } from '../src/components/common/Button';

jest.mock('expo-glass-effect', () => ({
  GlassView: jest.requireActual('react-native').View,
  isGlassEffectAPIAvailable: () => true,
  isLiquidGlassAvailable: jest.fn(),
}));

it('retains a busy button label and prevents another submission', async () => {
  await render(<Button title="Save collection" onPress={jest.fn()} loading />);
  expect(screen.getByRole('button', { name: 'Save collection', disabled: true, busy: true })).toBeTruthy();
  expect(screen.getByText('Save collection')).toBeTruthy();
});

it('resolves transparency conservatively and tracks preference changes', async () => {
  const platform = jest.replaceProperty(Platform, 'OS', 'ios');
  jest.mocked(isLiquidGlassAvailable).mockReturnValue(true);
  let resolve!: (value: boolean) => void;
  const query = jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockImplementation(() => new Promise(r => { resolve = r; }));
  const subscribe = jest.spyOn(AccessibilityInfo, 'addEventListener');
  try {
    const view = await render(<FloatingSurface />);
    const hasGlass = () => JSON.stringify(view.toJSON()).includes('"glassEffectStyle"');
    expect(hasGlass()).toBe(false);
    await act(() => resolve(false));
    expect(hasGlass()).toBe(true);
    const listener = subscribe.mock.calls.find(([event]) => event === 'reduceTransparencyChanged')![1];
    await act(() => listener(true));
    expect(hasGlass()).toBe(false);
    jest.mocked(isLiquidGlassAvailable).mockReturnValue(false);
    await view.rerender(<FloatingSurface />);
    expect(hasGlass()).toBe(false);
  } finally {
    query.mockRestore();
    subscribe.mockRestore();
    platform.restore();
  }
});
