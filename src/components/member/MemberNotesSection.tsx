import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, FormInput, SkeletonCard } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { MemberDetailRow, MemberSectionTitle } from './MemberDetailRow';

type MemberNotesSectionProps = {
  memberId: string;
  canEdit: boolean;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function MemberNotesSection({ memberId, canEdit }: MemberNotesSectionProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const notes = useMemberStore(state => state.notes);
  const notesLoading = useMemberStore(state => state.notesLoading);
  const loading = useMemberStore(state => state.loading);
  const loadNotes = useMemberStore(state => state.loadNotes);
  const addNote = useMemberStore(state => state.addNote);

  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadNotes(memberId);
  }, [loadNotes, memberId]);

  const handleAdd = async () => {
    if (!noteText.trim()) {
      setError(t('membership.notes.required'));
      return;
    }

    const created = await addNote(memberId, { note: noteText.trim() });
    if (created) {
      showToast(t('membership.notes.successToast'));
      setNoteText('');
      setError(null);
    }
  };

  if (notesLoading && notes.length === 0) {
    return (
      <View style={styles.wrap}>
        <MemberSectionTitle title={t('membership.detailTabs.notes')} />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <MemberSectionTitle title={t('membership.detailTabs.notes')} />

      {canEdit ? (
        <Card style={styles.card}>
          <FormInput
            label={t('membership.notes.addLabel')}
            value={noteText}
            onChangeText={setNoteText}
            placeholder={t('membership.notes.placeholder')}
            multiline
            numberOfLines={3}
            style={styles.noteInput}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button
            label={t('membership.notes.add')}
            variant="secondary"
            onPress={handleAdd}
            disabled={loading}
            style={styles.actionButton}
          />
        </Card>
      ) : null}

      {notes.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>{t('membership.notes.emptyDescription')}</Text>
        </Card>
      ) : (
        notes.map(note => (
          <Card key={note.noteId} style={styles.card}>
            <MemberDetailRow label={t('membership.notes.addLabel')} value={note.note} />
            <MemberDetailRow label={t('membership.notes.authorLabel')} value={note.createdByName} />
            <MemberDetailRow
              label={t('membership.notes.dateLabel')}
              value={formatDate(note.createdAt)}
              isLast
            />
          </Card>
        ))
      )}
    </View>
  );
}

/** @deprecated Use MemberNotesSection inside Profile tab */
export const MemberNotesTab = MemberNotesSection;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.sm,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actionButton: {
    marginTop: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
