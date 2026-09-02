import { create } from 'zustand';

interface AdminState {
  adminMode: boolean;
  setAdminMode: (value: boolean) => void;
}

export const useAdminStore = create<AdminState>(set => ({
  adminMode: false,
  setAdminMode: (value: boolean) => set({ adminMode: value }),
}));

export function isPlatformAdmin(
  systemRole: string | null | undefined,
): boolean {
  return systemRole === 'ADMIN';
}

/** Route admins into admin app after normal login; operators stay in operator app. */
export function syncAdminModeForUser(
  systemRole: string | null | undefined,
): void {
  useAdminStore.getState().setAdminMode(isPlatformAdmin(systemRole));
}
