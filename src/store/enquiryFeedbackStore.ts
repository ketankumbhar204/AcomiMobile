import { create } from 'zustand';

type EnquiryToast = {
  title: string;
  body?: string;
  tone: 'success' | 'error';
};

type EnquiryFeedbackState = {
  toast: EnquiryToast | null;
  showEnquiryToast: (toast: EnquiryToast) => void;
  hideEnquiryToast: () => void;
};

export const useEnquiryFeedbackStore = create<EnquiryFeedbackState>(set => ({
  toast: null,
  showEnquiryToast: toast => set({ toast }),
  hideEnquiryToast: () => set({ toast: null }),
}));

export function showEnquiryToast(toast: EnquiryToast) {
  useEnquiryFeedbackStore.getState().showEnquiryToast(toast);
}
