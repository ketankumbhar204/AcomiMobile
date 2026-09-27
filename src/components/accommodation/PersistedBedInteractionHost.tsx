import React from 'react';
import type { SpaceType } from '../../api/types';
import type { usePersistedBedInteraction } from '../../hooks/usePersistedBedInteraction';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';
import { useTranslation } from 'react-i18next';
import { BedInteractionSheet } from './BedInteractionSheet';
import { BedPricingConfirmModal } from './BedPricingConfirmModal';

type Host = ReturnType<typeof usePersistedBedInteraction>;

export function PersistedBedInteractionHost({
  interaction,
  spaceId,
  spaceType,
}: {
  interaction: Host;
  spaceId: string;
  spaceType?: SpaceType | null;
}) {
  const { t } = useTranslation();
  const {
    target,
    close,
    save,
    saving,
    pricingCommit,
    canEditStructure,
    canManageOccupancy,
    onOccupancySuccess,
  } = interaction;
  const displayLabel = target
    ? formatBedDisplayLabel(target.label || target.bedNumber, t)
    : '';

  return (
    <>
      <BedInteractionSheet
        visible={target != null}
        mode="persisted"
        label={displayLabel}
        bedNumber={target?.bedNumber ?? ''}
        status={target?.status}
        locationLine={target?.locationLine}
        rent={target?.rent}
        deposit={target?.deposit}
        canEditStructure={canEditStructure}
        canManageOccupancy={canManageOccupancy}
        inactive={target?.inactive}
        saving={saving || pricingCommit.busy}
        occupancy={
          target?.occupancyTarget && spaceType
            ? {
                spaceId,
                spaceType,
                target: target.occupancyTarget,
                occupancy: target.occupancy,
                onSuccess: onOccupancySuccess,
              }
            : undefined
        }
        onClose={() => {
          if (!pricingCommit.confirming) {
            close();
          }
        }}
        onSave={draft => {
          void save(draft);
        }}
      />
      <BedPricingConfirmModal
        pending={pricingCommit.pending}
        confirming={pricingCommit.confirming}
        error={pricingCommit.error}
        onConfirm={() => void pricingCommit.confirm()}
        onClose={pricingCommit.close}
      />
    </>
  );
}
