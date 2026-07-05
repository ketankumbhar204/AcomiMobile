import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
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
  PropertyLayoutModePicker,
  RoomTypePicker,
  SetupStructureEditor,
  executeSetupStructure,
} from '../../components/accommodation';
import { expandToEditableStructure } from '../../components/accommodation/setup-preview/setupStructureModel';
import type { EditableSetupStructure } from '../../components/accommodation/setup-preview/setupStructureTypes';
import { Button, FormInput, HeaderBackButton } from '../../components/ui';
import { useQuickSetup } from '../../hooks/useQuickSetup';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
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
  const [includeGroundFloor, setIncludeGroundFloor] = useState(true);
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState('4');

  const [unitCount, setUnitCount] = useState('10');
  const [startNumber, setStartNumber] = useState('101');
  const [numberingStep, setNumberingStep] = useState('1');

  const [roomsPerParent, setRoomsPerParent] = useState('10');
  const [bedsPerRoom, setBedsPerRoom] = useState('3');
  const [capacityPerRoom, setCapacityPerRoom] = useState('3');
  const [roomType, setRoomType] = useState<RoomType | null>('SHARED');

  const [stepError, setStepError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AccommodationSetupPreviewResponse | null>(null);
  const [editableStructure, setEditableStructure] = useState<EditableSetupStructure | null>(null);
  const [generating, setGenerating] = useState(false);

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

  const expandConfig = useMemo(
    () => ({
      roomsPerParent: Number(roomsPerParent) || 1,
      bedsPerRoom: Number(bedsPerRoom) || 1,
      capacityPerRoom: Number(capacityPerRoom) || 1,
      includeGroundFloor,
    }),
    [bedsPerRoom, capacityPerRoom, includeGroundFloor, roomsPerParent],
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
        capacityPerRoom: Number(capacityPerRoom),
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
      units.capacityPerRoom = Number(capacityPerRoom);
    }

    return buildSetupRequest(spaceType, building, undefined, units);
  }, [
    apartmentsPerFloor,
    bedsPerRoom,
    buildingCode,
    buildingName,
    capacityPerRoom,
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

  function validateBuildingStep(): boolean {
    if (!buildingName.trim()) {
      setBuildingNameError(t('accommodation.buildings.nameRequired'));
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
        capacityPerRoom: Number(capacityPerRoom),
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
        capacityPerRoom: Number(capacityPerRoom),
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
      if (!validateBuildingStep()) {
        return;
      }
      setStepIndex(index => Math.min(index + 1, steps.length - 1));
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
    if (!editableStructure || !spaceType) {
      return;
    }

    if (!editableStructure.building.name.trim()) {
      setStepError(t('accommodation.buildings.nameRequired'));
      return;
    }

    setStepError(null);
    setError(null);
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
      setError(t('accommodation.setup.errors.generate'));
    } finally {
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepLabel}>
            {t('accommodation.setup.step', {
              current: stepIndex + 1,
              total: steps.length,
            })}
          </Text>

          {currentStep === 'building' ? (
            <View>
              <Text style={styles.sectionTitle}>{t('accommodation.setup.buildingStep')}</Text>
              <FormInput
                label={t('accommodation.fields.name')}
                value={buildingName}
                onChangeText={setBuildingName}
                placeholder={t('accommodation.buildings.namePlaceholder')}
                error={buildingNameError}
              />
              <FormInput
                label={t('accommodation.fields.code')}
                value={buildingCode}
                onChangeText={setBuildingCode}
                placeholder={t('accommodation.buildings.codePlaceholder')}
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

          {isPgHostel && currentStep !== 'building' ? (
            <Text style={styles.layoutReminder}>
              {t('accommodation.setup.selectedLayout', {
                layout: t(getLayoutModeLabelKey(layoutMode)),
              })}
            </Text>
          ) : null}

          {currentStep === 'structure' && isPgHostel ? (
            <View>
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
              />
              <Pressable
                style={[styles.toggle, includeGroundFloor && styles.toggleOn]}
                onPress={() => setIncludeGroundFloor(value => !value)}>
                <Text style={styles.toggleLabel}>{t('accommodation.setup.includeGroundFloor')}</Text>
                <Text style={styles.toggleValue}>
                  {includeGroundFloor ? t('common.yes') : t('common.no')}
                </Text>
              </Pressable>
              {isApartmentPg ? (
                <FormInput
                  label={t('accommodation.setup.apartmentsPerFloor')}
                  value={apartmentsPerFloor}
                  onChangeText={setApartmentsPerFloor}
                  keyboardType="number-pad"
                />
              ) : null}
            </View>
          ) : null}

          {currentStep === 'structure' && (spaceType === 'CO_LIVING' || spaceType === 'RENTAL') ? (
            <View>
              <Text style={styles.sectionTitle}>{t('accommodation.setup.unitsStep')}</Text>
              <FormInput
                label={t('accommodation.setup.unitCount')}
                value={unitCount}
                onChangeText={setUnitCount}
                keyboardType="number-pad"
              />
              <FormInput
                label={t('accommodation.setup.startNumber')}
                value={startNumber}
                onChangeText={setStartNumber}
              />
              {spaceType === 'CO_LIVING' ? (
                <FormInput
                  label={t('accommodation.setup.numberingStep')}
                  value={numberingStep}
                  onChangeText={setNumberingStep}
                  keyboardType="number-pad"
                />
              ) : null}
            </View>
          ) : null}

          {currentStep === 'rooms' ? (
            <View>
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
              />
              <FormInput
                label={t('accommodation.setup.bedsPerRoom')}
                value={bedsPerRoom}
                onChangeText={setBedsPerRoom}
                keyboardType="number-pad"
              />
              <RoomTypePicker value={roomType} onChange={setRoomType} />
              <FormInput
                label={t('accommodation.setup.capacityPerRoom')}
                value={capacityPerRoom}
                onChangeText={setCapacityPerRoom}
                keyboardType="number-pad"
              />
              {estimatedBeds > 0 ? (
                <Text style={styles.estimate}>
                  {t('accommodation.setup.estimatedBeds', { count: estimatedBeds })}
                </Text>
              ) : null}
            </View>
          ) : null}

          {currentStep === 'preview' && preview && editableStructure ? (
            <View>
              <Text style={styles.sectionTitle}>{t('accommodation.setup.previewStep')}</Text>
              <SetupStructureEditor
                structure={editableStructure}
                onChange={setEditableStructure}
                expandConfig={expandConfig}
                layoutModeLabel={
                  spaceType && isLayoutModeSelectable(spaceType)
                    ? t(getLayoutModeLabelKey(layoutMode))
                    : undefined
                }
              />
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

          {stepError ? <Text style={styles.errorText}>{stepError}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label={stepIndex === 0 ? t('common.cancel') : t('accommodation.setup.back')}
              variant="ghost"
              onPress={goBack}
              style={styles.actionBtn}
            />
            {currentStep === 'preview' ? (
              <Button
                label={t('accommodation.setup.generateStructure')}
                onPress={handleGenerate}
                loading={generating}
                style={styles.actionBtn}
              />
            ) : (
              <Button
                label={t('accommodation.setup.next')}
                onPress={goNext}
                loading={loading}
                style={styles.actionBtn}
              />
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
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
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  layoutReminder: {
    ...typography.caption,
    color: colors.primaryDark,
    marginBottom: spacing.md,
  },
  stepHint: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  toggleOn: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  toggleLabel: {
    ...typography.bodyStrong,
  },
  toggleValue: {
    ...typography.body,
    color: colors.primaryDark,
  },
  estimate: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.lg,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionBtn: {
    flex: 1,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginTop: spacing.md,
  },
});
