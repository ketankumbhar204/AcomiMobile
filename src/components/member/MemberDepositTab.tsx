import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberDetailsResponse } from '../../api/types';
import { Button, Card, FormInput } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency, parseDepositAmount, validateDeposit } from '../../utils/memberDeposit';

type MemberDepositTabProps = {
  member: MemberDetailsResponse;
  canEdit: boolean;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function MemberDepositTab({ member, canEdit }: MemberDepositTabProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const loading = useMemberStore(state => state.loading);
  const updateDeposit = useMemberStore(state => state.updateDeposit);

  const [editing, setEditing] = useState(false);
  const [depositAmount, setDepositAmount] = useState(String(member.depositAmount ?? 0));
  const [depositPaid, setDepositPaid] = useState(String(member.depositPaid ?? 0));
  const [depositRefunded, setDepositRefunded] = useState(
    String(member.depositRefunded ?? 0),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDepositAmount(String(member.depositAmount ?? 0));
    setDepositPaid(String(member.depositPaid ?? 0));
    setDepositRefunded(String(member.depositRefunded ?? 0));
  }, [member.depositAmount, member.depositPaid, member.depositRefunded]);

  const handleSave = async () => {
    const body = {
      depositAmount: parseDepositAmount(depositAmount),
      depositPaid: parseDepositAmount(depositPaid),
      depositRefunded: parseDepositAmount(depositRefunded),
    };

    const validationKey = validateDeposit(body);
    if (validationKey) {
      setError(t(validationKey));
      return;
    }

    console.log('[MemberDepositTab] update deposit', body);
    const updated = await updateDeposit(member.memberId, body);
    if (updated) {
      showToast(t('membership.deposit.successToast'));
      setEditing(false);
      setError(null);
    }
  };

  if (editing && canEdit) {
    return (
      <View>
        <FormInput
          label={t('membership.deposit.amount')}
          value={depositAmount}
          onChangeText={setDepositAmount}
          keyboardType="decimal-pad"
        />
        <FormInput
          label={t('membership.deposit.paid')}
          value={depositPaid}
          onChangeText={setDepositPaid}
          keyboardType="decimal-pad"
        />
        <FormInput
          label={t('membership.deposit.refunded')}
          value={depositRefunded}
          onChangeText={setDepositRefunded}
          keyboardType="decimal-pad"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button
          label={t('common.save')}
          onPress={handleSave}
          disabled={loading}
          style={styles.actionButton}
        />
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={() => {
            setEditing(false);
            setError(null);
            setDepositAmount(String(member.depositAmount ?? 0));
            setDepositPaid(String(member.depositPaid ?? 0));
            setDepositRefunded(String(member.depositRefunded ?? 0));
          }}
          style={styles.actionButton}
        />
      </View>
    );
  }

  return (
    <View>
      <Card style={styles.card}>
        <DetailRow
          label={t('membership.deposit.amount')}
          value={formatCurrency(member.depositAmount ?? 0)}
        />
        <DetailRow
          label={t('membership.deposit.paid')}
          value={formatCurrency(member.depositPaid ?? 0)}
        />
        <DetailRow
          label={t('membership.deposit.refunded')}
          value={formatCurrency(member.depositRefunded ?? 0)}
        />
        <DetailRow
          label={t('membership.deposit.balance')}
          value={formatCurrency(member.depositBalance ?? 0)}
        />
      </Card>

      {canEdit ? (
        <Button
          label={t('membership.deposit.edit')}
          onPress={() => setEditing(true)}
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.bodyStrong,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
