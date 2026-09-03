import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus, BedListItemResponse, UUID } from '../../../../api/types';
import { InlineEditableName } from '../../../ui/InlineEditableName';
import { useBedOccupantLabel } from '../../../../hooks/useBedOccupantLabel';
import { colors, radius, shadows, spacing, typography } from '../../../../theme';
import { isAccommodationEntityActive } from '../../../../utils/accommodationEntityActive';
import { formatBedDisplayLabel } from '../../../../utils/formatBedDisplayLabel';
import { AccommodationInactiveBadge, accommodationInactiveCardStyle, accommodationInactiveIllustrationStyle } from '../../AccommodationInactiveBadge';
import { AccommodationStatusBadge } from '../../AccommodationStatusBadge';
import { BedPricingFields } from '../../BedPricingFields';
import { getBedIllustration } from '../illustrations/illustrationAssets';
import { LayoutCardShell } from './LayoutCardShell';
import { LayoutIllustration } from './LayoutIllustration';

type BedLayoutCardProps = {
  bed: BedListItemResponse;
  spaceId?: UUID;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  pricingEditable?: boolean;
  onCommitPricing?: (
    field: 'defaultRent' | 'defaultDeposit',
    value: number | null,
  ) => Promise<void>;
};

function BedOccupantLine({
  spaceId,
  bedId,
  status,
  inactive,
}: {
  spaceId?: UUID;
  bedId: UUID;
  status: AccommodationStatus;
  inactive: boolean;
}) {
  const { t } = useTranslation();
  const occupantLabel = useBedOccupantLabel(spaceId ?? ('' as UUID), bedId, status);

  if (inactive) {
    return null;
  }

  if (status === 'AVAILABLE') {
    return (
      <Text style={styles.availableText}>{t('accommodation.status.AVAILABLE')}</Text>
    );
  }

  if (occupantLabel) {
    return (
      <Text style={styles.occupant} numberOfLines={1}>
        {occupantLabel}
      </Text>
    );
  }

  return (
    <Text style={styles.statusOnly}>{t(`accommodation.status.${status}`)}</Text>
  );
}

export function BedLayoutCard({
  bed,
  spaceId,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
  editableName = false,
  onSaveName,
  pricingEditable = false,
  onCommitPricing,
}: BedLayoutCardProps) {
  const { t } = useTranslation();
  const inactive = !isAccommodationEntityActive(bed);
  const displayLabel = formatBedDisplayLabel(bed.label, t);

  return (
    <LayoutCardShell
      debugCardId={`bed-${bed.bedId}`}
      onPress={onPress}
      onLongPress={onLongPress}
      menu={menu}
      shellStyle={styles.shell}
      cardStyle={[
        styles.card,
        highlighted && styles.highlighted,
        inactive && accommodationInactiveCardStyle,
      ]}
      pressedStyle={styles.pressed}>
      <LayoutIllustration
        source={getBedIllustration(bed.status)}
        size="bed"
        style={inactive ? accommodationInactiveIllustrationStyle : undefined}
      />
      {editableName && onSaveName ? (
        <InlineEditableName
          value={bed.label}
          displayValue={displayLabel}
          editable
          onSave={onSaveName}
        />
      ) : (
        <Text style={[styles.label, inactive && styles.labelInactive]}>{displayLabel}</Text>
      )}
      <BedOccupantLine
        spaceId={spaceId}
        bedId={bed.bedId}
        status={bed.status}
        inactive={inactive}
      />
      {inactive ? (
        <AccommodationInactiveBadge />
      ) : (
        <AccommodationStatusBadge status={bed.status} />
      )}
      <BedPricingFields
        rent={bed.defaultRent}
        deposit={bed.defaultDeposit}
        editable={pricingEditable && !inactive}
        onCommit={onCommitPricing}
      />
    </LayoutCardShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '50%',
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 220,
    ...shadows.sm,
  },
  highlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 16,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  labelInactive: {
    color: '#6B7280',
  },
  occupant: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  availableText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  statusOnly: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
});
