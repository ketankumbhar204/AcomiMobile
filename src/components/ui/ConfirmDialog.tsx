import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  InteractionManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  const [dialog, setDialog] = useState<ConfirmDialogOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    if (loading) {
      return;
    }
    dialog?.onDismiss?.();
    setDialog(null);
  }, [dialog, loading]);

  const showConfirm = useCallback((next: ConfirmDialogOptions) => {
    setLoading(false);
    setDialog(next);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!dialog || loading) {
      return;
    }

    const onConfirm = dialog.onConfirm;
    setLoading(true);
    setDialog(null);

    try {
      await new Promise<void>(resolve => {
        InteractionManager.runAfterInteractions(() => resolve());
      });
      await onConfirm();
    } catch {
      // Errors are handled by the caller (e.g. toast).
    } finally {
      setLoading(false);
    }
  }, [dialog, loading]);

  const contextValue = useMemo(() => ({ showConfirm }), [showConfirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={dialog !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
        presentationStyle="overFullScreen">
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTap} onPress={close} accessibilityRole="button" />
          <View style={styles.card}>
            <Text style={styles.title}>{dialog?.title}</Text>
            <Text style={styles.message}>{dialog?.message}</Text>
            <View
              style={[
                styles.actions,
                dialog?.hideCancel ? styles.actionsSingle : undefined,
              ]}>
              {dialog?.hideCancel ? null : (
                <Button
                  label={dialog?.cancelLabel ?? t('common.cancel')}
                  variant="ghost"
                  onPress={close}
                  disabled={loading}
                  style={styles.actionButton}
                />
              )}
              <Button
                label={dialog?.confirmLabel ?? ''}
                onPress={() => void handleConfirm()}
                loading={loading}
                style={[
                  styles.actionButton,
                  dialog?.destructive ? styles.destructiveButton : undefined,
                ]}
              />
            </View>
          </View>
        </View>
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
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    zIndex: 1,
    elevation: 8,
    ...shadows.md,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: spacing.lg,
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
