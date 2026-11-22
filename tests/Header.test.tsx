import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Header } from '../src/components/common/Header';

describe('Header Component', () => {
  it('renders title and optional subtitle', async () => {
    await render(
      <Header title="The Field Shelf" subtitle="Persistent Celestial Archive" />
    );

    expect(screen.getByText('The Field Shelf')).toBeTruthy();
    expect(screen.getByText('Persistent Celestial Archive')).toBeTruthy();
  });

  it('triggers onBack callback when back button is pressed', async () => {
    const onBackMock = jest.fn();
    await render(
      <Header title="Discovery Details" showBack onBack={onBackMock} />
    );

    const backButton = screen.getByLabelText('Go back to previous screen');
    expect(backButton).toBeTruthy();

    fireEvent.press(backButton);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
