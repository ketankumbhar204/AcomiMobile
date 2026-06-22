import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import { Button } from './Button';

type ListFilterDrawerProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: React.ReactNode;
};

export function ListFilterDrawer({
  visible,
  title,
  onClose,
  onReset,
  onApply,
  children,
}: ListFilterDrawerProps) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = Math.min(Math.round(windowWidth * 0.88), 400);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      hardwareAccelerated>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
        <View style={[styles.panel, { width: panelWidth }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title ?? t('list.filterDrawer.title')}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={t('list.filterDrawer.reset')}
              variant="ghost"
              onPress={onReset}
              style={styles.footerButton}
            />
            <Button
              label={t('list.filterDrawer.apply')}
              onPress={onApply}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type FilterDrawerSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function FilterDrawerSection({ title, children }: FilterDrawerSectionProps) {
  return (
    <View style={sectionStyles.section}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

type FilterCheckboxRowProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

export function FilterCheckboxRow({ label, checked, onToggle }: FilterCheckboxRowProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={optionStyles.row}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}>
      <View style={[optionStyles.box, checked && optionStyles.boxChecked]}>
        {checked ? <Text style={optionStyles.checkMark}>✓</Text> : null}
      </View>
      <Text style={optionStyles.label}>{label}</Text>
    </Pressable>
  );
}

type FilterRadioRowProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
};

export function FilterRadioRow({ label, selected, onSelect }: FilterRadioRowProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={optionStyles.row}
      accessibilityRole="radio"
      accessibilityState={{ selected }}>
      <View style={[optionStyles.radio, selected && optionStyles.radioSelected]}>
        {selected ? <View style={optionStyles.radioDot} /> : null}
      </View>
      <Text style={optionStyles.label}>{label}</Text>
    </Pressable>
  );
}

export function FilterDrawerDivider() {
  return <View style={sectionStyles.divider} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 0,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    elevation: 24,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 17,
    color: colors.textPrimary,
  },
  close: {
    ...typography.body,
    fontSize: 20,
    color: colors.muted,
    paddingHorizontal: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  footerButton: {
    width: '100%',
  },
});

const sectionStyles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  body: {
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
});

const optionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.button,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  boxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    lineHeight: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
});
