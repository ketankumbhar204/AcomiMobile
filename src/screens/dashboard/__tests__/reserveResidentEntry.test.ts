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

  it('opens vacant beds with reserve intent (Future Reservation)', () => {
    const reserveAction = dashboard.slice(
      dashboard.indexOf("t('dashboard.quickActions.reserve')"),
      dashboard.indexOf("t('dashboard.quickActions.transfer')"),
    );
    expect(reserveAction).toContain("navigateFromTab('DashboardBedInventory'");
    expect(reserveAction).toContain("intent: 'reserve'");
    expect(reserveAction).not.toContain("intent: 'allocate'");
    expect(dashboard).not.toContain("openFromSpace('RESERVE')");
    expect(dashboard).not.toContain('useHierarchyOccupancyPicker');
  });

  it('continues a chosen bed into the Reserve wizard', () => {
    expect(inventory).toContain("mode: wizardMode");
    expect(inventory).toContain("selectingForReserve");
    expect(inventory).toContain("wizardMode = selectingForReserve ? 'RESERVE' : 'ALLOCATE'");
    expect(inventory).toContain('bedId: bed.bedId');
  });
});
