import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';
import { formatPricingMoney } from '../../utils/commitBedPricing';
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
              {summary.totals.floors > 0 ? (
                <Text style={styles.sectionValue}>
                  {t('accommodation.setup.totals.floors', { count: summary.totals.floors })}
                </Text>
              ) : null}
              {summary.totals.units > 0 ? (
                <Text style={styles.sectionValue}>
                  {t('accommodation.setup.totals.units', { count: summary.totals.units })}
                </Text>
              ) : null}
              <Text style={styles.sectionValue}>
                {t('accommodation.setup.totals.rooms', { count: summary.totals.rooms })}
              </Text>
              <Text style={styles.sectionValue}>
                {t('accommodation.setup.totals.beds', { count: summary.totals.beds })}
              </Text>
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
                </>
              ) : (
                summary.pricingGroups.map((group, index) => (
                  <View key={group.key} style={styles.pattern}>
                    <Text style={styles.patternTitle}>
                      {t('accommodation.setup.createConfirm.pattern', {
                        index: index + 1,
                        count: group.bedCount,
                        defaultValue: 'Pattern {{index}} · {{count}} beds',
                      })}
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
              <Text style={styles.footnote}>
                {t('accommodation.setup.createConfirm.footnote', {
                  count: summary.totals.beds,
                  defaultValue:
                    'This will create {{count}} beds with the above pricing configuration.',
                })}
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    elevation: 8,
    ...shadows.md,
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
