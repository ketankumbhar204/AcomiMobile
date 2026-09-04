import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AdminUpdateRegistrationContactRequest } from '../../api/types';
import { Button, FormInput } from '../ui';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';
import { spacing } from '../../theme';
import { adminErrorBanner } from './adminStyles';

type AdminRegistrationContactEditorProps = {
  ownerName: string;
  mobileNumber: string;
  alternateMobileNumber?: string | null;
  saving: boolean;
  onSave: (payload: AdminUpdateRegistrationContactRequest) => void;
  onCancel: () => void;
};

export function AdminRegistrationContactEditor({
  ownerName,
  mobileNumber,
  alternateMobileNumber,
  saving,
  onSave,
  onCancel,
}: AdminRegistrationContactEditorProps) {
  const { t } = useTranslation();
  const [owner, setOwner] = useState(ownerName ?? '');
  const [primary, setPrimary] = useState(mobileNumber ?? '');
  const [alternate, setAlternate] = useState(alternateMobileNumber ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    Keyboard.dismiss();
    setError(null);
    if (primary.trim() && !isValidIndianMobile(primary)) {
      setError(t('admin.contactEditor.errors.primaryMobile'));
      return;
    }
    if (alternate.trim() && !isValidIndianMobile(alternate)) {
      setError(t('admin.contactEditor.errors.alternateMobile'));
      return;
    }
    if (
      primary.trim() &&
      alternate.trim() &&
      normalizeIndianMobileDigits(primary) === normalizeIndianMobileDigits(alternate)
    ) {
      setError(t('admin.contactEditor.errors.alternateDifferent'));
      return;
    }

    const payload: AdminUpdateRegistrationContactRequest = {
      alternateMobileNumber: alternate.trim() ? normalizeIndianMobileDigits(alternate) : null,
    };
    if (owner.trim()) payload.ownerName = owner.trim();
    if (primary.trim()) payload.mobileNumber = normalizeIndianMobileDigits(primary);
    onSave(payload);
  }

  return (
    <View style={styles.wrap}>
      {error ? (
        <View style={adminErrorBanner.box}>
          <Text style={adminErrorBanner.text}>{error}</Text>
        </View>
      ) : null}
      <FormInput label={t('admin.contactEditor.ownerName')} value={owner} onChangeText={setOwner} />
      <FormInput
        label={t('admin.contactEditor.primaryMobile')}
        value={primary}
        onChangeText={text => setPrimary(normalizeIndianMobileDigits(text))}
        keyboardType="number-pad"
        maxLength={10}
      />
      <FormInput
        label={t('admin.contactEditor.alternateMobile')}
        value={alternate}
        onChangeText={text => setAlternate(normalizeIndianMobileDigits(text))}
        keyboardType="number-pad"
        maxLength={10}
        hint={t('admin.contactEditor.alternateHint')}
      />
      <View style={styles.actions}>
        <Button label={t('admin.contactEditor.save')} loading={saving} onPress={handleSubmit} />
        <Button
          label={t('common.cancel')}
          variant="secondary"
          disabled={saving}
          onPress={onCancel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
