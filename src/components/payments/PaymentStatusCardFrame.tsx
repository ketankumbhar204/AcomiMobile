import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';
import type { PaymentStatusSource } from '../../utils/paymentStatusTheme';

type PaymentStatusCardFrameProps = {
  status: PaymentStatusSource | null | undefined;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function PaymentStatusCardFrame({ style, children }: PaymentStatusCardFrameProps) {
  return <View style={[styles.frame, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
});
