/**
 * Reader Preferences Repository (F12)
 *
 * Persists user theme mode ('editorial' | 'night') and speech synthesis preferences,
 * isolated by user account ID in SQLite.
 */

import { getDatabase, writeDatabase } from '../db';

export interface ReaderPreferences {
  accountId: number;
  theme: 'editorial' | 'night';
  speechRate: number;
  voiceId: string | null;
  updatedAt: string;
}

export async function getReaderPreferences(accountId: number): Promise<ReaderPreferences> {
  if (!accountId || accountId <= 0) {
    return { accountId: 0, theme: 'editorial', speechRate: 1.0, voiceId: null, updatedAt: '' };
  }
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    account_id: number;
    theme: 'editorial' | 'night';
    speech_rate: number;
    voice_id: string | null;
    updated_at: string;
  }>('SELECT * FROM reader_preferences WHERE account_id = ?', [accountId]);

  if (!row) {
    return {
      accountId,
      theme: 'editorial',
      speechRate: 1.0,
      voiceId: null,
      updatedAt: '',
    };
  }

  return {
    accountId: row.account_id,
    theme: row.theme,
    speechRate: row.speech_rate,
    voiceId: row.voice_id,
    updatedAt: row.updated_at,
  };
}

export async function setThemePreference(
  accountId: number,
  theme: 'editorial' | 'night'
): Promise<void> {
  if (!accountId || accountId <= 0) return;
  await writeDatabase(async db => {
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO reader_preferences (account_id, theme, speech_rate, voice_id, updated_at)
       VALUES (?, ?, 1.0, NULL, ?)
       ON CONFLICT (account_id) DO UPDATE SET theme = excluded.theme, updated_at = excluded.updated_at`,
      [accountId, theme, now]
    );
  });
}

export async function setSpeechRatePreference(
  accountId: number,
  rate: number
): Promise<void> {
  if (!accountId || accountId <= 0) return;
  await writeDatabase(async db => {
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO reader_preferences (account_id, theme, speech_rate, voice_id, updated_at)
       VALUES (?, 'editorial', ?, NULL, ?)
       ON CONFLICT (account_id) DO UPDATE SET speech_rate = excluded.speech_rate, updated_at = excluded.updated_at`,
      [accountId, rate, now]
    );
  });
}
