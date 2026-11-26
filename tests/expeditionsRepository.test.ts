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
});
