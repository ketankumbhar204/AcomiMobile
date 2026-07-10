import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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
import { complaintsApi } from '../../api/complaintsApi';
import type {
  ComplaintCategory,
  ComplaintPriority,
  MealType,
  SpaceType,
} from '../../api/types';
import { ApiError } from '../../api/types';
import { Button, FormInput, HeaderBackButton, ListFilterChips } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { categoriesForSpaceType } from '../../utils/complaintPermissions';
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

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(s => s.spaceId === spaceId)?.spaceType as SpaceType | undefined,
    [mySpaces, spaceId],
  );
  const categories = useMemo(() => categoriesForSpaceType(spaceType), [spaceType]);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('complaints.raiseTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t('complaints.fields.category')}</Text>
        <ListFilterChips
          options={categories.map(id => ({
            id,
            label: t(`complaints.category.${id}`),
          }))}
          value={category}
          onChange={setCategory}
        />

        <Text style={styles.label}>{t('complaints.fields.priority')}</Text>
        <ListFilterChips
          options={PRIORITIES.map(id => ({
            id,
            label: t(`complaints.priority.${id}`),
          }))}
          value={priority}
          onChange={setPriority}
        />

        <FormInput
          label={t('complaints.fields.title')}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          placeholder={t(`complaints.placeholders.subject.${category}`)}
        />
        <FormInput
          label={t('complaints.fields.description')}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          style={styles.multiline}
          placeholder={t(`complaints.placeholders.description.${category}`)}
        />

        {foodRelated ? (
          <>
            <FormInput
              label={t('complaints.fields.mealDate')}
              value={mealDate}
              onChangeText={setMealDate}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.label}>{t('complaints.fields.mealType')}</Text>
            <ListFilterChips
              options={MEAL_TYPES.map(id => ({
                id,
                label: t(`complaints.mealType.${id}`),
              }))}
              value={mealType ?? MEAL_TYPES[0]}
              onChange={value => setMealType(value)}
            />
          </>
        ) : null}

        <Text style={styles.label}>{t('complaints.fields.photos')}</Text>
        <View style={styles.photoRow}>
          {photos.map((uri, index) => (
            <Image key={`${index}`} source={{ uri }} style={styles.thumb} />
          ))}
          <Pressable onPress={onAddPhoto} style={styles.addPhoto}>
            <Text style={styles.addPhotoText}>+</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={t('complaints.submit')}
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.caption,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
  },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  addPhotoText: {
    ...typography.h2,
    color: colors.primary,
  },
  error: {
    ...typography.body,
    color: '#B91C1C',
    marginBottom: spacing.sm,
  },
});
