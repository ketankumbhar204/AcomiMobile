import React, { useCallback, useState } from 'react';
import { BlurView } from '@react-native-community/blur';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FAB } from '../ui/FAB';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type AccommodationHomeSpeedDialProps = {
  visible: boolean;
  onQuickSetup: () => void;
  onAddManually: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AccommodationHomeSpeedDial({
  visible,
  onQuickSetup,
  onAddManually,
  style,
}: AccommodationHomeSpeedDialProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => setOpen(false);
    }, []),
  );

  const closeMenu = useCallback(() => {
    setOpen(false);
    // #region agent log
    if (__DEV__) {
      fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'AccommodationHomeSpeedDial.tsx:closeMenu',message:'fab menu closed',data:{},timestamp:Date.now(),hypothesisId:'H1',runId:'fab-speed-dial'})}).catch(()=>{});
    }
    // #endregion
  }, []);

  const toggleMenu = useCallback(() => {
    setOpen(current => {
      const next = !current;
      // #region agent log
      if (__DEV__) {
        fetch('http://127.0.0.1:7467/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1a4af9'},body:JSON.stringify({sessionId:'1a4af9',location:'AccommodationHomeSpeedDial.tsx:toggleMenu',message:'fab menu toggled',data:{open:next},timestamp:Date.now(),hypothesisId:'H1',runId:'fab-speed-dial'})}).catch(()=>{});
      }
      // #endregion
      return next;
    });
  }, []);

  const handleQuickSetup = useCallback(() => {
    closeMenu();
    onQuickSetup();
  }, [closeMenu, onQuickSetup]);

  const handleAddManually = useCallback(() => {
    closeMenu();
    onAddManually();
  }, [closeMenu, onAddManually]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {open ? (
        <Pressable
          style={styles.backdrop}
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={Platform.OS === 'android' ? 16 : 12}
            reducedTransparencyFallbackColor="rgba(255,255,255,0.72)"
            overlayColor="rgba(255,255,255,0.08)"
          />
        </Pressable>
      ) : null}

      <View style={[styles.anchor, style]} pointerEvents="box-none">
        {open ? (
          <View style={styles.actionStack}>
            <Pressable
              style={({ pressed }) => [styles.actionPill, pressed && styles.actionPillPressed]}
              onPress={handleQuickSetup}
              accessibilityRole="button"
              accessibilityLabel={t('accommodation.home.quickSetup')}>
              <Text style={styles.actionPillText}>{t('accommodation.home.quickSetup')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionPill, pressed && styles.actionPillPressed]}
              onPress={handleAddManually}
              accessibilityRole="button"
              accessibilityLabel={t('accommodation.home.addManually')}>
              <Text style={styles.actionPillText}>{t('accommodation.home.addManually')}</Text>
            </Pressable>
          </View>
        ) : null}
        <FAB
          inline
          open={open}
          onPress={toggleMenu}
          accessibilityLabel={
            open ? t('common.cancel') : t('accommodation.home.addBuildingManually')
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  anchor: {
    position: 'absolute',
    bottom: 24,
    right: spacing.xl,
    alignItems: 'flex-end',
    zIndex: 21,
  },
  actionStack: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionPill: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 148,
    ...shadows.md,
  },
  actionPillPressed: {
    opacity: 0.9,
    borderColor: colors.primary,
  },
  actionPillText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
  },
});
