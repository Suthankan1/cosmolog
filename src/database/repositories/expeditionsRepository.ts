import { getDatabase, writeDatabase } from '../db';

export interface ExpeditionProgressRow {
  account_id: number;
  expedition_id: string;
  step_id: string;
  completed_at: string;
}

export async function getExpeditionCompletedStepIds(accountId: number, expeditionId: string): Promise<Set<string>> {
  if (accountId <= 0) return new Set();
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ step_id: string }>(
    'SELECT step_id FROM expedition_progress WHERE account_id = ? AND expedition_id = ?',
    [accountId, expeditionId],
  );
  return new Set(rows.map(r => r.step_id));
}

export async function getAllCompletedStepIds(accountId: number): Promise<Map<string, Set<string>>> {
  if (accountId <= 0) return new Map();
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ expedition_id: string; step_id: string }>(
    'SELECT expedition_id, step_id FROM expedition_progress WHERE account_id = ?',
    [accountId],
  );
  const result = new Map<string, Set<string>>();
  for (const row of rows) {
    let set = result.get(row.expedition_id);
    if (!set) {
      set = new Set();
      result.set(row.expedition_id, set);
    }
    set.add(row.step_id);
  }
  return result;
}

export async function markExpeditionStepCompleted(
  accountId: number,
  expeditionId: string,
  stepId: string,
  completedAt: string = new Date().toISOString(),
): Promise<void> {
  if (accountId <= 0) throw new Error('Valid account ID required');
  await writeDatabase(async db => {
    await db.runAsync(
      `INSERT INTO expedition_progress (account_id, expedition_id, step_id, completed_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(account_id, expedition_id, step_id) DO UPDATE SET completed_at = excluded.completed_at`,
      [accountId, expeditionId, stepId, completedAt],
    );
  });
}

export async function unmarkExpeditionStepCompleted(
  accountId: number,
  expeditionId: string,
  stepId: string,
): Promise<void> {
  if (accountId <= 0) return;
  await writeDatabase(async db => {
    await db.runAsync(
      'DELETE FROM expedition_progress WHERE account_id = ? AND expedition_id = ? AND step_id = ?',
      [accountId, expeditionId, stepId],
    );
  });
}

export async function resetExpeditionProgress(accountId: number, expeditionId: string): Promise<void> {
  if (accountId <= 0) return;
  await writeDatabase(async db => {
    await db.runAsync(
      'DELETE FROM expedition_progress WHERE account_id = ? AND expedition_id = ?',
      [accountId, expeditionId],
    );
  });
}

export async function getExpeditionProgressSummary(
  accountId: number,
  expeditionId: string,
  totalSteps: number,
): Promise<{ completedCount: number; totalCount: number; isCompleted: boolean }> {
  const completed = await getExpeditionCompletedStepIds(accountId, expeditionId);
  return {
    completedCount: completed.size,
    totalCount: totalSteps,
    isCompleted: totalSteps > 0 && completed.size >= totalSteps,
  };
}
