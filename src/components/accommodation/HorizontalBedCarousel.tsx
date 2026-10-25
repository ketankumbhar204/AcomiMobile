import React, { Children, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';
import { BedCarouselChrome, BedCarouselFades } from './BedCarouselChrome';
import {
  bedCarouselActiveDot,
  bedCarouselAtEnd,
  bedCarouselAtStart,
  bedCarouselDotCount,
  bedCarouselHasOverflow,
  bedCarouselMaxScroll,
  bedCarouselScrollTarget,
} from './bedCarouselNav';
import { BED_CAROUSEL_GAP, bedCarouselEndInset, bedCarouselLayout } from './bedCarouselLayout';

type HorizontalBedCarouselProps = {
  children: React.ReactNode;
  accessibilityLabel?: string;
  /** Color the edge fade blends into. Defaults to the white room card. */
  fadeColor?: string;
};

export function HorizontalBedCarousel({
  children,
  accessibilityLabel,
  fadeColor = colors.white,
}: HorizontalBedCarouselProps) {
  const { t } = useTranslation();
  const items = Children.toArray(children);
  const scrollRef = useRef<ScrollView>(null);
  const scrollXRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const layout = bedCarouselLayout(containerWidth, items.length);
  const endInset = layout.overflows ? bedCarouselEndInset(viewportWidth, layout.cardWidth) : 0;
  const maxScroll = bedCarouselMaxScroll(contentWidth, viewportWidth);
  const overflows = bedCarouselHasOverflow(contentWidth, viewportWidth);
  const dotCount = bedCarouselDotCount(items.length, overflows);
  const activeDot = bedCarouselActiveDot(scrollX, maxScroll, layout.stride, dotCount, items.length);

  const onOuterLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setContainerWidth(prev => (prev === next ? prev : next));
  };

  const onScrollerLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setViewportWidth(prev => (prev === next ? prev : next));
  };

  const rememberScroll = (x: number) => {
    scrollXRef.current = x;
    setScrollX(prev => (Math.abs(prev - x) < 0.5 ? prev : x));
  };

  const scrollByCard = (direction: -1 | 1) => {
    const target = bedCarouselScrollTarget(scrollXRef.current, direction, layout.stride, maxScroll);
    rememberScroll(target);
    scrollRef.current?.scrollTo({ x: target, animated: true });
  };

  return (
    <View style={styles.outer} onLayout={onOuterLayout}>
      <View style={styles.scrollerWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        scrollEnabled={overflows}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        decelerationRate="fast"
        {...(overflows
          ? { snapToInterval: layout.stride, snapToAlignment: 'start' as const }
          : null)}
        disableIntervalMomentum={false}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        onLayout={onScrollerLayout}
        onContentSizeChange={width => {
          const next = Math.round(width);
          setContentWidth(prev => (prev === next ? prev : next));
        }}
        onScroll={event => rememberScroll(event.nativeEvent.contentOffset.x)}
        style={styles.scroller}
        contentContainerStyle={[
          styles.content,
          endInset > 0 ? { paddingRight: endInset } : null,
        ]}
        accessibilityLabel={
          accessibilityLabel ?? t('accommodation.beds.title', { defaultValue: 'Beds' })
        }>
        {items.map((item, index) => (
          <View
            key={itemKey(item, index)}
            style={[styles.item, { width: layout.cardWidth }]}>
            {item}
          </View>
        ))}
      </ScrollView>
      <BedCarouselFades
        visible={overflows}
        showLeft={!bedCarouselAtStart(scrollX)}
        showRight={!bedCarouselAtEnd(scrollX, maxScroll)}
        color={fadeColor}
      />
      </View>
      <BedCarouselChrome
        visible={overflows}
        canGoBack={!bedCarouselAtStart(scrollX)}
        canGoForward={!bedCarouselAtEnd(scrollX, maxScroll)}
        dotCount={dotCount}
        activeDot={activeDot}
        onBack={() => scrollByCard(-1)}
        onForward={() => scrollByCard(1)}
        backLabel={t('accommodation.beds.previous', { defaultValue: 'Previous beds' })}
        forwardLabel={t('accommodation.beds.next', { defaultValue: 'Next beds' })}
      />
    </View>
  );
}

function itemKey(item: React.ReactNode, index: number): string {
  if (React.isValidElement(item) && item.key != null) {
    return String(item.key);
  }
  return `bed-card-${index}`;
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    minWidth: 0,
  },
  scrollerWrap: {
    position: 'relative',
    width: '100%',
    minWidth: 0,
  },
  scroller: {
    width: '100%',
    minWidth: 0,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    gap: BED_CAROUSEL_GAP,
  },
  item: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
