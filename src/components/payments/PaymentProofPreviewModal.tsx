import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

type PaymentProofPreviewModalProps = {
  visible: boolean;
  proofUrl?: string | null;
  onClose: () => void;
};

export function PaymentProofPreviewModal({
  visible,
  proofUrl,
  onClose,
}: PaymentProofPreviewModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  if (!visible) {
    return null;
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('paymentCollection.proof.viewTitle')}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>{t('common.close')}</Text>
          </Pressable>
        </View>

        {proofUrl ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}>
            <Image
              source={{ uri: proofUrl }}
              style={[styles.preview, { width: screenWidth - spacing.lg * 2 }]}
              resizeMode="contain"
            />
          </ScrollView>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>{t('paymentCollection.proof.noProofAvailable')}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.white,
  },
  close: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  preview: {
    minHeight: 320,
    aspectRatio: 0.75,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
});
