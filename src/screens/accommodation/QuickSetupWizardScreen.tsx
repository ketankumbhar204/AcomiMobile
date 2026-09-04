import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Hash, Tag, Type } from 'lucide-react-native';
import type {
  AccommodationSetupPreviewResponse,
  AccommodationSetupRequest,
  PgHostelSetupConfig,
  PropertyLayoutMode,
  RoomType,
  SpaceType,
  UnitSetupConfig,
} from '../../api/types';
import {
  AccommodationFormHero,
  PropertyLayoutModePicker,
  RoomTypePicker,
  SetupStructureEditor,
  executeSetupStructure,
} from '../../components/accommodation';
import { expandToEditableStructure } from '../../components/accommodation/setup-preview/setupStructureModel';
import type { EditableSetupStructure } from '../../components/accommodation/setup-preview/setupStructureTypes';
import { StickyFormActions } from '../../components/progressive';
import { FormInput, HeaderBackButton } from '../../components/ui';
import { useQuickSetup } from '../../hooks/useQuickSetup';
import { accommodationApi } from '../../api/accommodationApi';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  buildSetupRequest,
  validateCoLivingSetup,
  validatePgHostelSetup,
  validateRentalSetup,
} from '../../utils/accommodationSetup';
import { computeSetupBedTotal } from '../../utils/accommodationLimits';
import { defaultLayoutModeForSpaceType } from '../../utils/accommodationProfile';
import {
  getLayoutModeLabelKey,
  isLayoutModeSelectable,
  layoutModesForSpaceType,
} from '../../utils/propertyLayoutMode';

type Nav = NativeStackNavigationProp<MainStackParamList, 'QuickSetupWizard'>;
type Route = NativeStackScreenProps<MainStackParamList, 'QuickSetupWizard'>['route'];

type WizardStep = 'building' | 'structure' | 'rooms' | 'preview';

function getSteps(spaceType: SpaceType): WizardStep[] {
  if (spaceType === 'PG' || spaceType === 'HOSTEL') {
    return ['building', 'structure', 'rooms', 'preview'];
  }
  if (spaceType === 'CO_LIVING') {
    return ['building', 'structure', 'rooms', 'preview'];
  }
  return ['building', 'structure', 'preview'];
}

