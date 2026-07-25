import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberOccupancyStatus } from '../../../../api/types';
import { AccommodationSearchBar } from '../../../../components/accommodation/AccommodationSearchBar';
import { Badge, Button, FormInput } from '../../../../components/ui';
import type { ResidentPickerItem } from '../../../../hooks/useResidentImportSearch';
import { colors, radius, spacing, typography } from '../../../../theme';
import type { NewMemberFieldErrors } from '../../../../utils/validateNewMemberFields';

export type MemberPickerMode = 'search' | 'new';

export type MemberPickerAudience = 'resident' | 'customer';

type MemberPickerStepProps = {
  query: string;
  onQueryChange: (value: string) => void;
  members: ResidentPickerItem[];
  loading: boolean;
  error: string | null;
  preferredStatus?: MemberOccupancyStatus;
  allowAddNew?: boolean;
  /** When true, show cross-space resident card copy (previous space, available). */
  crossSpaceReuse?: boolean;
  /** Copy variant — Mess uses customer language. */
  audience?: MemberPickerAudience;
  pickerMode: MemberPickerMode;
  onPickerModeChange: (mode: MemberPickerMode) => void;
  newMemberName: string;
  newMemberMobile: string;
  onNewMemberNameChange: (value: string) => void;
  onNewMemberMobileChange: (value: string) => void;
  newMemberErrors?: NewMemberFieldErrors;
  creatingMember?: boolean;
  selectedMemberId?: string | null;
  hideTitle?: boolean;
  onSelect: (member: ResidentPickerItem) => void;
  onCreateNewPress?: () => void;
};

function occupancyBadgeLabel(
  status: MemberOccupancyStatus | undefined,
  t: (key: string) => string,
): string {
  if (!status) {
    return t('occupancyWizard.occupancyStatus.VACATED');
  }
  return t(`occupancyWizard.occupancyStatus.${status}`);
}

function memberRoleLabel(role: string, t: (key: string) => string): string {
  const key = `membership.roles.${role.toLowerCase()}.label`;
  const translated = t(key);
  return translated === key ? role : translated;
}

/** Plain-language source chip for Mess import — no Vacated/Allocated jargon. */
function customerReuseMeta(
  item: ResidentPickerItem,
  t: (key: string, opts?: Record<string, string>) => string,
): { typeLabel: string; fromLine: string; statusLine: string | null } {
  const isResident = item.role === 'TENANT';
  const typeLabel = isResident
    ? t('membership.add.reuseCard.typeResident')
    : t('membership.add.reuseCard.typeCustomer');
  const space = item.sourceSpaceName ?? '';
  if (item.alreadyInTargetSpace) {
    return {
      typeLabel,
      fromLine: t('membership.add.reuseCard.alreadyHere'),
      statusLine: null,
    };
  }
  const isCurrentStay =
    isResident &&
    (item.occupancyStatus === 'ALLOCATED' || item.occupancyStatus === 'RESERVED');
  if (isCurrentStay && space) {
    return {
      typeLabel,
      fromLine: t('membership.add.reuseCard.currentResident', { space }),
      statusLine: t('membership.add.reuseCard.available'),
    };
  }
  return {
    typeLabel,
    fromLine: t('membership.add.reuseCard.fromSpace', { space }),
    statusLine: t('membership.add.reuseCard.available'),
  };
}

