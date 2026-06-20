import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PENDING_UPLOAD_FILE_URL } from '../../api/memberApi';
import type { MemberDocumentType } from '../../api/types';
import { Button, Card, FormInput, SkeletonCard, useConfirmDialog } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { DocumentTypePicker } from './DocumentTypePicker';
import { MemberDetailRow, MemberSectionTitle } from './MemberDetailRow';

type MemberDocumentsSectionProps = {
  memberId: string;
  canEdit: boolean;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

export function MemberDocumentsSection({ memberId, canEdit }: MemberDocumentsSectionProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const documents = useMemberStore(state => state.documents);
  const documentsLoading = useMemberStore(state => state.documentsLoading);
  const loading = useMemberStore(state => state.loading);
  const loadDocuments = useMemberStore(state => state.loadDocuments);
  const addDocument = useMemberStore(state => state.addDocument);
  const deleteDocument = useMemberStore(state => state.deleteDocument);
  const { showConfirm } = useConfirmDialog();

  const [modalVisible, setModalVisible] = useState(false);
  const [documentType, setDocumentType] = useState<MemberDocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void loadDocuments(memberId);
  }, [loadDocuments, memberId]);

  const openAddModal = () => {
    setDocumentType(null);
    setDocumentNumber('');
    setFormError(null);
    setModalVisible(true);
  };

  const handleAdd = async () => {
    if (!documentType) {
      setFormError(t('membership.documents.typeRequired'));
      return;
    }
    if (!documentNumber.trim()) {
      setFormError(t('membership.documents.numberRequired'));
      return;
    }

    const created = await addDocument(memberId, {
      documentType,
      documentNumber: documentNumber.trim(),
      fileUrl: PENDING_UPLOAD_FILE_URL,
    });
    if (created) {
      showToast(t('membership.documents.successToast'));
      setModalVisible(false);
      setFormError(null);
    }
  };

  const confirmDelete = (documentId: string) => {
    showConfirm({
      title: t('membership.documents.deleteTitle'),
      message: t('membership.documents.deleteMessage'),
      confirmLabel: t('membership.documents.deleteConfirm'),
      destructive: true,
      onConfirm: async () => {
        await deleteDocument(memberId, documentId);
      },
    });
  };

  if (documentsLoading && documents.length === 0) {
    return (
      <View style={styles.wrap}>
        <MemberSectionTitle title={t('membership.detailTabs.documents')} />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <MemberSectionTitle title={t('membership.detailTabs.documents')} />

      {canEdit ? (
        <Button
          label={t('membership.documents.add')}
          variant="secondary"
          onPress={openAddModal}
          style={styles.actionButton}
        />
      ) : null}

      {documents.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>{t('membership.documents.emptyDescription')}</Text>
        </Card>
      ) : (
        documents.map(doc => (
          <Card key={doc.documentId} style={styles.card}>
            <MemberDetailRow
              label={t('membership.documents.typeLabel')}
              value={t(`membership.documents.types.${doc.documentType}`)}
            />
            <MemberDetailRow
              label={t('membership.documents.numberLabel')}
              value={doc.documentNumber}
            />
            <MemberDetailRow
              label={t('membership.documents.verificationLabel')}
              value={t(`membership.documents.verification.${doc.verificationStatus}`)}
            />
            <MemberDetailRow
              label={t('membership.documents.uploadedLabel')}
              value={formatDate(doc.uploadedAt)}
            />
            <MemberDetailRow
              label={t('membership.documents.fileLabel')}
              value={
                doc.fileUrl === PENDING_UPLOAD_FILE_URL
                  ? t('membership.documents.pendingUpload')
                  : doc.fileUrl
              }
              isLast
            />
            {canEdit ? (
              <Button
                label={t('membership.documents.deleteConfirm')}
                variant="ghost"
                onPress={() => confirmDelete(doc.documentId)}
                disabled={loading}
                style={styles.deleteButton}
              />
            ) : null}
          </Card>
        ))
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('membership.documents.add')}</Text>
            <DocumentTypePicker value={documentType} onChange={setDocumentType} />
            <FormInput
              label={t('membership.documents.numberLabel')}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder={t('membership.documents.numberPlaceholder')}
            />
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                label={t('common.save')}
                onPress={handleAdd}
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

/** @deprecated Use MemberDocumentsSection inside Profile tab */
export const MemberDocumentsTab = MemberDocumentsSection;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  deleteButton: {
    marginTop: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.md,
  },
  modalTitle: {
    ...typography.h2,
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
