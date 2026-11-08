import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { canOpenContactOptions } from '../../utils/contactActions';
import {
  ContactOptionsBottomSheet,
  type ContactOptionsTarget,
} from './ContactOptionsBottomSheet';

type ContactOptionsContextValue = {
  openContactOptions: (target: ContactOptionsTarget) => void;
};

const ContactOptionsContext = createContext<ContactOptionsContextValue | null>(null);

export function ContactOptionsProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<ContactOptionsTarget | null>(null);

  const openContactOptions = useCallback((next: ContactOptionsTarget) => {
    if (!canOpenContactOptions(next.phoneNumber)) {
      return;
    }
    setTarget({
      phoneNumber: next.phoneNumber,
      displayName: next.displayName ?? null,
      roleLabel: next.roleLabel ?? null,
      avatarInitial: next.avatarInitial ?? null,
    });
  }, []);

  const close = useCallback(() => setTarget(null), []);

  const value = useMemo(() => ({ openContactOptions }), [openContactOptions]);

  return (
    <ContactOptionsContext.Provider value={value}>
      {children}
      <ContactOptionsBottomSheet visible={target != null} target={target} onClose={close} />
    </ContactOptionsContext.Provider>
  );
}

export function useContactOptions(): ContactOptionsContextValue {
  const context = useContext(ContactOptionsContext);
  if (!context) {
    throw new Error('useContactOptions must be used within ContactOptionsProvider');
  }
  return context;
}

/** Safe hook for optional provider nesting (returns no-op when missing). */
export function useOptionalContactOptions(): ContactOptionsContextValue {
  const context = useContext(ContactOptionsContext);
  return (
    context ?? {
      openContactOptions: () => undefined,
    }
  );
}