export function QuickSetupWizardScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType as SpaceType | undefined,
    [mySpaces, spaceId],
  );

  const steps = useMemo(() => (spaceType ? getSteps(spaceType) : []), [spaceType]);
  const pgLayoutModes = useMemo(
    () => (spaceType ? layoutModesForSpaceType(spaceType) : []),
    [spaceType],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const [buildingCode, setBuildingCode] = useState('');
  const [buildingNameError, setBuildingNameError] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<PropertyLayoutMode>('CORRIDOR_PG');
  const [floorCount, setFloorCount] = useState('3');
  const [includeGroundFloor, setIncludeGroundFloor] = useState(false);
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState('4');

  const [unitCount, setUnitCount] = useState('10');
  const [startNumber, setStartNumber] = useState('101');
  const [numberingStep, setNumberingStep] = useState('1');

  const [roomsPerParent, setRoomsPerParent] = useState('4');
  const [bedsPerRoom, setBedsPerRoom] = useState('3');
  const [roomType, setRoomType] = useState<RoomType | null>('SHARED');

  const [stepError, setStepError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AccommodationSetupPreviewResponse | null>(null);
  const [editableStructure, setEditableStructure] = useState<EditableSetupStructure | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checkingBuilding, setCheckingBuilding] = useState(false);
  const generatingRef = useRef(false);
  const checkingBuildingRef = useRef(false);

  const currentStep = steps[stepIndex] ?? 'building';
  const isApartmentPg = layoutMode === 'APARTMENT_PG';
  const isPgHostel = spaceType === 'PG' || spaceType === 'HOSTEL';

  // Auto-set layout for non-PG types only — never reset a PG layout the user picked.
  useEffect(() => {
    if (!spaceType || isLayoutModeSelectable(spaceType)) {
      return;
    }
    setLayoutMode(defaultLayoutModeForSpaceType(spaceType));
  }, [spaceType]);

  const bedsPerRoomCount = Number(bedsPerRoom) || 1;
  const isRental = spaceType === 'RENTAL';
  const expandConfig = useMemo(
    () => ({
      roomsPerParent: isRental ? 0 : Number(roomsPerParent) || 1,
      bedsPerRoom: isRental ? 0 : bedsPerRoomCount,
      // Capacity tracks beds so API/validation stay valid without a separate UI field.
      capacityPerRoom: isRental ? 0 : bedsPerRoomCount,
      includeGroundFloor,
      groundFloorName: t('accommodation.setup.groundFloorName'),
      floorNameTemplate: t('accommodation.setup.floorNameNumber'),
    }),
    [bedsPerRoomCount, includeGroundFloor, isRental, roomsPerParent, t],
  );

  const buildExpandConfig = useCallback(() => {
    if (!spaceType) {
      return null;
    }
    return {
      buildingName: buildingName.trim(),
      buildingCode: buildingCode.trim(),
      layoutMode,
      spaceType,
      roomType: roomType ?? 'SHARED',
      ...expandConfig,
    };
  }, [
    buildingCode,
    buildingName,
    expandConfig,
    layoutMode,
    roomType,
    spaceType,
  ]);

  const { preview: previewSetup, loading, error, setError } = useQuickSetup(spaceId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('accommodation.setup.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  const buildRequest = useCallback((): AccommodationSetupRequest | null => {
    if (!spaceType) {
      return null;
    }

    const building = {
      name: buildingName.trim(),
      code: buildingCode.trim() || undefined,
    };

    if (spaceType === 'PG' || spaceType === 'HOSTEL') {
      const floors: PgHostelSetupConfig = {
        count: Number(floorCount),
        includeGroundFloor,
        apartmentsPerFloor: isApartmentPg ? Number(apartmentsPerFloor) : undefined,
        roomsPerFloor: Number(roomsPerParent),
        bedsPerRoom: Number(bedsPerRoom),
        defaultRoomType: roomType ?? 'SHARED',
        capacityPerRoom: Number(bedsPerRoom),
      };
      return buildSetupRequest(spaceType, building, floors, undefined, layoutMode);
    }

    const units: UnitSetupConfig = {
      count: Number(unitCount),
      startNumber: startNumber.trim() || '101',
    };

    if (spaceType === 'CO_LIVING') {
      units.numberingStep = Number(numberingStep) || 1;
      units.roomsPerUnit = Number(roomsPerParent);
      units.bedsPerRoom = Number(bedsPerRoom);
      units.defaultRoomType = roomType ?? 'SHARED';
      units.capacityPerRoom = Number(bedsPerRoom);
    }

    return buildSetupRequest(spaceType, building, undefined, units);
  }, [
    apartmentsPerFloor,
    bedsPerRoom,
    buildingCode,
    buildingName,
    floorCount,
    includeGroundFloor,
    isApartmentPg,
    layoutMode,
    numberingStep,
    roomType,
    roomsPerParent,
    spaceType,
    startNumber,
    unitCount,
  ]);

  async function validateBuildingStep(): Promise<boolean> {
    if (!buildingName.trim()) {
      setBuildingNameError(t('accommodation.buildings.nameRequired'));
      return false;
    }
    try {
      const result = await accommodationApi.checkBuildingAvailability(spaceId, buildingName.trim());
      if (!result.nameAvailable) {
        setBuildingNameError(
          result.message || t('accommodation.setup.buildingNameTaken'),
        );
        return false;
      }
    } catch (error) {
      setBuildingNameError(getAccommodationErrorMessage(error, 'accommodation.setup.errors.preview'));
      return false;
    }
    setBuildingNameError(null);
    return true;
  }

  function validateStructureStep(): boolean {
    if (!spaceType) {
      return false;
    }

    if (spaceType === 'PG' || spaceType === 'HOSTEL') {
      const count = Number(floorCount);
      if (count < 1 || count > 20) {
        setStepError(t('accommodation.setup.errors.floorCount'));
        return false;
      }
      if (isApartmentPg) {
        const apartments = Number(apartmentsPerFloor);
        if (apartments < 1) {
          setStepError(t('accommodation.setup.errors.apartmentsPerFloor'));
          return false;
        }
      }
    } else if (spaceType === 'CO_LIVING') {
      const count = Number(unitCount);
      if (count < 1) {
        setStepError(t('accommodation.setup.errors.unitCount'));
        return false;
      }
    } else {
      const units: UnitSetupConfig = {
        count: Number(unitCount),
        startNumber: startNumber.trim() || '101',
      };
      const err = validateRentalSetup(units);
      if (err) {
        setStepError(t(err));
        return false;
      }
    }

    setStepError(null);
    return true;
  }

  function validateRoomsStep(): boolean {
    if (!spaceType) {
      return false;
    }

    if (!roomType) {
      setStepError(t('accommodation.roomType.required'));
      return false;
    }

    if (spaceType === 'PG' || spaceType === 'HOSTEL') {
      const floors: PgHostelSetupConfig = {
        count: Number(floorCount),
        includeGroundFloor,
        apartmentsPerFloor: isApartmentPg ? Number(apartmentsPerFloor) : undefined,
        roomsPerFloor: Number(roomsPerParent),
        bedsPerRoom: Number(bedsPerRoom),
        defaultRoomType: roomType,
        capacityPerRoom: Number(bedsPerRoom),
      };
      const err = validatePgHostelSetup(floors, layoutMode);
      if (err) {
        setStepError(t(err));
        return false;
      }
    } else if (spaceType === 'CO_LIVING') {
      const units: UnitSetupConfig = {
        count: Number(unitCount),
        startNumber: startNumber.trim() || '101',
        numberingStep: Number(numberingStep) || 1,
        roomsPerUnit: Number(roomsPerParent),
        bedsPerRoom: Number(bedsPerRoom),
        defaultRoomType: roomType,
        capacityPerRoom: Number(bedsPerRoom),
      };
      const err = validateCoLivingSetup(units);
      if (err) {
        setStepError(t(err));
        return false;
      }
    }

    setStepError(null);
    return true;
  }

  async function goNext() {
    Keyboard.dismiss();
    setStepError(null);
    setError(null);

    if (currentStep === 'building') {
      if (checkingBuildingRef.current) {
        return;
      }
      checkingBuildingRef.current = true;
      setCheckingBuilding(true);
      try {
        const available = await validateBuildingStep();
        if (!available) {
          return;
        }
        setStepIndex(index => Math.min(index + 1, steps.length - 1));
      } finally {
        checkingBuildingRef.current = false;
        setCheckingBuilding(false);
      }
      return;
    }

    if (currentStep === 'structure') {
      if (!validateStructureStep()) {
        return;
      }
      if (spaceType === 'RENTAL') {
        await loadPreview();
        return;
      }
      setStepIndex(index => Math.min(index + 1, steps.length - 1));
      return;
    }

    if (currentStep === 'rooms') {
      if (!validateRoomsStep()) {
        return;
      }
      await loadPreview();
    }
  }

  async function loadPreview() {
    const body = buildRequest();
    if (!body) {
      return;
    }

    const result = await previewSetup(body);
    if (result) {
      const config = buildExpandConfig();
      if (config) {
        setEditableStructure(expandToEditableStructure(result.sample, result.totals, config));
      }
      setPreview(result);
      setStepIndex(steps.indexOf('preview'));
    }
  }

  async function handleGenerate() {
    if (!editableStructure || !spaceType || generatingRef.current) {
      return;
    }

    if (!editableStructure.building.name.trim()) {
      setStepError(t('accommodation.buildings.nameRequired'));
      return;
    }

    setStepError(null);
    setError(null);
    generatingRef.current = true;
    setGenerating(true);

    try {
      const result = await executeSetupStructure(spaceId, editableStructure);
      showToast(
        t('accommodation.setup.success', {
          beds: result.totals.beds,
          name: editableStructure.building.name.trim(),
        }),
      );
      navigation.replace('AccommodationBuilder', {
        spaceId,
        buildingId: result.buildingId,
      });
    } catch (generateError) {
      console.error('[QuickSetupWizard] generate structure failed', generateError);
      setError(getAccommodationErrorMessage(generateError, 'accommodation.setup.errors.generate'));
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  }

  function goBack() {
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setStepError(null);
    setError(null);
    if (currentStep === 'preview') {
      setPreview(null);
      setEditableStructure(null);
    }
    setStepIndex(index => Math.max(index - 1, 0));
  }

  const estimatedBeds = useMemo(() => {
    if (!spaceType) {
      return 0;
    }
    if (spaceType === 'PG' || spaceType === 'HOSTEL') {
      return computeSetupBedTotal({
        floors: Number(floorCount) || 0,
        apartmentsPerFloor: isApartmentPg ? Number(apartmentsPerFloor) || 0 : 1,
        roomsPerFloor: Number(roomsPerParent) || 0,
        bedsPerRoom: Number(bedsPerRoom) || 0,
      });
    }
    if (spaceType === 'CO_LIVING') {
      return computeSetupBedTotal({
        units: Number(unitCount) || 0,
        roomsPerUnit: Number(roomsPerParent) || 0,
        bedsPerRoom: Number(bedsPerRoom) || 0,
      });
    }
    return 0;
  }, [apartmentsPerFloor, bedsPerRoom, floorCount, isApartmentPg, roomsPerParent, spaceType, unitCount]);

  if (!spaceType || spaceType === 'MESS') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('accommodation.setup.notApplicable')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          showsVerticalScrollIndicator>

          {stepIndex === 0 ? (
            <AccommodationFormHero
              level="building"
              eyebrow={t('accommodation.setup.formEyebrow')}
              heading={t('accommodation.setup.formHeading')}
              subheading={t('accommodation.setup.formSubheading')}
            />
          ) : null}

          {currentStep !== 'preview' ? (
            <Text style={styles.stepLabel}>
              {t('accommodation.setup.step', {
                current: stepIndex + 1,
                total: steps.length,
              })}
            </Text>
          ) : null}

          {currentStep === 'building' ? (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>{t('accommodation.setup.buildingStep')}</Text>
              <FormInput
                label={t('accommodation.fields.name')}
                value={buildingName}
                onChangeText={text => {
                  setBuildingName(text);
                  setBuildingNameError(null);
                }}
                onBlur={() => {
                  if (buildingName.trim()) {
                    void validateBuildingStep();
                  }
                }}
                placeholder={t('accommodation.buildings.namePlaceholder')}
                error={buildingNameError}
                leadingIcon={Type}
              />
              <FormInput
                label={t('accommodation.fields.code')}
                value={buildingCode}
                onChangeText={setBuildingCode}
                placeholder={t('accommodation.buildings.codePlaceholder')}
                leadingIcon={Tag}
              />
              {spaceType && isLayoutModeSelectable(spaceType) ? (
                <PropertyLayoutModePicker
                  value={layoutMode}
                  onChange={setLayoutMode}
                  options={pgLayoutModes}
                />
              ) : null}
            </View>
          ) : null}

          {isPgHostel && currentStep !== 'building' && currentStep !== 'preview' ? (
            <Text style={styles.layoutReminder}>
              {t('accommodation.setup.selectedLayout', {
                layout: t(getLayoutModeLabelKey(layoutMode)),
              })}
            </Text>
          ) : null}

          {currentStep === 'structure' && isPgHostel ? (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>
                {isApartmentPg
                  ? t('accommodation.setup.floorsAndApartmentsStep')
                  : t('accommodation.setup.floorsStep')}
              </Text>
              {isApartmentPg ? (
                <Text style={styles.stepHint}>{t('accommodation.setup.apartmentPgStructureHint')}</Text>
              ) : null}
              <FormInput
                label={t('accommodation.setup.floorCount')}
                value={floorCount}
                onChangeText={setFloorCount}
                keyboardType="number-pad"
                leadingIcon={Hash}
              />
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleLabel}>{t('accommodation.setup.includeGroundFloor')}</Text>
                  <Text style={styles.toggleHint}>{t('accommodation.setup.includeGroundFloorHint')}</Text>
                </View>
                <Switch
                  value={includeGroundFloor}
                  onValueChange={setIncludeGroundFloor}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.border}
                  accessibilityLabel={t('accommodation.setup.includeGroundFloor')}
                />
              </View>
              {isApartmentPg ? (
                <FormInput
                  label={t('accommodation.setup.apartmentsPerFloor')}
                  value={apartmentsPerFloor}
                  onChangeText={setApartmentsPerFloor}
                  keyboardType="number-pad"
                  leadingIcon={Hash}
                />
              ) : null}
            </View>
          ) : null}

          {currentStep === 'structure' && (spaceType === 'CO_LIVING' || spaceType === 'RENTAL') ? (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>{t('accommodation.setup.unitsStep')}</Text>
              <FormInput
                label={t('accommodation.setup.unitCount')}
                value={unitCount}
                onChangeText={setUnitCount}
                keyboardType="number-pad"
                leadingIcon={Hash}
              />
              <FormInput
                label={t('accommodation.setup.startNumber')}
                value={startNumber}
                onChangeText={setStartNumber}
                leadingIcon={Hash}
              />
              {spaceType === 'CO_LIVING' ? (
                <FormInput
                  label={t('accommodation.setup.numberingStep')}
                  value={numberingStep}
                  onChangeText={setNumberingStep}
                  keyboardType="number-pad"
                  leadingIcon={Hash}
                />
              ) : null}
            </View>
          ) : null}

          {currentStep === 'rooms' ? (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>
                {isApartmentPg
                  ? t('accommodation.setup.roomsAndBedsApartmentStep')
                  : t('accommodation.setup.roomsStep')}
              </Text>
              {isApartmentPg ? (
                <Text style={styles.stepHint}>{t('accommodation.setup.apartmentPgRoomsHint')}</Text>
              ) : null}
              <FormInput
                label={
                  spaceType === 'CO_LIVING'
                    ? t('accommodation.setup.roomsPerUnit')
                    : isApartmentPg
                      ? t('accommodation.setup.roomsPerApartment')
                      : t('accommodation.setup.roomsPerFloor')
                }
                value={roomsPerParent}
                onChangeText={setRoomsPerParent}
                keyboardType="number-pad"
                leadingIcon={Hash}
              />
              <FormInput
                label={t('accommodation.setup.bedsPerRoom')}
                value={bedsPerRoom}
                onChangeText={setBedsPerRoom}
                keyboardType="number-pad"
                leadingIcon={Hash}
              />
              <RoomTypePicker value={roomType} onChange={setRoomType} />
              {estimatedBeds > 0 ? (
                <Text style={styles.estimate}>
                  {t('accommodation.setup.estimatedBeds', { count: estimatedBeds })}
                </Text>
              ) : null}
            </View>
          ) : null}

          {currentStep === 'preview' && preview && editableStructure ? (
            <View>
              <SetupStructureEditor
                structure={editableStructure}
                onChange={setEditableStructure}
                expandConfig={expandConfig}
                stepLabel={t('accommodation.setup.step', {
                  current: stepIndex + 1,
                  total: steps.length,
                })}
                layoutModeLabel={
                  spaceType && isLayoutModeSelectable(spaceType)
                    ? t(getLayoutModeLabelKey(layoutMode))
                    : undefined
                }
              />
              {generating ? (
                <Text style={styles.creatingText}>{t('accommodation.setup.creatingLayout')}</Text>
              ) : null}
              {preview.warnings.length > 0 ? (
                <View style={styles.warnings}>
                  {preview.warnings.map((warning, index) => (
                    <Text key={`${warning}-${index}`} style={styles.warningText}>
                      ⚠ {warning}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {stepError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{stepError}</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {currentStep === 'preview' ? (
            <Text style={styles.previewHint}>
              {t('progressiveWorkflow.quickSetup.reviewPreviewHint')}
            </Text>
          ) : null}
          </ScrollView>

          <StickyFormActions
            layout="row"
            secondary={{
              label: stepIndex === 0 ? t('common.cancel') : t('accommodation.setup.back'),
              onPress: goBack,
              disabled: generating || checkingBuilding,
            }}
            primary={
              currentStep === 'preview'
                ? {
                    label: generating
                      ? t('accommodation.setup.creatingLayout')
                      : t('accommodation.setup.generateStructure'),
                    onPress: handleGenerate,
                    loading: generating,
                    disabled: generating,
                  }
                : {
                    label: t('accommodation.setup.next'),
                    onPress: goNext,
                    loading: loading || checkingBuilding,
                    disabled: checkingBuilding,
                  }
            }
          />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stepLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.md,
  },
  formCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.xs,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  layoutReminder: {
    ...typography.caption,
    color: colors.primaryDark,
    marginBottom: spacing.md,
  },
  stepHint: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  toggleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  toggleLabel: {
    ...typography.bodyStrong,
  },
  toggleHint: {
    ...typography.caption,
    color: colors.muted,
  },
  estimate: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  warnings: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  warningText: {
    ...typography.body,
    color: '#B45309',
  },
  previewHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  creatingText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.button,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    ...typography.body,
    color: '#DC2626',
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginTop: spacing.md,
  },
});
