import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Pencil,
  Phone,
  ShieldAlert,
  Trash2,
  UserPlus,
} from 'lucide-react-native';
import type { MemberDetailsResponse, MemberStatus, SpaceType } from '../../api/types';
import { MemberAccommodationSection } from '../occupancy';
import { Button, Card, FormInput, useConfirmDialog } from '../ui';
import { DashboardActionRow } from '../dashboard/shared/DashboardActionRow';
import { DashboardSectionTitle } from '../dashboard/DashboardSectionTitle';
import type { MainStackParamList } from '../../navigation/types';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, shadows, spacing, typography } from '../../theme';
import { memberAcomiBadgeLabel, memberInviteHint } from '../../utils/memberAppStatus';
import { isSelectableMemberGender, memberGenderLabelKey } from '../../utils/memberGender';
import { MemberDocumentsSection } from './MemberDocumentsSection';
import { MemberProfileCorrectionSection } from '../profile/MemberProfileCorrectionSection';
import { UserProfileFields } from '../profile/UserProfileFields';
import { MemberDetailRow } from './MemberDetailRow';
import { MemberMealBillingPanel } from './MemberMealBillingPanel';
import { MemberNotesSection } from './MemberNotesSection';
import { StatusPicker } from './StatusPicker';

type MemberProfileNav = NativeStackNavigationProp<MainStackParamList>;

type MemberProfileTabProps = {
  spaceId: string;
  spaceType?: SpaceType;
  member: MemberDetailsResponse;
  canEdit: boolean;
  canRemove: boolean;
  canInvite: boolean;
  currentRole?: MemberDetailsResponse['role'];
};

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

