import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { SelectedInventorySummaryCard } from '../SelectedInventorySummaryCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { label?: string; defaultValue?: string }) => {
      if (key === 'accommodation.listItem.bed') {
        return `Bed ${opts?.label ?? ''}`;
      }
      if (key === 'occupancy.section.bed') {
        return 'Bed';
      }
      if (key === 'occupancy.section.room') {
        return 'Room';
      }
      if (key === 'occupancy.section.unit') {
        return 'Unit';
      }
      return opts?.defaultValue ?? key;
    },
  }),
}));

jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));

function collectText(node: TestRenderer.ReactTestInstance): string {
  const parts: string[] = [];
  const walk = (n: TestRenderer.ReactTestInstance | string) => {
    if (typeof n === 'string') {
      parts.push(n);
      return;
    }
    if (typeof n.props?.children === 'string') {
      parts.push(n.props.children);
    }
    n.children?.forEach(child => walk(child as TestRenderer.ReactTestInstance | string));
  };
  walk(node);
  return parts.join(' | ');
}

describe('SelectedInventorySummaryCard', () => {
  it('shows Bed A instead of bare A', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <SelectedInventorySummaryCard
          context={{
            spaceName: 'Sunrise PG',
            buildingName: 'PG 1',
            floorName: 'Floor 1',
            unitName: 'Unit 101',
            roomName: 'Room B',
            bedName: 'A',
          }}
        />,
      );
    });

    const text = collectText(tree!.root);
    expect(text).toContain('Bed A');
    expect(text).toContain('Sunrise PG · PG 1 · Floor 1 · Unit 101 · Room B');
    expect(text.split(' | ').includes('A')).toBe(false);
  });
});
