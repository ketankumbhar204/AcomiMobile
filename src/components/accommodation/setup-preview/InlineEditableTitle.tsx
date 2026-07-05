import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../theme';

type InlineEditableTitleProps = {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  style?: object;
};

export function InlineEditableTitle({
  value,
  onSave,
  placeholder,
  style,
}: InlineEditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  function save() {
    onSave(draft.trim() || value);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <View style={[styles.editRow, style]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          style={styles.input}
          autoFocus
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
        />
        <Pressable onPress={save} style={styles.iconBtn} accessibilityRole="button">
          <Text style={styles.saveIcon}>✓</Text>
        </Pressable>
        <Pressable onPress={cancel} style={styles.iconBtn} accessibilityRole="button">
          <Text style={styles.cancelIcon}>✕</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.viewRow, style]}>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
      <Pressable onPress={startEdit} style={styles.iconBtn} accessibilityRole="button">
        <Text style={styles.editIcon}>✏️</Text>
      </Pressable>
    </View>
  );
}

type InlineEditableFieldProps = {
  label: string;
  value: string;
  onSave: (value: string) => void;
  keyboardType?: 'default' | 'number-pad';
};

export function InlineEditableField({ label, value, onSave, keyboardType = 'default' }: InlineEditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            keyboardType={keyboardType}
            autoFocus
          />
          <Pressable
            onPress={() => {
              onSave(draft.trim());
              setEditing(false);
            }}
            style={styles.iconBtn}>
            <Text style={styles.saveIcon}>✓</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setDraft(value);
              setEditing(false);
            }}
            style={styles.iconBtn}>
            <Text style={styles.cancelIcon}>✕</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.viewRow}>
          <Text style={styles.fieldValue}>{value}</Text>
          <Pressable
            onPress={() => {
              setDraft(value);
              setEditing(true);
            }}
            style={styles.iconBtn}>
            <Text style={styles.editIcon}>✏️</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  value: {
    ...typography.bodyStrong,
    flex: 1,
  },
  input: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: 14,
  },
  saveIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  cancelIcon: {
    fontSize: 14,
    color: colors.muted,
  },
  fieldWrap: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  fieldValue: {
    ...typography.body,
    flex: 1,
  },
});
