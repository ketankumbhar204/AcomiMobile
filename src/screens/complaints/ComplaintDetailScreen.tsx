import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
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
import {
  BadgeCheck,
  CalendarDays,
  MessageCircle,
  MessageSquareWarning,
  TriangleAlert,
  UserCheck,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react-native';
import { complaintsApi } from '../../api/complaintsApi';
import type { ComplaintStatus } from '../../api/types';
import { ApiError } from '../../api/types';
import {
  ComplaintCategoryBadge,
  ComplaintPriorityBadge,
  ComplaintStatusBadge,
} from '../../components/complaints';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import { DashboardAvatar } from '../../components/dashboard/shared/DashboardPersonCard';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { StickyFormActions } from '../../components/progressive';
import {
  Button,
  EmptyState,
  FormInput,
  HeaderBackButton,
  SkeletonCard,
  Timeline,
  type TimelineGroup,
} from '../../components/ui';
import { useComplaintDetail } from '../../hooks/useComplaintDetail';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, shadows, spacing, typography } from '../../theme';
import { canManageComplaints } from '../../utils/complaintPermissions';
import { formatComplaintDateTime } from '../../utils/complaintStatus';
import {
  getComplaintTimelineAccent,
  getComplaintTimelineIcon,
} from '../../utils/complaintVisuals';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
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

  const headerLeft = useCallback(() => <HeaderBackButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('complaints.detailTitle'),
      headerBackVisible: false,
      headerLeft,
    });
  }, [headerLeft, navigation, t]);

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
      invalidateDashboardQueries();
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

  const hasStickyActions = useMemo(() => {
    if (!complaint) {
      return false;
    }
    if (complaint.canReopen) {
      return true;
    }
    if (!manage) {
      return false;
    }
    return (
      complaint.status === 'OPEN' ||
      complaint.status === 'IN_PROGRESS' ||
      complaint.status === 'RESOLVED'
    );
  }, [complaint, manage]);

  const timelineGroups = useMemo((): TimelineGroup[] => {
    const events = complaint?.timeline ?? [];
    if (events.length === 0) {
      return [];
    }
    return [
      {
        key: 'activity',
        label: t('complaints.timeline'),
        items: events.map(event => ({
          id: event.eventId,
          title: t(`complaints.timelineEvent.${event.eventType}`),
          meta: formatComplaintDateTime(event.performedAt),
          description: event.remarks ?? undefined,
          accent: getComplaintTimelineAccent(event.eventType),
          icon: getComplaintTimelineIcon(event.eventType),
        })),
      },
    ];
  }, [complaint?.timeline, t]);

  if (loading && !complaint) {
    return (
      <View style={styles.pad}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.pad}>
        <EmptyState
          Icon={TriangleAlert}
          title={t('complaints.errors.load')}
          description={error ?? undefined}
        />
        <Button label={t('common.retry', { defaultValue: 'Retry' })} onPress={reload} />
      </View>
    );
  }

  const showResolveStack =
    manage && (complaint.status === 'OPEN' || complaint.status === 'IN_PROGRESS');
  const comments = complaint.comments ?? [];
  const attachments = complaint.attachments ?? [];

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <MealFormHero
          icon={MessageSquareWarning}
          eyebrow={t(`complaints.category.${complaint.category}`)}
          heading={complaint.title}
          subheading={formatComplaintDateTime(complaint.createdAt)}
          accent="#B45309"
          soft={colors.warningTint}
          border="#FDE68A"
        />

        <View style={styles.sectionCard}>
          <View style={styles.badgeRow}>
            <ComplaintStatusBadge status={complaint.status} />
            <ComplaintPriorityBadge priority={complaint.priority} />
            <ComplaintCategoryBadge category={complaint.category} />
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <UserRound size={14} color={colors.muted} strokeWidth={2.2} />
              <View style={styles.metaTextWrap}>
                <Text style={styles.metaLabel}>
                  {t('complaints.fields.reporter', { defaultValue: 'Reporter' })}
                </Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {complaint.createdByMemberName ?? t('complaints.operator')}
                </Text>
              </View>
            </View>
            <View style={styles.metaItem}>
              <UserCheck size={14} color={colors.muted} strokeWidth={2.2} />
              <View style={styles.metaTextWrap}>
                <Text style={styles.metaLabel}>
                  {t('complaints.fields.assigned', { defaultValue: 'Assigned' })}
                </Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {complaint.assignedToName?.trim() ||
                    t('complaints.unassigned', { defaultValue: 'Unassigned' })}
                </Text>
              </View>
            </View>
            <View style={styles.metaItem}>
              <CalendarDays size={14} color={colors.muted} strokeWidth={2.2} />
              <View style={styles.metaTextWrap}>
                <Text style={styles.metaLabel}>
                  {t('complaints.fields.updated', { defaultValue: 'Updated' })}
                </Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {formatComplaintDateTime(complaint.updatedAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <DashboardSectionTitle
            title={t('complaints.fields.description')}
          />
          <Text style={styles.body}>{complaint.description}</Text>
          {complaint.mealDate || complaint.mealType ? (
            <View style={styles.mealChip}>
              <UtensilsCrossed size={14} color="#B45309" strokeWidth={2.2} />
              <Text style={styles.mealChipText}>
                {t('complaints.fields.meal')}: {complaint.mealDate ?? '—'}
                {complaint.mealType
                  ? ` · ${t(`complaints.mealType.${complaint.mealType}`)}`
                  : ''}
              </Text>
            </View>
          ) : null}
        </View>

        {complaint.resolutionSummary ? (
          <View style={[styles.sectionCard, styles.resolutionCard]}>
            <DashboardSectionTitle title={t('complaints.fields.resolution')} />
            <View style={styles.resolutionRow}>
              <BadgeCheck size={16} color="#059669" strokeWidth={2.2} />
              <Text style={[styles.body, styles.resolutionText]}>
                {complaint.resolutionSummary}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <DashboardSectionTitle title={t('complaints.fields.photos')} />
          {attachments.length > 0 ? (
            <View style={styles.photoRow}>
              {attachments.map(att => (
                <Image
                  key={att.attachmentId}
                  source={{ uri: att.storageUrl }}
                  style={styles.thumb}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>
              {t('complaints.photos.empty', { defaultValue: 'No photos attached yet.' })}
            </Text>
          )}
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
        </View>

        <View style={styles.sectionCard}>
          {timelineGroups.length > 0 ? (
            <Timeline groups={timelineGroups} />
          ) : (
            <>
              <DashboardSectionTitle title={t('complaints.timeline')} />
              <Text style={styles.muted}>
                {t('complaints.timelineEmpty', {
                  defaultValue: 'Activity will appear here as the issue progresses.',
                })}
              </Text>
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <DashboardSectionTitle title={t('complaints.comments')} />
          {comments.length === 0 ? (
            <Text style={styles.muted}>
              {t('complaints.commentsEmpty', {
                defaultValue: 'No comments yet. Add an update below.',
              })}
            </Text>
          ) : (
            comments.map(c => (
              <View key={c.commentId} style={styles.commentCard}>
                <DashboardAvatar label={c.authorName ?? t('complaints.operator')} />
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor} numberOfLines={1}>
                      {c.authorName ?? t('complaints.operator')}
                    </Text>
                    {c.internal ? (
                      <View style={styles.internalChip}>
                        <Text style={styles.internalChipText}>{t('complaints.internal')}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.body}>{c.body}</Text>
                  <Text style={styles.muted}>{formatComplaintDateTime(c.createdAt)}</Text>
                </View>
              </View>
            ))
          )}

          <FormInput
            label={t('complaints.fields.comment')}
            value={comment}
            onChangeText={setComment}
            multiline
            leadingIcon={MessageCircle}
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
      </ScrollView>

      {hasStickyActions ? (
        <StickyFormActions>
          <View style={styles.stickyStack}>
            {complaint.status === 'OPEN' ? (
              <Button
                label={t('complaints.actions.start')}
                onPress={() => updateStatus('IN_PROGRESS')}
                disabled={busy}
              />
            ) : null}
            {showResolveStack ? (
              <>
                <FormInput
                  label={t('complaints.fields.resolution')}
                  value={resolution}
                  onChangeText={setResolution}
                  multiline
                  leadingIcon={BadgeCheck}
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
          </View>
        </StickyFormActions>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  pad: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaGrid: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
  },
  muted: {
    ...typography.caption,
    color: colors.muted,
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  mealChipText: {
    ...typography.caption,
    color: '#B45309',
    fontWeight: '600',
  },
  resolutionCard: {
    borderColor: '#A7F3D0',
    backgroundColor: colors.successTint,
  },
  resolutionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  resolutionText: {
    flex: 1,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commentAuthor: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  internalChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  internalChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
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
  stickyStack: { gap: spacing.sm },
});
