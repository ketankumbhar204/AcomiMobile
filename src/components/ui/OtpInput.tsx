import React, { useRef } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  const handleChange = (text: string, index: number) => {
    const sanitized = text.replace(/\D/g, '');

    // Handle paste: fill from current index forward
    if (sanitized.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < sanitized.length && index + i < OTP_LENGTH; i++) {
        newDigits[index + i] = sanitized[i];
      }
      onChange(newDigits.join(''));
      const nextIndex = Math.min(index + sanitized.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = sanitized.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(''));

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (digits[index]) {
        // Clear current box
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => {
        const isFilled = digit.length > 0;
        return (
          <TextInput
            key={index}
            ref={ref => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            style={[
              styles.box,
              isFilled && styles.boxFilled,
            ]}
            keyboardType="number-pad"
            maxLength={6}
            editable={!disabled}
            selectTextOnFocus
            caretHidden
            textAlign="center"
            accessibilityLabel={`OTP digit ${index + 1}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
    color: colors.primaryDark,
  },
});
