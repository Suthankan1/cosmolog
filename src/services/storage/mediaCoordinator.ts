/**
 * Shared service-level coordinator for critical media operations
 * (downloads, reconciliation, and filesystem pruning).
 * Guarantees mutually exclusive execution without importing Redux internals.
 */

let lockQueue: Promise<unknown> = Promise.resolve();
let activeOperationsCount = 0;

/**
 * Checks if any critical media operation (download, reconciliation, or pruning) is active.
 */
export function isMediaOperationInProgress(): boolean {
  return activeOperationsCount > 0;
}

/**
 * Returns a Promise that resolves when all currently queued media operations finish.
 */
export async function waitForMediaOperations(): Promise<void> {
  while (activeOperationsCount > 0) {
    try {
      await lockQueue;
    } catch {
      // Ignore background operation failures in awaiter
    }
  }
}

/**
 * Executes `action` inside an exclusive lock. If another media operation is currently running,
 * `action` queues and waits for its turn, ensuring that media downloads, reconciliation,
 * and filesystem pruning never execute concurrently.
 */
export async function withExclusiveMediaLock<T>(action: () => Promise<T>): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>(resolve => {
    release = resolve;
  });

  const previousLock = lockQueue;
  lockQueue = previousLock.then(
    () => nextLock,
    () => nextLock,
  );

  activeOperationsCount++;
  try {
    await previousLock;
    return await action();
  } finally {
    activeOperationsCount--;
    release!();
  }
}

/**
 * Reset function for testing purposes only.
 */
export function _resetMediaCoordinatorForTesting(): void {
  lockQueue = Promise.resolve();
  activeOperationsCount = 0;
}
