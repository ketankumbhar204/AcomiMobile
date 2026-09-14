import { create } from 'zustand';

interface ToastState {
  message: string | null;
  onPress: (() => void) | null;
  showToast: (message: string, onPress?: () => void) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  message: null,
  onPress: null,
  showToast: (message, onPress) => set({ message, onPress: onPress ?? null }),
  hideToast: () => set({ message: null, onPress: null }),
}));
