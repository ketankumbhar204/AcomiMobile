import { create } from 'zustand';

export type ToastTone = 'success' | 'error';

interface ToastState {
  message: string | null;
  onPress: (() => void) | null;
  tone: ToastTone;
  showToast: (message: string, onPress?: () => void, tone?: ToastTone) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  message: null,
  onPress: null,
  tone: 'success',
  showToast: (message, onPress, tone = 'success') =>
    set({ message, onPress: onPress ?? null, tone }),
  hideToast: () => set({ message: null, onPress: null, tone: 'success' }),
}));
