import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealSharePreviewResponse, MealType, UUID } from '../../api/types';
import { Screen } from '../../components/ui/Screen';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type MenuSharePreviewScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType?: MealType;
};

export function MenuSharePreviewScreen({
  spaceId,
  menuDate,
  mealType,
}: MenuSharePreviewScreenProps) {
  const { t, i18n } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<MealSharePreviewResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mealsApi.getSharePreview(spaceId, menuDate, mealType);
      setPreview(data);
    } catch {
      setPreview(null);
      showToast(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [mealType, menuDate, showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const copyMessage = async () => {
    if (!preview?.messageText) {
      return;
    }
    try {
      await Share.share({ message: preview.messageText });
    } catch {
      showToast(t('meals.errors.actionFailed'));
    }
  };

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>{t('meals.planning.previewShare')}</Text>
      <Text style={styles.date}>{formatMenuDate(menuDate, i18n.language)}</Text>
      <Text style={styles.hint}>{t('meals.planning.shareHint')}</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!loading && !preview?.messageText ? (
        <Text style={styles.empty}>{t('meals.planning.shareEmpty')}</Text>
      ) : null}

      {preview?.messageText ? (
        <View style={styles.messageBox}>
          <Text style={styles.message}>{preview.messageText}</Text>
        </View>
      ) : null}

      {preview?.slots?.map(slot => (
        <View key={slot.mealType} style={styles.slotBlock}>
          <Text style={styles.slotTitle}>{t(mealTypeLabelKey(slot.mealType))}</Text>
          {slot.lines.map((line, index) => (
            <Text key={`${line.label}-${index}`} style={styles.slotLine}>
              • {line.label}
            </Text>
          ))}
        </View>
      ))}

      {preview?.messageText ? (
        <Pressable style={styles.copyBtn} onPress={() => void copyMessage()}>
          <Text style={styles.copyBtnText}>{t('meals.planning.copyMessage')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.xs },
  date: { ...typography.bodyStrong, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.muted, marginBottom: spacing.lg },
  loader: { marginVertical: spacing.lg },
  empty: { ...typography.body, color: colors.muted },
  messageBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  message: { ...typography.body, lineHeight: 22 },
  slotBlock: { marginBottom: spacing.md },
  slotTitle: { ...typography.bodyStrong, marginBottom: spacing.xs },
  slotLine: { ...typography.body, color: colors.textSecondary },
  copyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  copyBtnText: { ...typography.bodyStrong, color: colors.white },
});
