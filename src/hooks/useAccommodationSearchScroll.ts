import { useEffect, useRef, type RefObject } from 'react';
import type { FlatList } from 'react-native';
import { findFirstSearchMatchIndex } from '../utils/accommodationLayoutSearch';

export function useAccommodationSearchScroll<T>(
  items: T[],
  searchQuery: string,
  getLabel: (item: T) => string,
  indexOffset = 0,
): RefObject<FlatList<T> | null> {
  const listRef = useRef<FlatList<T>>(null);

  useEffect(() => {
    const index = findFirstSearchMatchIndex(items, searchQuery, getLabel);
    if (index >= 0) {
      listRef.current?.scrollToIndex({
        index: index + indexOffset,
        animated: true,
        viewPosition: 0.3,
      });
    }
  }, [items, searchQuery, getLabel, indexOffset]);

  return listRef;
}
