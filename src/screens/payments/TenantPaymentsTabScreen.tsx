import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { UniversalPaymentCard } from '../../components/payments/UniversalPaymentCard';
import { Button, EmptyState, SkeletonCard } from '../../components/ui';
import { useLinkedMember } from '../../hooks/useLinkedMember';
import { useSpaceTabHeader } from '../../hooks/useSpaceTabHeader';
import { useUniversalPayments } from '../../hooks/useUniversalPayments';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Route = RouteProp<SpaceTabParamList, 'Payments'>;
type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Payments'>,
  NativeStackNavigationProp<MainStackParamList>
>;

export function TenantPaymentsTabScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  useSpaceTabHeader(spaceId);

  const { memberId, member, loading: memberLoading } = useLinkedMember(spaceId);
  const { payments, loading, error, serviceUnavailable, reload } = useUniversalPayments(spaceId, {
    memberId: memberId ?? undefined,
    enabled: Boolean(memberId),
  });
  const [refreshing, setRefreshing] = useState(false);

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
      if (!memberId) {
        return;
      }
      navigation.navigate('PaymentDetail', {
        spaceId,
        paymentId,
        memberId,
        memberName: member?.fullName ?? t('paymentCollection.memberPayments.title'),
      });
    },
    [member?.fullName, memberId, navigation, spaceId, t],
  );

  if (memberLoading && !memberId) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (!memberId) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <EmptyState
            icon="💳"
            title={t('paymentCollection.memberPayments.emptyTitle')}
            description={t('paymentCollection.memberPayments.noLinkedMember')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }>
        <Text style={styles.heading}>{t('paymentCollection.memberPayments.title')}</Text>
        <Text style={styles.subheading}>{member?.fullName}</Text>

        {serviceUnavailable ? (
          <EmptyState
            title={t('paymentCollection.serviceUnavailable.title')}
            description={t('paymentCollection.serviceUnavailable.description')}
            icon="⚠️"
          />
        ) : null}

        {error ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{t(error)}</Text>
            <Button label={t('common.retry')} variant="secondary" onPress={() => void reload()} />
          </View>
        ) : null}

        {!serviceUnavailable && !error && loading && payments.length === 0 ? (
          <SkeletonCard />
        ) : null}

        {!serviceUnavailable && !error && !loading && payments.length === 0 ? (
          <EmptyState
            title={t('paymentCollection.memberPayments.emptyTitle')}
            description={t('paymentCollection.memberPayments.emptyDescription')}
            icon="💳"
          />
        ) : null}

        {!serviceUnavailable && !error
          ? payments.map(payment => (
              <UniversalPaymentCard
                key={payment.paymentId}
                payment={payment}
                onPress={() => openPayment(payment.paymentId)}
              />
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.section,
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
  errorBlock: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
  },
});
