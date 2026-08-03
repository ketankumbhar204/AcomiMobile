import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OccupancyResponse } from '../../../../api/types';
import { OccupancyContractSnapshotCard } from '../../../../components/occupancy/OccupancyContractSnapshotCard';
import { FormInput } from '../../../../components/ui';
import { colors, spacing, typography } from '../../../../theme';
import { formatOccupancyTargetLines } from '../../../../utils/occupancyBrowse';
import type { OccupancyTargetSelection } from '../../../../utils/occupancyRules';

type VacateConfirmStepProps = {
  memberName: string;
  memberMobile: string;
  occupancy: OccupancyResponse;
  remarks: string;
  onRemarksChange: (value: string) => void;
};

export function VacateConfirmStep({
  memberName,
  memberMobile,
  occupancy,
  remarks,
  onRemarksChange,
}: VacateConfirmStepProps) {
  const { t } = useTranslation();
  const selection: OccupancyTargetSelection = {
    targetType: occupancy.targetType,
    buildingId: occupancy.buildingId,
    buildingName: occupancy.buildingName,
    floorId: occupancy.floorId ?? undefined,
    floorName: occupancy.floorName ?? undefined,
    unitId: occupancy.unitId ?? undefined,
    unitName: occupancy.unitName ?? undefined,
    roomId: occupancy.roomId ?? undefined,
    roomName: occupancy.roomName ?? undefined,
    bedId: occupancy.bedId ?? undefined,
    bedName: occupancy.bedName ?? undefined,
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('occupancyWizard.steps.vacate')}</Text>
      <Text style={styles.hint}>{t('occupancy.vacate.message')}</Text>
      <Text style={styles.member}>
        {memberName} · {memberMobile}
      </Text>
      <Text style={styles.path}>{formatOccupancyTargetLines(selection).join(' · ')}</Text>
      {occupancy.status === 'ACTIVE' ? (
        <OccupancyContractSnapshotCard occupancy={occupancy} />
      ) : null}
      <FormInput
        label={t('occupancy.fields.remarks')}
        value={remarks}
        onChangeText={onRemarksChange}
        placeholder={t('occupancy.fields.remarksPlaceholder')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { ...typography.h3, fontSize: 18, lineHeight: 22, fontWeight: '600' },
  hint: { ...typography.caption, color: colors.muted },
  member: { ...typography.bodyStrong },
  path: { ...typography.body, color: colors.textSecondary },
});
