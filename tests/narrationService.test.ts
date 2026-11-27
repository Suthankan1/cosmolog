import {
  chunkTextForNarration,
  narrationController,
} from '../src/services/voice/narrationService';

describe('narrationService (F11 Read Aloud)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await narrationController.stop();
    narrationController.unregisterRecognitionStopper();
  });

  describe('chunkTextForNarration', () => {
    it('returns empty array for empty or whitespace text', () => {
      expect(chunkTextForNarration('')).toEqual([]);
      expect(chunkTextForNarration('   \n\n   ')).toEqual([]);
    });

    it('keeps short text intact in a single chunk', () => {
      const text = 'Webb detected carbon dioxide on WASP-39 b.';
      const chunks = chunkTextForNarration(text);
      expect(chunks).toEqual([text]);
    });

    it('splits multi-sentence long text cleanly without breaking words', () => {
      const sentence1 = 'The James Webb Space Telescope observed the transmission spectrum of exoplanet WASP-39 b.';
      const sentence2 = 'A significant absorption feature was identified around 4.3 micrometers corresponding to carbon dioxide.';
      const sentence3 = 'This detection provides direct evidence of photochemical processes in a giant gas planet atmosphere.';
      const sentence4 = 'However, atmospheric carbon dioxide does not imply biological activity or habitability on gas giants.';

      const longText = `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;
      const chunks = chunkTextForNarration(longText, 150);

      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(150);
        expect(chunk.trim().length).toBeGreaterThan(0);
      }

      // Reconstructed text should contain all core sentences
      const recombined = chunks.join(' ');
      expect(recombined).toContain('WASP-39 b');
      expect(recombined).toContain('carbon dioxide');
      expect(recombined).toContain('habitability');
    });
  });

  describe('NarrationController lifecycle', () => {
    it('transitions through speaking and idle states, notifying subscribers', async () => {
      const states: string[] = [];
      const unsub = narrationController.subscribe(s => {
        states.push(s.status);
      });

      await narrationController.start('Test Title', 'First sentence. Second sentence.');
      expect(narrationController.isSpeaking()).toBe(true);
      expect(states).toContain('speaking');

      await narrationController.stop();
      expect(narrationController.isSpeaking()).toBe(false);
      expect(states).toContain('idle');

      unsub();
    });

    it('clamps speech rate between 0.5x and 2.0x', () => {
      narrationController.setRate(1.25);
      expect(narrationController.getState().rate).toBe(1.25);

      narrationController.setRate(0.1);
      expect(narrationController.getState().rate).toBe(0.5);

      narrationController.setRate(5.0);
      expect(narrationController.getState().rate).toBe(2.0);
    });

    it('cancels stale callbacks when stopped before chunk completion', async () => {
      let chunkCount = 0;
      await narrationController.start('Long Read', 'Sentence one. Sentence two. Sentence three.', {
        onChunkChange: () => {
          chunkCount++;
        },
      });

      // Stop immediately
      await narrationController.stop();
      const countAtStop = chunkCount;

      // Wait a short tick
      await new Promise(r => setTimeout(r, 30));

      // Must not continue to advance chunks after stop
      expect(chunkCount).toBe(countAtStop);
      expect(narrationController.getState().status).toBe('idle');
    });

    it('coordinates with voice recognition by invoking stopper when narration starts', async () => {
      const recognitionStopper = jest.fn();
      narrationController.registerRecognitionStopper(recognitionStopper);

      await narrationController.start('Title', 'Some text to read');
      expect(recognitionStopper).toHaveBeenCalledTimes(1);
    });

    it('retrieves available system voices gracefully', async () => {
      const voices = await narrationController.getAvailableVoices();
      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThanOrEqual(1);
      expect(voices[0].name).toBe('Samantha');
    });
  });
});
