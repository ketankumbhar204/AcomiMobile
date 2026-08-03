import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AlignLeft,
  CalendarDays,
  CirclePlus,
  ImagePlus,
  MessageSquareWarning,
  Type,
  UtensilsCrossed,
  Wrench,
  X,
} from 'lucide-react-native';
import { complaintsApi } from '../../api/complaintsApi';
import type {
  ComplaintCategory,
  ComplaintPriority,
  MealType,
  SpaceType,
} from '../../api/types';
import { ApiError } from '../../api/types';
import {
  ComplaintCategoryPicker,
  ComplaintPriorityPicker,
  ComplaintSelectionSummary,
} from '../../components/complaints';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { FormInput, HeaderBackButton, ListFilterChips } from '../../components/ui';
import {
  ProgressiveWorkflowFooter,
  StickyFormActions,
  progressiveSectionHighlightStyle,
} from '../../components/progressive';
import { useProgressiveSectionReview } from '../../hooks/useProgressiveSectionReview';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { resolveProgressivePhase } from '../../utils/progressivePhase';
import { colors, shadows, spacing, typography } from '../../theme';
import { categoriesForSpaceType } from '../../utils/complaintPermissions';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import { pickPaymentProofImage } from '../../utils/pickPaymentProofImage';

type Nav = NativeStackNavigationProp<MainStackParamList, 'RaiseComplaint'>;
type Route = NativeStackScreenProps<MainStackParamList, 'RaiseComplaint'>['route'];

const PRIORITIES: ComplaintPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

