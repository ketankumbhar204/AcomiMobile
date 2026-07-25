import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import type { PropertyLayoutMode } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  getLayoutModeDescriptionKey,
  getLayoutModeLabelKey,
} from '../../utils/propertyLayoutMode';
import {
  accommodationIllustrations,
} from './layout/illustrations/illustrationAssets';

type PropertyLayoutModePickerProps = {
  value: PropertyLayoutMode | null;
  onChange: (mode: PropertyLayoutMode) => void;
  options: PropertyLayoutMode[];
  error?: string | null;
};

function layoutIllustration(mode: PropertyLayoutMode) {
  if (mode === 'CORRIDOR_PG') {
    return accommodationIllustrations.corridorFloor;
  }
  if (mode === 'APARTMENT_PG') {
    return accommodationIllustrations.floor;
  }
  return accommodationIllustrations.floor;
}

function LayoutOptionCard({
  mode,
  selected,
  onPress,
}: {
  mode: PropertyLayoutMode;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [progress, selected]);

  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });
  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.white, colors.lightGreen],
  });
  const checkOpacity = progress;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${t(getLayoutModeLabelKey(mode))}${
        selected ? `, ${t('accommodation.layoutMode.selected')}` : ''
      }`}>
      <Animated.View style={[styles.card, { borderColor, backgroundColor }]}>
        <View style={styles.imageWrap}>
          <Image
            source={layoutIllustration(mode)}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, selected && styles.titleSelected]}
              numberOfLines={1}>
              {t(getLayoutModeLabelKey(mode))}
            </Text>
            <Animated.View
              style={[styles.checkWrap, { opacity: checkOpacity }]}
              accessibilityElementsHidden={!selected}>
              <Check size={14} color={colors.white} strokeWidth={3} />
            </Animated.View>
          </View>

          <Text
            style={[styles.description, selected && styles.descriptionSelected]}
            numberOfLines={2}>
            {t(getLayoutModeDescriptionKey(mode))}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Visual property-layout picker for Quick Setup (PG / Hostel).
 * Selection logic unchanged — presentation only.
 */
export function PropertyLayoutModePicker({
  value,
  onChange,
  options,
  error,
}: PropertyLayoutModePickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('accommodation.layoutMode.label')}</Text>
      <View style={styles.list}>
        {options.map(mode => (
          <LayoutOptionCard
            key={mode}
            mode={mode}
            selected={value === mode}
            onPress={() => onChange(mode)}
          />
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageWrap: {
    width: '100%',
    height: 132,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  copy: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    flex: 1,
  },
  titleSelected: {
    color: colors.primaryDark,
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  descriptionSelected: {
    color: colors.primaryDark,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
