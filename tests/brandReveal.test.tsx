import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as motion from 'react-native-reanimated';
import { BrandReveal } from '../src/components/common/BrandReveal';

jest.mock('react-native-worklets', () => ({ scheduleOnRN: (fn: () => void) => fn() }));
jest.mock('expo-image', () => ({ Image: 'Image' }));

const dismissNative = jest.fn(async () => {});
const onFinish = jest.fn();
let completions: ((finished: boolean) => void)[];

function intro(destinationReady = true) {
  return <BrandReveal {...{ dismissNative, onFinish, destinationReady }} />;
}

async function handoff() {
  await fireEvent(screen.getByTestId('launch-overlay'), 'layout', {});
  expect(dismissNative).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId('launch-mark'), 'display');
  expect(dismissNative).toHaveBeenCalledTimes(1);
}

beforeEach(() => {
  completions = [];
  jest.clearAllMocks();
  jest.spyOn(motion, 'withTiming').mockImplementation((to, _config, callback) => {
    if (callback) completions.push(callback);
    return to;
  });
});
afterEach(() => { jest.restoreAllMocks(); });

it('starts after the native handoff and finishes once after the final fade', async () => {
  await render(intro());
  await handoff();
  expect(motion.withTiming).toHaveBeenCalledWith(820, expect.objectContaining({ duration: 820 }), expect.any(Function));
  await act(() => completions[0](true));
  expect(motion.withTiming).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 180 }), expect.any(Function));
  expect(onFinish).not.toHaveBeenCalled();
  await act(() => { completions[1](true); completions[1](true); });
  expect(onFinish).toHaveBeenCalledTimes(1);
});

it('holds the composition until local startup finishes even when Earth cannot decode', async () => {
  const view = await render(intro(false));
  await handoff();
  await fireEvent(screen.getByTestId('launch-earth'), 'error', {});
  expect(screen.queryByTestId('launch-earth')).toBeNull();
  await act(() => completions[0](true));
  expect(screen.getByText('Restoring your session')).toBeTruthy();
  expect(completions).toHaveLength(1);
  await view.rerender(intro());
  await act(() => completions[1](true));
  expect(onFinish).toHaveBeenCalledTimes(1);
});

it('allows Skip during the exit without double completion', async () => {
  await render(intro());
  await handoff();
  await act(() => completions[0](true));
  await fireEvent.press(screen.getByLabelText('Skip introduction'));
  await act(() => completions[1](true));
  expect(onFinish).toHaveBeenCalledTimes(1);
});

it('bypasses motion while still waiting for the route under Reduce Motion', async () => {
  jest.spyOn(motion, 'useReducedMotion').mockReturnValue(true);
  const view = await render(intro(false));
  await handoff();
  expect(screen.getByText('Restoring your session')).toBeTruthy();
  await view.rerender(intro());
  expect(completions).toHaveLength(0);
  expect(onFinish).toHaveBeenCalledTimes(1);
});

it('ignores cancelled and late callbacks after unmount', async () => {
  const view = await render(intro());
  await handoff();
  await act(() => completions[0](false));
  expect(completions).toHaveLength(1);
  await act(() => completions[0](true));
  await view.unmount();
  await act(() => completions[1](true));
  expect(onFinish).not.toHaveBeenCalled();
});
