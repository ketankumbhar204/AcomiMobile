import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ShortStayChoice } from '../ShortStayChoice';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; count?: number; amount?: string }) => {
      if (opts?.defaultValue) {
        return opts.defaultValue
          .replace('{{count}}', String(opts.count ?? ''))
          .replace('{{amount}}', String(opts.amount ?? ''));
      }
      return key;
    },
  }),
}));

jest.mock('lucide-react-native', () => ({
  Check: 'Check',
  CalendarDays: 'CalendarDays',
  CalendarRange: 'CalendarRange',
  Infinity: 'Infinity',
  Info: 'Info',
}));

jest.mock('../../../../components/ui', () => {
  const ReactLocal = require('react');
  const RN = require('react-native');
  return {
    DateField: ({ label, error }: { label: string; error?: string }) =>
      ReactLocal.createElement(
        RN.View,
        null,
        ReactLocal.createElement(RN.Text, null, label),
        error ? ReactLocal.createElement(RN.Text, null, error) : null,
      ),
    FormInput: ({ label, error }: { label: string; error?: string | null }) =>
      ReactLocal.createElement(
        RN.View,
        null,
        ReactLocal.createElement(RN.Text, null, label),
        error ? ReactLocal.createElement(RN.Text, null, error) : null,
      ),
  };
});

jest.mock('../../../../utils/occupancyContract', () => ({
  formatContractAmount: (n: number) => `₹${n}`,
}));

function collectText(node: TestRenderer.ReactTestInstance): string[] {
  const out: string[] = [];
  const walk = (n: TestRenderer.ReactTestInstance | string) => {
    if (typeof n === 'string') {
      out.push(n);
      return;
    }
    if (typeof n.props?.children === 'string') {
      out.push(n.props.children);
    } else if (Array.isArray(n.props?.children)) {
      n.props.children.forEach((child: unknown) => {
        if (typeof child === 'string') {
          out.push(child);
        } else if (child && typeof child === 'object' && 'props' in (child as object)) {
          walk(child as TestRenderer.ReactTestInstance);
        }
      });
    }
    n.children?.forEach(child => walk(child as TestRenderer.ReactTestInstance | string));
  };
  walk(node);
  return out;
}

describe('ShortStayChoice', () => {
  it('renders stay-type cards with approved descriptions', () => {
    const onChoiceChange = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ShortStayChoice
          section="type"
          choice="MONTHLY"
          agreedTotal=""
          expectedExitDate=""
          showCheckout={false}
          onChoiceChange={onChoiceChange}
          onAgreedTotalChange={jest.fn()}
          onExpectedExitDateChange={jest.fn()}
        />,
      );
    });

    const text = collectText(tree!.root).join(' | ');
    expect(text).toContain('Monthly');
    expect(text).toContain('Fixed monthly rent.');
    expect(text).toContain('Daily');
    expect(text).toContain('Pay a daily rent for a fixed number of days');
    expect(text).toContain('No Fixed Move-Out Date');
    expect(text).toContain('No fixed move-out date. Pay daily rent until the resident vacates.');

    const shortCard = tree!.root.findAll(
      (n: TestRenderer.ReactTestInstance) =>
        typeof n.props?.onPress === 'function' &&
        collectText(n).join(' ').includes('Daily') &&
        collectText(n).join(' ').includes('Pay a daily rent'),
    )[0];
    expect(shortCard).toBeTruthy();
    act(() => {
      shortCard.props.onPress();
    });
    expect(onChoiceChange).toHaveBeenCalledWith('SHORT');
  });

  it('shows short-stay duration without monthly rent pricing', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ShortStayChoice
          section="details"
          choice="SHORT"
          agreedTotal=""
          expectedExitDate="2026-11-12"
          checkInDate="2026-11-05"
          showCheckout
          onChoiceChange={jest.fn()}
          onAgreedTotalChange={jest.fn()}
          onExpectedExitDateChange={jest.fn()}
        />,
      );
    });

    const text = collectText(tree!.root).join(' | ');
    expect(text).toContain('Checkout date');
    expect(text).toContain('Stay duration');
    expect(text).toContain('7 nights');
    expect(text).not.toContain('Monthly rent (');
  });

  it('shows daily rent and calculated stay rent on contract section', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ShortStayChoice
          section="contract"
          choice="SHORT"
          agreedTotal=""
          dailyRent="400"
          expectedExitDate="2026-11-12"
          checkInDate="2026-11-05"
          showCheckout={false}
          onChoiceChange={jest.fn()}
          onAgreedTotalChange={jest.fn()}
          onDailyRentChange={jest.fn()}
          onExpectedExitDateChange={jest.fn()}
        />,
      );
    });

    const text = collectText(tree!.root).join(' | ');
    expect(text).toContain('Daily rent (per night)');
    expect(text).toContain('Stay Rent');
    expect(text).toContain('₹2800');
  });
});
