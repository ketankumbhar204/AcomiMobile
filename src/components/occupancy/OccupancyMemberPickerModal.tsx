import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { memberApi } from '../../api/memberApi';
import type { MemberResponse } from '../../api/types';
import { AccommodationSearchBar } from '../accommodation/AccommodationSearchBar';
import { Button } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getMembershipErrorMessage } from '../../utils/membershipErrors';
import { shouldShowOccupancySection } from '../../utils/occupancyPermissions';

type OccupancyMemberPickerModalProps = {
  visible: boolean;
  spaceId: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSelect: (member: MemberResponse) => void;
};

function matchesSearch(member: MemberResponse, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    member.fullName.toLowerCase().includes(normalized) ||
    member.mobileNumber.includes(normalized)
  );
}

export function OccupancyMemberPickerModal({
  visible,
  spaceId,
  title,
  subtitle,
  onClose,
  onSelect,
}: OccupancyMemberPickerModalProps) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberApi.getMembers(spaceId);
      setMembers(
        data.filter(
          member =>
            member.status === 'ACTIVE' && shouldShowOccupancySection(member.role),
        ),
      );
    } catch (err) {
      setError(getMembershipErrorMessage(err, 'membership.errors.loadMembers'));
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      return;
    }
    void loadMembers();
  }, [loadMembers, visible]);

  const filteredMembers = useMemo(
    () => members.filter(member => matchesSearch(member, searchQuery)),
    [members, searchQuery],
  );

  function handleDismiss() {
    setSearchQuery('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleDismiss} hitSlop={12}>
            <Text style={styles.cancel}>{t('common.cancel')}</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>
              {title ?? t('occupancy.memberPicker.title')}
            </Text>
            <Text style={styles.subtitle}>
              {subtitle ?? t('occupancy.memberPicker.subtitle')}
            </Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <AccommodationSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('occupancy.memberPicker.searchPlaceholder')}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map(member => (
              <Pressable
                key={member.memberId}
                style={styles.row}
                onPress={() => onSelect(member)}>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{member.fullName}</Text>
                  <Text style={styles.rowSub}>
                    {member.mobileNumber} · {t(`spaces.roles.${member.role}`)}
                  </Text>
                </View>
                <Text style={styles.pickMark}>›</Text>
              </Pressable>
            ))
          ) : !loading ? (
            <Text style={styles.empty}>{t('occupancy.memberPicker.empty')}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t('common.cancel')} variant="ghost" onPress={handleDismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cancel: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  searchWrap: {
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.section,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.bodyStrong,
  },
  rowSub: {
    ...typography.caption,
    color: colors.muted,
  },
  pickMark: {
    ...typography.h3,
    color: colors.muted,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  loader: {
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
