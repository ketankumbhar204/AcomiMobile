import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InlineEditableName } from '../ui/InlineEditableName';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type AccommodationEntityRowProps = {
  title: string;
  subtitle?: string;
  iconLabel?: string;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  badge?: React.ReactNode;
  showChevron?: boolean;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
};

export function AccommodationEntityRow({
  title,
  subtitle,
  iconLabel,
  onPress,
  onLongPress,
  menu,
  badge,
  showChevron = true,
  editableName = false,
  onSaveName,
}: AccommodationEntityRowProps) {
  const showTrailingChevron = showChevron && !menu;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          style={({ pressed }) => [styles.main, pressed && styles.mainPressed]}>
          {iconLabel ? (
            <View style={styles.icon}>
              <Text style={styles.iconText}>{iconLabel}</Text>
            </View>
          ) : null}
          <View style={styles.info}>
            <InlineEditableName
              value={title}
              editable={editableName}
              onSave={onSaveName}
            />
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
            {badge ? <View style={styles.badge}>{badge}</View> : null}
          </View>
          {showTrailingChevron ? <Text style={styles.chevron}>›</Text> : null}
        </Pressable>
        {menu ? (
          <>
            <View style={styles.divider} />
            <View style={styles.menuSlot}>{menu}</View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
    overflow: 'hidden',
    ...shadows.sm,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  mainPressed: {
    backgroundColor: colors.surface,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  badge: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.muted,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  menuSlot: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
