import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  PinchGestureHandler,
  State,
  TapGestureHandler,
  type PinchGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuthorizedImageSource } from '../../services/fileUploadService';
import { spacing, typography } from '../../theme';

type ZoomableImageModalProps = {
  visible: boolean;
  source: AuthorizedImageSource | null;
  title: string;
  closeLabel: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
};

/** Full-screen image with pinch and double-tap zoom. Android back uses Modal onRequestClose. */
export function ZoomableImageModal({
  visible,
  source,
  title,
  closeLabel,
  loading = false,
  error,
  onClose,
}: ZoomableImageModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = useRef(Animated.multiply(baseScale, pinchScale)).current;
  const lastBase = useRef(1);

  useEffect(() => {
    if (!visible) {
      lastBase.current = 1;
      baseScale.setValue(1);
      pinchScale.setValue(1);
    }
  }, [visible, baseScale, pinchScale]);

  const onPinchEvent = Animated.event([{ nativeEvent: { scale: pinchScale } }], {
    useNativeDriver: true,
  });

  function onPinchStateChange(event: PinchGestureHandlerStateChangeEvent) {
    if (event.nativeEvent.oldState !== State.ACTIVE) {
      return;
    }
    const next = Math.min(4, Math.max(1, lastBase.current * event.nativeEvent.scale));
    lastBase.current = next;
    baseScale.setValue(next);
    pinchScale.setValue(1);
  }

  function onDoubleTap() {
    const next = lastBase.current > 1.05 ? 1 : 2.5;
    lastBase.current = next;
    pinchScale.setValue(1);
    Animated.spring(baseScale, { toValue: next, useNativeDriver: true, bounciness: 0 }).start();
  }

  const imageWidth = width;
  const imageHeight = Math.max(240, height - insets.top - insets.bottom - 72);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="fullScreen">
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.close}>{closeLabel}</Text>
          </Pressable>
        </View>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : source ? (
          <TapGestureHandler numberOfTaps={2} onActivated={onDoubleTap}>
            <Animated.View style={styles.stage}>
              <PinchGestureHandler
                onGestureEvent={onPinchEvent}
                onHandlerStateChange={onPinchStateChange}>
                <Animated.View style={{ transform: [{ scale }] }}>
                  <Animated.Image
                    source={source}
                    style={{ width: imageWidth, height: imageHeight }}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        ) : (
          <View style={styles.center}>
            <Text style={styles.error}>{error ?? 'Unable to display the image.'}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  title: { ...typography.bodyStrong, color: '#fff', flex: 1 },
  close: { ...typography.bodyStrong, color: '#fff' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  error: { ...typography.body, color: '#E2E8F0', textAlign: 'center' },
});
