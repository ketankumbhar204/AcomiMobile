import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearCoachmarkRecord,
  coachmarkStorageKey,
  isCoachmarkFinished,
  loadCoachmarkRecord,
  saveCoachmarkRecord,
} from '../../utils/coachmarkStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const spaceId = 'space-1';
const tourId = 'setup.mess.v1' as const;

describe('coachmarkStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds the recommended storage key', () => {
    expect(coachmarkStorageKey(spaceId, tourId)).toBe(
      `@acomi/coachmarks/${spaceId}/${tourId}`,
    );
  });

  it('returns null when nothing stored', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    expect(await loadCoachmarkRecord(spaceId, tourId)).toBeNull();
    expect(await isCoachmarkFinished(spaceId, tourId)).toBe(false);
  });

  it('persists completed status', async () => {
    storage.setItem.mockResolvedValueOnce(undefined);
    const record = await saveCoachmarkRecord(spaceId, tourId, 'completed');
    expect(record.status).toBe('completed');
    expect(storage.setItem).toHaveBeenCalledWith(
      `@acomi/coachmarks/${spaceId}/${tourId}`,
      expect.stringContaining('"status":"completed"'),
    );
  });

  it('persists skipped status', async () => {
    storage.setItem.mockResolvedValueOnce(undefined);
    const record = await saveCoachmarkRecord(spaceId, tourId, 'skipped');
    expect(record.status).toBe('skipped');
  });

  it('loads a valid record and treats it as finished', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        status: 'skipped',
        completedAt: '2026-07-25T00:00:00.000Z',
      }),
    );
    const record = await loadCoachmarkRecord(spaceId, tourId);
    expect(record).toEqual({
      status: 'skipped',
      completedAt: '2026-07-25T00:00:00.000Z',
    });
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        status: 'skipped',
        completedAt: '2026-07-25T00:00:00.000Z',
      }),
    );
    expect(await isCoachmarkFinished(spaceId, tourId)).toBe(true);
  });

  it('ignores corrupt payloads', async () => {
    storage.getItem.mockResolvedValueOnce('{not-json');
    expect(await loadCoachmarkRecord(spaceId, tourId)).toBeNull();

    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({ status: 'unknown' }),
    );
    expect(await loadCoachmarkRecord(spaceId, tourId)).toBeNull();
  });

  it('clears record for future replay', async () => {
    storage.removeItem.mockResolvedValueOnce(undefined);
    await clearCoachmarkRecord(spaceId, tourId);
    expect(storage.removeItem).toHaveBeenCalledWith(
      `@acomi/coachmarks/${spaceId}/${tourId}`,
    );
  });
});
