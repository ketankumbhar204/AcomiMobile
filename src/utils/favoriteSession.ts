export type FavoriteToggleResult = 'saved' | 'removed' | 'failed' | 'superseded' | 'auth-required';

export type FavoriteWriter = {
  add: (spaceId: string) => Promise<{ favorited: boolean }>;
  remove: (spaceId: string) => Promise<{ favorited: boolean }>;
};

type Listener = () => void;
type Waiter = {
  resolve: (result: FavoriteToggleResult) => void;
};

/**
 * Shared favorite set for search cards, detail, and the saved list.
 * The heart updates immediately, then rolls back when the API rejects the change.
 * Overlapping taps on one listing collapse to the latest requested state.
 */
export class FavoriteSession {
  private displayed = new Set<string>();
  private confirmed = new Set<string>();
  private generation = new Map<string, number>();
  private running = new Set<string>();
  private waiters = new Map<string, Map<number, Waiter>>();
  private listeners = new Set<Listener>();
  private snapshot = 0;
  private mutationEpoch = 0;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): number => this.snapshot;

  isFavorite(spaceId: string | null | undefined): boolean {
    return Boolean(spaceId && this.displayed.has(spaceId));
  }

  isPending(spaceId: string | null | undefined): boolean {
    return Boolean(spaceId && this.generation.has(spaceId));
  }

  ids(): ReadonlySet<string> {
    return this.displayed;
  }

  mutationStamp(): number {
    return this.mutationEpoch;
  }

  reset(): void {
    this.displayed = new Set();
    this.confirmed = new Set();
    this.generation.clear();
    this.running.clear();
    this.mutationEpoch += 1;
    this.rejectWaiters();
    this.emit();
  }

  /**
   * Apply a server id list only when no toggle started after the request began.
   * In-flight listings keep the heart the user last tapped.
   */
  hydrateIfUnchanged(stamp: number, ids: Iterable<string>): void {
    if (stamp !== this.mutationEpoch) return;
    const nextConfirmed = new Set<string>();
    for (const id of ids) {
      if (id) nextConfirmed.add(id);
    }
    const nextDisplayed = new Set(nextConfirmed);
    for (const id of this.running) {
      if (this.displayed.has(id)) nextDisplayed.add(id);
      else nextDisplayed.delete(id);
    }
    this.confirmed = nextConfirmed;
    this.displayed = nextDisplayed;
    this.emit();
  }

  async toggle(spaceId: string, writer: FavoriteWriter): Promise<FavoriteToggleResult> {
    const id = spaceId.trim();
    if (!id) return 'failed';
    const target = !this.displayed.has(id);
    this.setDisplayed(id, target);
    this.mutationEpoch += 1;
    const gen = (this.generation.get(id) ?? 0) + 1;
    this.generation.set(id, gen);
    this.emit();
    const pending = new Promise<FavoriteToggleResult>(resolve => {
      const bucket = this.waiters.get(id) ?? new Map<number, Waiter>();
      bucket.set(gen, { resolve });
      this.waiters.set(id, bucket);
    });
    void this.pump(id, writer);
    return pending;
  }

  private async pump(spaceId: string, writer: FavoriteWriter): Promise<void> {
    if (this.running.has(spaceId)) return;
    this.running.add(spaceId);
    try {
      for (;;) {
        const gen = this.generation.get(spaceId);
        if (gen == null) break;
        const want = this.displayed.has(spaceId);
        try {
          const result = want ? await writer.add(spaceId) : await writer.remove(spaceId);
          if (this.generation.get(spaceId) !== gen) {
            this.resolveWaiter(spaceId, gen, 'superseded');
            continue;
          }
          const serverOn = result?.favorited === true;
          this.applyConfirmed(spaceId, serverOn);
          this.generation.delete(spaceId);
          this.emit();
          this.resolveWaiter(
            spaceId,
            gen,
            serverOn === want ? (serverOn ? 'saved' : 'removed') : 'failed',
          );
        } catch {
          if (this.generation.get(spaceId) !== gen) {
            this.resolveWaiter(spaceId, gen, 'superseded');
            continue;
          }
          this.setDisplayed(spaceId, this.confirmed.has(spaceId));
          this.generation.delete(spaceId);
          this.emit();
          this.resolveWaiter(spaceId, gen, 'failed');
        }
      }
    } finally {
      this.running.delete(spaceId);
      if (this.generation.has(spaceId)) {
        void this.pump(spaceId, writer);
      }
    }
  }

  private applyConfirmed(spaceId: string, on: boolean): void {
    const next = new Set(this.confirmed);
    if (on) next.add(spaceId);
    else next.delete(spaceId);
    this.confirmed = next;
    this.setDisplayed(spaceId, on);
  }

  private setDisplayed(spaceId: string, on: boolean): void {
    if (this.displayed.has(spaceId) === on) return;
    const next = new Set(this.displayed);
    if (on) next.add(spaceId);
    else next.delete(spaceId);
    this.displayed = next;
    this.emit();
  }

  private resolveWaiter(spaceId: string, gen: number, result: FavoriteToggleResult): void {
    const bucket = this.waiters.get(spaceId);
    const waiter = bucket?.get(gen);
    if (!waiter) return;
    bucket?.delete(gen);
    waiter.resolve(result);
  }

  private rejectWaiters(): void {
    for (const [spaceId, bucket] of this.waiters) {
      for (const [gen, waiter] of bucket) {
        bucket.delete(gen);
        waiter.resolve('failed');
      }
      this.waiters.delete(spaceId);
    }
  }

  private emit(): void {
    this.snapshot += 1;
    this.listeners.forEach(listener => listener());
  }
}

export async function runFavoriteToggle(
  isAuthenticated: boolean,
  spaceId: string,
  session: FavoriteSession,
  writer: FavoriteWriter,
): Promise<FavoriteToggleResult> {
  if (!isAuthenticated) return 'auth-required';
  return session.toggle(spaceId, writer);
}
