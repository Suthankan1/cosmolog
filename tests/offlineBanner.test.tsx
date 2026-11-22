import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OfflineBanner } from '../src/components/common/OfflineBanner';

describe('OfflineBanner Component', () => {
  it('renders offline alert text and formatted sync timestamp', async () => {
    await render(
      <OfflineBanner lastSyncedAt="2026-11-22T14:00:00.000Z" />
    );

    expect(screen.getByText('Offline Field Mode')).toBeTruthy();
    expect(screen.getByText(/Last synchronized:/)).toBeTruthy();
  });

  it('triggers onRetry callback when user taps retry button', async () => {
    const onRetryMock = jest.fn();
    await render(
      <OfflineBanner
        lastSyncedAt="2026-11-22T14:00:00.000Z"
        onRetry={onRetryMock}
      />
    );

    const retryBtn = screen.getByLabelText('Retry connection and refresh feed');
    expect(retryBtn).toBeTruthy();

    fireEvent.press(retryBtn);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });
});
