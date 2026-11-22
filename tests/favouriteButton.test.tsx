import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { FavouriteButton } from '../src/components/common/FavouriteButton';

describe('FavouriteButton Component (Reanimated Bonus Interaction)', () => {
  it('renders with appropriate accessibility state when not saved', async () => {
    await render(<FavouriteButton isSaved={false} onToggle={jest.fn()} />);

    const button = screen.getByLabelText('Save to The Field Shelf');
    expect(button).toBeTruthy();
  });

  it('renders with appropriate accessibility state when saved', async () => {
    await render(<FavouriteButton isSaved={true} onToggle={jest.fn()} />);

    const button = screen.getByLabelText('Remove from The Field Shelf');
    expect(button).toBeTruthy();
  });

  it('triggers onToggle callback when pressed', async () => {
    const onToggleMock = jest.fn();
    await render(<FavouriteButton isSaved={false} onToggle={onToggleMock} />);

    const button = screen.getByLabelText('Save to The Field Shelf');
    await fireEvent.press(button);

    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});

it('confirms a save without playing the spring when reduced motion is on', async () => {
  const motion = jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
  const spring = jest.spyOn(Reanimated, 'withSpring');
  try {
    const onToggle = jest.fn();
    const view = await render(<FavouriteButton isSaved={false} onToggle={onToggle} />);
    await fireEvent.press(screen.getByLabelText('Save to The Field Shelf'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    await view.rerender(<FavouriteButton isSaved onToggle={onToggle} />);
    expect(screen.getByLabelText('Remove from The Field Shelf')).toBeTruthy();
    expect(spring).not.toHaveBeenCalled();
  } finally {
    motion.mockRestore();
    spring.mockRestore();
  }
});
