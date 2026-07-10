import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { complaintsApi } from '../../api/complaintsApi';
import type { ComplaintStatus } from '../../api/types';
import { ApiError } from '../../api/types';
import { Button, FormInput, HeaderBackButton, SkeletonCard } from '../../components/ui';
import {
  ComplaintCategoryBadge,
  ComplaintPriorityBadge,
  ComplaintStatusBadge,
} from '../../components/complaints';
import { useComplaintDetail } from '../../hooks/useComplaintDetail';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { canManageComplaints } from '../../utils/complaintPermissions';
import { formatComplaintDateTime } from '../../utils/complaintStatus';
import { pickPaymentProofImage } from '../../utils/pickPaymentProofImage';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ComplaintDetail'>;
type Route = NativeStackScreenProps<MainStackParamList, 'ComplaintDetail'>['route'];

export function ComplaintDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, complaintId } = route.params;
  const showToast = useToastStore(state => state.showToast);
  const permissions = useSpacePermissions(spaceId);
  const manage = canManageComplaints(permissions.membershipRole);

  const { complaint, setComplaint, loading, error, reload } = useComplaintDetail(
    spaceId,
    complaintId,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [comment, setComment] = useState('');
  const [internalNote, setInternalNote] = useState(false);
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('complaints.detailTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

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

  const runAction = async (action: () => Promise<void>, successKey: string) => {
    setBusy(true);
    try {
      await action();
      showToast(t(successKey));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('complaints.errors.action');
      showToast(message);
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = (status: ComplaintStatus) =>
    runAction(async () => {
      const updated = await complaintsApi.updateStatus(spaceId, complaintId, { status });
      setComplaint(updated);
    }, 'complaints.updated');

  if (loading && !complaint) {
    return (
      <View style={styles.pad}>
        <SkeletonCard />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.pad}>
        <Text style={styles.error}>{error ?? t('complaints.errors.load')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>{complaint.title}</Text>
      <View style={styles.badgeRow}>
        <ComplaintStatusBadge status={complaint.status} />
        <ComplaintPriorityBadge priority={complaint.priority} />
        <ComplaintCategoryBadge category={complaint.category} />
      </View>
      <Text style={styles.meta}>{formatComplaintDateTime(complaint.createdAt)}</Text>
      <Text style={styles.body}>{complaint.description}</Text>

      {complaint.mealDate || complaint.mealType ? (
        <Text style={styles.meta}>
          {t('complaints.fields.meal')}: {complaint.mealDate ?? '—'}{' '}
          {complaint.mealType ? t(`complaints.mealType.${complaint.mealType}`) : ''}
        </Text>
      ) : null}

      {complaint.resolutionSummary ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('complaints.fields.resolution')}</Text>
          <Text style={styles.body}>{complaint.resolutionSummary}</Text>
        </View>
      ) : null}

      {complaint.attachments && complaint.attachments.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('complaints.fields.photos')}</Text>
          <View style={styles.photoRow}>
            {complaint.attachments.map(att => (
              <Image key={att.attachmentId} source={{ uri: att.storageUrl }} style={styles.thumb} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('complaints.timeline')}</Text>
        {(complaint.timeline ?? []).map(event => (
          <View key={event.eventId} style={styles.timelineItem}>
            <Text style={styles.timelineType}>
              {t(`complaints.timelineEvent.${event.eventType}`)}
            </Text>
            {event.remarks ? <Text style={styles.meta}>{event.remarks}</Text> : null}
            <Text style={styles.meta}>{formatComplaintDateTime(event.performedAt)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('complaints.comments')}</Text>
        {(complaint.comments ?? []).map(c => (
          <View key={c.commentId} style={styles.comment}>
            <Text style={styles.commentAuthor}>
              {c.authorName ?? t('complaints.operator')}
              {c.internal ? ` · ${t('complaints.internal')}` : ''}
            </Text>
            <Text style={styles.body}>{c.body}</Text>
            <Text style={styles.meta}>{formatComplaintDateTime(c.createdAt)}</Text>
          </View>
        ))}
        <FormInput
          label={t('complaints.fields.comment')}
          value={comment}
          onChangeText={setComment}
          multiline
        />
        {manage ? (
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>{t('complaints.fields.internalNote')}</Text>
              <Text style={styles.switchHint}>
                {internalNote
                  ? t('complaints.hints.internalNoteOn')
                  : t('complaints.hints.internalNoteOff')}
              </Text>
            </View>
            <Switch
              value={internalNote}
              onValueChange={setInternalNote}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        ) : null}
        <Button
          label={t('complaints.actions.addComment')}
          loading={busy}
          disabled={busy || !comment.trim()}
          onPress={() =>
            runAction(async () => {
              const updated = await complaintsApi.addComment(spaceId, complaintId, {
                body: comment.trim(),
                internal: manage && internalNote,
              });
              setComplaint(updated);
              setComment('');
            }, 'complaints.commentAdded')
          }
        />
      </View>

      {manage ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('complaints.operatorActions')}</Text>
          <View style={styles.actions}>
            {complaint.status === 'OPEN' ? (
              <Button
                label={t('complaints.actions.start')}
                onPress={() => updateStatus('IN_PROGRESS')}
                disabled={busy}
              />
            ) : null}
            {complaint.status === 'OPEN' || complaint.status === 'IN_PROGRESS' ? (
              <>
                <FormInput
                  label={t('complaints.fields.resolution')}
                  value={resolution}
                  onChangeText={setResolution}
                  multiline
                />
                <Button
                  label={t('complaints.actions.resolve')}
                  disabled={busy || !resolution.trim()}
                  onPress={() =>
                    runAction(async () => {
                      const updated = await complaintsApi.updateResolution(
                        spaceId,
                        complaintId,
                        { resolutionSummary: resolution.trim(), markResolved: true },
                      );
                      setComplaint(updated);
                      setResolution('');
                    }, 'complaints.updated')
                  }
                />
                <Button
                  label={t('complaints.actions.cancel')}
                  variant="secondary"
                  disabled={busy}
                  onPress={() => updateStatus('CANCELLED')}
                />
              </>
            ) : null}
            {complaint.status === 'RESOLVED' ? (
              <Button
                label={t('complaints.actions.close')}
                disabled={busy}
                onPress={() => updateStatus('CLOSED')}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {complaint.canReopen ? (
        <Button
          label={t('complaints.actions.reopen')}
          variant="secondary"
          disabled={busy}
          onPress={() =>
            runAction(async () => {
              const updated = await complaintsApi.reopen(spaceId, complaintId);
              setComplaint(updated);
            }, 'complaints.reopened')
          }
        />
      ) : null}

      <Button
        label={t('complaints.actions.addPhoto')}
        variant="secondary"
        disabled={busy}
        onPress={() =>
          runAction(async () => {
            const image = await pickPaymentProofImage();
            if (!image) {
              return;
            }
            const updated = await complaintsApi.addAttachment(spaceId, complaintId, {
              imageBase64: image,
            });
            setComplaint(updated);
          }, 'complaints.updated')
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  pad: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { ...typography.h2 },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  meta: { ...typography.caption },
  body: { ...typography.body },
  section: {
    marginTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionTitle: { ...typography.h3 },
  timelineItem: { gap: 2, marginBottom: spacing.sm },
  timelineType: { ...typography.body, fontWeight: '600' },
  comment: { gap: 2, marginBottom: spacing.sm },
  commentAuthor: { ...typography.caption, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  switchHint: {
    ...typography.caption,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: { width: 88, height: 88, borderRadius: radius.sm },
  actions: { gap: spacing.sm },
  error: { ...typography.body, color: '#B91C1C' },
});
