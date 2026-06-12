import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from './Button';

export type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void | Promise<void>;
  onDismiss?: () => void;
};

type ConfirmDialogContextValue = {
  showConfirm: (options: ConfirmDialogOptions) => void;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    if (loading) {
      return;
    }
    options?.onDismiss?.();
    setOptions(null);
  }, [loading, options]);

  const showConfirm = useCallback((next: ConfirmDialogOptions) => {
    setOptions(next);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!options) {
      return;
    }

    setLoading(true);
    try {
      await options.onConfirm();
      setOptions(null);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const contextValue = useMemo(() => ({ showConfirm }), [showConfirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={options !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent>
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={options?.cancelLabel ?? t('common.cancel')}>
          <Pressable style={styles.card} onPress={event => event.stopPropagation()}>
            <Text style={styles.title}>{options?.title}</Text>
            <Text style={styles.message}>{options?.message}</Text>
            <View
              style={[
                styles.actions,
                options?.hideCancel ? styles.actionsSingle : undefined,
              ]}>
              {options?.hideCancel ? null : (
                <Button
                  label={options?.cancelLabel ?? t('common.cancel')}
                  variant="ghost"
                  onPress={close}
                  disabled={loading}
                  style={styles.actionButton}
                />
              )}
              <Button
                label={options?.confirmLabel ?? ''}
                onPress={() => void handleConfirm()}
                loading={loading}
                style={[
                  styles.actionButton,
                  options?.destructive ? styles.destructiveButton : undefined,
                ]}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog(): ConfirmDialogContextValue {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionsSingle: {
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
  },
});
