import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';

type ProfileAssetUploadRowProps = {
  label: string;
  previewUri?: string | null;
  onUpload: () => void;
  loading?: boolean;
  disabled?: boolean;
  hint?: string;
  showPreview?: boolean;
};

function previewUriForStoredFile(stored?: string | null): string {
  if (!stored) {
    return '';
  }
  if (stored.startsWith('file://') || stored.startsWith('data:') || stored.startsWith('http')) {
    return stored;
  }
  return '';
}

export function ProfileAssetUploadRow({
  label,
  previewUri,
  onUpload,
  loading = false,
  disabled = false,
  hint,
  showPreview = true,
}: ProfileAssetUploadRowProps) {
  const { t } = useTranslation();
  const uri = showPreview ? previewUriForStoredFile(previewUri) : '';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {uri ? <Image source={{ uri }} style={styles.preview} /> : null}
      <Button
        label={
          uri
            ? t('profileCompletion.wizard.replacePhoto')
            : t('settings.profile.uploadPhoto')
        }
        variant="secondary"
        onPress={onUpload}
        loading={loading}
        disabled={disabled || loading}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  button: {
    alignSelf: 'flex-start',
  },
});
