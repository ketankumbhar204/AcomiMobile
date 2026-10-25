import { FavoriteSession, runFavoriteToggle, type FavoriteWriter } from '../favoriteSession';

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('favoriteSession', () => {
  it('adds and removes a listing', async () => {
    const session = new FavoriteSession();
    const writer: FavoriteWriter = {
      add: async () => ({ favorited: true }),
      remove: async () => ({ favorited: false }),
    };

    await expect(runFavoriteToggle(true, 'pg-1', session, writer)).resolves.toBe('saved');
    expect(session.isFavorite('pg-1')).toBe(true);

    await expect(runFavoriteToggle(true, 'pg-1', session, writer)).resolves.toBe('removed');
    expect(session.isFavorite('pg-1')).toBe(false);
  });

  it('does not show a saved heart when the request fails', async () => {
    const session = new FavoriteSession();
    const writer: FavoriteWriter = {
      add: async () => {
        throw new Error('network');
      },
      remove: async () => ({ favorited: false }),
    };

    await expect(runFavoriteToggle(true, 'mess-1', session, writer)).resolves.toBe('failed');
    expect(session.isFavorite('mess-1')).toBe(false);
  });

  it('rolls back a removal when the API fails', async () => {
    const session = new FavoriteSession();
    session.hydrateIfUnchanged(session.mutationStamp(), ['pg-1']);
    const writer: FavoriteWriter = {
      add: async () => ({ favorited: true }),
      remove: async () => {
        throw new Error('unavailable');
      },
    };

    await expect(runFavoriteToggle(true, 'pg-1', session, writer)).resolves.toBe('failed');
    expect(session.isFavorite('pg-1')).toBe(true);
  });

  it('does not change the heart when the user is signed out', async () => {
    const session = new FavoriteSession();
    let calls = 0;
    const writer: FavoriteWriter = {
      add: async () => {
        calls += 1;
        return { favorited: true };
      },
      remove: async () => ({ favorited: false }),
    };

    await expect(runFavoriteToggle(false, 'pg-1', session, writer)).resolves.toBe('auth-required');
    expect(session.isFavorite('pg-1')).toBe(false);
    expect(calls).toBe(0);
  });

  it('collapses rapid taps to the latest state and avoids a duplicate add', async () => {
    const session = new FavoriteSession();
    const addGate = deferred<{ favorited: boolean }>();
    let adds = 0;
    let removes = 0;
    const writer: FavoriteWriter = {
      add: () => {
        adds += 1;
        return addGate.promise;
      },
      remove: async () => {
        removes += 1;
        return { favorited: false };
      },
    };

    const first = runFavoriteToggle(true, 'hostel-1', session, writer);
    const second = runFavoriteToggle(true, 'hostel-1', session, writer);
    expect(session.isFavorite('hostel-1')).toBe(false);
    addGate.resolve({ favorited: true });

    await expect(first).resolves.toBe('superseded');
    await expect(second).resolves.toBe('removed');
    expect(adds).toBe(1);
    expect(removes).toBe(1);
    expect(session.isFavorite('hostel-1')).toBe(false);
  });

  it('ignores a stale id list that returns after a newer toggle', async () => {
    const session = new FavoriteSession();
    const stamp = session.mutationStamp();
    await runFavoriteToggle(true, 'rental-1', session, {
      add: async () => ({ favorited: true }),
      remove: async () => ({ favorited: false }),
    });

    session.hydrateIfUnchanged(stamp, []);
    expect(session.isFavorite('rental-1')).toBe(true);
  });

  it('keeps one id when the server list repeats it', () => {
    const session = new FavoriteSession();
    session.hydrateIfUnchanged(session.mutationStamp(), ['mess-2', 'mess-2']);
    expect([...session.ids()]).toEqual(['mess-2']);
  });

  it('shows a pending heart until the save finishes, then keeps the favorite', async () => {
    const session = new FavoriteSession();
    const gate = deferred<{ favorited: boolean }>();
    const pending = runFavoriteToggle(true, 'pg-1', session, {
      add: () => gate.promise,
      remove: async () => ({ favorited: false }),
    });

    expect(session.isPending('pg-1')).toBe(true);
    expect(session.isFavorite('pg-1')).toBe(true);
    gate.resolve({ favorited: true });
    await expect(pending).resolves.toBe('saved');
    expect(session.isPending('pg-1')).toBe(false);
    expect(session.isFavorite('pg-1')).toBe(true);
  });

  it('clears the pending state and restores the previous heart when the save fails', async () => {
    const session = new FavoriteSession();
    const gate = deferred<{ favorited: boolean }>();
    const pending = runFavoriteToggle(true, 'pg-1', session, {
      add: () => gate.promise,
      remove: async () => ({ favorited: false }),
    });

    expect(session.isFavorite('pg-1')).toBe(true);
    gate.reject(new Error('offline'));
    await expect(pending).resolves.toBe('failed');
    expect(session.isPending('pg-1')).toBe(false);
    expect(session.isFavorite('pg-1')).toBe(false);
  });

  it('does not leave a heart filled when the server refuses the save', async () => {
    const session = new FavoriteSession();
    await expect(
      runFavoriteToggle(true, 'pg-9', session, {
        add: async () => ({ favorited: false }),
        remove: async () => ({ favorited: false }),
      }),
    ).resolves.toBe('failed');
    expect(session.isFavorite('pg-9')).toBe(false);
  });
});
