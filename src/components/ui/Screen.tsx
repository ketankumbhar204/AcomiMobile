import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useScreenBackButton } from '../../hooks/useScreenBackButton';
import { colors, spacing } from '../../theme';

type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  showBack?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  scrollable = false,
  showBack = false,
  style,
  contentStyle,
}: ScreenProps) {
  useScreenBackButton(showBack);

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.screen, style]}
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, styles.content, style, contentStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xxl,
  },
});
