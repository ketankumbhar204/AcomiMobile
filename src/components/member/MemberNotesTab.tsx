import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, FormInput, SkeletonCard } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type MemberNotesTabProps = {
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

export function MemberNotesTab({ memberId, canEdit }: MemberNotesTabProps) {
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
    console.log('[MemberNotesTab] first visit, load notes', memberId);
    void loadNotes(memberId);
  }, [loadNotes, memberId]);

  const handleAdd = async () => {
    if (!noteText.trim()) {
      setError(t('membership.notes.required'));
      return;
    }

    console.log('[MemberNotesTab] add note');
    const created = await addNote(memberId, { note: noteText.trim() });
    if (created) {
      showToast(t('membership.notes.successToast'));
      setNoteText('');
      setError(null);
    }
  };

  if (notesLoading && notes.length === 0) {
    return <SkeletonCard />;
  }

  return (
    <View>
      {canEdit ? (
        <View style={styles.compose}>
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
            onPress={handleAdd}
            disabled={loading}
            style={styles.actionButton}
          />
        </View>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          title={t('membership.notes.emptyTitle')}
          description={t('membership.notes.emptyDescription')}
          icon="📝"
        />
      ) : (
        <View style={styles.list}>
          {notes.map(note => (
            <View key={note.noteId} style={styles.card}>
              <Text style={styles.noteBody}>{note.note}</Text>
              <Text style={styles.noteMeta}>
                {t('membership.notes.meta', {
                  name: note.createdByName,
                  date: formatDate(note.createdAt),
                })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compose: {
    marginBottom: spacing.lg,
  },
  noteInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  noteBody: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  noteMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
