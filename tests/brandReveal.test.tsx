import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as motion from 'react-native-reanimated';
import { BrandReveal } from '../src/components/common/BrandReveal';

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

it('plays for five seconds and completes once', async () => {
  const finish = jest.fn();
  await render(<BrandReveal onFinish={finish} />);
  await act(() => void jest.advanceTimersByTime(4999));
  expect(finish).not.toHaveBeenCalled();
  await act(() => void jest.advanceTimersByTime(1));
  await fireEvent.press(screen.getByLabelText('Skip introduction'));
  expect(finish).toHaveBeenCalledTimes(1);
});
it('can skip immediately and bypasses motion when requested', async () => {
  const finish = jest.fn();
  const view = await render(<BrandReveal onFinish={finish} />);
  await fireEvent.press(screen.getByLabelText('Skip introduction'));
  await act(() => void jest.advanceTimersByTime(5000));
  expect(finish).toHaveBeenCalledTimes(1);
  await view.unmount();
  jest.spyOn(motion, 'useReducedMotion').mockReturnValue(true);
  await render(<BrandReveal onFinish={finish} />);
  expect(finish).toHaveBeenCalledTimes(2);
});
