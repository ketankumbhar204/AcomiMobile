import { formatBedDisplayLabel } from '../formatBedDisplayLabel';

const t = ((key: string, opts?: { label?: string }) => {
  if (key === 'occupancy.section.bed') {
    return 'Bed';
  }
  if (key === 'accommodation.listItem.bed') {
    return `Bed ${opts?.label ?? ''}`;
  }
  return key;
}) as never;

describe('formatBedDisplayLabel', () => {
  it('prefixes a bare identifier as Bed A', () => {
    expect(formatBedDisplayLabel('A', t)).toBe('Bed A');
    expect(formatBedDisplayLabel('B', t)).toBe('Bed B');
    expect(formatBedDisplayLabel('1', t)).toBe('Bed 1');
  });

  it('keeps labels that already name the bed', () => {
    expect(formatBedDisplayLabel('Bed A', t)).toBe('Bed A');
    expect(formatBedDisplayLabel('Lower', t)).toBe('Lower');
    expect(formatBedDisplayLabel('Upper bunk', t)).toBe('Upper bunk');
  });

  it('falls back when the identifier is missing', () => {
    expect(formatBedDisplayLabel('', t)).toBe('Bed');
    expect(formatBedDisplayLabel(null, t)).toBe('Bed');
  });
});
