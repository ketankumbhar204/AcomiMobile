import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationActionMetadata, MembershipRole } from '../../api/types';
import { Button } from '../ui';
import { spacing, typography } from '../../theme';
import {
  canCreateOrUpdateAccommodation,
  canDeactivateAccommodation,
} from '../../utils/accommodationPermissions';

type AccommodationLifecycleActionsProps = {
  actions?: AccommodationActionMetadata | null;
  role?: MembershipRole;
  onEdit: () => void;
  onDeactivate: () => void;
  onRestore: () => void;
  onDelete: () => void;
  loading?: boolean;
};

export function AccommodationLifecycleActions({
  actions,
  role,
  onEdit,
  onDeactivate,
  onRestore,
  onDelete,
  loading = false,
}: AccommodationLifecycleActionsProps) {
  const { t } = useTranslation();
  const isOwner = canDeactivateAccommodation(role);
  const canEdit = Boolean(actions?.canEdit && canCreateOrUpdateAccommodation(role));
  const showDeactivate = Boolean(isOwner && actions?.canDeactivate);
  const showRestore = Boolean(isOwner && actions?.canRestore);
  const showDelete = Boolean(isOwner && actions?.canDelete);
  const showDeleteHint = Boolean(
    isOwner && actions && !actions.canDelete && actions.deleteReason,
  );

  if (!actions && !canEdit) {
    return null;
  }

  return (
    <View style={styles.root}>
      {canEdit ? (
        <Button
          label={t('accommodation.actions.edit')}
          variant="secondary"
          onPress={onEdit}
          disabled={loading}
          style={styles.action}
        />
      ) : null}

      {showDeactivate ? (
        <Button
          label={t('accommodation.lifecycle.deactivateConfirm')}
          variant="ghost"
          onPress={onDeactivate}
          disabled={loading}
          style={styles.action}
        />
      ) : null}

      {showRestore ? (
        <Button
          label={t('accommodation.lifecycle.activateConfirm')}
          variant="secondary"
          onPress={onRestore}
          disabled={loading}
          style={styles.action}
        />
      ) : null}

      {showDelete ? (
        <Button
          label={t('accommodation.lifecycle.deleteConfirm')}
          variant="ghost"
          onPress={onDelete}
          disabled={loading}
          style={styles.action}
        />
      ) : null}

      {showDeleteHint ? (
        <Text style={styles.deleteHint}>{actions?.deleteReason}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.sm,
  },
  deleteHint: {
    ...typography.caption,
    color: '#6B7280',
    marginTop: spacing.md,
  },
});
