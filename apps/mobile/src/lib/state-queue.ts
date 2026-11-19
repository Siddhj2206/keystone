export function createStateQueue<T>(initial: T, persist: (next: T) => Promise<void>, publish: (next: T) => void) {
  let current = initial;
  let pending = Promise.resolve();
  return {
    get: (): T => current,
    update(transform: (latest: T) => T): Promise<void> {
      const result = pending.then(async () => {
        const next = transform(current);
        await persist(next);
        current = next;
        publish(next);
      });
      pending = result.catch(() => {});
      return result;
    },
  };
}
