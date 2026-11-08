import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarClock, CalendarDays } from 'lucide-react-native';
import { pastels, typography } from '../../theme';
import {
  stayChoiceDefaultLabel,
  stayChoiceLabelKey,
  type StayChoice,
} from '../../utils/shortStay';

type StayTypeBadgeProps = {
  stayKind?: StayChoice | null;
  /** Compact OPEN_ENDED label (“No Fixed”) for tight bed/member chips. */
  compact?: boolean;
};

const TONES: Record<StayChoice, { fg: string; bg: string; border: string }> = {
  MONTHLY: pastels.mint,
  SHORT: pastels.blue,
  OPEN_ENDED: pastels.orange,
};

/** Compact stay-type chip. Renders nothing when stayKind is null/unknown. */
export const StayTypeBadge = memo(function StayTypeBadge({
  stayKind,
  compact = true,
}: StayTypeBadgeProps) {
  const { t } = useTranslation();
  if (stayKind !== 'MONTHLY' && stayKind !== 'SHORT' && stayKind !== 'OPEN_ENDED') {
    return null;
  }

  const tone = TONES[stayKind];
  const Icon = stayKind === 'SHORT' ? CalendarClock : CalendarDays;
  const fullLabel = t(stayChoiceLabelKey(stayKind), {
    defaultValue: stayChoiceDefaultLabel(stayKind),
  });
  const label =
    compact && stayKind === 'OPEN_ENDED'
      ? t('occupancy.section.openEndedStayChoiceCompact', {
          defaultValue: 'No Fixed',
        })
      : fullLabel;

  return (
    <View
      style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}
      accessibilityLabel={fullLabel}>
      <Icon size={11} color={tone.fg} strokeWidth={2.3} />
      <Text style={[styles.text, { color: tone.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
});
