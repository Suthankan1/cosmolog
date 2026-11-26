import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { FieldNote } from '../src/features/journal/FieldNote';

jest.mock('../src/database/repositories/favouritesRepository', () => ({
  NOTE_LIMIT: 1000,
}));

describe('FieldNote Component with Voice Dictation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__mockSpeechRecognition.clear();
  });

  it('opens note editor and starts voice dictation on press', async () => {
    const onSaveMock = jest.fn().mockResolvedValue(undefined);

    await render(<FieldNote note={null} onSave={onSaveMock} />);

    // Tap to open note editor
    const openBtn = screen.getByRole('button', { name: 'Add a note' });
    await act(async () => {
      fireEvent.press(openBtn);
      await Promise.resolve();
    });

    const dictateBtn = screen.getByTestId('field-note-dictate');
    expect(dictateBtn).toBeTruthy();
    expect(screen.getByText('Dictate observation')).toBeTruthy();

    // Start dictation
    await act(async () => {
      fireEvent.press(dictateBtn);
      await Promise.resolve();
    });

    expect(screen.getByText('Stop dictating')).toBeTruthy();
    expect(screen.getByText('Listening...')).toBeTruthy();

    // Emit live transcript
    await act(async () => {
      (global as any).__mockSpeechRecognition.emit('result', {
        isFinal: false,
        results: [{ transcript: 'Observed Great Red Spot at 21:00 UTC.' }],
      });
      await Promise.resolve();
    });

    const input = screen.getByTestId('field-note-input');
    expect(input.props.value).toBe('Observed Great Red Spot at 21:00 UTC.');

    // Finalize utterance
    await act(async () => {
      (global as any).__mockSpeechRecognition.emit('result', {
        isFinal: true,
        results: [{ transcript: 'Observed Great Red Spot at 21:00 UTC.' }],
      });
      await Promise.resolve();
    });

    // Emit a second utterance to verify concatenation
    await act(async () => {
      (global as any).__mockSpeechRecognition.emit('result', {
        isFinal: false,
        results: [{ transcript: 'Seeing was 4 out of 5.' }],
      });
      await Promise.resolve();
    });

    expect(input.props.value).toBe(
      'Observed Great Red Spot at 21:00 UTC. Seeing was 4 out of 5.'
    );

    // Stop dictation
    await act(async () => {
      fireEvent.press(screen.getByTestId('field-note-dictate'));
      await Promise.resolve();
    });

    expect(screen.getByText('Dictate observation')).toBeTruthy();

    // Save note
    const saveBtn = screen.getByRole('button', { name: 'Save note' });
    await act(async () => {
      fireEvent.press(saveBtn);
      await Promise.resolve();
    });

    expect(onSaveMock).toHaveBeenCalledWith(
      'Observed Great Red Spot at 21:00 UTC. Seeing was 4 out of 5.'
    );
  });
});