export function RaiseComplaintScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const showToast = useToastStore(state => state.showToast);
  const scrollRef = useRef<ScrollView>(null);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = React.useMemo(
    () => mySpaces.find(s => s.spaceId === spaceId)?.spaceType as SpaceType | undefined,
    [mySpaces, spaceId],
  );
  const categories = React.useMemo(() => categoriesForSpaceType(spaceType), [spaceType]);

  const [category, setCategory] = useState<ComplaintCategory>(categories[0] ?? 'OTHER');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mealDate, setMealDate] = useState('');
  const [mealType, setMealType] = useState<MealType | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const foodRelated =
    category === 'FOOD' || category === 'FOOD_QUALITY' || category === 'FOOD_SERVICE';

  const detailsComplete = Boolean(title.trim() && description.trim());
  const progressiveEnabled = detailsComplete;

  const {
    reviewed: photosReviewed,
    highlighted: photosHighlighted,
    onSectionLayout: onPhotosLayout,
    onScroll: onPhotosScroll,
    onScrollBeginDrag: onPhotosScrollBeginDrag,
    continueToSection: continueToPhotos,
    clearReviewed: clearPhotosReviewed,
  } = useProgressiveSectionReview({
    enabled: progressiveEnabled,
  });

  React.useEffect(() => {
    if (!detailsComplete) {
      clearPhotosReviewed();
    }
  }, [clearPhotosReviewed, detailsComplete]);

  const progressivePhase = resolveProgressivePhase({
    enabled: progressiveEnabled,
    prerequisiteMet: true,
    sectionReviewed: photosReviewed,
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    onPhotosScroll(contentOffset.y, layoutMeasurement.height);
  };

  const headerLeft = useCallback(() => <HeaderBackButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('complaints.raiseTitle'),
      headerBackVisible: false,
      headerLeft,
    });
  }, [headerLeft, navigation, t]);

  const onAddPhoto = async () => {
    if (photos.length >= 5) {
      showToast(t('complaints.errors.maxPhotos'));
      return;
    }
    const image = await pickPaymentProofImage();
    if (image) {
      setPhotos(prev => [...prev, image]);
    }
  };

  const onRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async () => {
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError(t('complaints.errors.requiredFields'));
      return;
    }
    setSubmitting(true);
    try {
      const created = await complaintsApi.create(spaceId, {
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        mealDate: foodRelated && mealDate.trim() ? mealDate.trim() : undefined,
        mealType: foodRelated ? mealType ?? 'BREAKFAST' : undefined,
        attachmentImagesBase64: photos.length > 0 ? photos : undefined,
      });
      showToast(t('complaints.created'));
      invalidateDashboardQueries();
      navigation.replace('ComplaintDetail', {
        spaceId,
        complaintId: created.complaintId,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('complaints.errors.create');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = React.useMemo(
    () =>
      categories.map(id => ({
        id,
        label: t(`complaints.category.${id}`),
      })),
    [categories, t],
  );

  const priorityOptions = React.useMemo(
    () =>
      PRIORITIES.map(id => ({
        id,
        label: t(`complaints.priority.${id}`),
        description: t(`complaints.priorityHint.${id}`, {
          defaultValue:
            id === 'LOW'
              ? 'Minor issue'
              : id === 'MEDIUM'
                ? 'Needs attention'
                : id === 'HIGH'
                  ? 'Resolve soon'
                  : 'Immediate action',
        }),
      })),
    [t],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScrollBeginDrag={progressiveEnabled ? onPhotosScrollBeginDrag : undefined}
          onScroll={progressiveEnabled ? handleScroll : undefined}>
          <MealFormHero
            icon={CirclePlus}
            eyebrow={t('complaints.raiseHero.eyebrow', { defaultValue: 'New issue' })}
            heading={t('complaints.raiseTitle')}
            subheading={t('complaints.raiseHero.subheading', {
              defaultValue: 'Describe the issue, set priority, and attach photos.',
            })}
            accent="#B45309"
            soft={colors.warningTint}
            border="#FDE68A"
            compact
          />

          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>
              {t('progressiveWorkflow.raiseComplaint.detailsTitle')}
            </Text>
            <ComplaintCategoryPicker
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              TitleIcon={Wrench}
              title={t('complaints.fields.categorySection', {
                defaultValue: 'Category',
              })}
              helper={t('complaints.fields.categoryHelper', {
                defaultValue: 'Choose the issue type',
              })}
            />

            <ComplaintPriorityPicker
              options={priorityOptions}
              value={priority}
              onChange={setPriority}
              title={t('complaints.fields.prioritySection', {
                defaultValue: 'Priority',
              })}
              helper={t('complaints.fields.priorityHelper', {
                defaultValue: 'How urgent is this issue?',
              })}
            />

            <FormInput
              label={t('complaints.fields.title')}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              placeholder={t(`complaints.placeholders.subject.${category}`)}
              leadingIcon={Type}
            />
            <FormInput
              label={t('complaints.fields.description')}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              style={styles.multiline}
              placeholder={t(`complaints.placeholders.description.${category}`)}
              leadingIcon={AlignLeft}
            />
          </View>

          {foodRelated ? (
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>
                {t('progressiveWorkflow.raiseComplaint.contextTitle')}
              </Text>
              <FormInput
                label={t('complaints.fields.mealDate')}
                value={mealDate}
                onChangeText={setMealDate}
                placeholder="YYYY-MM-DD"
                leadingIcon={CalendarDays}
              />
              <View style={styles.fieldBlock}>
                <View style={styles.fieldLabelRow}>
                  <UtensilsCrossed size={14} color="#B45309" strokeWidth={2.2} />
                  <Text style={styles.label}>{t('complaints.fields.mealType')}</Text>
                </View>
                <ListFilterChips
                  options={MEAL_TYPES.map(id => ({
                    id,
                    label: t(`complaints.mealType.${id}`),
                  }))}
                  value={mealType ?? MEAL_TYPES[0]}
                  onChange={value => setMealType(value)}
                />
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.sectionCard,
              photosHighlighted && styles.photosHighlight,
            ]}
            onLayout={event => {
              onPhotosLayout(event.nativeEvent.layout.y, event.nativeEvent.layout.height);
            }}>
            <View style={styles.photosHeader}>
              <Text style={styles.cardTitle}>
                {t('progressiveWorkflow.raiseComplaint.photosTitle')}
              </Text>
              <Text style={styles.helper}>
                {t('complaints.photos.helper', {
                  defaultValue: 'Add up to 5 photos so the team can act faster.',
                })}
              </Text>
            </View>
            <View style={styles.photoRow}>
              {photos.map((uri, index) => (
                <View key={`${index}`} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <Pressable
                    onPress={() => onRemovePhoto(index)}
                    style={styles.removeThumb}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.remove', { defaultValue: 'Remove' })}>
                    <X size={12} color={colors.white} strokeWidth={2.6} />
                  </Pressable>
                </View>
              ))}
              {photos.length < 5 ? (
                <Pressable
                  onPress={onAddPhoto}
                  style={({ pressed }) => [
                    styles.addPhoto,
                    pressed && styles.addPhotoPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('complaints.actions.addPhoto')}>
                  <ImagePlus size={20} color="#B45309" strokeWidth={2.2} />
                  <Text style={styles.addPhotoText}>
                    {t('complaints.actions.addPhoto')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {detailsComplete ? (
            <ComplaintSelectionSummary
              title={t('complaints.summary.title', {
                defaultValue: 'Complaint Summary',
              })}
              categoryCaption={t('complaints.fields.category')}
              priorityCaption={t('complaints.fields.priority')}
              category={category}
              priority={priority}
              categoryLabel={t(`complaints.category.${category}`)}
              priorityLabel={t(`complaints.priority.${priority}`)}
            />
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <MessageSquareWarning size={16} color="#B91C1C" strokeWidth={2.2} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        {progressiveEnabled ? (
          <ProgressiveWorkflowFooter
            phase={progressivePhase}
            stepLabel={t('progressiveWorkflow.stepOf', {
              current: progressivePhase === 'continue' ? 1 : 2,
              total: 2,
            })}
            progressLine={
              progressivePhase === 'continue'
                ? t('progressiveWorkflow.raiseComplaint.progressDetailsNext')
                : t('progressiveWorkflow.raiseComplaint.progressReady')
            }
            continueEyebrow={t('progressiveWorkflow.nextStep')}
            continueTitle={t('progressiveWorkflow.raiseComplaint.reviewPhotosTitle')}
            continueHint={t('progressiveWorkflow.raiseComplaint.reviewPhotosHint')}
            continueLabel={t('progressiveWorkflow.raiseComplaint.continueToPhotos')}
            onContinue={() => continueToPhotos(scrollRef)}
            primaryAction={{
              label: t('complaints.submit'),
              onPress: onSubmit,
              loading: submitting,
              disabled: submitting,
            }}
          />
        ) : (
          <StickyFormActions
            primary={{
              label: t('complaints.submit'),
              onPress: onSubmit,
              loading: submitting,
              disabled: submitting,
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardTitle: {
    ...typography.h3,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  photosHeader: {
    gap: 2,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  helper: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  photosHighlight: {
    ...progressiveSectionHighlightStyle,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  removeThumb: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 108,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.warningTint,
    paddingHorizontal: spacing.sm,
  },
  addPhotoPressed: {
    backgroundColor: '#FEF3C7',
  },
  addPhotoText: {
    ...typography.caption,
    fontWeight: '600',
    color: '#B45309',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    ...typography.body,
    flex: 1,
    color: '#B91C1C',
  },
});
