import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Building2,
  Home,
  MessageSquareWarning,
  Users,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { SpaceTabParamList } from './types';
import { colors } from '../theme';

const TAB_ICONS: Record<keyof SpaceTabParamList, LucideIcon> = {
  Dashboard: Home,
  Members: Users,
  Accommodation: Building2,
  Meals: UtensilsCrossed,
  Payments: WalletCards,
  Complaints: MessageSquareWarning,
};

type SpaceTabBarIconProps = {
  routeName: keyof SpaceTabParamList;
  color: string;
  size?: number;
  focused?: boolean;
};

/** Lucide SVG tab icons — no icon font / glyph map required. */
export function SpaceTabBarIcon({
  routeName,
  color,
  size = 24,
  focused = false,
}: SpaceTabBarIconProps) {
  const Icon = TAB_ICONS[routeName] ?? Home;

  return (
    <View
      style={styles.iconWrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {focused ? <View style={styles.activeBar} /> : null}
      <Icon size={size} color={color} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

type SpaceTabBarLabelProps = {
  label: string;
  color: string;
  focused: boolean;
};

export function SpaceTabBarLabel({ label, color, focused }: SpaceTabBarLabelProps) {
  return (
    <Text
      style={[styles.label, focused ? styles.labelFocused : styles.labelIdle, { color }]}
      numberOfLines={1}
      allowFontScaling={false}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBar: {
    position: 'absolute',
    top: -2,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  labelFocused: {
    fontWeight: '700',
  },
  labelIdle: {
    fontWeight: '500',
  },
});
