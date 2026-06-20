import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { MemberDetailsResponse, SpaceType } from '../../api/types';
import { spacing } from '../../theme';
import { MemberMealActivitySection } from './MemberMealActivitySection';

type MemberMealsTabProps = {
  spaceId: string;
  spaceType?: SpaceType;
  member: MemberDetailsResponse;
  onSelectActivityDate: (date: string) => void;
  onBindActivityReload?: (reload: () => void) => void;
  selectedActivityDate?: string | null;
};

export function MemberMealsTab({
  spaceId,
  spaceType,
  member,
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
      <MemberMealActivitySection
        spaceId={spaceId}
        memberId={member.memberId}
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
