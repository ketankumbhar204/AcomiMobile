import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealParticipationResponse, MealParticipationStatus, UUID } from '../../api/types';
import { MealParticipationStatusBadge, MealPlanBadge } from '../../components/meals';
import { RoleBadge } from '../../components/member';
import { PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const FILTERS: Array<MealParticipationStatus | 'ALL'> = ['ALL', 'ACTIVE', 'PAUSED', 'STOPPED'];

type MealParticipantListScreenProps = {
  spaceId: UUID;
};

export function MealParticipantListScreen({ spaceId }: MealParticipantListScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const permissions = useSpacePermissions(spaceId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MealParticipationStatus | 'ALL'>('ACTIVE');
  const [participants, setParticipants] = useState<MealParticipationResponse[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await mealsApi.getMealParticipations(spaceId, {
        status: filter === 'ALL' ? undefined : filter,
      });
      setParticipants(rows);
    } catch {
      setError(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filter, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!permissions.canViewMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.title}>{t('meals.participants')}</Text>
      <Text style={styles.subtitle}>{t('meals.eligibleParticipantsHint')}</Text>

      <View style={styles.filters}>
        {FILTERS.map(value => (
          <Pressable
            key={value}
            style={[styles.filterChip, filter === value && styles.filterChipActive]}
            onPress={() => setFilter(value)}>
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
              {value === 'ALL' ? t('meals.filters.all') : t(`meals.status.${value.toLowerCase()}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={participants}
        keyExtractor={item => item.participationId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>{t('meals.participantsEmpty')}</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate('MemberDetails', {
                spaceId,
                memberId: item.memberId,
              })
            }>
            <View style={styles.rowHeader}>
              <Text style={styles.name}>{item.memberName}</Text>
              <RoleBadge role={item.memberRole} />
            </View>
            <View style={styles.badges}>
              <MealPlanBadge code={item.mealPlanCode} />
              <MealParticipationStatusBadge status={item.status} />
            </View>
          </Pressable>
        )}
      />

      {permissions.canManageMeals ? (
        <Pressable
          style={styles.addBtn}
          onPress={() =>
            navigation.navigate('MealParticipationForm', { spaceId, mode: 'create' })
          }>
          <Text style={styles.addBtnText}>+ {t('meals.enroll')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.lightGreen },
  filterText: { ...typography.caption, color: colors.muted },
  filterTextActive: { color: colors.primaryDark, fontWeight: '600' },
  loader: { marginVertical: spacing.lg },
  error: { ...typography.caption, color: '#DC2626' },
  list: { gap: spacing.sm, paddingBottom: spacing.xxl },
  row: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  name: { ...typography.bodyStrong, flex: 1 },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  empty: { ...typography.body, color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
  addBtn: {
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addBtnText: { ...typography.bodyStrong, color: colors.primaryDark },
});
