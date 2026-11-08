import React from 'react';
import { StyleSheet } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import {
  OccupancyWizardHeroBanner,
  occupancyWizardHeroBannerStyles,
} from '../OccupancyWizardHeroBanner';

jest.mock('lucide-react-native', () => ({
  Home: 'Home',
}));

describe('OccupancyWizardHeroBanner', () => {
  it('uses a single-row layout for icon and title', () => {
    const Home = 'Home' as unknown as React.ComponentType<{ size?: number; color?: string }>;
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <OccupancyWizardHeroBanner title="Move In today" Icon={Home as never} />,
      );
    });

    const flat = StyleSheet.flatten(occupancyWizardHeroBannerStyles.hero);
    expect(flat.flexDirection).toBe('row');
    expect(flat.alignItems).toBe('center');

    const root = tree!.root.findByProps({ testID: 'occupancy-wizard-hero' });
    expect(root).toBeTruthy();
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('Move In today');
  });

  it('shows stay type chip right-aligned next to the title', () => {
    const Home = 'Home' as unknown as React.ComponentType<{ size?: number; color?: string }>;
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <OccupancyWizardHeroBanner
          title="Move In today"
          Icon={Home as never}
          stayTypeLabel="No Fixed Move-Out Date"
        />,
      );
    });

    const chip = tree!.root.findByProps({ testID: 'occupancy-wizard-hero-stay-type' });
    expect(chip).toBeTruthy();
    expect(JSON.stringify(tree!.toJSON())).toContain('No Fixed Move-Out Date');
    expect(StyleSheet.flatten(occupancyWizardHeroBannerStyles.stayTypeChip).marginLeft).toBe(
      'auto',
    );
  });
});
