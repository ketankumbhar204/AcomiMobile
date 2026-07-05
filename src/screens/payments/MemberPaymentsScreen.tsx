import React, { useCallback, useLayoutEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { UniversalPaymentCard } from '../../components/payments/UniversalPaymentCard';
import { EmptyState, HeaderBackButton, Screen, SkeletonCard } from '../../components/ui';
import { useUniversalPayments } from '../../hooks/useUniversalPayments';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'MemberPayments'>;
type Route = NativeStackScreenProps<MainStackParamList, 'MemberPayments'>['route'];

export function MemberPaymentsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, memberId, memberName } = route.params;

  const { payments, loading, error, serviceUnavailable, reload } = useUniversalPayments(spaceId, {
    memberId,
  });
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('paymentCollection.memberPayments.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const openPayment = useCallback(
    (paymentId: string) => {
      navigation.navigate('PaymentDetail', { spaceId, paymentId, memberId, memberName });
    },
    [memberId, memberName, navigation, spaceId],
  );

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{memberName}</Text>
        <Text style={styles.subheading}>{t('paymentCollection.memberPayments.subtitle')}</Text>

        {serviceUnavailable ? (
          <EmptyState
            title={t('paymentCollection.serviceUnavailable.title')}
            description={t('paymentCollection.serviceUnavailable.description')}
            icon="⚠️"
          />
        ) : null}

        {error ? <Text style={styles.error}>{t(error)}</Text> : null}

        {!serviceUnavailable && loading && payments.length === 0 ? (
          <SkeletonCard />
        ) : null}

        {!serviceUnavailable && !loading && payments.length === 0 ? (
          <EmptyState
            title={t('paymentCollection.memberPayments.emptyTitle')}
            description={t('paymentCollection.memberPayments.emptyDescription')}
            icon="💳"
          />
        ) : null}

        {!serviceUnavailable
          ? payments.map(payment => (
              <UniversalPaymentCard
                key={payment.paymentId}
                payment={payment}
                onPress={() => openPayment(payment.paymentId)}
              />
            ))
          : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  heading: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.md,
  },
});
