import fs from 'fs';
import path from 'path';

describe('space role display labels', () => {
  const en = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../i18n/locales/en.json'), 'utf8'),
  ) as {
    admin: {
      labels: { member: string };
      users: { createTestUserRoles: Record<string, string> };
    };
    spaces: { roles: Record<string, string> };
  };

  it('shows the individual Member role, not the plural Members label', () => {
    expect(en.admin.users.createTestUserRoles).toEqual({
      OWNER: 'Owner',
      MANAGER: 'Manager',
      TENANT: 'Member',
      CUSTOMER: 'Customer',
      STAFF: 'Staff',
    });
    expect(en.admin.labels.member).toBe('Member');
    expect(en.spaces.roles.MEMBER).toBe('Member');
  });
});