export function MemberPickerStep({
  query,
  onQueryChange,
  members,
  loading,
  error,
  preferredStatus,
  allowAddNew = false,
  crossSpaceReuse = false,
  audience = 'resident',
  pickerMode,
  onPickerModeChange,
  newMemberName,
  newMemberMobile,
  onNewMemberNameChange,
  onNewMemberMobileChange,
  newMemberErrors,
  creatingMember = false,
  selectedMemberId,
  hideTitle = false,
  onSelect,
  onCreateNewPress,
}: MemberPickerStepProps) {
  const { t } = useTranslation();
  const isCustomer = audience === 'customer';
  const searchModeLabel = isCustomer
    ? t('membership.add.memberMode.search')
    : t('occupancyWizard.memberMode.search');
  const addNewModeLabel = isCustomer
    ? t('membership.add.memberMode.addNew')
    : t('occupancyWizard.memberMode.addNew');
  const availableLabel = isCustomer
    ? t('membership.add.reuseCard.available')
    : t('occupancyWizard.residentCard.available');
  const addActionLabel = isCustomer
    ? t('membership.add.reuseCard.addAction')
    : t('occupancyWizard.residentCard.moveIn');
  const emptyReuseLabel = isCustomer
    ? t('membership.add.noReusableCustomers')
    : t('occupancyWizard.noReusableResidents');
  const searchPlaceholder = isCustomer
    ? t('membership.add.searchCustomerPlaceholder')
    : t('occupancyWizard.searchMemberPlaceholder');
  const addNewHint = isCustomer
    ? t('membership.add.createNewHint')
    : t('occupancyWizard.addMemberHint');

  return (
    <View style={styles.wrap}>
      {!hideTitle ? (
        <>
          <Text style={styles.title}>{t('occupancyWizard.steps.member')}</Text>
          <Text style={styles.hint}>{t('occupancyWizard.steps.memberHint')}</Text>
        </>
      ) : null}

      {allowAddNew ? (
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeChip, pickerMode === 'search' && styles.modeChipSelected]}
            onPress={() => onPickerModeChange('search')}>
            <Text
              style={[
                styles.modeChipText,
                pickerMode === 'search' && styles.modeChipTextSelected,
              ]}>
              {searchModeLabel}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeChip, pickerMode === 'new' && styles.modeChipSelected]}
            onPress={() => onPickerModeChange('new')}>
            <Text
              style={[
                styles.modeChipText,
                pickerMode === 'new' && styles.modeChipTextSelected,
              ]}>
              {addNewModeLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {pickerMode === 'new' ? (
        <View style={styles.newForm}>
          <Text style={styles.newHint}>{addNewHint}</Text>
          <FormInput
            label={t('membership.add.fullNameLabel')}
            placeholder={t('membership.add.fullNamePlaceholder')}
            value={newMemberName}
            onChangeText={onNewMemberNameChange}
            error={newMemberErrors?.fullName}
            autoCapitalize="words"
          />
          <FormInput
            label={t('membership.invite.mobileLabel')}
            placeholder={t('membership.invite.mobilePlaceholder')}
            value={newMemberMobile}
            onChangeText={onNewMemberMobileChange}
            error={newMemberErrors?.mobileNumber}
            keyboardType="phone-pad"
            maxLength={15}
          />
          {creatingMember ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}
        </View>
      ) : (
        <>
          <AccommodationSearchBar
            value={query}
            onChangeText={onQueryChange}
            placeholder={searchPlaceholder}
          />

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FlatList
            data={members}
            keyExtractor={item =>
              item.sourceSpaceId ? `${item.sourceSpaceId}:${item.memberId}` : item.memberId
            }
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const blocked =
                preferredStatus === 'VACATED' &&
                (item.occupancyStatus === 'ALLOCATED' || item.occupancyStatus === 'RESERVED');
              const warn =
                preferredStatus === 'ALLOCATED' && item.occupancyStatus !== 'ALLOCATED';
              const selected = selectedMemberId === item.memberId;
              const customerMeta =
                isCustomer && crossSpaceReuse ? customerReuseMeta(item, t) : null;

              return (
                <Pressable
                  style={[
                    styles.card,
                    selected && styles.cardSelected,
                    blocked && styles.cardDisabled,
                  ]}
                  disabled={blocked || creatingMember}
                  onPress={() => onSelect(item)}>
                  <View style={styles.cardBody}>
                    {customerMeta ? (
                      <View style={styles.typeChipWrap}>
                        <Text style={styles.typeChip}>{customerMeta.typeLabel}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.mobile}>
                      {customerMeta
                        ? item.mobileNumber
                        : t('occupancyWizard.residentCard.mobile', {
                            mobile: item.mobileNumber,
                          })}
                    </Text>
                    {customerMeta ? (
                      <>
                        <Text style={styles.meta}>{customerMeta.fromLine}</Text>
                        {customerMeta.statusLine ? (
                          <Text style={styles.available}>{customerMeta.statusLine}</Text>
                        ) : null}
                      </>
                    ) : crossSpaceReuse && item.sourceSpaceName ? (
                      <>
                        <Text style={styles.meta}>
                          {item.alreadyInTargetSpace
                            ? t('occupancyWizard.residentCard.inThisSpace')
                            : t('occupancyWizard.residentCard.previouslyIn', {
                                space: item.sourceSpaceName,
                              })}
                        </Text>
                        {item.availableForMoveIn !== false ? (
                          <Text style={styles.available}>{availableLabel}</Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={styles.role}>{memberRoleLabel(item.role, t)}</Text>
                    )}
                    {warn ? (
                      <Text style={styles.warn}>{t('occupancyWizard.memberNotAllocated')}</Text>
                    ) : null}
                  </View>
                  <View style={styles.cardAside}>
                    {customerMeta ? (
                      <Text style={styles.moveInAction}>{addActionLabel}</Text>
                    ) : (
                      <>
                        <Badge label={occupancyBadgeLabel(item.occupancyStatus, t)} />
                        {crossSpaceReuse ? (
                          <Text style={styles.moveInAction}>{addActionLabel}</Text>
                        ) : (
                          <Text style={styles.radio}>{selected ? '●' : '○'}</Text>
                        )}
                      </>
                    )}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.empty}>
                    {crossSpaceReuse ? emptyReuseLabel : t('occupancyWizard.noMembers')}
                  </Text>
                  {crossSpaceReuse && allowAddNew ? (
                    <Button
                      label={addNewModeLabel}
                      onPress={() => {
                        onPickerModeChange('new');
                        onCreateNewPress?.();
                      }}
                      style={styles.emptyCta}
                    />
                  ) : null}
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 360 },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.md, gap: spacing.sm },
  title: { ...typography.h3, marginBottom: spacing.xs },
  hint: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  modeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  modeChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeChipTextSelected: {
    color: colors.primaryDark,
  },
  newForm: {
    gap: spacing.xs,
  },
  newHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  loader: { marginVertical: spacing.lg },
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  cardDisabled: { opacity: 0.45 },
  radio: {
    ...typography.body,
    width: 18,
    color: colors.primaryDark,
  },
  cardBody: { flex: 1, gap: 2 },
  cardAside: { alignItems: 'flex-end', gap: spacing.xs },
  typeChipWrap: {
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  typeChip: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: `${colors.primary}18`,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.input,
  },
  name: { ...typography.bodyStrong },
  mobile: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.muted },
  role: { ...typography.caption, color: colors.muted },
  available: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  moveInAction: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  warn: { ...typography.caption, color: '#B45309', marginTop: spacing.xs },
  emptyWrap: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyCta: {
    alignSelf: 'stretch',
  },
});
