import {
  isMediaOperationInProgress,
  waitForMediaOperations,
  withExclusiveMediaLock,
  _resetMediaCoordinatorForTesting,
} from '../src/services/storage/mediaCoordinator';

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('Exclusive Media Operation Coordinator (Issue 2)', () => {
  beforeEach(() => {
    _resetMediaCoordinatorForTesting();
  });

  it('executes concurrent operations strictly sequentially with exclusive lock', async () => {
    const executionOrder: string[] = [];
    const op1Deferred = createDeferred();
    const op2Deferred = createDeferred();

    let op1Started = false;
    let op2Started = false;

    // Start operation 1 (e.g. cache cleanup)
    const op1Promise = withExclusiveMediaLock(async () => {
      op1Started = true;
      executionOrder.push('op1:start');
      await op1Deferred.promise;
      executionOrder.push('op1:end');
      return 'op1_result';
    });

    // Start operation 2 (e.g. background media worker download) immediately while op1 is still in flight
    const op2Promise = withExclusiveMediaLock(async () => {
      op2Started = true;
      executionOrder.push('op2:start');
      await op2Deferred.promise;
      executionOrder.push('op2:end');
      return 'op2_result';
    });

    // Let microtask turn so op1 begins executing under lock
    await new Promise(r => setTimeout(r, 0));

    // Verify op1 is running and coordinator reports busy
    expect(isMediaOperationInProgress()).toBe(true);
    expect(op1Started).toBe(true);
    // Crucial: op2 has NOT started running because op1 holds the exclusive lock!
    expect(op2Started).toBe(false);
    expect(executionOrder).toEqual(['op1:start']);

    // Now resolve op1
    op1Deferred.resolve();
    const result1 = await op1Promise;
    expect(result1).toBe('op1_result');

    // Op1 finished, let microtask turn so op2 begins executing under lock
    await new Promise(r => setTimeout(r, 0));
    expect(op2Started).toBe(true);
    expect(executionOrder).toEqual(['op1:start', 'op1:end', 'op2:start']);
    expect(isMediaOperationInProgress()).toBe(true);

    // Resolve op2
    op2Deferred.resolve();
    const result2 = await op2Promise;
    expect(result2).toBe('op2_result');

    // Both completed in deterministic sequential order
    expect(executionOrder).toEqual(['op1:start', 'op1:end', 'op2:start', 'op2:end']);
    expect(isMediaOperationInProgress()).toBe(false);
  });

  it('unblocks queued operations even if an earlier operation rejects', async () => {
    const op1Deferred = createDeferred();
    const op2Deferred = createDeferred();

    const op1Promise = withExclusiveMediaLock(async () => {
      await op1Deferred.promise;
      throw new Error('Disk write error in op1');
    });

    let op2Ran = false;
    const op2Promise = withExclusiveMediaLock(async () => {
      await op2Deferred.promise;
      op2Ran = true;
      return 'op2_success';
    });

    op1Deferred.resolve();
    await expect(op1Promise).rejects.toThrow('Disk write error in op1');

    // Op2 should not be stalled or poisoned by Op1's failure
    op2Deferred.resolve();
    const result2 = await op2Promise;
    expect(op2Ran).toBe(true);
    expect(result2).toBe('op2_success');
    expect(isMediaOperationInProgress()).toBe(false);
  });

  it('waitForMediaOperations waits until all queued operations complete', async () => {
    const deferred = createDeferred();
    let completed = false;

    void withExclusiveMediaLock(async () => {
      await deferred.promise;
      completed = true;
    });

    expect(isMediaOperationInProgress()).toBe(true);

    let waitResolved = false;
    const waitPromise = waitForMediaOperations().then(() => {
      waitResolved = true;
    });

    // Give a tick to ensure waitPromise is waiting
    await new Promise(r => setTimeout(r, 10));
    expect(waitResolved).toBe(false);

    deferred.resolve();
    await waitPromise;
    expect(waitResolved).toBe(true);
    expect(completed).toBe(true);
    expect(isMediaOperationInProgress()).toBe(false);
  });
});
