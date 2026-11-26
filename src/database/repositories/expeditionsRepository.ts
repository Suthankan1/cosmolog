import { getDatabase, writeDatabase } from '../db';
import type { ExpeditionManifest } from '../../features/expeditions/manifest';

export interface ExpeditionProgressRow {
  account_id: number;
  expedition_id: string;
  step_id: string;
  revision: number;
  completed_at: string;
}

export interface ExpeditionProgressSummary {
  completedRequiredCount: number;
  totalRequiredCount: number;
  completedOptionalCount: number;
  totalOptionalCount: number;
  completedTotalCount: number;
  totalStepsCount: number;
  isCompleted: boolean;
  completedCount: number; // backward compatibility alias
  totalCount: number;     // backward compatibility alias
}

export async function getExpeditionCompletedStepIds(
  accountId: number,
  expeditionId: string,
  manifest?: ExpeditionManifest,
): Promise<Set<string>> {
  if (accountId <= 0) return new Set();
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ step_id: string; revision: number }>(
    'SELECT step_id, revision FROM expedition_progress WHERE account_id = ? AND expedition_id = ?',
    [accountId, expeditionId],
  );

  const set = new Set<string>();
  const validStepIds = manifest ? new Set(manifest.steps.map(s => s.id)) : null;

  for (const row of rows) {
    if (manifest) {
      if (manifest.minCompatibleRevision && row.revision < manifest.minCompatibleRevision) {
        continue;
      }
      if (validStepIds && !validStepIds.has(row.step_id)) {
        continue;
      }
    }
    set.add(row.step_id);
  }

  return set;
}

export async function getAllCompletedStepIds(
  accountId: number,
  manifests?: readonly ExpeditionManifest[],
): Promise<Map<string, Set<string>>> {
  if (accountId <= 0) return new Map();
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ expedition_id: string; step_id: string; revision: number }>(
    'SELECT expedition_id, step_id, revision FROM expedition_progress WHERE account_id = ?',
    [accountId],
  );

  const manifestMap = manifests ? new Map(manifests.map(m => [m.id, m])) : null;
  const result = new Map<string, Set<string>>();

  for (const row of rows) {
    const manifest = manifestMap?.get(row.expedition_id);
    if (manifest) {
      if (manifest.minCompatibleRevision && row.revision < manifest.minCompatibleRevision) {
        continue;
      }
      const validStepIds = new Set(manifest.steps.map(s => s.id));
      if (!validStepIds.has(row.step_id)) {
        continue;
      }
    }
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
  revision: number = 1,
  completedAt: string = new Date().toISOString(),
): Promise<void> {
  if (accountId <= 0) throw new Error('Valid account ID required');
  await writeDatabase(async db => {
    await db.runAsync(
      `INSERT INTO expedition_progress (account_id, expedition_id, step_id, revision, completed_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(account_id, expedition_id, step_id) DO UPDATE SET revision = excluded.revision, completed_at = excluded.completed_at`,
      [accountId, expeditionId, stepId, revision, completedAt],
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
  expeditionOrId: string | ExpeditionManifest,
  manifestOrTotalSteps?: number | ExpeditionManifest,
): Promise<ExpeditionProgressSummary> {
  let manifest: ExpeditionManifest | undefined;
  let expeditionId: string;

  if (typeof expeditionOrId === 'object' && expeditionOrId !== null) {
    manifest = expeditionOrId;
    expeditionId = manifest.id;
  } else {
    expeditionId = expeditionOrId;
    if (typeof manifestOrTotalSteps === 'object' && manifestOrTotalSteps !== null) {
      manifest = manifestOrTotalSteps;
    }
  }

  const completed = await getExpeditionCompletedStepIds(accountId, expeditionId, manifest);

  if (manifest) {
    const requiredSteps = manifest.steps.filter(s => s.required);
    const optionalSteps = manifest.steps.filter(s => !s.required);

    const completedRequiredCount = requiredSteps.filter(s => completed.has(s.id)).length;
    const completedOptionalCount = optionalSteps.filter(s => completed.has(s.id)).length;
    const totalRequiredCount = requiredSteps.length;
    const totalOptionalCount = optionalSteps.length;
    const completedTotalCount = completedRequiredCount + completedOptionalCount;
    const totalStepsCount = manifest.steps.length;

    // Finding 2: Only required steps govern whether the expedition is completed
    const isCompleted = totalRequiredCount > 0 && completedRequiredCount >= totalRequiredCount;

    return {
      completedRequiredCount,
      totalRequiredCount,
      completedOptionalCount,
      totalOptionalCount,
      completedTotalCount,
      totalStepsCount,
      isCompleted,
      completedCount: completedTotalCount,
      totalCount: totalStepsCount,
    };
  }

  const totalSteps = typeof manifestOrTotalSteps === 'number' ? manifestOrTotalSteps : completed.size;
  const isCompleted = totalSteps > 0 && completed.size >= totalSteps;
  return {
    completedRequiredCount: completed.size,
    totalRequiredCount: totalSteps,
    completedOptionalCount: 0,
    totalOptionalCount: 0,
    completedTotalCount: completed.size,
    totalStepsCount: totalSteps,
    isCompleted,
    completedCount: completed.size,
    totalCount: totalSteps,
  };
}
