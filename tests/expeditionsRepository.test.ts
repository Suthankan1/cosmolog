import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync as mockDatabaseSync } from 'node:sqlite';
import { CREATE_TABLES_SQL } from '../src/database/schema';
import { writeDatabase } from '../src/database/db';
import {
  getAllCompletedStepIds,
  getExpeditionCompletedStepIds,
  getExpeditionProgressSummary,
  markExpeditionStepCompleted,
  resetExpeditionProgress,
  unmarkExpeditionStepCompleted,
} from '../src/database/repositories/expeditionsRepository';

let mockDatabasePath: string;
const mockOpenConnections: mockDatabaseSync[] = [];
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => {
    const db = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
    mockOpenConnections.push(db);
    return {
      execAsync: async (sql: string) => db.exec(sql),
      getFirstAsync: async (sql: string, args: never[] = []) => db.prepare(sql).get(...args),
      getAllAsync: async (sql: string, args: never[] = []) => db.prepare(sql).all(...args),
      runAsync: async (sql: string, args: never[] = []) => db.prepare(sql).run(...args),
      closeAsync: async () => db.close(),
      withTransactionAsync: async (work: () => Promise<void>) => {
        db.exec('BEGIN');
        try {
          await work();
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
    };
  },
}));

const dir = mkdtempSync(join(tmpdir(), 'cosmolog-expeditions-'));
beforeAll(() => {
  mockDatabasePath = join(dir, 'expeditions.sqlite');
  const legacy = new mockDatabaseSync(mockDatabasePath, { enableForeignKeyConstraints: false });
  legacy.exec(CREATE_TABLES_SQL);
  legacy.close();
});

