import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAccountEnquiryUnreadCount } from '../../hooks/useAccountEnquiryUnreadCount';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

export function AccountNotificationBellButton() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const unreadCount = useAccountEnquiryUnreadCount();

  return (
    <Pressable
      onPress={() => navigation.navigate('AccountNotifications')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('notifications.title')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.icon}>🔔</Text>
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
