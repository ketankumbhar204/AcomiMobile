import React, { type RefObject } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useScreenBackButton } from '../../hooks/useScreenBackButton';
import { colors, spacing } from '../../theme';

type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  showBack?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollRef?: RefObject<ScrollView | null>;
};

export function Screen({
  children,
  scrollable = false,
  showBack = false,
  style,
  contentStyle,
  refreshing,
  onRefresh,
  scrollRef,
}: ScreenProps) {
  useScreenBackButton(showBack);

  if (scrollable) {
    return (
      <View style={[styles.screen, style]}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing === true} onRefresh={onRefresh} />
            ) : undefined
          }>
          {children}
        </ScrollView>
      </View>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xxl,
  },
});
