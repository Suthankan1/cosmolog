import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { ReadAloudBar } from '../src/components/common/ReadAloudBar';
import { narrationController } from '../src/services/voice/narrationService';

describe('ReadAloudBar Component (F11)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await narrationController.stop();
  });

  it('renders Read Aloud button, badge, rate button, and audio guidance link', async () => {
    await render(
      <ReadAloudBar
        title="Webb WASP-39 b Discovery"
        textToRead="Empirical detection of carbon dioxide in an exoplanetary atmosphere."
        contentScopeLabel="Publisher summary"
      />
    );

    expect(screen.getByText('READ ALOUD · F11')).toBeTruthy();
    expect(screen.getByText('Read aloud')).toBeTruthy();
    expect(screen.getByText('Audio guidance')).toBeTruthy();
    expect(screen.getByText('1x')).toBeTruthy();
  });

  it('toggles platform audio guidance caveat when tapped', async () => {
    await render(
      <ReadAloudBar
        title="Sample Plate"
        textToRead="Short text"
        contentScopeLabel="Daily Plate"
      />
    );

    expect(screen.queryByText(/iOS Silent Switch:/)).toBeNull();

    fireEvent.press(screen.getByText('Audio guidance'));
    await waitFor(() => {
      expect(screen.getByText(/iOS Silent Switch:/)).toBeTruthy();
      expect(screen.getByText(/Content Scope:/)).toBeTruthy();
      expect(screen.getByText('Hide advice')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Hide advice'));
    await waitFor(() => {
      expect(screen.queryByText(/iOS Silent Switch:/)).toBeNull();
    });
  });

  it('cycles through rates on button press', async () => {
    await render(
      <ReadAloudBar
        title="Sample Plate"
        textToRead="Short text"
      />
    );

    expect(screen.getByText('1x')).toBeTruthy();

    fireEvent.press(screen.getByText('1x'));
    await waitFor(() => {
      expect(screen.getByText('1.25x')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('1.25x'));
    await waitFor(() => {
      expect(screen.getByText('1.5x')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('1.5x'));
    await waitFor(() => {
      expect(screen.getByText('0.8x')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('0.8x'));
    await waitFor(() => {
      expect(screen.getByText('1x')).toBeTruthy();
    });
  });

  it('invokes native speech synthesis when Read aloud is pressed', async () => {
    await render(
      <ReadAloudBar
        title="Perseids Shower"
        textToRead="Active radiant in constellation Perseus."
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Read aloud')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Read aloud'));

    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalledWith(
        'Active radiant in constellation Perseus.',
        expect.objectContaining({
          rate: 1.0,
          language: 'en-US',
        })
      );
    });
  });
});
