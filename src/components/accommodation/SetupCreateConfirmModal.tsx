import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';
import { formatPricingMoney } from '../../utils/commitBedPricing';
import { visiblePositiveStructureCounts } from '../../utils/accommodationProfile';
import type { SetupCreateSummary } from './setup-preview/summarizeSetupPricing';

type SetupCreateConfirmModalProps = {
  visible: boolean;
  summary: SetupCreateSummary | null;
  creating: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function SetupCreateConfirmModal({
  visible,
  summary,
  creating,
  error,
  onConfirm,
  onClose,
}: SetupCreateConfirmModalProps) {
  const { t } = useTranslation();
  const notSet = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={creating ? undefined : onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTap}
          onPress={creating ? undefined : onClose}
          accessibilityRole="button"
        />
        <View style={styles.card}>
          <Text style={styles.title}>
            {t('accommodation.setup.createConfirm.title', {
              defaultValue: 'Confirm Building Creation',
            })}
          </Text>
          {summary ? (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              <Text style={styles.sectionLabel}>
                {t('accommodation.setup.createConfirm.building', { defaultValue: 'Building' })}
              </Text>
              <Text style={styles.sectionValue}>{summary.buildingName}</Text>
              <Text style={[styles.sectionLabel, styles.sectionSpacer]}>
                {t('accommodation.setup.createConfirm.structure', { defaultValue: 'Structure' })}
              </Text>
              {visiblePositiveStructureCounts(summary.totals).map(part => (
                <Text key={part} style={styles.sectionValue}>
                  {t(`accommodation.setup.totals.${part}`, { count: summary.totals[part] })}
                </Text>
              ))}
              <Text style={[styles.sectionLabel, styles.sectionSpacer]}>
                {t('accommodation.setup.createConfirm.pricing', { defaultValue: 'Pricing' })}
              </Text>
              {summary.pricingGroups.length === 0 ? (
                <Text style={styles.sectionValue}>
                  {t('accommodation.setup.createConfirm.noPricing', {
                    defaultValue: 'No rent or deposit set.',
                  })}
                </Text>
              ) : summary.pricingGroups.length === 1 ? (
                <>
                  <Text style={styles.sectionValue}>
                    {t('accommodation.fields.rent')}:{' '}
                    {formatPricingMoney(summary.pricingGroups[0].rent, notSet)}
                  </Text>
                  <Text style={styles.sectionValue}>
                    {t('accommodation.fields.deposit')}:{' '}
                    {formatPricingMoney(summary.pricingGroups[0].deposit, notSet)}
                  </Text>
                  <Text style={styles.sectionValue}>
                    {t(
                      summary.pricingSubject === 'units'
                        ? 'accommodation.setup.createConfirm.appliesToUnits'
                        : 'accommodation.setup.createConfirm.appliesToBeds',
                      {
                        count: summary.pricingGroups[0].bedCount,
                        defaultValue:
                          summary.pricingSubject === 'units'
                            ? 'Applies to {{count}} units'
                            : 'Applies to {{count}} beds',
                      },
                    )}
                  </Text>
                </>
              ) : (
                summary.pricingGroups.map((group, index) => (
                  <View key={group.key} style={styles.pattern}>
                    <Text style={styles.patternTitle}>
                      {t(
                        summary.pricingSubject === 'units'
                          ? 'accommodation.setup.createConfirm.unitPattern'
                          : 'accommodation.setup.createConfirm.pattern',
                        {
                          index: index + 1,
                          count: group.bedCount,
                          defaultValue:
                            summary.pricingSubject === 'units'
                              ? 'Pattern {{index}} · {{count}} units'
                              : 'Pattern {{index}} · {{count}} beds',
                        },
                      )}
                    </Text>
                    <Text style={styles.sectionValue}>
                      {t('accommodation.fields.rent')}: {formatPricingMoney(group.rent, notSet)}
                    </Text>
                    <Text style={styles.sectionValue}>
                      {t('accommodation.fields.deposit')}:{' '}
                      {formatPricingMoney(group.deposit, notSet)}
                    </Text>
                  </View>
                ))
              )}
              {summary.totals.beds > 0 ? (
                <Text style={styles.footnote}>
                  {summary.pricingGroups.length > 0
                    ? t('accommodation.setup.createConfirm.footnote', {
                        count: summary.totals.beds,
                        defaultValue:
                          'This will create {{count}} beds with the rent and deposit above.',
                      })
                    : t('accommodation.setup.createConfirm.bedsWithoutPricing', {
                        count: summary.totals.beds,
                        defaultValue:
                          'This will create {{count}} beds. No rent or deposit will be saved.',
                      })}
                </Text>
              ) : summary.totals.units > 0 ? (
                <Text style={styles.footnote}>
                  {summary.pricingGroups.length > 0
                    ? t('accommodation.setup.createConfirm.unitsWithPricing', {
                        count: summary.totals.units,
                        defaultValue:
                          'This will create {{count}} units with the rent and deposit above.',
                      })
                    : t('accommodation.setup.createConfirm.unitsWithoutPricing', {
                        count: summary.totals.units,
                        defaultValue:
                          'This will create {{count}} units. No rent or deposit will be saved.',
                      })}
                </Text>
              ) : null}
              <Text style={styles.continue}>
                {t('accommodation.setup.createConfirm.continue', {
                  defaultValue: 'Are you sure you want to create this building?',
                })}
              </Text>
            </ScrollView>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button
              label={t('accommodation.setup.back')}
              variant="ghost"
              onPress={onClose}
              disabled={creating}
              style={styles.actionButton}
            />
            <Button
              label={
                creating
                  ? t('accommodation.setup.createConfirm.creating', {
                      defaultValue: 'Creating building...',
                    })
                  : t('accommodation.setup.createConfirm.confirm', {
                      defaultValue: 'Create Building',
                    })
              }
              onPress={onConfirm}
              loading={creating}
              disabled={creating}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    zIndex: 1,
        ...shadows.raised,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  body: {
    maxHeight: 360,
  },
  bodyContent: {
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSpacer: {
    marginTop: spacing.md,
  },
  sectionValue: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pattern: {
    marginBottom: spacing.sm,
  },
  patternTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  footnote: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  continue: {
    ...typography.body,
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
