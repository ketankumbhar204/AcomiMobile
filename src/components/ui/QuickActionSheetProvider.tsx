import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  QuickActionSheetModal,
  type QuickActionSheetOption,
} from './QuickActionSheetModal';

type QuickActionSheetContextValue = {
  showQuickActionSheet: (title: string, options: QuickActionSheetOption[]) => void;
};

const QuickActionSheetContext = createContext<QuickActionSheetContextValue | null>(null);

export function QuickActionSheetProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<{
    title: string;
    options: QuickActionSheetOption[];
  } | null>(null);

  const showQuickActionSheet = useCallback(
    (title: string, options: QuickActionSheetOption[]) => {
      if (options.length === 0) {
        return;
      }
      setSheet({ title, options });
    },
    [],
  );

  const close = useCallback(() => {
    setSheet(null);
  }, []);

  const contextValue = useMemo(
    () => ({ showQuickActionSheet }),
    [showQuickActionSheet],
  );

  return (
    <QuickActionSheetContext.Provider value={contextValue}>
      {children}
      <QuickActionSheetModal
        visible={sheet !== null}
        title={sheet?.title ?? ''}
        options={sheet?.options ?? []}
        onClose={close}
      />
    </QuickActionSheetContext.Provider>
  );
}

export function useQuickActionSheet(): QuickActionSheetContextValue {
  const context = useContext(QuickActionSheetContext);
  if (!context) {
    throw new Error('useQuickActionSheet must be used within QuickActionSheetProvider');
  }
  return context;
}
