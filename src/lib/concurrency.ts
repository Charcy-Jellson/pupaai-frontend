/**
 * Concurrency control utilities for batch operations.
 * Used to limit the number of concurrent AI API requests.
 */

/**
 * Execute tasks with a concurrency limit.
 * 
 * @param tasks - Array of functions that return promises
 * @param limit - Maximum number of concurrent executions (default: 3)
 * @returns Array of results in the same order as input tasks
 * 
 * @example
 * const results = await withConcurrencyLimit(
 *   images.map(img => () => processImage(img)),
 *   3
 * );
 */
export async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 3
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;

  async function runNext(): Promise<void> {
    const index = currentIndex++;
    if (index >= tasks.length) return;

    try {
      results[index] = await tasks[index]();
    } catch (error) {
      // Re-throw to be caught by Promise.all
      throw { index, error };
    }

    await runNext();
  }

  // Start up to 'limit' workers
  const workers = Array(Math.min(limit, tasks.length))
    .fill(null)
    .map(() => runNext());

  await Promise.all(workers);
  return results;
}

/**
 * Execute tasks with concurrency limit, returning results as they complete.
 * 
 * @param tasks - Array of functions that return promises
 * @param limit - Maximum number of concurrent executions (default: 3)
 * @param onProgress - Callback called when each task completes
 * @returns Array of results with success/error status
 */
export async function withConcurrencyLimitSettled<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 3,
  onProgress?: (completed: number, total: number, result: PromiseSettledResult<T>) => void
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let currentIndex = 0;
  let completedCount = 0;

  async function runNext(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;

      try {
        const value = await tasks[index]();
        results[index] = { status: "fulfilled", value };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }

      completedCount++;
      onProgress?.(completedCount, tasks.length, results[index]);
    }
  }

  // Start up to 'limit' workers
  const workers = Array(Math.min(limit, tasks.length))
    .fill(null)
    .map(() => runNext());

  await Promise.all(workers);
  return results;
}

/**
 * Semaphore class for fine-grained concurrency control.
 * Useful when you need to acquire/release across different code paths.
 */
export class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }

  async withPermit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  get availablePermits(): number {
    return this.permits;
  }

  get queueLength(): number {
    return this.waitQueue.length;
  }
}



