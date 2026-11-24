import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, FileText, Pencil, Plus, Trash2 } from 'lucide-react-native';
import type { RuleAssignment, SpaceType } from '../../api/types';
import {
  MAX_RULE_TEXT_LENGTH,
  MAX_SPACE_RULES,
  buildEditableRuleRows,
  selectedRulesFromEditableRows,
} from '../../utils/spaceRules';
import { colors, radius, spacing, typography } from '../../theme';

type SpaceRulesFieldProps = {
  spaceType: SpaceType | null | undefined;
  value: RuleAssignment[];
  onChange: (value: RuleAssignment[]) => void;
  disabled?: boolean;
};

type EditableRow = ReturnType<typeof buildEditableRuleRows>[number] & { rowId: string };

export function SpaceRulesField({
  spaceType,
  value,
  onChange,
  disabled = false,
}: SpaceRulesFieldProps) {
  const { t } = useTranslation();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const rows: EditableRow[] = useMemo(() => {
    let customIndex = 0;
    return buildEditableRuleRows(spaceType, value).map(row => ({
      ...row,
      rowId: row.isCustom ? `CUSTOM:${customIndex++}:${row.label}` : row.code,
    }));
  }, [spaceType, value]);

  function commit(nextRows: EditableRow[]) {
    onChange(
      selectedRulesFromEditableRows(
        nextRows.map(({ code, label, selected }) => ({ code, label, selected })),
      ),
    );
  }

  function toggleRow(rowId: string) {
    if (disabled) {
      return;
    }
    const next = rows.map(row =>
      row.rowId === rowId ? { ...row, selected: !row.selected } : row,
    );
    const selectedCount = next.filter(row => row.selected).length;
    if (selectedCount > MAX_SPACE_RULES) {
      Alert.alert(
        t('spaces.rules.maxReachedTitle', { defaultValue: 'Limit reached' }),
        t('spaces.rules.maxReachedBody', {
          defaultValue: 'You can select up to {{count}} rules.',
          count: MAX_SPACE_RULES,
        }),
      );
      return;
    }
    commit(next);
  }

  function beginEdit(row: EditableRow) {
    if (disabled) {
      return;
    }
    setEditingRowId(row.rowId);
    setDraftText(row.label);
  }

  function saveEdit(rowId: string) {
    const text = draftText.trim();
    if (!text) {
      Alert.alert(
        t('spaces.rules.textRequiredTitle', { defaultValue: 'Rule text required' }),
        t('spaces.rules.textRequiredBody', {
          defaultValue: 'Enter the rule wording before saving.',
        }),
      );
      return;
    }
    if (text.length > MAX_RULE_TEXT_LENGTH) {
      Alert.alert(
        t('spaces.rules.textTooLongTitle', { defaultValue: 'Too long' }),
        t('spaces.rules.textTooLongBody', {
          defaultValue: 'Rule text must be at most {{count}} characters.',
          count: MAX_RULE_TEXT_LENGTH,
        }),
      );
      return;
    }
    const next = rows.map(row =>
      row.rowId === rowId ? { ...row, label: text, selected: true } : row,
    );
    commit(next);
    setEditingRowId(null);
    setDraftText('');
  }

  function deleteCustom(rowId: string) {
    if (disabled) {
      return;
    }
    commit(rows.filter(row => row.rowId !== rowId));
  }

  function addCustom() {
    const text = customDraft.trim();
    if (!text) {
      return;
    }
    if (text.length > MAX_RULE_TEXT_LENGTH) {
      Alert.alert(
        t('spaces.rules.textTooLongTitle', { defaultValue: 'Too long' }),
        t('spaces.rules.textTooLongBody', {
          defaultValue: 'Rule text must be at most {{count}} characters.',
          count: MAX_RULE_TEXT_LENGTH,
        }),
      );
      return;
    }
    const selectedCount = rows.filter(row => row.selected).length;
    if (selectedCount >= MAX_SPACE_RULES) {
      Alert.alert(
        t('spaces.rules.maxReachedTitle', { defaultValue: 'Limit reached' }),
        t('spaces.rules.maxReachedBody', {
          defaultValue: 'You can select up to {{count}} rules.',
          count: MAX_SPACE_RULES,
        }),
      );
      return;
    }
    onChange(
      selectedRulesFromEditableRows([
        ...rows.map(({ code, label, selected }) => ({ code, label, selected })),
        { code: 'CUSTOM', label: text, selected: true },
      ]),
    );
    setCustomDraft('');
    setAddingCustom(false);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <FileText size={16} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>
            {t('spaces.rules.title', { defaultValue: 'Rules & Guidelines' })}
          </Text>
          <Text style={styles.helper}>
            {t('spaces.rules.helper', {
              defaultValue:
                'Select, edit or add rules for this space. These rules will be shown to residents.',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {rows.map((row, index) => {
          const editing = editingRowId === row.rowId;
          return (
            <View
              key={row.rowId}
              style={[styles.row, index < rows.length - 1 && styles.rowBorder]}>
              <Pressable
                style={styles.checkboxHit}
                onPress={() => toggleRow(row.rowId)}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: row.selected, disabled }}>
                <View style={[styles.checkbox, row.selected && styles.checkboxChecked]}>
                  {row.selected ? (
                    <Check size={14} color={colors.white} strokeWidth={3} />
                  ) : null}
                </View>
              </Pressable>

              <View style={styles.rowBody}>
                {editing ? (
                  <View style={styles.editBlock}>
                    <TextInput
                      style={styles.editInput}
                      value={draftText}
                      onChangeText={setDraftText}
                      editable={!disabled}
                      multiline
                      maxLength={MAX_RULE_TEXT_LENGTH}
                      placeholder={t('spaces.rules.editPlaceholder', {
                        defaultValue: 'Edit rule text',
                      })}
                      placeholderTextColor={colors.muted}
                    />
                    <View style={styles.editActions}>
                      <Pressable
                        onPress={() => {
                          setEditingRowId(null);
                          setDraftText('');
                        }}
                        style={styles.editSecondaryBtn}>
                        <Text style={styles.editSecondaryText}>
                          {t('common.cancel', { defaultValue: 'Cancel' })}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => saveEdit(row.rowId)}
                        style={styles.editPrimaryBtn}>
                        <Text style={styles.editPrimaryText}>
                          {t('common.save', { defaultValue: 'Save' })}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.ruleText, !row.selected && styles.ruleTextMuted]}>
                    {row.label}
                  </Text>
                )}
              </View>

              {!editing ? (
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => beginEdit(row)}
                    disabled={disabled}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('spaces.rules.editA11y', {
                      defaultValue: 'Edit rule',
                    })}>
                    <Pencil size={16} color={colors.textSecondary} strokeWidth={2.2} />
                  </Pressable>
                  {row.isCustom ? (
                    <Pressable
                      onPress={() => deleteCustom(row.rowId)}
                      disabled={disabled}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('spaces.rules.deleteA11y', {
                        defaultValue: 'Delete custom rule',
                      })}>
                      <Trash2 size={16} color={colors.danger} strokeWidth={2.2} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {addingCustom ? (
        <View style={styles.customBlock}>
          <TextInput
            style={styles.editInput}
            value={customDraft}
            onChangeText={setCustomDraft}
            editable={!disabled}
            multiline
            maxLength={MAX_RULE_TEXT_LENGTH}
            placeholder={t('spaces.rules.customPlaceholder', {
              defaultValue: 'Enter a custom rule',
            })}
            placeholderTextColor={colors.muted}
            autoFocus
          />
          <View style={styles.editActions}>
            <Pressable
              onPress={() => {
                setAddingCustom(false);
                setCustomDraft('');
              }}
              style={styles.editSecondaryBtn}>
              <Text style={styles.editSecondaryText}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Text>
            </Pressable>
            <Pressable onPress={addCustom} style={styles.editPrimaryBtn}>
              <Text style={styles.editPrimaryText}>
                {t('spaces.rules.add', { defaultValue: 'Add' })}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.addButton, disabled && styles.addButtonDisabled]}
          onPress={() => setAddingCustom(true)}
          disabled={disabled}
          accessibilityRole="button">
          <Plus size={16} color={colors.primaryDark} strokeWidth={2.4} />
          <Text style={styles.addButtonText}>
            {t('spaces.rules.addCustom', { defaultValue: 'Add Custom Rule' })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkboxHit: {
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  ruleText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  ruleTextMuted: {
    color: colors.textSecondary,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 2,
  },
  editBlock: {
    gap: spacing.sm,
  },
  editInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
    textAlignVertical: 'top',
    backgroundColor: colors.background,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editSecondaryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  editSecondaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  editPrimaryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  editPrimaryText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  addButton: {
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  customBlock: {
    gap: spacing.sm,
  },
});
