import { create } from 'zustand';
import type { UUID } from '../api/types';

export type MemberMealActivityDaySheetContext = {
  spaceId: UUID;
  memberId: UUID;
  memberName: string;
  canManage: boolean;
};

type MemberMealActivityDaySheetState = {
  visible: boolean;
  /** Selected calendar date (YYYY-MM-DD); kept while sheet is open for highlight sync. */
  selectedDate: string | null;
  context: MemberMealActivityDaySheetContext | null;
  onPaymentReviewed: (() => void) | null;
  open: (
    date: string,
    context: MemberMealActivityDaySheetContext,
    onPaymentReviewed?: () => void,
  ) => void;
  close: () => void;
};

export const useMemberMealActivityDaySheetStore = create<MemberMealActivityDaySheetState>(set => ({
  visible: false,
  selectedDate: null,
  context: null,
  onPaymentReviewed: null,
  open: (date, context, onPaymentReviewed) =>
    set({
      visible: true,
      selectedDate: date,
      context,
      onPaymentReviewed: onPaymentReviewed ?? null,
    }),
  close: () =>
    set({
      visible: false,
      selectedDate: null,
      context: null,
      onPaymentReviewed: null,
    }),
}));
