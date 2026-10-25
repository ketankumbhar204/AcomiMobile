import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme';

type BedCarouselChromeProps = {
  visible: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  dotCount: number;
  activeDot: number;
  onBack: () => void;
  onForward: () => void;
  backLabel: string;
  forwardLabel: string;
};

const FADE_STEPS = 6;

/** Fades sit on the scroller only. The arrow row is a separate block under the cards. */
export function BedCarouselFades({
  visible,
  showLeft,
  showRight,
  color = colors.white,
}: {
  visible: boolean;
  showLeft: boolean;
  showRight: boolean;
  color?: string;
}) {
  if (!visible) {
    return null;
  }
  return (
    <>
      {showLeft ? <EdgeFade edge="left" color={color} /> : null}
      {showRight ? <EdgeFade edge="right" color={color} /> : null}
    </>
  );
}

export function BedCarouselChrome({
  visible,
  canGoBack,
  canGoForward,
  dotCount,
  activeDot,
  onBack,
  onForward,
  backLabel,
  forwardLabel,
}: BedCarouselChromeProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.controls}>
      <ArrowButton
        direction="back"
        enabled={canGoBack}
        label={backLabel}
        onPress={onBack}
      />
      <View pointerEvents="none" style={styles.dots}>
        {Array.from({ length: dotCount }, (_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeDot ? styles.dotActive : null]}
          />
        ))}
      </View>
      <ArrowButton
        direction="forward"
        enabled={canGoForward}
        label={forwardLabel}
        onPress={onForward}
      />
    </View>
  );
}

function ArrowButton({
  direction,
  enabled,
  label,
  onPress,
}: {
  direction: 'back' | 'forward';
  enabled: boolean;
  label: string;
  onPress: () => void;
}) {
  const Icon = direction === 'back' ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      disabled={!enabled}
      onPress={event => {
        event.stopPropagation?.();
        onPress();
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      style={[styles.arrow, !enabled && styles.arrowDisabled]}>
      <Icon size={16} color={colors.info} strokeWidth={2.4} />
    </Pressable>
  );
}

function EdgeFade({ edge, color }: { edge: 'left' | 'right'; color: string }) {
  return (
    <View pointerEvents="none" style={[styles.fade, edge === 'left' ? styles.fadeLeft : styles.fadeRight]}>
      {Array.from({ length: FADE_STEPS }, (_, index) => {
        const strength =
          edge === 'left' ? (FADE_STEPS - index) / FADE_STEPS : (index + 1) / FADE_STEPS;
        return <View key={index} style={{ flex: 1, backgroundColor: withAlpha(color, strength * 0.72) }} />;
      })}
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(255,255,255,${alpha})`;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 22,
    flexDirection: 'row',
    zIndex: 2,
  },
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
  controls: {
    marginTop: 8,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
  },
  dotActive: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.info,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.22)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  arrowDisabled: {
    opacity: 0.38,
  },
});
