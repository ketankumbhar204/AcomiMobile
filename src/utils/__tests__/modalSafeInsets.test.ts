import { readFileSync } from 'fs';
import { join } from 'path';
import { androidInsetFloorDp, resolveModalSafeInsets } from '../modalSafeInsets';

describe('resolveModalSafeInsets', () => {
  it('keeps the status bar clear when a modal reports no top inset', () => {
    expect(resolveModalSafeInsets({ top: 0, bottom: 0 }, null, 24)).toEqual({
      top: 24,
      bottom: 0,
    });
  });

  it('uses the larger of the live inset, the window inset, and the status bar', () => {
    expect(
      resolveModalSafeInsets({ top: 0, bottom: 0 }, { top: 47, bottom: 34 }, 24),
    ).toEqual({ top: 47, bottom: 34 });
  });

  it('keeps an Android status-bar floor when the system reports no height', () => {
    expect(androidInsetFloorDp(24, 0)).toBe(24);
    expect(androidInsetFloorDp(24, 48)).toBe(48);
    expect(androidInsetFloorDp(48, null)).toBe(48);
    const source = readFileSync(join(__dirname, '../modalSafeInsets.ts'), 'utf8');
    expect(source).toContain("Platform.OS !== 'android'");
    expect(source).toContain('androidInsetFloorDp(24, StatusBar.currentHeight)');
    expect(source).not.toContain('PixelRatio');
  });

  it('keeps the filter drawer header below the status bar and the actions below the content', () => {
    const drawer = readFileSync(join(__dirname, '../../components/ui/ListFilterDrawer.tsx'), 'utf8');
    expect(drawer).toContain('SafeAreaProvider');
    expect(drawer).toContain('androidModalStatusBarInset');
    expect(drawer).toContain('marginTop: topInset');
    expect(drawer).toContain('marginBottom: bottomInset');
    expect(drawer).toContain('androidModalNavigationInset');
    expect(drawer).toContain('width: 44');
    expect(drawer).toContain('minHeight: 0');
    expect(drawer).toContain('paddingTop: spacing.md');
    expect(drawer.indexOf('<ScrollView')).toBeGreaterThan(drawer.indexOf('styles.header'));
    expect(drawer.indexOf('styles.footer')).toBeGreaterThan(drawer.indexOf('</ScrollView>'));
  });
});
