import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react-native';
import type { AccommodationStatus } from '../../api/types';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { compactBedVisualSize } from '../../utils/compactBedVisualSize';
import { AccommodationStatusBadge } from './AccommodationStatusBadge';
import { LayoutIllustration } from './layout/cards/LayoutIllustration';
import { LayoutEntityPhoto } from './layout/cards/LayoutEntityPhoto';
import { getBedIllustration } from './layout/illustrations/illustrationAssets';

type BedDetailHeroProps = {
  label: string;
  status: AccommodationStatus;
  bedNumber: string;
  roomName?: string | null;
  occupantName?: string | null;
  subtitle?: string | null;
  bedId?: string;
  photoFileId?: string | null;
  onEdit?: () => void;
};

export function BedDetailHero({
  label,
  status,
  bedNumber,
  roomName,
  occupantName,
  subtitle,
  bedId,
  photoFileId,
  onEdit,
}: BedDetailHeroProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const visualSize = compactBedVisualSize(width);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.visualWell, { width: visualSize, height: visualSize }]}>
          <LayoutEntityPhoto
            kind="bed"
            entityId={bedId ?? ''}
            fileId={photoFileId}
            title={label}
            height={visualSize}
            resizeMode="contain"
            fallback={
              <LayoutIllustration
                source={getBedIllustration(status)}
                size="bedHero"
                style={{ width: visualSize, height: visualSize }}
              />
            }
          />
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.label} numberOfLines={2}>
              {label}
            </Text>
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel={t('common.edit', { defaultValue: 'Edit' })}>
                <Pencil size={14} color={colors.info} strokeWidth={2.2} />
                <Text style={styles.editLabel}>
                  {t('common.edit', { defaultValue: 'Edit' })}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {roomName ? (
            <Text style={styles.room} numberOfLines={1}>
              {roomName}
            </Text>
          ) : null}
          <View style={styles.badgeRow}>
            <AccommodationStatusBadge status={status} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {t('accommodation.beds.bedNumberLabel')}: {bedNumber}
          </Text>
          {occupantName ? (
            <Text style={styles.occupant} numberOfLines={2}>
              {occupantName}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  visualWell: {
    borderRadius: radius.card,
    backgroundColor: pastels.green.bg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  label: {
    ...typography.h3,
    flex: 1,
    color: colors.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: pastels.blue.bg,
    borderWidth: 1,
    borderColor: pastels.blue.border,
  },
  editLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.info,
  },
  room: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badgeRow: {
    alignSelf: 'flex-start',
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  occupant: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
