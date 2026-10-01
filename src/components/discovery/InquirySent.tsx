import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

type InquirySentProps = {
  variant?: 'chip' | 'inline' | 'button';
  sentVia?: 'EMAIL' | 'APP' | 'BOTH' | null;
  style?: StyleProp<ViewStyle>;
};

export function InquirySent({ variant = 'chip', sentVia = null, style }: InquirySentProps) {
  const { t } = useTranslation();
  const label = t('spaces.findPlace.inquirySent', { defaultValue: 'Inquiry sent' });
  const where = sentVia === 'APP'
    ? t('spaces.findPlace.inquirySentInApp', { defaultValue: 'Sent in the ACOMI app' })
    : sentVia === 'BOTH'
      ? t('spaces.findPlace.inquirySentEmailAndApp', { defaultValue: 'Sent to your email and the ACOMI app' })
      : sentVia === 'EMAIL'
        ? t('spaces.findPlace.inquirySentByEmail', { defaultValue: 'Sent to your email' })
        : null;
  const compact = variant !== 'button';
  if (variant === 'inline') {
    const line = where ? `${label} · ${where}` : label;
    return (
      <View accessibilityRole="text" accessibilityLabel={line} style={[styles.inline, style]}>
        <Check size={11} color="#C2410C" strokeWidth={2.4} />
        <Text style={styles.inlineText} numberOfLines={1}>
          {line}
        </Text>
      </View>
    );
  }
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        variant === 'chip' ? styles.chip : styles.button,
        variant === 'button' && where ? styles.buttonStack : null,
        style,
      ]}>
      <View style={styles.row}>
        <Check size={compact ? 12 : 14} color="#C2410C" strokeWidth={2.4} />
        <Text style={variant === 'button' ? styles.buttonText : styles.text} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {variant === 'button' && where ? (
        <Text style={styles.where} numberOfLines={2}>
          {where}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    maxWidth: '100%',
  },
  inlineText: {
    flexShrink: 1,
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '700',
  },
  where: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  buttonStack: {
    flexDirection: 'column',
    gap: 2,
  },
  text: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonText: {
    color: '#C2410C',
    fontSize: 15,
    fontWeight: '700',
  },
});
