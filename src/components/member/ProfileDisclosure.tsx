import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ProfileDisclosureProps = {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function ProfileDisclosure({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: ProfileDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen(current => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
        <View style={styles.titleRow}>
          {Icon ? <Icon size={16} color={colors.primaryDark} strokeWidth={2.2} /> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        <ChevronDown
          size={18}
          color={colors.muted}
          strokeWidth={2.2}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerPressed: {
    backgroundColor: colors.lightGreen,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
