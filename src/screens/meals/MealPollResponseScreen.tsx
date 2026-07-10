import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MealPollPaymentChoice, UUID } from '../../api/types';
import { MealPollDayContent } from '../../components/meals/MealPollDayContent';
import { MealPollPaymentProofModal } from '../../components/meals/MealPollPaymentProofModal';
import { Button, Screen } from '../../components/ui';
import { useMealPollDay } from '../../hooks/useMealPollDay';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { isPastMenuDate } from '../../utils/mealDates';

type MealPollResponseScreenProps = {
  spaceId: UUID;
  menuDate: string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function MealPollResponseScreen({ spaceId, menuDate }: MealPollResponseScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const permissions = useSpacePermissions(spaceId);
  const mealPricing = useMealPricingPolicy(spaceId);
  const poll = useMealPollDay(spaceId, menuDate, permissions.spaceType, {
    startInEditMode: true,
    onSaved: () => {
      navigation.goBack();
    },
  });
  const dateReadOnly = isPastMenuDate(menuDate);
  const [paymentStep, setPaymentStep] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: paymentStep ? t('meals.poll.paymentTitle') : t('meals.poll.responseTitle'),
    });
  }, [navigation, paymentStep, t]);

  const handleSavePress = async () => {
    const proceedToPayment = await poll.handleSave();
    if (proceedToPayment && poll.requiresPayment) {
      setPaymentStep(true);
    }
  };

  const handlePayLater = async () => {
    const success = await poll.submitWithPayment('PAY_LATER');
    if (success) {
      setPaymentStep(false);
    }
  };

  const handleProofSubmit = async (proofImageBase64: string) => {
    const success = await poll.submitWithPayment('MARK_AS_PAID', proofImageBase64);
    if (success) {
      setProofModalOpen(false);
      setPaymentStep(false);
    }
  };

  return (
    <>
      <Screen scrollable contentStyle={styles.content}>
        {!poll.loading && poll.openPolls.length === 0 ? (
          <Text style={styles.empty}>{t('meals.poll.noOpenPolls')}</Text>
        ) : paymentStep && !dateReadOnly ? (
          <View style={styles.paymentBlock}>
            <Text style={styles.paymentPrompt}>{t('meals.poll.paymentPrompt')}</Text>
            <Text style={styles.paymentHint}>{t('meals.poll.paymentHint')}</Text>
            <Button
              label={t('meals.poll.markAsPaid')}
              onPress={() => setProofModalOpen(true)}
              loading={poll.saving}
              style={styles.button}
            />
            <Button
              label={t('meals.poll.payLater')}
              variant="secondary"
              onPress={() => void handlePayLater()}
              disabled={poll.saving}
              style={styles.button}
            />
            <Text style={styles.backLink} onPress={() => setPaymentStep(false)}>
              {t('meals.poll.backToChoices')}
            </Text>
          </View>
        ) : (
          <>
            <MealPollDayContent
              menuDate={menuDate}
              loading={poll.loading}
              saving={poll.saving}
              openPolls={poll.openPolls}
              selections={poll.selections}
              quantitySelections={poll.quantitySelections}
              multiQuantity={poll.multiQuantity}
              showSummary={poll.showSummary}
              totalPlates={poll.totalPlates}
              totalPlatesForMeal={poll.totalPlatesForMeal}
              deliveryLocations={poll.deliveryLocations}
              deliverySelections={poll.deliverySelections}
              lastDeliveryLocations={poll.lastDeliveryLocations}
              onDeliveryLocationChange={poll.handleDeliveryLocationChange}
              onSelect={poll.handleSelect}
              onQuantityChange={poll.handleQuantityChange}
              onSave={handleSavePress}
              onUpdateChoices={poll.handleUpdateChoices}
              variant="screen"
              hideSubmitButton
              readOnly={dateReadOnly}
              showMealPrices={mealPricing.showMealPrices}
            />
            {!poll.loading && poll.openPolls.length > 0 && !poll.showSummary && !dateReadOnly ? (
              <Button
                label={poll.saving ? t('meals.poll.submitting') : t('meals.poll.submit')}
                onPress={() => void handleSavePress()}
                loading={poll.saving}
                style={styles.button}
              />
            ) : !poll.loading && poll.openPolls.length > 0 && poll.showSummary && !dateReadOnly ? (
              <Button
                label={t('meals.poll.updateChoices')}
                onPress={poll.handleUpdateChoices}
                variant="secondary"
                style={styles.button}
              />
            ) : null}
          </>
        )}
      </Screen>

      <MealPollPaymentProofModal
        visible={proofModalOpen}
        submitting={poll.saving}
        onClose={() => setProofModalOpen(false)}
        onSubmit={proof => void handleProofSubmit(proof)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.md },
  button: { marginTop: spacing.md },
  paymentBlock: { gap: spacing.md, marginTop: spacing.md },
  paymentPrompt: { ...typography.h3 },
  paymentHint: { ...typography.body, color: colors.muted, lineHeight: 22 },
  backLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
