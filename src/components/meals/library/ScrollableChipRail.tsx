import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../../../theme';

type ScrollableChipRailProps = {
  children: React.ReactNode;
};

const SCROLL_STEP = 140;

export function ScrollableChipRail({ children }: ScrollableChipRailProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const showLeft = scrollX > 4;
  const showRight = contentWidth > containerWidth && scrollX + containerWidth < contentWidth - 4;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setScrollX(event.nativeEvent.contentOffset.x);
  }

  function scrollBy(delta: number) {
    const nextX = Math.max(0, Math.min(scrollX + delta, contentWidth - containerWidth));
    scrollRef.current?.scrollTo({ x: nextX, animated: true });
  }

  return (
    <View style={styles.wrapper}>
      {showLeft ? (
        <Pressable
          style={styles.arrow}
          onPress={() => scrollBy(-SCROLL_STEP)}
          hitSlop={8}>
          <Text style={styles.arrowLabel}>‹</Text>
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        horizontal
        style={styles.scroll}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={width => setContentWidth(width)}
        onLayout={event => setContainerWidth(event.nativeEvent.layout.width)}
        contentContainerStyle={styles.row}>
        {children}
      </ScrollView>

      {showRight ? (
        <Pressable
          style={styles.arrow}
          onPress={() => scrollBy(SCROLL_STEP)}
          hitSlop={8}>
          <Text style={styles.arrowLabel}>›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  scroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  arrow: {
    width: 24,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 20,
    lineHeight: 22,
  },
});
