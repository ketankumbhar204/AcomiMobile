import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import type { FoodCategoryResponse } from '../../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../../theme';

type LibraryManageCategoriesSheetProps = {
  visible: boolean;
  categories: FoodCategoryResponse[];
  countByCategoryId: Record<string, number>;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (category: FoodCategoryResponse, name: string) => void | Promise<void>;
  onRemove: (category: FoodCategoryResponse) => void;
};

export function LibraryManageCategoriesSheet({
  visible,
  categories,
  countByCategoryId,
  onClose,
  onAdd,
  onEdit,
  onRemove,
}: LibraryManageCategoriesSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const listMaxHeight = Math.max(220, Math.round(windowHeight * 0.78) - 210);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setEditingId(null);
      setDraftName('');
      setSaving(false);
    }
  }, [visible]);

  const startEdit = (category: FoodCategoryResponse) => {
    setEditingId(category.categoryId);
    setDraftName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName('');
    setSaving(false);
  };

  const commitEdit = async (category: FoodCategoryResponse) => {
    const trimmed = draftName.trim();
    if (!trimmed || saving) {
      return;
    }
    if (trimmed === category.name.trim()) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      await onEdit(category, trimmed);
      cancelEdit();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTap}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('meals.library.manageCategories')}</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              hitSlop={8}
              testID="library-manage-categories-close">
              <X size={18} color={colors.textSecondary} strokeWidth={2.4} />
            </Pressable>
          </View>
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
            accessibilityRole="button"
            testID="library-add-category">
            <Plus size={16} color={colors.primaryDark} strokeWidth={2.4} />
            <Text style={styles.addLabel}>{t('meals.library.addCategoryAction')}</Text>
          </Pressable>
          <ScrollView
            style={[styles.list, { maxHeight: listMaxHeight }]}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
            bounces>
            {categories.length === 0 ? (
              <Text style={styles.empty}>{t('meals.library.categoriesEmpty')}</Text>
            ) : (
              categories.map(category => {
                const count = countByCategoryId[category.categoryId] ?? 0;
                const isEditing = editingId === category.categoryId;
                if (isEditing) {
                  return (
                    <View key={category.categoryId} style={styles.categoryRow}>
                      <TextInput
                        style={styles.editInput}
                        value={draftName}
                        onChangeText={setDraftName}
                        autoFocus
                        editable={!saving}
                        returnKeyType="done"
                        onSubmitEditing={() => void commitEdit(category)}
                        placeholder={t('meals.library.categoryNameInlinePlaceholder')}
                        placeholderTextColor={colors.muted}
                      />
                      <Pressable
                        onPress={cancelEdit}
                        disabled={saving}
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.cancel')}
                        hitSlop={8}>
                        <X size={16} color={colors.muted} strokeWidth={2.4} />
                      </Pressable>
                      <Pressable
                        onPress={() => void commitEdit(category)}
                        disabled={saving}
                        style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.save')}
                        hitSlop={8}
                        testID={`library-save-category-${category.categoryId}`}>
                        {saving ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Check size={16} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </Pressable>
                    </View>
                  );
                }
                return (
                  <View key={category.categoryId} style={styles.categoryRow}>
                    <View style={styles.categoryText}>
                      <Text style={styles.categoryName} numberOfLines={2}>
                        {category.name}
                      </Text>
                      <Text style={styles.categoryMeta} numberOfLines={1}>
                        {t('meals.library.categoryMeta', { count })}
                      </Text>
                    </View>
                    {category.scope === 'SPACE' ? (
                      <Pressable
                        onPress={() => startEdit(category)}
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('common.edit', { defaultValue: 'Edit' })} ${category.name}`}
                        hitSlop={8}
                        testID={`library-edit-category-${category.categoryId}`}>
                        <Pencil size={16} color={colors.primaryDark} strokeWidth={2.2} />
                      </Pressable>
                    ) : (
                      <View style={styles.iconBtn} />
                    )}
                    <Pressable
                      onPress={() => onRemove(category)}
                      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('meals.library.removeCategory')} ${category.name}`}
                      hitSlop={8}
                      testID={`library-remove-category-${category.categoryId}`}>
                      <Trash2 size={16} color={colors.danger} strokeWidth={2.2} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            accessibilityRole="button">
            <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '78%',
    paddingTop: spacing.sm,
    overflow: 'hidden',
    ...shadows.raised,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  addRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    minHeight: 44,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  addLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingBottom: spacing.xs,
  },
  empty: {
    ...typography.caption,
    color: colors.muted,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    minHeight: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  categoryText: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    ...typography.bodyStrong,
    fontWeight: '700',
  },
  categoryMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  editInput: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    color: colors.textPrimary,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  cancel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    ...typography.bodyStrong,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
