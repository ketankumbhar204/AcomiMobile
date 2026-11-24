import type { SpaceType } from '../../api/types';
import {
  getMarketingDemoMetrics,
  regenerateMarketingDemoDataset,
} from '../marketingDemoDataset';

const TYPES: SpaceType[] = ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL', 'CORPORATE_STAY', 'MESS'];

describe('marketing demo dataset', () => {
  beforeEach(() => {
    regenerateMarketingDemoDataset();
  });

  it('keeps each space stable and distinct', () => {
    const first = getMarketingDemoMetrics('space-a', 'PG');
    const again = getMarketingDemoMetrics('space-a', 'PG');
    const other = getMarketingDemoMetrics('space-b', 'HOSTEL');
    expect(again).toEqual(first);
    expect(other?.expected).not.toBe(first?.expected);
  });

  it.each(TYPES)('reconciles %s summary figures', spaceType => {
    const metrics = getMarketingDemoMetrics(`space-${spaceType}`, spaceType);
    expect(metrics).not.toBeNull();
    if (!metrics) {
      return;
    }
    expect(metrics.occupied + metrics.available + metrics.reserved).toBe(metrics.totalCapacity);
    expect(metrics.collected + metrics.pending + metrics.underReview).toBe(metrics.expected);
    expect(metrics.occupancyPercent).toBe(Math.round((metrics.occupied / metrics.totalCapacity) * 100));
    expect(metrics.available).toBeGreaterThan(0);
    expect(metrics.pending).toBeGreaterThanOrEqual(0);
    expect(metrics.collected).toBeLessThanOrEqual(metrics.expected);
    expect(metrics.activeMembers).toBeLessThanOrEqual(metrics.members);
    expect(metrics.breakfastResponses).toBeLessThanOrEqual(metrics.members);
    expect(metrics.lunchResponses).toBeLessThanOrEqual(metrics.members);
    expect(metrics.dinnerResponses).toBeLessThanOrEqual(metrics.members);
    expect(metrics.mealResponses).toBeLessThanOrEqual(metrics.members);
    expect(metrics.mealResponses).toBe(
      Math.max(metrics.breakfastResponses, metrics.lunchResponses, metrics.dinnerResponses),
    );
  });

  it('changes the set only when regeneration is requested', () => {
    const before = getMarketingDemoMetrics('space-a', 'PG');
    const sameSession = getMarketingDemoMetrics('space-a', 'PG');
    expect(sameSession).toEqual(before);
    regenerateMarketingDemoDataset();
    const after = getMarketingDemoMetrics('space-a', 'PG');
    expect(after).not.toEqual(before);
  });
});
