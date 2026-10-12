import fs from 'fs';
import path from 'path';

describe('AdminInquiryPurchaseListScreen filters', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../../screens/admin/AdminInquiryPurchaseListScreen.tsx'),
    'utf8',
  );

  it('uses the summary cards as the status filter and does not render a second chip row', () => {
    expect(source).toContain('nextInquiryPurchaseStatus');
    expect(source).toContain('filterInquiryPurchases');
    expect(source).not.toMatch(/filters:\s*\[/);
    expect(source).not.toContain("defaultValue: 'All'");
    expect(source).not.toContain('statusChips');
  });
});