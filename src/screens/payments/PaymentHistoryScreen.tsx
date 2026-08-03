import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { History, TriangleAlert } from 'lucide-react-native';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import type { PaymentTimelineEventResponse } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { PaymentHistoryTimeline } from '../../components/payments/PaymentHistoryTimeline';
import { EmptyState, HeaderBackButton, Screen, Skeleton } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'PaymentHistory'>;
type Route = NativeStackScreenProps<MainStackParamList, 'PaymentHistory'>['route'];

export function PaymentHistoryScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, paymentId } = route.params;

  const [events, setEvents] = useState<PaymentTimelineEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setServiceUnavailable(false);
    try {
      const response = await paymentsApi.getPaymentTimeline(spaceId, paymentId);
      setEvents(response.events);
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        setServiceUnavailable(true);
        return;
      }
      setError(t('paymentCollection.errors.loadTimeline'));
    } finally {
      setLoading(false);
    }
  }, [paymentId, spaceId, t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('paymentCollection.timeline.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen contentStyle={styles.content}>
      <MealFormHero
        icon={History}
        eyebrow={t('paymentCollection.timeline.eyebrow', { defaultValue: 'Payment' })}
        heading={t('paymentCollection.timeline.title')}
        subheading={t('paymentCollection.timeline.subtitle', {
          defaultValue: 'Status changes and review events for this payment.',
        })}
        compact
      />

      {loading ? (
        <View style={styles.skeletonWrap}>
          <Skeleton width="100%" height={72} borderRadius={18} />
          <Skeleton width="100%" height={72} borderRadius={18} />
          <Skeleton width="100%" height={72} borderRadius={18} />
        </View>
      ) : serviceUnavailable ? (
        <EmptyState
          Icon={TriangleAlert}
          title={t('paymentCollection.serviceUnavailable.title')}
          description={t('paymentCollection.serviceUnavailable.description')}
        />
      ) : error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : events.length === 0 ? (
        <EmptyState
          Icon={History}
          title={t('paymentCollection.timeline.empty')}
          description={t('paymentCollection.timeline.emptyHint', {
            defaultValue: 'Events will appear as this payment moves through review.',
          })}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <PaymentHistoryTimeline events={events} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
  },
  error: {
    ...typography.body,
    color: '#DC2626',
  },
});
