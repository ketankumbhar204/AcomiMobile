import React from 'react';
import { useMemberMealActivityDaySheetStore } from '../../store/memberMealActivityDaySheetStore';
import { MemberMealActivityDaySheet } from './MemberMealActivityDaySheet';

/** App-root host so the day sheet Modal renders above the navigation stack. */
export function MemberMealActivityDaySheetHost() {
  const visible = useMemberMealActivityDaySheetStore(state => state.visible);
  const selectedDate = useMemberMealActivityDaySheetStore(state => state.selectedDate);
  const context = useMemberMealActivityDaySheetStore(state => state.context);
  const onPaymentReviewed = useMemberMealActivityDaySheetStore(state => state.onPaymentReviewed);
  const close = useMemberMealActivityDaySheetStore(state => state.close);

  if (!context || !selectedDate) {
    return null;
  }

  return (
    <MemberMealActivityDaySheet
      visible={visible}
      date={selectedDate}
      spaceId={context.spaceId}
      memberId={context.memberId}
      memberName={context.memberName}
      canManage={context.canManage}
      onClose={close}
      onPaymentReviewed={() => onPaymentReviewed?.()}
    />
  );
}
