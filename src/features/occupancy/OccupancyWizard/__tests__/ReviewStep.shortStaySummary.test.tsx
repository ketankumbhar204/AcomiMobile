import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ReviewStep } from '../steps/ReviewStep';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; count?: number }) => {
      if (opts?.defaultValue) {
        return opts.defaultValue.replace('{{count}}', String(opts.count ?? ''));
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }));

jest.mock('../../../../components/occupancy/SelectedInventorySummaryCard', () => ({
  SelectedInventorySummaryCard: () => null,
}));

jest.mock('../../../../components/ui', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return {
    Card: ({ children }: { children?: React.ReactNode }) =>
      ReactLocal.createElement(View, null, children),
  };
});

jest.mock('../../../../utils/mealDates', () => ({
  formatMenuDate: (iso: string) => iso,
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

describe('ReviewStep short stay summary', () => {
  it('shows one charges card with stay rent calc and allocation total (no duplicate payment card)', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ReviewStep
          mode="ALLOCATE"
          member={{
            memberId: 'm1',
            fullName: 'Customer 1',
            mobileNumber: '9111111111',
          }}
          hideTitle
          stayChoice="SHORT"
          agreedTotalPreview="500"
          contractValues={{
            rentSnapshot: '',
            depositSnapshot: '3000',
            bookingAdvanceAmount: '',
            bookingAdvanceCollected: false,
            foodEnabled: true,
            foodChargeSnapshot: '',
            otherCharges: [],
          }}
          moveInDate="2026-11-05"
          expectedExitDate="2026-11-12"
        />,
      );
    });

    const text = collectText(tree!.root);
    expect(text).toContain('Daily rent');
    expect(text).toContain('Stay rent');
    expect(text).toContain('Total on allocation');
    // Consolidated — should not show a second Payment summary heading.
    expect(text.match(/Payment summary/g) ?? []).toHaveLength(0);
  });

  it('maps Include food charges from contractValues.foodEnabled, not space foodIncludedInRent', () => {
    let treeOff: TestRenderer.ReactTestRenderer;
    let treeOn: TestRenderer.ReactTestRenderer;
    act(() => {
      treeOff = TestRenderer.create(
        <ReviewStep
          mode="ALLOCATE"
          member={{
            memberId: 'm1',
            fullName: 'Customer 1',
            mobileNumber: '9111111111',
          }}
          hideTitle
          stayChoice="SHORT"
          agreedTotalPreview="400"
          foodPolicy={{ foodIncludedInRent: true, defaultFoodCharge: null }}
          contractValues={{
            rentSnapshot: '400',
            depositSnapshot: '0',
            bookingAdvanceAmount: '',
            bookingAdvanceCollected: false,
            foodEnabled: false,
            foodChargeSnapshot: '',
            otherCharges: [],
          }}
          moveInDate="2026-11-05"
          expectedExitDate="2026-11-12"
        />,
      );
      treeOn = TestRenderer.create(
        <ReviewStep
          mode="ALLOCATE"
          member={{
            memberId: 'm1',
            fullName: 'Customer 1',
            mobileNumber: '9111111111',
          }}
          hideTitle
          stayChoice="SHORT"
          agreedTotalPreview="400"
          foodPolicy={{ foodIncludedInRent: false, defaultFoodCharge: null }}
          contractValues={{
            rentSnapshot: '400',
            depositSnapshot: '0',
            bookingAdvanceAmount: '',
            bookingAdvanceCollected: false,
            foodEnabled: true,
            foodChargeSnapshot: '',
            otherCharges: [],
          }}
          moveInDate="2026-11-05"
          expectedExitDate="2026-11-12"
        />,
      );
    });

    expect(collectText(treeOff!.root)).toContain('common.no');
    expect(collectText(treeOn!.root)).toContain('common.yes');
  });
});
