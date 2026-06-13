import { create } from 'zustand';

export type AccommodationActionSheetOption = {
  label: string;
  action: () => void;
  destructive?: boolean;
};

type AccommodationActionSheetState = {
  visible: boolean;
  backdropDismissible: boolean;
  title: string;
  options: AccommodationActionSheetOption[];
  open: (title: string, options: AccommodationActionSheetOption[]) => void;
  setOptions: (options: AccommodationActionSheetOption[]) => void;
  setBackdropDismissible: (value: boolean) => void;
  close: () => void;
};

export const useAccommodationActionSheetStore = create<AccommodationActionSheetState>(set => ({
  visible: false,
  backdropDismissible: false,
  title: '',
  options: [],
  open: (title, options) =>
    set({
      visible: true,
      backdropDismissible: false,
      title,
      options,
    }),
  setOptions: options => set({ options }),
  setBackdropDismissible: value => set({ backdropDismissible: value }),
  close: () =>
    set({
      visible: false,
      backdropDismissible: false,
      title: '',
      options: [],
    }),
}));
