import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, ChevronUp, LayoutGrid, Search } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { categoryVisual } from '../../utils/serviceContactCategoryVisual';

export type CategoryOption = {
  code: string;
  label: string;
};

type CategorySelectFieldProps = {
  label: string;
  value: string;
  options: CategoryOption[];
  error?: string;
  onChange: (code: string) => void;
};

type Anchor = { x: number; y: number; width: number; height: number };

export function CategorySelectField({
  label,
  value,
  options,
  error,
  onChange,
}: CategorySelectFieldProps) {
  const { t } = useTranslation();
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [anchor, setAnchor] = useState<Anchor>({ x: 0, y: 0, width: 0, height: 0 });
  const selected = options.find(option => option.code === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(option => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  function close() {
    setOpen(false);
    setQuery('');
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setQuery('');
      setOpen(true);
    });
  }

  function choose(code: string) {
    onChange(code);
    close();
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View ref={anchorRef} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={label}
          onPress={toggle}
          style={[styles.field, error ? styles.fieldError : null]}>
          <View style={styles.glyph}>
            <LayoutGrid size={16} color={colors.teal} strokeWidth={2.2} />
          </View>
          <Text style={[styles.fieldText, !selected && styles.placeholder]} numberOfLines={1}>
            {selected?.label ??
              t('serviceContacts.selectCategory', { defaultValue: 'Select category' })}
          </Text>
          {open ? (
            <ChevronUp size={18} color={colors.textSecondary} strokeWidth={2.2} />
          ) : (
            <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[
              styles.panel,
              { top: anchor.y + anchor.height + spacing.xs, left: anchor.x, width: anchor.width },
            ]}
            onPress={event => event.stopPropagation()}>
            <View style={styles.searchRow}>
              <Search size={16} color={colors.muted} strokeWidth={2.2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('serviceContacts.searchCategory', { defaultValue: 'Search category' })}
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel={t('serviceContacts.searchCategory', {
                  defaultValue: 'Search category',
                })}
              />
            </View>
            <ScrollView
              style={styles.list}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              bounces={false}>
              {filtered.length === 0 ? (
                <Text style={styles.empty}>
                  {t('serviceContacts.noCategoryMatch', { defaultValue: 'No matching category' })}
                </Text>
              ) : (
                filtered.map(option => {
                  const isSelected = option.code === value;
                  const visual = categoryVisual(option.code, option.label);
                  const Icon = visual.icon;
                  return (
                    <Pressable
                      key={option.code}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => choose(option.code)}
                      style={[styles.option, isSelected && styles.optionSelected]}>
                      <View style={[styles.optionGlyph, { backgroundColor: visual.iconBg }]}>
                        <Icon size={16} color={visual.iconColor} strokeWidth={2.2} />
                      </View>
                      <Text
                        style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                        numberOfLines={2}>
                        {option.label}
                      </Text>
                      {isSelected ? (
                        <Check size={18} color={colors.teal} strokeWidth={2.8} />
                      ) : (
                        <View style={styles.checkSpacer} />
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  fieldError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  fieldText: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  placeholder: {
    color: colors.muted,
  },
  glyph: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    includeFontPadding: false,
  },
  list: {
    maxHeight: 280,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  optionGlyph: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: colors.lightGreen,
  },
  optionLabel: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
    lineHeight: 20,
    includeFontPadding: false,
  },
  optionLabelSelected: {
    fontWeight: '700',
  },
  checkSpacer: {
    width: 18,
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
