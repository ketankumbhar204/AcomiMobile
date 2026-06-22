import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { MemberDetailsResponse, SpaceType } from '../../api/types';
import { MemberMealBillingPanel } from '../member/MemberMealBillingPanel';
import { spacing } from '../../theme';
import { MemberMealActivitySection } from './MemberMealActivitySection';

type MemberMealsTabProps = {
  spaceId: string;
  spaceType?: SpaceType;
  member: MemberDetailsResponse;
  canManageBalance?: boolean;
  canEditMember?: boolean;
  onBillingChanged?: () => void;
  onSelectActivityDate: (date: string) => void;
  onBindActivityReload?: (reload: () => void) => void;
  selectedActivityDate?: string | null;
};

export function MemberMealsTab({
  spaceId,
  spaceType,
  member,
  canManageBalance = false,
  canEditMember = false,
  onBillingChanged,
  onSelectActivityDate,
  onBindActivityReload,
  selectedActivityDate,
}: MemberMealsTabProps) {
  const isMess = spaceType === 'MESS';

  if (!isMess) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <MemberMealBillingPanel
        spaceId={spaceId}
        member={member}
        spaceType={spaceType}
        canEdit={canEditMember}
        onBillingChanged={onBillingChanged}
      />
      <MemberMealActivitySection
        spaceId={spaceId}
        memberId={member.memberId}
        effectiveMealBillingType={member.effectiveMealBillingType}
        canManageBalance={canManageBalance}
        selectedDate={selectedActivityDate}
        onSelectDate={onSelectActivityDate}
        onBindReload={onBindActivityReload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    marginTop: spacing.xxs,
  },
});
