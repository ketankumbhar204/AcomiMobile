import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react-native';
import { useIsFavorite, useIsFavoritePending, useToggleFavorite } from '../../hooks/useFavorites';
import { useToastStore } from '../../store/toastStore';
import { colors, shadows } from '../../theme';

const FILLED = '#E11D48';

type FavoriteHeartButtonProps = {
  spaceId: string;
  listingName?: string;
  style?: StyleProp<ViewStyle>;
  onPressIn?: () => void;
  onPressOut?: () => void;
};

export function FavoriteHeartButton({
  spaceId,
  listingName,
  style,
  onPressIn,
  onPressOut,
}: FavoriteHeartButtonProps) {
  const { t } = useTranslation();
  const favorited = useIsFavorite(spaceId);
  const pending = useIsFavoritePending(spaceId);
  const toggle = useToggleFavorite();
  const showToast = useToastStore(state => state.showToast);
  const label = favorited
    ? t('spaces.favorites.remove', {
        name: listingName ?? '',
        defaultValue: 'Remove from favorites',
      })
    : t('spaces.favorites.add', {
        name: listingName ?? '',
        defaultValue: 'Add to favorites',
      });

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={event => {
        event.stopPropagation?.();
        toggle(spaceId)
          .then(result => {
            if (result === 'failed') {
              showToast(t('spaces.favorites.failed', {
                defaultValue: 'Could not update favorites. Please try again.',
              }));
            } else if (result === 'auth-required') {
              showToast(t('spaces.favorites.signIn', {
                defaultValue: 'Sign in to save favorites.',
              }));
            }
          })
          .catch(() => {
            showToast(t('spaces.favorites.failed', {
              defaultValue: 'Could not update favorites. Please try again.',
            }));
          });
      }}
      hitSlop={8}
      style={[styles.button, pending && styles.pending, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: favorited, busy: pending }}>
      <Heart
        size={16}
        color={favorited ? FILLED : colors.textPrimary}
        fill={favorited ? FILLED : 'transparent'}
        strokeWidth={2}
      />
      {pending ? (
        <ActivityIndicator
          size="small"
          color={favorited ? FILLED : colors.textPrimary}
          style={styles.spinner}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    // Keep elevation at or below the card. A higher value is drawn on Android
    // but does not receive touches.
    elevation: 0,
  },
  pending: {
    opacity: 0.7,
  },
  spinner: {
    position: 'absolute',
    transform: [{ scale: 0.55 }],
  },
});
