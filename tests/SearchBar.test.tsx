import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { SearchBar } from '../src/components/discovery/SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__mockSpeechRecognition.clear();
  });

  it('renders input with placeholder', async () => {
    await render(<SearchBar value="" onChangeText={jest.fn()} />);

    expect(screen.getByPlaceholderText('Search celestial observations...')).toBeTruthy();
  });

  it('renders clear button when value is non-empty and triggers clear', async () => {
    const onClearMock = jest.fn();
    const onChangeTextMock = jest.fn();

    await render(
      <SearchBar
        value="Jupiter"
        onChangeText={onChangeTextMock}
        onClear={onClearMock}
      />
    );

    const clearBtn = screen.getByLabelText('Clear search input');
    expect(clearBtn).toBeTruthy();

    await fireEvent.press(clearBtn);
    expect(onClearMock).toHaveBeenCalledTimes(1);
  });

  it('renders voice search button and toggles listening state on press', async () => {
    const onChangeTextMock = jest.fn();

    await render(
      <SearchBar
        value=""
        onChangeText={onChangeTextMock}
        enableVoice={true}
      />
    );

    const voiceBtn = screen.getByTestId('search-voice-button');
    expect(voiceBtn).toBeTruthy();
    expect(voiceBtn.props.accessibilityLabel).toBe('Search with voice');

    await act(async () => {
      fireEvent.press(voiceBtn);
      await Promise.resolve();
    });

    expect(screen.getByTestId('search-voice-button').props.accessibilityLabel).toBe(
      'Stop voice search'
    );
    expect(screen.getByPlaceholderText('Listening... speak now')).toBeTruthy();

    // Emit live transcript
    await act(async () => {
      (global as any).__mockSpeechRecognition.emit('result', {
        isFinal: false,
        results: [{ transcript: 'James Webb' }],
      });
      await Promise.resolve();
    });

    expect(onChangeTextMock).toHaveBeenCalledWith('James Webb');

    // Press again to stop
    await act(async () => {
      fireEvent.press(screen.getByTestId('search-voice-button'));
      await Promise.resolve();
    });

    expect(screen.getByTestId('search-voice-button').props.accessibilityLabel).toBe(
      'Search with voice'
    );
  });
});
