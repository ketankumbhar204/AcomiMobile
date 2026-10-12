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
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import {
  androidModalNavigationInset,
  androidModalStatusBarInset,
  resolveModalSafeInsets,
} from '../../utils/modalSafeInsets';
import { Button } from './Button';

type ListFilterDrawerProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: React.ReactNode;
};

export function ListFilterDrawer(props: ListFilterDrawerProps) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
      statusBarTranslucent
      hardwareAccelerated>
      <SafeAreaProvider style={styles.flex} initialMetrics={initialWindowMetrics}>
        <FilterDrawerPanel {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

function FilterDrawerPanel({
  title,
  onClose,
  onReset,
  onApply,
  children,
}: ListFilterDrawerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const safe = resolveModalSafeInsets(
    insets,
    initialWindowMetrics?.insets,
    androidModalStatusBarInset(),
  );
  const topInset = safe.top;
  const bottomInset = safe.bottom > 0 ? safe.bottom : androidModalNavigationInset();
  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = Math.min(Math.round(windowWidth * 0.88), 400);

  return (
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
        <View
          style={[
            styles.panel,
            { width: panelWidth, marginTop: topInset, marginBottom: bottomInset },
          ]}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title ?? t('list.filterDrawer.title')}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}>
              <X size={18} color={colors.textPrimary} strokeWidth={2.2} />
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
        {checked ? <Check size={14} color={colors.primaryDark} strokeWidth={2.6} /> : null}
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
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 17,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  close: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.muted,
    fontWeight: '300',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
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