export function MemberProfileTab({
  spaceId,
  spaceType,
  member,
  canEdit,
  canRemove,
  canInvite,
  currentRole,
}: MemberProfileTabProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<MemberProfileNav>();
  const showToast = useToastStore(state => state.showToast);
  const loading = useMemberStore(state => state.loading);
  const pendingInvitations = useMemberStore(state => state.pendingInvitations);
  const updateStatus = useMemberStore(state => state.updateStatus);
  const updateEmergencyContact = useMemberStore(state => state.updateEmergencyContact);
  const removeMember = useMemberStore(state => state.removeMember);
  const { showConfirm } = useConfirmDialog();

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<MemberStatus>(member.status);
  const [emergencyName, setEmergencyName] = useState(member.emergencyContactName ?? '');
  const [emergencyRelation, setEmergencyRelation] = useState(
    member.emergencyContactRelation ?? '',
  );
  const [emergencyMobile, setEmergencyMobile] = useState(
    member.emergencyContactMobile ?? '',
  );
  const [statusError, setStatusError] = useState<string | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);

  const appStatusLabel = memberAcomiBadgeLabel(member, t);

  const genderLabel = isSelectableMemberGender(member.gender)
    ? t(memberGenderLabelKey(member.gender))
    : t('membership.gender.unspecified');

  const hasPendingInvite = pendingInvitations.some(
    invitation =>
      invitation.mobileNumber.replace(/\D/g, '') ===
      member.mobileNumber.replace(/\D/g, ''),
  );

  const openInviteScreen = () => {
    navigation.navigate('InviteMembers', {
      spaceId,
      mobileNumber: member.mobileNumber,
      role: member.role,
      memberName: member.fullName,
    });
  };

  const handleSaveStatus = async () => {
    if (!selectedStatus) {
      setStatusError(t('membership.status.required'));
      return;
    }

    const updated = await updateStatus(member.memberId, { status: selectedStatus });
    if (updated) {
      showToast(t('membership.status.successToast'));
      setStatusModalVisible(false);
      setStatusError(null);
    }
  };

  const handleSaveEmergency = async () => {
    if (!emergencyName.trim()) {
      setEmergencyError(t('membership.emergency.nameRequired'));
      return;
    }
    if (!emergencyRelation.trim()) {
      setEmergencyError(t('membership.emergency.relationRequired'));
      return;
    }
    if (!emergencyMobile.trim()) {
      setEmergencyError(t('membership.emergency.mobileRequired'));
      return;
    }

    const updated = await updateEmergencyContact(member.memberId, {
      emergencyContactName: emergencyName.trim(),
      emergencyContactRelation: emergencyRelation.trim(),
      emergencyContactMobile: emergencyMobile.trim(),
    });
    if (updated) {
      showToast(t('membership.emergency.successToast'));
      setEmergencyModalVisible(false);
      setEmergencyError(null);
    }
  };

  const confirmRemove = () => {
    showConfirm({
      title: t('membership.remove.title'),
      message: t('membership.remove.message'),
      confirmLabel: t('membership.remove.confirm'),
      destructive: true,
      onConfirm: async () => {
        const success = await removeMember(member.memberId);
        if (success) {
          navigation.goBack();
        }
      },
    });
  };

  const openStatusModal = () => {
    setSelectedStatus(member.status);
    setStatusError(null);
    setStatusModalVisible(true);
  };

  const openEmergencyModal = () => {
    setEmergencyName(member.emergencyContactName ?? '');
    setEmergencyRelation(member.emergencyContactRelation ?? '');
    setEmergencyMobile(member.emergencyContactMobile ?? '');
    setEmergencyError(null);
    setEmergencyModalVisible(true);
  };

  return (
    <View>
      <MemberAccommodationSection
        spaceId={spaceId}
        spaceType={spaceType}
        member={member}
        currentRole={currentRole}
      />

      <Card style={styles.card}>
        <MemberDetailRow
          label={t('membership.details.mobile')}
          value={member.mobileNumber}
        />
        <MemberDetailRow label={t('membership.details.gender')} value={genderLabel} />
        <MemberDetailRow
          label={t('membership.details.appStatus')}
          value={appStatusLabel}
        />
        <MemberDetailRow
          label={t('membership.status.label')}
          value={t(`membership.status.${member.status}`)}
        />
        <MemberDetailRow
          label={t('membership.status.updatedAt')}
          value={formatDate(member.statusUpdatedAt)}
        />
        <MemberDetailRow
          label={t('membership.details.created')}
          value={formatDate(member.createdAt)}
        />
        <MemberDetailRow
          label={t('membership.details.updated')}
          value={formatDate(member.updatedAt)}
          isLast
        />
      </Card>

      {member.linkedUserProfile ? (
        <UserProfileFields
          user={member.linkedUserProfile}
          emergencyContact={{
            name: member.emergencyContactName,
            relation: member.emergencyContactRelation,
            mobile: member.emergencyContactMobile,
          }}
          showPhoto
        />
      ) : null}

      {spaceType === 'MESS' ? (
        <MemberMealBillingPanel
          spaceId={spaceId}
          member={member}
          spaceType={spaceType}
          canEdit={canEdit}
        />
      ) : null}

      <DashboardSectionTitle title={t('membership.emergency.heading')} />
      {!member.linkedUserProfile ? (
        <Card style={styles.card}>
          <MemberDetailRow
            label={t('membership.emergency.name')}
            value={member.emergencyContactName ?? '—'}
          />
          <MemberDetailRow
            label={t('membership.emergency.relation')}
            value={member.emergencyContactRelation ?? '—'}
          />
          <MemberDetailRow
            label={t('membership.emergency.mobile')}
            value={member.emergencyContactMobile ?? '—'}
            isLast
          />
        </Card>
      ) : null}

      <MemberDocumentsSection memberId={member.memberId} canEdit={canEdit} />
      <MemberProfileCorrectionSection
        memberId={member.memberId}
        canRequest={canEdit && member.linkedUser}
      />
      <MemberNotesSection memberId={member.memberId} canEdit={canEdit} />

      <DashboardSectionTitle title={t('membership.details.actionsHeading', {
        defaultValue: 'Actions',
      })} />
      <View style={styles.actionsStack}>
        {canInvite ? (
          <DashboardActionRow
            icon={UserPlus}
            accent={colors.primaryDark}
            title={
              hasPendingInvite
                ? t('membership.invite.pending')
                : t('membership.invite.send')
            }
            subtitle={memberInviteHint(member, t)}
            onPress={hasPendingInvite ? undefined : openInviteScreen}
            disabled={hasPendingInvite}
          />
        ) : null}
        {canEdit ? (
          <>
            <DashboardActionRow
              icon={Pencil}
              accent={colors.primaryDark}
              title={t('membership.details.edit')}
              subtitle={t('membership.details.editSubtitle', {
                defaultValue: 'Update name, role, and profile details',
              })}
              onPress={() =>
                navigation.navigate('EditMember', {
                  spaceId,
                  memberId: member.memberId,
                })
              }
            />
            <DashboardActionRow
              icon={ShieldAlert}
              accent="#2563EB"
              title={t('membership.status.change')}
              subtitle={t('membership.status.changeSubtitle', {
                defaultValue: 'Active, left, or other status',
              })}
              onPress={openStatusModal}
            />
            <DashboardActionRow
              icon={Phone}
              accent="#D97706"
              title={t('membership.emergency.edit')}
              subtitle={t('membership.emergency.editSubtitle', {
                defaultValue: 'Name, relation, and mobile',
              })}
              onPress={openEmergencyModal}
            />
          </>
        ) : null}
        {canRemove ? (
          <DashboardActionRow
            icon={Trash2}
            accent="#DC2626"
            title={t('membership.members.remove')}
            subtitle={t('membership.remove.message')}
            onPress={confirmRemove}
            disabled={loading}
          />
        ) : null}
      </View>

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setStatusModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('membership.status.change')}</Text>
            <StatusPicker
              value={selectedStatus}
              onChange={setSelectedStatus}
              error={statusError}
            />
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setStatusModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                label={t('common.save')}
                onPress={handleSaveStatus}
                disabled={loading}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={emergencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmergencyModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setEmergencyModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('membership.emergency.edit')}</Text>
            <FormInput
              label={t('membership.emergency.name')}
              value={emergencyName}
              onChangeText={setEmergencyName}
              placeholder={t('membership.emergency.namePlaceholder')}
            />
            <FormInput
              label={t('membership.emergency.relation')}
              value={emergencyRelation}
              onChangeText={setEmergencyRelation}
              placeholder={t('membership.emergency.relationPlaceholder')}
            />
            <FormInput
              label={t('membership.emergency.mobile')}
              value={emergencyMobile}
              onChangeText={setEmergencyMobile}
              placeholder={t('membership.emergency.mobilePlaceholder')}
              keyboardType="phone-pad"
            />
            {emergencyError ? (
              <Text style={styles.errorText}>{emergencyError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setEmergencyModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                label={t('common.save')}
                onPress={handleSaveEmergency}
                disabled={loading}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: 18,
  },
  actionsStack: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.xl,
    ...shadows.md,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
