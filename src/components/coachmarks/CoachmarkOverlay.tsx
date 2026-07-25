import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  useCoachmarkLayoutVersion,
  useCoachmarks,
} from '../../coachmarks/CoachmarkProvider';
import { colors, spacing } from '../../theme';
import { CoachmarkCard } from './CoachmarkCard';

const HIGHLIGHT_PAD = 6;
const HIGHLIGHT_RADIUS = 16;
const BACKDROP_COLOR = 'rgba(15, 23, 42, 0.52)';
/** Soft wash at rest; pulse drives opacity for the blink. */
const SPOTLIGHT_FILL = `${colors.primary}55`;
const PULSE_MS = 480;

/**
 * Spotlight overlay: dim backdrop with a cutout over the active anchor,
 * pulsed highlight fill + border, tip card.
 * Dismiss via Skip, primary Done, outside tap, or hardware Back.
 */
export function CoachmarkOverlay() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { active, getAnchorLayout, next, dismiss } = useCoachmarks();
  const layoutVersion = useCoachmarkLayoutVersion();
  const pulse = useRef(new Animated.Value(0)).current;

  const step = active?.steps[active.stepIndex] ?? null;
  const rawLayout = step ? getAnchorLayout(step.anchorId) : null;

  // Android status-bar-translucent Modal draws from screen top, but
  // measureInWindow reports Y relative to the app window (below the status
  // bar). Add the status-bar height so the highlight lands on its anchor.
  const androidTopOffset =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const layout = useMemo(
    () =>
      rawLayout
        ? { ...rawLayout, y: rawLayout.y + androidTopOffset }
        : null,
    [androidTopOffset, rawLayout],
  );

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    // Quick bright ↔ soft blink to pull attention to the spotlight.
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: PULSE_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => {
      anim.stop();
    };
  }, [active, pulse]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss('back');
      return true;
    });
    return () => sub.remove();
  }, [active, dismiss]);

  // Modal with statusBarTranslucent covers the full screen including status bar.
  const screen = Dimensions.get('screen');

  const hole = useMemo(() => {
    if (!layout) {
      return null;
    }
    return {
      x: Math.max(0, layout.x - HIGHLIGHT_PAD),
      y: Math.max(0, layout.y - HIGHLIGHT_PAD),
      width: layout.width + HIGHLIGHT_PAD * 2,
      height: layout.height + HIGHLIGHT_PAD * 2,
    };
    // layoutVersion forces recalculation when anchors remeasure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, layoutVersion]);

  const cardTop = useMemo(() => {
    if (!hole) {
      return Math.max(insets.top + spacing.xl, screen.height * 0.35);
    }
    const below = hole.y + hole.height + spacing.md;
    const cardEstimate = 160;
    if (below + cardEstimate < screen.height - insets.bottom - spacing.lg) {
      return below;
    }
    const above = hole.y - spacing.md - cardEstimate;
    return Math.max(insets.top + spacing.md, above);
  }, [hole, insets.top, insets.bottom, screen.height]);

  if (!active || !step) {
    return null;
  }

  // Fill blinks strongly; border stays steadier so the frame doesn't vanish.
  const fillOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.85],
  });
  const borderOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => dismiss('back')}>
      <View style={styles.root} pointerEvents="box-none">
        {/* Dimmed backdrop with a rounded cutout so the target stays bright. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => dismiss('outside')}
          accessibilityRole="button"
          accessibilityLabel={t('coachmarks.a11y.dismissOverlay')}>
          <Svg width={screen.width} height={screen.height}>
            <Defs>
              <Mask
                id="coachmarkSpotlight"
                x="0"
                y="0"
                width="100%"
                height="100%">
                <Rect
                  x="0"
                  y="0"
                  width={screen.width}
                  height={screen.height}
                  fill="#fff"
                />
                {hole ? (
                  <Rect
                    x={hole.x}
                    y={hole.y}
                    width={hole.width}
                    height={hole.height}
                    rx={HIGHLIGHT_RADIUS}
                    ry={HIGHLIGHT_RADIUS}
                    fill="#000"
                  />
                ) : null}
              </Mask>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={screen.width}
              height={screen.height}
              fill={BACKDROP_COLOR}
              mask="url(#coachmarkSpotlight)"
            />
          </Svg>
        </Pressable>

        {hole ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.highlightFill,
                {
                  left: hole.x,
                  top: hole.y,
                  width: hole.width,
                  height: hole.height,
                  opacity: fillOpacity,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.highlightBorder,
                {
                  left: hole.x,
                  top: hole.y,
                  width: hole.width,
                  height: hole.height,
                  opacity: borderOpacity,
                },
              ]}
            />
          </>
        ) : null}

        <View
          style={[
            styles.cardWrap,
            {
              top: cardTop,
              paddingHorizontal: spacing.lg,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
          pointerEvents="box-none">
          <CoachmarkCard
            stepIndex={active.stepIndex}
            stepCount={active.steps.length}
            body={t(step.bodyKey)}
            primaryLabel={t(step.primaryLabelKey)}
            onPrimary={next}
            onSkip={() => dismiss('skipped')}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  highlightFill: {
    position: 'absolute',
    borderRadius: HIGHLIGHT_RADIUS,
    backgroundColor: SPOTLIGHT_FILL,
  },
  highlightBorder: {
    position: 'absolute',
    borderRadius: HIGHLIGHT_RADIUS,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  cardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
