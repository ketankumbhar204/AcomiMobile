import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAccountEnquiryUnreadCount } from '../../hooks/useAccountEnquiryUnreadCount';
import type { MainStackParamList } from '../../navigation/types';
import { colors, pastels, radius, spacing, typography } from '../../theme';

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
      <Bell size={18} color={pastels.orange.fg} strokeWidth={2.2} />
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
    borderRadius: radius.button,
    backgroundColor: pastels.orange.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
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
