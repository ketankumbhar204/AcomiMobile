import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UnitListItemResponse } from '../../../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../../../theme';
import { isAccommodationEntityActive } from '../../../../utils/accommodationEntityActive';
import { inferUnitListStatus } from '../../../../utils/inferAggregateOccupancyStatus';
import { AccommodationStatusBadge } from '../../AccommodationStatusBadge';
import { getUnitIllustration } from '../illustrations/illustrationAssets';
import { CircularOccupancyIndicator } from './CircularOccupancyIndicator';
import { LayoutCardShell } from './LayoutCardShell';
import { LayoutIllustration } from './LayoutIllustration';
import { calcOccupancyPercent } from './occupancyUtils';

type UnitLayoutCardProps = {
  unit: UnitListItemResponse;
  highlighted?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
};

export function UnitLayoutCard({
  unit,
  highlighted = false,
  onPress,
  onLongPress,
  menu,
}: UnitLayoutCardProps) {
  const { t } = useTranslation();
  const inactive = !isAccommodationEntityActive(unit);
  const percent = inactive
    ? 0
    : calcOccupancyPercent(unit.occupiedBeds ?? 0, unit.bedCount);
  const status = inactive ? null : inferUnitListStatus(unit);
  const illustration = getUnitIllustration(unit.roomCount, unit.bedCount);

  // #region agent log
  if (__DEV__ && !inactive && unit.bedCount > 0) {
    fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'UnitLayoutCard.tsx:render',message:'unit occupancy display',data:{unitId:unit.unitId,unitName:unit.name,apiStatus:unit.status,displayStatus:status,percent,occupiedBeds:unit.occupiedBeds??0,availableBeds:unit.availableBeds,bedCount:unit.bedCount},timestamp:Date.now(),hypothesisId:'H1',runId:'unit-occupancy'})}).catch(()=>{});
  }
  // #endregion

  return (
    <LayoutCardShell
      debugCardId={`unit-${unit.unitId}`}
      onPress={onPress}
      onLongPress={onLongPress}
      menu={menu}
      shellStyle={styles.shell}
      cardStyle={[styles.card, highlighted && styles.highlighted]}
      pressedStyle={styles.pressed}>
      <LayoutIllustration source={illustration} size="unit" />
      <Text style={styles.title} numberOfLines={2}>
        {unit.name}
      </Text>
      <Text style={styles.meta}>
        {t('accommodation.layout.dashboard.roomsAndBeds', {
          rooms: unit.roomCount,
          beds: unit.bedCount,
        })}
      </Text>
      <View style={styles.footer}>
        {status ? <AccommodationStatusBadge status={status} /> : null}
        {!inactive ? <CircularOccupancyIndicator percent={percent} size={44} /> : null}
      </View>
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
    ...shadows.sm,
  },
  highlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    marginBottom: 4,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
});
