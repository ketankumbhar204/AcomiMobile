import fs from 'fs';
import path from 'path';

describe('dashboard reserve resident entry', () => {
  const dashboard = fs.readFileSync(
    path.join(__dirname, '../DashboardScreen.tsx'),
    'utf8',
  );
  const inventory = fs.readFileSync(
    path.join(__dirname, '../DashboardBedInventoryScreen.tsx'),
    'utf8',
  );

  it('opens the same allocate bed list as Move In', () => {
    const reserveAction = dashboard.slice(
      dashboard.indexOf("t('dashboard.quickActions.reserve')"),
      dashboard.indexOf("t('dashboard.quickActions.transfer')"),
    );
    expect(reserveAction).toContain("navigateFromTab('DashboardBedInventory'");
    expect(reserveAction).toContain("intent: 'allocate'");
    expect(reserveAction).not.toContain("intent: 'reserve'");
    expect(dashboard).not.toContain("openFromSpace('RESERVE')");
    expect(dashboard).not.toContain('useHierarchyOccupancyPicker');
  });

  it('continues a chosen bed into the existing allocate wizard', () => {
    expect(inventory).toContain("mode: 'ALLOCATE'");
    expect(inventory).toContain('bedId: bed.bedId');
    expect(inventory).not.toContain("mode: 'RESERVE'");
    expect(inventory).not.toContain('flowIntent');
  });
});
