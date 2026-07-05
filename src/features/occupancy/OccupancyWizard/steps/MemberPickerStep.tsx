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
import type { MemberOccupancyStatus, MemberResponse } from '../../../../api/types';
import { AccommodationSearchBar } from '../../../../components/accommodation/AccommodationSearchBar';
import { Badge, FormInput } from '../../../../components/ui';
import { colors, radius, spacing, typography } from '../../../../theme';
import type { NewMemberFieldErrors } from '../../../../utils/validateNewMemberFields';

export type MemberPickerMode = 'search' | 'new';

type MemberPickerStepProps = {
  query: string;
  onQueryChange: (value: string) => void;
  members: MemberResponse[];
  loading: boolean;
  error: string | null;
  preferredStatus?: MemberOccupancyStatus;
  allowAddNew?: boolean;
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
  onSelect: (member: MemberResponse) => void;
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

export function MemberPickerStep({
  query,
  onQueryChange,
  members,
  loading,
  error,
  preferredStatus,
  allowAddNew = false,
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
}: MemberPickerStepProps) {
  const { t } = useTranslation();

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
              {t('occupancyWizard.memberMode.search')}
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
              {t('occupancyWizard.memberMode.addNew')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {pickerMode === 'new' ? (
        <View style={styles.newForm}>
          <Text style={styles.newHint}>{t('occupancyWizard.addMemberHint')}</Text>
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
            placeholder={t('occupancyWizard.searchMemberPlaceholder')}
          />

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FlatList
            data={members}
            keyExtractor={item => item.memberId}
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

              return (
                <Pressable
                  style={[
                    styles.card,
                    selected && styles.cardSelected,
                    blocked && styles.cardDisabled,
                  ]}
                  disabled={blocked}
                  onPress={() => onSelect(item)}>
                  <Text style={styles.radio}>{selected ? '●' : '○'}</Text>
                  <View style={styles.cardBody}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.mobile}>{item.mobileNumber}</Text>
                    <Text style={styles.role}>{memberRoleLabel(item.role, t)}</Text>
                    {warn ? (
                      <Text style={styles.warn}>{t('occupancyWizard.memberNotAllocated')}</Text>
                    ) : null}
                  </View>
                  <Badge label={occupancyBadgeLabel(item.occupancyStatus, t)} />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.empty}>{t('occupancyWizard.noMembers')}</Text>
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
  name: { ...typography.bodyStrong },
  mobile: { ...typography.caption, color: colors.textSecondary },
  role: { ...typography.caption, color: colors.muted },
  warn: { ...typography.caption, color: '#B45309', marginTop: spacing.xs },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