afterAll(() => {
  for (const db of mockOpenConnections) db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('Expedition Progress SQLite Repository', () => {
  it('migrates to version 15 and creates expedition_progress table', async () => {
    const steps = await getExpeditionCompletedStepIds(1, 'saturn');
    expect(steps.size).toBe(0);
  });

  it('marks and unmarks steps with strict account isolation', async () => {
    await markExpeditionStepCompleted(1, 'saturn', 'step-saturn-shadow');
    await markExpeditionStepCompleted(1, 'saturn', 'step-saturn-density-waves');

    const account1Steps = await getExpeditionCompletedStepIds(1, 'saturn');
    expect(account1Steps.has('step-saturn-shadow')).toBe(true);
    expect(account1Steps.has('step-saturn-density-waves')).toBe(true);
    expect(account1Steps.size).toBe(2);

    // Account 2 must not see Account 1's progress
    const account2Steps = await getExpeditionCompletedStepIds(2, 'saturn');
    expect(account2Steps.size).toBe(0);

    // Unmark single step for account 1
    await unmarkExpeditionStepCompleted(1, 'saturn', 'step-saturn-shadow');
    const updatedAccount1 = await getExpeditionCompletedStepIds(1, 'saturn');
    expect(updatedAccount1.has('step-saturn-shadow')).toBe(false);
    expect(updatedAccount1.has('step-saturn-density-waves')).toBe(true);
    expect(updatedAccount1.size).toBe(1);
  });

  it('enforces check constraints and rolls back failed transactions', async () => {
    await expect(markExpeditionStepCompleted(0, 'saturn', 'step-invalid')).rejects.toThrow(
      /Valid account ID required/,
    );

    // Using raw invalid write with account_id <= 0 should fail sqlite CHECK constraint
    await expect(
      writeDatabase(async db => {
        await db.runAsync(
          'INSERT INTO expedition_progress (account_id, expedition_id, step_id, completed_at) VALUES (?, ?, ?, ?)',
          [-1, 'saturn', 'step-invalid', new Date().toISOString()],
        );
      }),
    ).rejects.toThrow(/CHECK constraint failed/i);
  });

  it('computes progress summary and resets progress', async () => {
    await markExpeditionStepCompleted(5, 'apollo', 'step-1');
    await markExpeditionStepCompleted(5, 'apollo', 'step-2');
    await markExpeditionStepCompleted(5, 'apollo', 'step-3');

    const summary = await getExpeditionProgressSummary(5, 'apollo', 5);
    expect(summary.completedCount).toBe(3);
    expect(summary.totalCount).toBe(5);
    expect(summary.isCompleted).toBe(false);

    const completeSummary = await getExpeditionProgressSummary(5, 'apollo', 3);
    expect(completeSummary.isCompleted).toBe(true);

    const allMap = await getAllCompletedStepIds(5);
    expect(allMap.get('apollo')?.size).toBe(3);

    await resetExpeditionProgress(5, 'apollo');
    const resetSteps = await getExpeditionCompletedStepIds(5, 'apollo');
    expect(resetSteps.size).toBe(0);
  });

  it('respects required vs optional steps when calculating completion (Finding 2)', async () => {
    const mockManifest = {
      id: 'apollo',
      revision: 1,
      title: 'Apollo at the Moon',
      description: 'Lunar expedition',
      estimatedBytes: 1000,
      sources: [],
      steps: [
        { id: 'step-req-1', order: 1, kind: 'discovery' as const, title: 'Req 1', summary: 'R1', required: true },
        { id: 'step-req-2', order: 2, kind: 'study' as const, title: 'Req 2', summary: 'R2', required: true },
        { id: 'step-opt-1', order: 3, kind: 'prompt' as const, title: 'Opt 1', summary: 'O1', required: false },
      ],
    };

    // Account 6 marks only 1 required step
    await markExpeditionStepCompleted(6, 'apollo', 'step-req-1');
    let summary = await getExpeditionProgressSummary(6, mockManifest);
    expect(summary.completedRequiredCount).toBe(1);
    expect(summary.totalRequiredCount).toBe(2);
    expect(summary.completedOptionalCount).toBe(0);
    expect(summary.totalOptionalCount).toBe(1);
    expect(summary.isCompleted).toBe(false);

    // Account 6 marks the optional step, but still missing 1 required step
    await markExpeditionStepCompleted(6, 'apollo', 'step-opt-1');
    summary = await getExpeditionProgressSummary(6, mockManifest);
    expect(summary.completedRequiredCount).toBe(1);
    expect(summary.completedOptionalCount).toBe(1);
    expect(summary.isCompleted).toBe(false);

    // Account 6 marks the 2nd required step -> expedition is completed even if optional step was pending
    await markExpeditionStepCompleted(6, 'apollo', 'step-req-2');
    summary = await getExpeditionProgressSummary(6, mockManifest);
    expect(summary.completedRequiredCount).toBe(2);
    expect(summary.totalRequiredCount).toBe(2);
    expect(summary.isCompleted).toBe(true);
  });

  it('persists revision and reconciles compatible step progress on revision changes (Finding 6)', async () => {
    // Save progress with revision
    await markExpeditionStepCompleted(7, 'saturn', 'step-saturn-shadow', 2);

    // Direct database inspection verifies revision column is persisted
    const rows = await writeDatabase(async db =>
      db.getAllAsync<{ step_id: string; revision: number }>(
        'SELECT step_id, revision FROM expedition_progress WHERE account_id = 7 AND expedition_id = ?',
        ['saturn'],
      ),
    );
    expect(rows).toEqual([{ step_id: 'step-saturn-shadow', revision: 2 }]);

    // Query with manifest filters out orphaned step IDs if manifest steps change
    const dummyManifest = {
      id: 'saturn',
      revision: 1,
      title: 'Saturn',
      description: 'Desc',
      estimatedBytes: 1000,
      sources: [],
      steps: [
        { id: 'step-saturn-shadow', order: 1, kind: 'discovery' as const, title: 'Shadow', summary: 'S', required: true },
      ],
    };

    const completed = await getExpeditionCompletedStepIds(7, 'saturn', dummyManifest);
    expect(completed.has('step-saturn-shadow')).toBe(true);

    // If an unknown step exists in DB from legacy revision, it is filtered out by manifest reconciliation
    await markExpeditionStepCompleted(7, 'saturn', 'removed-legacy-step', 1);
    const reconciled = await getExpeditionCompletedStepIds(7, 'saturn', dummyManifest);
    expect(reconciled.has('step-saturn-shadow')).toBe(true);
    expect(reconciled.has('removed-legacy-step')).toBe(false);
  });
});
