import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';

type InlineEditableNameProps = {
  value: string;
  editable?: boolean;
  onSave?: (value: string) => Promise<void>;
  onTitlePress?: () => void;
  placeholder?: string;
};

export function InlineEditableName({
  value,
  editable = false,
  onSave,
  onTitlePress,
  placeholder,
}: InlineEditableNameProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayValue = value ?? '';

  useEffect(() => {
    if (!isEditing) {
      setDraft(displayValue);
    }
  }, [displayValue, isEditing]);

  function startEditing() {
    setDraft(displayValue);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(displayValue);
    setError(null);
    setIsEditing(false);
  }

  async function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError(t('accommodation.inlineEdit.nameRequired'));
      return;
    }
    if (trimmed === displayValue.trim()) {
      setIsEditing(false);
      return;
    }
    if (!onSave) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('accommodation.inlineEdit.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (!editable || !onSave) {
    return (
      <Text style={styles.title} numberOfLines={2}>
        {displayValue}
      </Text>
    );
  }

  if (isEditing) {
    return (
      <View style={styles.editWrap}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder ?? t('accommodation.fields.name')}
          autoFocus
          editable={!saving}
          returnKeyType="done"
          onSubmitEditing={() => void commit()}
        />
        <View style={styles.editActions}>
          <Pressable
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={cancelEditing}
            disabled={saving}
            accessibilityLabel={t('accommodation.inlineEdit.cancel')}>
            <Text style={styles.cancelText}>✕</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.saveBtn]}
            onPress={() => void commit()}
            disabled={saving}
            accessibilityLabel={t('accommodation.inlineEdit.save')}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveText}>✓</Text>
            )}
          </Pressable>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  const titleNode = (
    <Text style={styles.title} numberOfLines={2}>
      {displayValue}
    </Text>
  );

  return (
    <View style={styles.nameRow}>
      {onTitlePress ? (
        <Pressable onPress={onTitlePress} style={styles.titleWrap}>
          {titleNode}
        </Pressable>
      ) : (
        <View style={styles.titleWrap}>{titleNode}</View>
      )}
      <Pressable
        style={styles.editIconBtn}
        onPress={startEditing}
        hitSlop={8}
        accessibilityLabel={t('accommodation.inlineEdit.editName')}>
        <Text style={styles.editIcon}>✎</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  titleWrap: {
    flexShrink: 1,
  },
  title: {
    ...typography.bodyStrong,
  },
  editIconBtn: {
    flexShrink: 0,
    paddingLeft: spacing.xs,
    paddingVertical: spacing.xs,
  },
  editIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  editWrap: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    ...typography.bodyStrong,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    minWidth: 36,
    height: 32,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  cancelText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
