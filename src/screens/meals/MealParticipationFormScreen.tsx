import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { memberApi } from '../../api/memberApi';
import { mealsApi } from '../../api/mealsApi';
import type { MealPlanResponse, MemberResponse } from '../../api/types';
import { Button, FormInput, PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useMemberSearch } from '../../hooks/useMemberSearch';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { MEAL_PLAN_CODES, mealPlanLabelKey } from '../../utils/mealLabels';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = NativeStackScreenProps<MainStackParamList, 'MealParticipationForm'>['route'];

export function MealParticipationFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, mode, memberId: initialMemberId } = route.params;
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const [plans, setPlans] = useState<MealPlanResponse[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { members, loading: membersLoading } = useMemberSearch(spaceId, memberQuery);

  useEffect(() => {
    void (async () => {
      try {
        const planList = await mealsApi.getMealPlans(spaceId);
        setPlans(planList.filter(plan => plan.isActive && plan.code !== 'NONE'));
        const full = planList.find(plan => plan.code === 'FULL');
        if (full) {
          setSelectedPlanId(full.mealPlanId);
        }
      } catch {
        showToast(t('meals.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast, spaceId, t]);

  useEffect(() => {
    if (!initialMemberId) {
      return;
    }
    void memberApi.getMember(spaceId, initialMemberId).then(details => {
      setSelectedMember({
        memberId: details.memberId,
        fullName: details.fullName,
        mobileNumber: details.mobileNumber,
        role: details.role,
        linkedUser: details.linkedUser,
        status: details.status,
        createdAt: details.createdAt,
      });
    });
  }, [initialMemberId, spaceId]);

  const submit = useCallback(async () => {
    if (!selectedMember || !selectedPlanId) {
      showToast(t('meals.errors.enrollRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await mealsApi.createMealParticipation(spaceId, {
        memberId: selectedMember.memberId,
        mealPlanId: selectedPlanId,
        effectiveFrom: new Date().toISOString().slice(0, 10),
      });
      showToast(t('meals.success.enrolled'));
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.enrollFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [navigation, selectedMember, selectedPlanId, showToast, spaceId, t]);

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>
        {mode === 'create' ? t('meals.enroll') : t('meals.actions.changePlan')}
      </Text>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {!initialMemberId ? (
        <>
          <FormInput
            label={t('meals.fields.searchMember')}
            value={memberQuery}
            onChangeText={setMemberQuery}
            placeholder={t('meals.fields.searchMemberPlaceholder')}
          />
          {membersLoading ? <ActivityIndicator color={colors.primary} /> : null}
          {members.slice(0, 8).map(member => (
            <Pressable
              key={member.memberId}
              style={[
                styles.memberRow,
                selectedMember?.memberId === member.memberId && styles.memberRowSelected,
              ]}
              onPress={() => setSelectedMember(member)}>
              <Text style={styles.memberName}>{member.fullName}</Text>
              <Text style={styles.memberMobile}>{member.mobileNumber}</Text>
            </Pressable>
          ))}
        </>
      ) : selectedMember ? (
        <View style={styles.selectedMember}>
          <Text style={styles.memberName}>{selectedMember.fullName}</Text>
          <Text style={styles.memberMobile}>{selectedMember.mobileNumber}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>{t('meals.fields.mealPlan')}</Text>
      <View style={styles.planGrid}>
        {plans
          .filter(plan => MEAL_PLAN_CODES.includes(plan.code as (typeof MEAL_PLAN_CODES)[number]))
          .map(plan => (
            <Pressable
              key={plan.mealPlanId}
              style={[
                styles.planChip,
                selectedPlanId === plan.mealPlanId && styles.planChipActive,
              ]}
              onPress={() => setSelectedPlanId(plan.mealPlanId)}>
              <Text
                style={[
                  styles.planChipText,
                  selectedPlanId === plan.mealPlanId && styles.planChipTextActive,
                ]}>
                {t(mealPlanLabelKey(plan.code))}
              </Text>
            </Pressable>
          ))}
      </View>

      <Button
        label={t('meals.enroll')}
        loading={submitting}
        onPress={() => void submit()}
        style={styles.submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.lg },
  label: { ...typography.bodyStrong, marginTop: spacing.lg, marginBottom: spacing.sm },
  memberRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  memberRowSelected: { borderColor: colors.primary, backgroundColor: colors.lightGreen },
  selectedMember: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    marginBottom: spacing.md,
  },
  memberName: { ...typography.bodyStrong },
  memberMobile: { ...typography.caption, color: colors.muted },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  planChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  planChipActive: { borderColor: colors.primary, backgroundColor: colors.lightGreen },
  planChipText: { ...typography.caption, color: colors.muted },
  planChipTextActive: { color: colors.primaryDark, fontWeight: '600' },
  submit: { marginTop: spacing.xl },
});
