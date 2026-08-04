import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SpacePaymentResponse, UniversalPaymentMethod } from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import {
  buildDefaultPaymentRemark,
  resolvePaymentProofRequirements,
  validatePaymentProofSubmission,
  type PaymentProofRequirements,
} from '../../utils/paymentProofPolicy';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { pickPaymentProofImage } from '../../utils/pickPaymentProofImage';

const PAYMENT_METHODS: UniversalPaymentMethod[] = [
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CHEQUE',
  'OTHER',
];

export type UniversalPaymentProofPayload = {
  proofImageBase64?: string;
  referenceNumber?: string;
  remarks?: string;
  paymentMethod?: UniversalPaymentMethod;
};

type UniversalPaymentProofModalProps = {
  visible: boolean;
  payment?: SpacePaymentResponse | null;
  mode?: 'submit' | 'edit';
  /** modal = overlay (default); inline = embed form in a screen without Modal chrome */
  presentation?: 'modal' | 'inline';
  /** Hide Cancel/Submit when parent owns the primary CTA (e.g. subscription progressive footer). */
  hideActions?: boolean;
  proofRequirements?: PaymentProofRequirements;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: UniversalPaymentProofPayload) => void;
  /** Fired whenever fields change (useful with hideActions / inline). */
  onPayloadChange?: (payload: UniversalPaymentProofPayload) => void;
};

