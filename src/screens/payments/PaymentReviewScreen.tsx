import React, { useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { navigateToPaymentsTab } from '../../navigation/navigationRef';
import type { MainStackParamList } from '../../navigation/types';

type Route = NativeStackScreenProps<MainStackParamList, 'PaymentReview'>['route'];

/**
 * Legacy stack route — redirects into the Payments tab review section.
 * Kept so existing deep links and navigation calls continue to work.
 */
export function PaymentReviewScreen() {
  const route = useRoute<Route>();
  const { spaceId } = route.params;

  useEffect(() => {
    navigateToPaymentsTab(spaceId, { initialSection: 'pendingReview' });
  }, [spaceId]);

  return null;
}
