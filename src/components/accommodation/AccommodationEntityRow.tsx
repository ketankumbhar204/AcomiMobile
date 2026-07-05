import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InlineEditableName } from '../ui/InlineEditableName';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  AccommodationInactiveBadge,
  accommodationInactiveCardStyle,
} from './AccommodationInactiveBadge';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';

type AccommodationEntityRowProps = {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  iconLabel?: string;
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  showChevron?: boolean;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  active?: boolean;
};

export function AccommodationEntityRow({
  title,
  subtitle,
  meta,
  iconLabel,
  onPress,
  onLongPress,
  menu,
  badge,
  footer,
  showChevron = true,
  editableName = false,
  onSaveName,
  active = true,
}: AccommodationEntityRowProps) {
  const inactive = !isAccommodationEntityActive({ active });
  const showTrailingChevron = showChevron && !menu;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, inactive && accommodationInactiveCardStyle]}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          style={({ pressed }) => [styles.main, pressed && styles.mainPressed]}>
          {iconLabel ? (
            <View style={[styles.icon, inactive && styles.iconInactive]}>
              <Text style={styles.iconText}>{iconLabel}</Text>
            </View>
          ) : null}
          <View style={styles.info}>
            <InlineEditableName
              value={title}
              editable={editableName}
              onSave={onSaveName}
            />
            {meta ? <View style={styles.meta}>{meta}</View> : null}
            {subtitle ? (
              <Text style={[styles.subtitle, inactive && styles.subtitleInactive]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
            {inactive ? (
              <View style={styles.badge}>
                <AccommodationInactiveBadge />
              </View>
            ) : badge ? (
              <View style={styles.badge}>{badge}</View>
            ) : null}
          </View>
          {showTrailingChevron ? <Text style={styles.chevron}>›</Text> : null}
        </Pressable>
        {menu ? (
          <>
            <View style={styles.divider} />
            <View style={styles.menuSlot}>{menu}</View>
          </>
        ) : null}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
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
  iconInactive: {
    backgroundColor: '#9CA3AF',
  },
  info: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    justifyContent: 'center',
  },
  meta: {
    minHeight: 18,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  subtitleInactive: {
    color: '#9CA3AF',
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
    zIndex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
