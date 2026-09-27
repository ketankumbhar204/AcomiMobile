import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BedSingle, X } from 'lucide-react-native';
import type { AccommodationStatus, OccupancyResponse, SpaceType } from '../../api/types';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { Button, FormInput, useConfirmDialog } from '../ui';
import { AccommodationOccupancyActions } from '../occupancy/AccommodationOccupancyActions';
import { AccommodationStatusBadge } from './AccommodationStatusBadge';
import {
  hasBedPricingChange,
  isBedDraftUnchanged,
  isOccupancyMoneyMissing,
  moneyToDraftText,
  parseBedMoneyText,
  type BedInteractionDraft,
} from '../../utils/bedInteractionDraft';
import { occupancyActionsForBedStatus } from '../../utils/occupancyBedActions';
import type { OccupancyTargetSelection } from '../../utils/occupancyRules';

export type BedInteractionMode = 'persisted' | 'preview';

export type BedInteractionSheetProps = {
  visible: boolean;
  mode: BedInteractionMode;
  label: string;
  bedNumber: string;
  status?: AccommodationStatus;
  locationLine?: string;
  rent?: number | null;
  deposit?: number | null;
  canEditStructure: boolean;
  canManageOccupancy?: boolean;
  inactive?: boolean;
  saving?: boolean;
  occupancy?: {
    spaceId: string;
    spaceType: SpaceType;
    target: OccupancyTargetSelection;
    occupancy?: OccupancyResponse | null;
    onSuccess?: () => void;
  };
  onClose: () => void;
  onSave: (draft: BedInteractionDraft) => void | Promise<void>;
};

export function BedInteractionSheet({
  visible,
  mode,
  label,
  bedNumber,
  status,
  locationLine,
  rent,
  deposit,
  canEditStructure,
  canManageOccupancy = false,
  inactive = false,
  saving = false,
  occupancy,
  onClose,
  onSave,
}: BedInteractionSheetProps) {
  const { t } = useTranslation();
  const { showConfirm } = useConfirmDialog();
  const [numberText, setNumberText] = useState(bedNumber);
  const [rentText, setRentText] = useState(moneyToDraftText(rent));
  const [depositText, setDepositText] = useState(moneyToDraftText(deposit));
  const [rentError, setRentError] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setNumberText(bedNumber);
      setRentText(moneyToDraftText(rent));
      setDepositText(moneyToDraftText(deposit));
      setRentError(null);
      setDepositError(null);
    }
  }, [bedNumber, deposit, rent, visible]);

  const current: BedInteractionDraft = useMemo(
    () => ({
      bedNumber,
      rent: rent ?? null,
      deposit: deposit ?? null,
    }),
    [bedNumber, deposit, rent],
  );

  const draft: BedInteractionDraft = useMemo(
    () => ({
      bedNumber: numberText,
      rent: parseBedMoneyText(rentText),
      deposit: parseBedMoneyText(depositText),
    }),
    [depositText, numberText, rentText],
  );

  const unchanged = isBedDraftUnchanged(current, draft);
  const editable = canEditStructure && !inactive;
  const occupancySet = occupancyActionsForBedStatus(status, inactive);
  const showOccupancy =
    mode === 'persisted' &&
    canManageOccupancy &&
    occupancy != null &&
    occupancySet !== 'none';

  const requestClose = () => {
    if (saving) {
      return;
    }
    if (editable && !unchanged) {
      showConfirm({
        title: t('accommodation.beds.unsavedTitle', {
          defaultValue: 'Discard changes?',
        }),
        message: t('accommodation.beds.unsavedMessage', {
          defaultValue: 'Your bed details have not been saved.',
        }),
        confirmLabel: t('common.discard', { defaultValue: 'Discard' }),
        cancelLabel: t('common.cancel'),
        destructive: true,
        onConfirm: onClose,
      });
      return;
    }
    onClose();
  };

  const validateOccupancyPricing = (): boolean => {
    const rentMissing = isOccupancyMoneyMissing(rentText);
    const depositMissing = isOccupancyMoneyMissing(depositText);
    setRentError(
      rentMissing
        ? t('accommodation.fields.rentRequired', { defaultValue: 'Rent is required' })
        : null,
    );
    setDepositError(
      depositMissing
        ? t('accommodation.fields.depositRequired', { defaultValue: 'Deposit is required' })
        : null,
    );
    return !rentMissing && !depositMissing;
  };

  const saveLabel =
    mode === 'persisted'
      ? t('accommodation.beds.updateAction', { defaultValue: 'Update' })
      : t('common.save');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={saving ? undefined : requestClose}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={styles.backdropTap}
          onPress={saving ? undefined : requestClose}
          accessibilityRole="button"
        />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <BedSingle size={18} color={pastels.green.fg} strokeWidth={2.2} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2}>
                {label}
              </Text>
              {locationLine ? (
                <Text style={styles.location} numberOfLines={1}>
                  {locationLine}
                </Text>
              ) : null}
              {status ? <AccommodationStatusBadge status={status} /> : null}
            </View>
            <Pressable
              onPress={requestClose}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={10}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closePressed]}>
              <X size={20} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}>
            <Text style={styles.section}>
              {t('accommodation.beds.detailsSection', { defaultValue: 'Bed details' })}
            </Text>
            <FormInput
              label={t('accommodation.beds.bedNumberLabel')}
              value={numberText}
              onChangeText={setNumberText}
              editable={editable}
            />
            <View style={styles.priceRow}>
              <View style={styles.priceField}>
                <FormInput
                  label={t('accommodation.fields.rent')}
                  prefix="₹"
                  value={rentText}
                  onChangeText={text => {
                    setRentText(text);
                    if (rentError) {
                      setRentError(null);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder={t('accommodation.fields.enterRent')}
                  editable={editable}
                  error={rentError}
                />
              </View>
              <View style={styles.priceField}>
                <FormInput
                  label={t('accommodation.fields.deposit')}
                  prefix="₹"
                  value={depositText}
                  onChangeText={text => {
                    setDepositText(text);
                    if (depositError) {
                      setDepositError(null);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder={t('accommodation.fields.enterDeposit')}
                  editable={editable}
                  error={depositError}
                />
              </View>
            </View>

            {editable ? (
              <Button
                label={saveLabel}
                onPress={() => {
                  void onSave(draft);
                }}
                loading={saving}
                disabled={saving || unchanged}
                style={styles.saveButton}
              />
            ) : null}

            {showOccupancy && occupancy ? (
              <AccommodationOccupancyActions
                spaceId={occupancy.spaceId}
                spaceType={occupancy.spaceType}
                canManage={canManageOccupancy}
                accommodationStatus={status ?? 'AVAILABLE'}
                target={occupancy.target}
                occupancy={occupancy.occupancy}
                layout="stack"
                onSuccess={occupancy.onSuccess}
                onBeforeAllocate={validateOccupancyPricing}
                onBeforeReserve={validateOccupancyPricing}
              />
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function sheetNeedsPricingConfirm(
  current: BedInteractionDraft,
  next: BedInteractionDraft,
): boolean {
  return hasBedPricingChange(current, next);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  backdropTap: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '88%',
    zIndex: 1,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: pastels.green.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    opacity: 0.7,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  section: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceField: {
    flex: 1,
    minWidth: 0,
  },
  saveButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
});
