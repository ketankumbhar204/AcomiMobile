import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { OccupancyWizardStepHeader } from '../OccupancyWizardStepHeader';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { label?: string; defaultValue?: string; current?: number; total?: number }) => {
      if (key === 'occupancy.section.shortStayChoice') {
        return 'Daily';
      }
      if (key === 'occupancy.section.openEndedStayChoice') {
        return 'No Fixed Move-Out Date';
      }
      if (key === 'occupancy.section.monthlyStayChoice') {
        return 'Monthly';
      }
      if (key === 'occupancy.section.stayTypeSelected') {
        return `Stay Type: ${opts?.label ?? ''}`;
      }
      return opts?.defaultValue ?? key;
    },
  }),
}));

jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));

jest.mock('../SelectedInventorySummaryCard', () => ({
  SelectedInventorySummaryCard: () => null,
}));

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

describe('OccupancyWizardStepHeader stay type badge', () => {
  it('shows Stay Type: Daily when SHORT is selected', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <OccupancyWizardStepHeader
          stepTitle="Select member"
          hierarchyContext={{ bedName: 'A', spaceName: 'Sunrise PG' }}
          stayChoice="SHORT"
          showStayChoiceBadge
          compactInventory={false}
        />,
      );
    });
    expect(collectText(tree!.root)).toContain('Stay Type: Daily');
  });

  it('shows Stay Type: No Fixed Move-Out Date when OPEN_ENDED is selected', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <OccupancyWizardStepHeader
          stepTitle="Contract terms"
          hierarchyContext={{ bedName: 'A' }}
          stayChoice="OPEN_ENDED"
          showStayChoiceBadge
          compactInventory={false}
        />,
      );
    });
    expect(collectText(tree!.root)).toContain('Stay Type: No Fixed Move-Out Date');
  });
});
