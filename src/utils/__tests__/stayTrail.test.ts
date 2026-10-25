import { formatHierarchyTrail, formatStayTrail } from '../stayTrail';

describe('stay trail', () => {
  it('keeps unit, room, and bed and uses arrows', () => {
    expect(formatStayTrail('Unit 101 • Room C • Bed 2')).toBe('Unit 101 → Room C → Bed 2');
    expect(formatStayTrail('Unit 101 · Room C')).toBe('Unit 101 → Room C');
  });

  it('builds a hierarchy from separate names and prefixes the bed', () => {
    expect(formatHierarchyTrail({ unit: 'Unit 101', room: 'Room C', bed: '2' })).toBe(
      'Unit 101 → Room C → Bed 2',
    );
    expect(formatHierarchyTrail({ unit: '101', room: 'C' })).toBe('Unit 101 → Room C');
    expect(formatHierarchyTrail({})).toBeNull();
  });
});
