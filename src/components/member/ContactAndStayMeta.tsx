import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { BedSingle, Phone } from 'lucide-react-native';
import { colors, typography } from '../../theme';
import { formatMemberContactNumber } from '../../utils/indianMobile';
import { formatStayTrail } from '../../utils/stayTrail';

type ContactNumberLineProps = {
  value?: string | null;
  /** Already formatted, including a "not available" fallback. */
  label?: string | null;
  textStyle?: StyleProp<TextStyle>;
};

export function ContactNumberLine({ value, label, textStyle }: ContactNumberLineProps) {
  const text = label?.trim() || formatMemberContactNumber(value);
  if (!text) {
    return null;
  }
  return (
    <View style={styles.row}>
      <Phone size={13} color={colors.textSecondary} strokeWidth={2.2} />
      <Text style={[styles.text, textStyle]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

type StayTrailLineProps = {
  label?: string | null;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function StayTrailLine({ label, textStyle, numberOfLines = 2 }: StayTrailLineProps) {
  const text = formatStayTrail(label);
  if (!text) {
    return null;
  }
  return (
    <View style={styles.row}>
      <BedSingle size={13} color={colors.textSecondary} strokeWidth={2.2} />
      <Text style={[styles.text, textStyle]} numberOfLines={numberOfLines}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    flexShrink: 1,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
