import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { BedSingle, Phone } from 'lucide-react-native';
import { colors, typography } from '../../theme';
import { formatMemberContactNumber } from '../../utils/indianMobile';
import { canOpenContactOptions } from '../../utils/contactActions';
import { formatStayTrail } from '../../utils/stayTrail';
import { useOptionalContactOptions } from '../contact/ContactOptionsProvider';

type ContactNumberLineProps = {
  value?: string | null;
  /** Already formatted, including a "not available" fallback. */
  label?: string | null;
  textStyle?: StyleProp<TextStyle>;
  /** Person name for the contact sheet title. */
  name?: string | null;
  roleLabel?: string | null;
  /** When false, renders plain text (e.g. unavailable / masked). Default true. */
  interactive?: boolean;
  showIcon?: boolean;
};

export function ContactNumberLine({
  value,
  label,
  textStyle,
  name,
  roleLabel,
  interactive = true,
  showIcon = true,
}: ContactNumberLineProps) {
  const { openContactOptions } = useOptionalContactOptions();
  const text = label?.trim() || formatMemberContactNumber(value);
  if (!text) {
    return null;
  }
  const rawForActions = value?.trim() || text;
  const canOpen = interactive && canOpenContactOptions(rawForActions);

  const content = (
    <>
      {showIcon ? (
        <Phone
          size={13}
          color={canOpen ? colors.primaryDark : colors.textSecondary}
          strokeWidth={2.2}
        />
      ) : null}
      <Text
        style={[styles.text, textStyle, canOpen && styles.linkText]}
        numberOfLines={1}>
        {text}
      </Text>
    </>
  );

  if (!canOpen) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={event => {
        event.stopPropagation?.();
        openContactOptions({
          phoneNumber: rawForActions,
          displayName: name,
          roleLabel,
        });
      }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={text}
      hitSlop={6}>
      {content}
    </Pressable>
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
  linkText: {
    color: colors.primaryDark,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.75,
  },
});
