import React from 'react';
import { QuickActionSheetModal } from '../ui/QuickActionSheetModal';
import { useAccommodationActionSheetStore } from '../../store/accommodationActionSheetStore';

/**
 * Single app-level action sheet for accommodation row/header menus.
 * Renders above FlatList rows and native headers (one Modal, not per list item).
 */
export function AccommodationActionSheet() {
  const visible = useAccommodationActionSheetStore(state => state.visible);
  const title = useAccommodationActionSheetStore(state => state.title);
  const options = useAccommodationActionSheetStore(state => state.options);
  const close = useAccommodationActionSheetStore(state => state.close);

  return (
    <QuickActionSheetModal
      visible={visible}
      title={title}
      options={options}
      onClose={close}
    />
  );
}