export function UniversalPaymentProofModal({
  visible,
  payment = null,
  mode = 'submit',
  presentation = 'modal',
  hideActions = false,
  proofRequirements,
  submitting = false,
  onClose,
  onSubmit,
  onPayloadChange,
}: UniversalPaymentProofModalProps) {
  const { t, i18n } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [proofImageBase64, setProofImageBase64] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<UniversalPaymentMethod>('UPI');
  const [picking, setPicking] = useState(false);
  const remarksEditedRef = useRef(false);
  const initializedPaymentIdRef = useRef<string | null>(null);
  const paidOnRef = useRef(new Date());

  const requirements =
    proofRequirements ??
    resolvePaymentProofRequirements({
      spaceId: payment?.spaceId,
      paymentMethod,
      paymentType: payment?.paymentType,
    });

  const reset = () => {
    setPreviewUri(null);
    setProofImageBase64(null);
    setReferenceNumber('');
    setRemarks('');
    setPaymentMethod('UPI');
    setPicking(false);
    remarksEditedRef.current = false;
    initializedPaymentIdRef.current = null;
  };

  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (!visible) {
      reset();
      return;
    }

    if (!payment || initializedPaymentIdRef.current === payment.paymentId) {
      return;
    }

    initializedPaymentIdRef.current = payment.paymentId;
    remarksEditedRef.current = false;
    paidOnRef.current = new Date();
    const initialMethod = payment.paymentMethod ?? 'UPI';
    setPaymentMethod(initialMethod);

    if (isEditMode) {
      setReferenceNumber(payment.referenceNumber ?? '');
      setRemarks(
        payment.remarks ??
          buildDefaultPaymentRemark(payment, t, i18n.language, paidOnRef.current, initialMethod),
      );
      remarksEditedRef.current = Boolean(payment.remarks?.trim());
      setPreviewUri(payment.proofUrl ?? null);
      setProofImageBase64(null);
      return;
    }

    setRemarks(
      buildDefaultPaymentRemark(payment, t, i18n.language, paidOnRef.current, initialMethod),
    );
  }, [i18n.language, isEditMode, payment, t, visible]);

  const handlePaymentMethodChange = (method: UniversalPaymentMethod) => {
    setPaymentMethod(method);
    if (!remarksEditedRef.current && payment) {
      setRemarks(
        buildDefaultPaymentRemark(payment, t, i18n.language, paidOnRef.current, method),
      );
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    reset();
    onClose();
  };

  const handlePickImage = async () => {
    setPicking(true);
    try {
      const dataUri = await pickPaymentProofImage();
      if (dataUri) {
        setPreviewUri(dataUri);
        setProofImageBase64(dataUri);
        // Future: OCR can extract amount, date, and UTR from the screenshot here.
      }
    } finally {
      setPicking(false);
    }
  };

  const handleRemarksChange = (value: string) => {
    remarksEditedRef.current = true;
    setRemarks(value);
  };

  const buildPayload = (): UniversalPaymentProofPayload => ({
    proofImageBase64: proofImageBase64?.trim() || undefined,
    referenceNumber: referenceNumber.trim() || undefined,
    remarks: remarks.trim() || undefined,
    paymentMethod,
  });

  useEffect(() => {
    if (!visible || !onPayloadChange) {
      return;
    }
    onPayloadChange(buildPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- emit on field edits only
  }, [visible, proofImageBase64, referenceNumber, remarks, paymentMethod]);

  const handleSubmit = () => {
    if (submitting) {
      return;
    }

    const payload = buildPayload();

    const validationError = validatePaymentProofSubmission(payload, requirements);
    if (validationError) {
      showToast(t(`paymentCollection.proof.${validationError}`));
      return;
    }

    onSubmit(payload);
  };

  if (!visible) {
    return null;
  }

  const form = (
    <View style={presentation === 'inline' ? styles.inlineSheet : styles.sheet}>
      <Text style={styles.title}>
        {isEditMode
          ? t('paymentCollection.proof.editTitle')
          : t('paymentCollection.proof.title')}
      </Text>
      <Text style={styles.hint}>
        {isEditMode
          ? t('paymentCollection.proof.editHint')
          : t('paymentCollection.proof.hint')}
      </Text>

      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
      ) : (
        <Pressable
          style={styles.pickArea}
          onPress={() => void handlePickImage()}
          disabled={picking}>
          {picking ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text style={styles.pickIcon}>📷</Text>
              <Text style={styles.pickLabel}>{t('paymentCollection.proof.uploadScreenshot')}</Text>
              <Text style={styles.pickOptional}>{t('paymentCollection.proof.uploadOptional')}</Text>
            </>
          )}
        </Pressable>
      )}

      {previewUri ? (
        <Pressable onPress={() => void handlePickImage()} disabled={picking || submitting}>
          <Text style={styles.changeLink}>{t('paymentCollection.proof.changeScreenshot')}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>{t('paymentCollection.proof.paymentMethod')}</Text>
      <View style={styles.methodRow}>
        {PAYMENT_METHODS.map(method => (
          <Pressable
            key={method}
            style={[styles.methodChip, paymentMethod === method && styles.methodChipActive]}
            onPress={() => handlePaymentMethodChange(method)}>
            <Text
              style={[
                styles.methodChipText,
                paymentMethod === method && styles.methodChipTextActive,
              ]}>
              {t(`paymentCollection.method.${method}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder={t('paymentCollection.proof.utrPlaceholder')}
        value={referenceNumber}
        onChangeText={setReferenceNumber}
        autoCapitalize="characters"
      />
      <View style={styles.remarksField}>
        <Text style={styles.label}>{t('paymentCollection.proof.remarksLabel')}</Text>
        <Text style={styles.remarksHelper}>{t('paymentCollection.proof.remarksHelper')}</Text>
        <TextInput
          style={[styles.input, styles.remarksInput]}
          placeholder={t('paymentCollection.proof.remarksPlaceholder')}
          value={remarks}
          onChangeText={handleRemarksChange}
          multiline
        />
      </View>

      {!hideActions ? (
        <View style={styles.actions}>
          <Button
            label={
              isEditMode
                ? t('paymentCollection.proof.saveChanges')
                : t('paymentCollection.proof.submit')
            }
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
          <Button
            label={t('common.cancel')}
            variant="ghost"
            onPress={handleClose}
            disabled={submitting}
          />
        </View>
      ) : null}
    </View>
  );

  if (presentation === 'inline') {
    return form;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {form}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  inlineSheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.h3 },
  hint: { ...typography.body, color: colors.muted, lineHeight: 22 },
  pickArea: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  pickIcon: { fontSize: 32 },
  pickLabel: { ...typography.bodyStrong, color: colors.primaryDark },
  pickOptional: { ...typography.caption, color: colors.muted },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  changeLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  label: { ...typography.bodyStrong },
  remarksField: {
    gap: spacing.xxs,
  },
  remarksHelper: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  methodChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  methodChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  methodChipText: {
    ...typography.caption,
    color: colors.muted,
  },
  methodChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    backgroundColor: colors.white,
  },
  remarksInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
