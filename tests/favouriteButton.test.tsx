import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
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
    fireEvent.press(button);

    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});
