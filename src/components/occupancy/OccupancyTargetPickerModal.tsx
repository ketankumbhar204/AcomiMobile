import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type {
  BuildingResponse,
  FloorListItemResponse,
  MemberCategory,
  SpaceType,
  UnitListItemResponse,
} from '../../api/types';
import { AccommodationSearchBar } from '../accommodation/AccommodationSearchBar';
import { AccommodationStatusBadge } from '../accommodation/AccommodationStatusBadge';
import { Button, Card, FormInput } from '../ui';
import { useOccupancyTargetSearch } from '../../hooks/useOccupancyTargetSearch';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import {
  browseUsesApartmentUnitPicker,
  browseUsesCoLivingUnits,
  browseUsesFloorTabs,
  browseUsesRoomGroups,
  browseUsesUnitsOnly,
  formatOccupancySearchResultSubtitle,
  formatOccupancySearchResultTitle,
  formatOccupancyTargetLines,
  loadAvailableUnitsForBuilding,
  loadCoLivingUnitsForBuilding,
  loadFloorsForBrowse,
  loadRoomBedGroupsForFloor,
  loadRoomBedGroupsForUnit,
  loadUnitsOnFloor,
  type OccupancyBrowseRoomGroup,
  type OccupancyBrowseUnitItem,
} from '../../utils/occupancyBrowse';
import type { OccupancySearchResult } from '../../utils/occupancyTargetSearch';
import type { OccupancyTargetSelection } from '../../utils/occupancyRules';
import {
  formatTodayIsoDate,
  formatOccupancyAllocatedDate,
} from '../../utils/occupancyRules';

export type OccupancyPickerMode = 'RESERVE' | 'WALK_IN' | 'TRANSFER';

export type OccupancyPickerExtras = {
  moveInDate?: string;
  expectedExitDate?: string;
  expectedCheckoutDate?: string;
  memberCategory?: MemberCategory;
  remarks?: string;
};

type PickerPhase = 'select' | 'details' | 'review';

type OccupancyTargetPickerModalProps = {
  visible: boolean;
  spaceId: string;
  spaceType: SpaceType;
  mode?: OccupancyPickerMode;
  title: string;
  memberName?: string;
  showCheckoutDate?: boolean;
  defaultMemberCategory?: MemberCategory;
  initialSelection?: OccupancyTargetSelection | null;
  skipSelectPhase?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (selection: OccupancyTargetSelection, extras?: OccupancyPickerExtras) => void;
};

const MEMBER_CATEGORIES: MemberCategory[] = [
  'STUDENT',
  'WORKING_PROFESSIONAL',
  'FAMILY',
  'GUEST',
  'INTERN',
];

function searchResultToSelection(result: OccupancySearchResult): OccupancyTargetSelection {
  return {
    targetType: result.targetType,
    buildingId: result.buildingId,
    buildingName: result.buildingName,
    floorId: result.floorId,
    floorName: result.floorName,
    unitId: result.unitId,
    unitName: result.unitName,
    roomId: result.roomId,
    roomName: result.roomName,
    bedId: result.bedId,
    bedName: result.bedName,
  };
}

function SelectionSummaryCard({
  selection,
  label,
}: {
  selection: OccupancyTargetSelection;
  label: string;
}) {
  const { t } = useTranslation();
  const lines = formatOccupancyTargetLines(selection);

  return (
    <Card style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      {lines.map((line, index) => (
        <Text key={`${line}-${index}`} style={index === 0 ? styles.summaryPrimary : styles.summaryLine}>
          {index === 0 ? line : line}
        </Text>
      ))}
      {selection.bedName ? (
        <Text style={styles.summaryMeta}>
          {t('accommodation.beds.bedNumber', { value: selection.bedName })}
        </Text>
      ) : null}
    </Card>
  );
}

function ComingSoonSection({ title, items }: { title: string; items?: string[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.comingSoonBlock}>
      <Text style={styles.comingSoonTitle}>{title}</Text>
      {items?.map(item => (
        <Text key={item} style={styles.comingSoonItem}>
          · {item}
        </Text>
      ))}
      <Text style={styles.comingSoonHint}>{t('occupancy.picker.comingSoonHint')}</Text>
    </View>
  );
}

export function OccupancyTargetPickerModal({
  visible,
  spaceId,
  spaceType,
  mode = 'WALK_IN',
  title,
  memberName,
  showCheckoutDate = false,
  defaultMemberCategory,
  initialSelection = null,
  skipSelectPhase = false,
  loading = false,
  onClose,
  onConfirm,
}: OccupancyTargetPickerModalProps) {
  const { t } = useTranslation();

  const [phase, setPhase] = useState<PickerPhase>('select');
  const [pendingSelection, setPendingSelection] = useState<OccupancyTargetSelection | null>(null);
  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [activeBuilding, setActiveBuilding] = useState<BuildingResponse | null>(null);
  const [coLivingUnit, setCoLivingUnit] = useState<UnitListItemResponse | null>(null);
  const [roomGroups, setRoomGroups] = useState<OccupancyBrowseRoomGroup[]>([]);
  const [browseUnits, setBrowseUnits] = useState<OccupancyBrowseUnitItem[]>([]);
  const [coLivingUnits, setCoLivingUnits] = useState<UnitListItemResponse[]>([]);
  const [browseFloors, setBrowseFloors] = useState<FloorListItemResponse[]>([]);
  const [activeBrowseFloor, setActiveBrowseFloor] = useState<FloorListItemResponse | null>(null);
  const [apartmentUnits, setApartmentUnits] = useState<UnitListItemResponse[]>([]);
  const [selectedApartmentUnit, setSelectedApartmentUnit] = useState<UnitListItemResponse | null>(
    null,
  );
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  const wasVisibleRef = useRef(false);
  const browseRequestSeq = useRef(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState('');
  const [memberCategory, setMemberCategory] = useState<MemberCategory | undefined>(
    defaultMemberCategory,
  );
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isSearchMode = searchQuery.trim().length > 0;
  const browseLoading = buildingsLoading || groupsLoading;
  const interactionLocked = loading || selecting || browseLoading;
  const showDetailsPhase = mode !== 'TRANSFER';
  const todayIso = formatTodayIsoDate();

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    reset: resetSearch,
  } = useOccupancyTargetSearch(
    spaceId,
    spaceType,
    searchQuery,
    visible && isSearchMode,
  );

  const reset = useCallback(() => {
    setPhase('select');
    setPendingSelection(null);
    setBuildings([]);
    setActiveBuilding(null);
    setCoLivingUnit(null);
    setRoomGroups([]);
    setBrowseUnits([]);
    setCoLivingUnits([]);
    setBrowseFloors([]);
    setActiveBrowseFloor(null);
    setApartmentUnits([]);
    setSelectedApartmentUnit(null);
    setBuildingsLoading(false);
    setGroupsLoading(false);
    setBrowseError(null);
    setSelecting(false);
    setSearchQuery('');
    setMoveInDate(mode === 'RESERVE' ? todayIso : todayIso);
    setExpectedCheckoutDate('');
    setMemberCategory(defaultMemberCategory);
    setRemarks('');
    setFormError(null);
    resetSearch();
  }, [defaultMemberCategory, mode, resetSearch, todayIso]);

  const handleDismiss = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      browseRequestSeq.current += 1;
      return;
    }
    if (wasVisibleRef.current) {
      return;
    }
    wasVisibleRef.current = true;
    if (skipSelectPhase && initialSelection) {
      setPendingSelection(initialSelection);
      setPhase(mode === 'TRANSFER' ? 'review' : 'details');
      setSearchQuery('');
      setMoveInDate(mode === 'RESERVE' ? todayIso : todayIso);
      setExpectedCheckoutDate('');
      setMemberCategory(defaultMemberCategory);
      setRemarks('');
      setFormError(null);
      return;
    }
    reset();
  }, [defaultMemberCategory, initialSelection, mode, reset, skipSelectPhase, todayIso, visible]);

  useEffect(() => {
    if (!loading) {
      setSelecting(false);
    }
  }, [loading]);

  const loadBuildings = useCallback(async () => {
    setBuildingsLoading(true);
    setBrowseError(null);
    try {
      const data = await accommodationApi.getBuildings(spaceId);
      setBuildings(data);
      if (data.length === 1) {
        setActiveBuilding(data[0]);
      }
    } catch (err) {
      setBrowseError(getAccommodationErrorMessage(err, 'accommodation.errors.loadBuildings'));
    } finally {
      setBuildingsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (!visible || phase !== 'select' || isSearchMode || buildings.length > 0) {
      return;
    }
    void loadBuildings();
  }, [buildings.length, isSearchMode, loadBuildings, phase, visible]);

  const loadBrowseFloors = useCallback(async () => {
    if (!activeBuilding || !browseUsesFloorTabs(spaceType, activeBuilding)) {
      setBrowseFloors([]);
      setActiveBrowseFloor(null);
      return;
    }
    const seq = ++browseRequestSeq.current;
    setGroupsLoading(true);
    setBrowseError(null);
    try {
      const floors = await loadFloorsForBrowse(spaceId, activeBuilding.buildingId);
      if (seq !== browseRequestSeq.current) {
        return;
      }
      setBrowseFloors(floors);
      setActiveBrowseFloor(floors[0] ?? null);
      setApartmentUnits([]);
      setSelectedApartmentUnit(null);
    } catch (err) {
      if (seq !== browseRequestSeq.current) {
        return;
      }
      setBrowseError(getAccommodationErrorMessage(err, 'accommodation.errors.loadFloors'));
    } finally {
      if (seq === browseRequestSeq.current) {
        setGroupsLoading(false);
      }
    }
  }, [activeBuilding, spaceId, spaceType]);

  const loadApartmentUnits = useCallback(async () => {
    if (
      !activeBuilding ||
      !activeBrowseFloor ||
      !browseUsesApartmentUnitPicker(activeBuilding)
    ) {
      setApartmentUnits([]);
      setSelectedApartmentUnit(null);
      return;
    }
    const seq = ++browseRequestSeq.current;
    setGroupsLoading(true);
    setBrowseError(null);
    try {
      const units = await loadUnitsOnFloor(
        spaceId,
        activeBuilding.buildingId,
        activeBrowseFloor.floorId,
      );
      if (seq !== browseRequestSeq.current) {
        return;
      }
      setApartmentUnits(units);
      setSelectedApartmentUnit(units[0] ?? null);
      setRoomGroups([]);
    } catch (err) {
      if (seq !== browseRequestSeq.current) {
        return;
      }
      setBrowseError(getAccommodationErrorMessage(err, 'accommodation.errors.loadUnits'));
    } finally {
      if (seq === browseRequestSeq.current) {
        setGroupsLoading(false);
      }
    }
  }, [activeBrowseFloor, activeBuilding, spaceId]);

  const loadBrowseContent = useCallback(async () => {
    if (!activeBuilding) {
      return;
    }
    const seq = ++browseRequestSeq.current;
    setGroupsLoading(true);
    setBrowseError(null);
    try {
      if (browseUsesUnitsOnly(spaceType, activeBuilding)) {
        const units = await loadAvailableUnitsForBuilding(spaceId, activeBuilding);
        if (seq !== browseRequestSeq.current) {
          return;
        }
        setBrowseUnits(units);
        setRoomGroups([]);
        setCoLivingUnits([]);
        return;
      }

      if (browseUsesCoLivingUnits(spaceType, activeBuilding) && !coLivingUnit) {
        const units = await loadCoLivingUnitsForBuilding(spaceId, activeBuilding);
        if (seq !== browseRequestSeq.current) {
          return;
        }
        setCoLivingUnits(units);
        setCoLivingUnit(units[0] ?? null);
        setRoomGroups([]);
        setBrowseUnits([]);
        return;
      }

      if (
        browseUsesFloorTabs(spaceType, activeBuilding) &&
        activeBrowseFloor &&
        browseUsesApartmentUnitPicker(activeBuilding)
      ) {
        if (!selectedApartmentUnit) {
          return;
        }
        const groups = await loadRoomBedGroupsForUnit(
          spaceId,
          activeBuilding,
          {
            unitId: selectedApartmentUnit.unitId,
            unitName: selectedApartmentUnit.name,
          },
          {
            floorId: activeBrowseFloor.floorId,
            floorName: activeBrowseFloor.name,
          },
        );
        if (seq !== browseRequestSeq.current) {
          return;
        }
        setRoomGroups(groups);
        setBrowseUnits([]);
        setCoLivingUnits([]);
        return;
      }

      if (browseUsesFloorTabs(spaceType, activeBuilding) && activeBrowseFloor) {
        const groups = await loadRoomBedGroupsForFloor(
          spaceId,
          spaceType,
          activeBuilding,
          activeBrowseFloor,
        );
        if (seq !== browseRequestSeq.current) {
          return;
        }
        setRoomGroups(groups);
        setBrowseUnits([]);
        setCoLivingUnits([]);
        return;
      }

      if (browseUsesRoomGroups(spaceType, activeBuilding) && coLivingUnit) {
        const groups = await loadRoomBedGroupsForUnit(
          spaceId,
          activeBuilding,
          {
            unitId: coLivingUnit.unitId,
            unitName: coLivingUnit.name,
          },
        );
        if (seq !== browseRequestSeq.current) {
          return;
        }
        setRoomGroups(groups);
        setBrowseUnits([]);
        setCoLivingUnits([]);
      }
    } catch (err) {
      if (seq !== browseRequestSeq.current) {
        return;
      }
      setBrowseError(getAccommodationErrorMessage(err, 'occupancy.errors.search'));
    } finally {
      if (seq === browseRequestSeq.current) {
        setGroupsLoading(false);
      }
    }
  }, [activeBrowseFloor, activeBuilding, coLivingUnit, selectedApartmentUnit, spaceId, spaceType]);

  useEffect(() => {
    if (!visible || phase !== 'select' || isSearchMode || !activeBuilding) {
      return;
    }
    if (browseUsesFloorTabs(spaceType, activeBuilding)) {
      void loadBrowseFloors();
      return;
    }
    void loadBrowseContent();
  }, [activeBuilding, isSearchMode, loadBrowseContent, loadBrowseFloors, phase, spaceType, visible]);

  useEffect(() => {
    if (!visible || phase !== 'select' || isSearchMode || !activeBuilding || !activeBrowseFloor) {
      return;
    }
    if (!browseUsesFloorTabs(spaceType, activeBuilding)) {
      return;
    }
    if (browseUsesApartmentUnitPicker(activeBuilding)) {
      void loadApartmentUnits();
      return;
    }
    void loadBrowseContent();
  }, [
    activeBrowseFloor,
    activeBuilding,
    isSearchMode,
    loadApartmentUnits,
    loadBrowseContent,
    phase,
    spaceType,
    visible,
  ]);

  useEffect(() => {
    if (
      !visible ||
      phase !== 'select' ||
      isSearchMode ||
      !activeBuilding ||
      !activeBrowseFloor ||
      !selectedApartmentUnit
    ) {
      return;
    }
    if (!browseUsesApartmentUnitPicker(activeBuilding)) {
      return;
    }
    void loadBrowseContent();
  }, [
    activeBrowseFloor,
    activeBuilding,
    isSearchMode,
    loadBrowseContent,
    phase,
    selectedApartmentUnit,
    visible,
  ]);

  useEffect(() => {
    if (!visible || phase !== 'select' || isSearchMode || !activeBuilding || !coLivingUnit) {
      return;
    }
    if (!browseUsesCoLivingUnits(spaceType, activeBuilding)) {
      return;
    }
    void loadBrowseContent();
  }, [
    activeBuilding,
    coLivingUnit,
    isSearchMode,
    loadBrowseContent,
    phase,
    spaceType,
    visible,
  ]);

  function buildExtras(): OccupancyPickerExtras {
    const resolvedMoveInDate = mode === 'WALK_IN' ? todayIso : moveInDate.trim();
    return {
      moveInDate: resolvedMoveInDate || undefined,
      expectedExitDate: expectedCheckoutDate.trim() || undefined,
      expectedCheckoutDate: expectedCheckoutDate.trim() || undefined,
      memberCategory: mode === 'RESERVE' ? memberCategory : undefined,
      remarks: remarks.trim() || undefined,
    };
  }

  function validateDetails(): boolean {
    if (mode === 'RESERVE' && !moveInDate.trim()) {
      setFormError(t('occupancy.errors.moveInDateRequired'));
      return false;
    }
    setFormError(null);
    return true;
  }

  function pickTarget(selection: OccupancyTargetSelection) {
    setPendingSelection(selection);
    if (mode === 'TRANSFER') {
      setPhase('review');
      return;
    }
    setPhase('details');
  }

  function handleContinueToReview() {
    if (!validateDetails()) {
      return;
    }
    setPhase('review');
  }

  function handleFinalConfirm() {
    if (!pendingSelection || interactionLocked) {
      return;
    }
    if (showDetailsPhase && !validateDetails()) {
      setPhase('details');
      return;
    }
    setSelecting(true);
    onConfirm(pendingSelection, buildExtras());
  }

  function handleHeaderBack() {
    if (phase === 'review') {
      setPhase(mode === 'TRANSFER' ? 'select' : 'details');
      return;
    }
    if (phase === 'details') {
      if (skipSelectPhase) {
        handleDismiss();
        return;
      }
      setPhase('select');
      setPendingSelection(null);
      return;
    }
    handleDismiss();
  }

  const phaseTitle = useMemo(() => {
    switch (phase) {
      case 'select':
        return isSearchMode
          ? t('occupancy.picker.searchResults')
          : t('occupancy.picker.chooseAccommodation');
      case 'details':
        return mode === 'RESERVE'
          ? t('occupancy.picker.reservationDetails')
          : t('occupancy.picker.allocationDetails');
      case 'review':
        return t('occupancy.picker.reviewTitle');
      default:
        return title;
    }
  }, [isSearchMode, mode, phase, t, title]);

  const showSearchEmptyBrowseHint =
    isSearchMode && !searchLoading && searchResults.length === 0 && searchQuery.trim().length > 0;

  const showBrowseSection =
    phase === 'select' &&
    !skipSelectPhase &&
    (!isSearchMode || showSearchEmptyBrowseHint) &&
    !(isSearchMode && searchResults.length > 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={handleHeaderBack} hitSlop={8} disabled={interactionLocked}>
              <Text style={styles.backText}>
                {phase === 'select' ? t('common.cancel') : t('common.back')}
              </Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.stepLabel}>{phaseTitle}</Text>
          </View>

          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {phase === 'select' ? (
              <>
                <View style={styles.searchWrap}>
                  <AccommodationSearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t('occupancy.picker.searchPlaceholder')}
                  />
                </View>

                {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
                {browseError ? <Text style={styles.errorText}>{browseError}</Text> : null}

                {isSearchMode ? (
                  <>
                    {searchLoading ? (
                      <ActivityIndicator color={colors.primary} style={styles.loader} />
                    ) : (
                      <>
                        {searchResults.length > 0 ? (
                          <View style={styles.section}>
                            {searchResults.map(result => (
                              <Pressable
                                key={result.key}
                                style={[styles.row, interactionLocked && styles.rowDisabled]}
                                onPress={() => pickTarget(searchResultToSelection(result))}
                                disabled={interactionLocked}>
                                <View style={styles.rowBody}>
                                  <Text style={styles.rowTitle}>
                                    {formatOccupancySearchResultTitle(result, t)}
                                  </Text>
                                  <Text style={styles.rowSub}>
                                    {formatOccupancySearchResultSubtitle(result)}
                                  </Text>
                                </View>
                                <Text style={styles.pickMark}>›</Text>
                              </Pressable>
                            ))}
                          </View>
                        ) : showSearchEmptyBrowseHint ? (
                          <Text style={styles.empty}>{t('occupancy.picker.searchEmpty')}</Text>
                        ) : null}
                      </>
                    )}
                  </>
                ) : null}

                {showBrowseSection ? (
                  <>
                    {showSearchEmptyBrowseHint ? (
                      <Text style={styles.browseDivider}>{t('occupancy.picker.browseManually')}</Text>
                    ) : !isSearchMode ? (
                      <Text style={styles.browseDivider}>{t('occupancy.picker.browseAvailable')}</Text>
                    ) : null}

                    {buildings.length > 1 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.buildingTabs}>
                        {buildings.map(building => (
                          <Pressable
                            key={building.buildingId}
                            style={[
                              styles.buildingTab,
                              activeBuilding?.buildingId === building.buildingId &&
                                styles.buildingTabActive,
                            ]}
                            onPress={() => {
                              browseRequestSeq.current += 1;
                              setActiveBuilding(building);
                              setCoLivingUnit(null);
                              setBrowseFloors([]);
                              setActiveBrowseFloor(null);
                              setApartmentUnits([]);
                              setSelectedApartmentUnit(null);
                              setRoomGroups([]);
                            }}>
                            <Text
                              style={[
                                styles.buildingTabText,
                                activeBuilding?.buildingId === building.buildingId &&
                                  styles.buildingTabTextActive,
                              ]}>
                              {building.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}

                    {browseFloors.length > 0 &&
                    activeBuilding &&
                    browseUsesFloorTabs(spaceType, activeBuilding) ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.buildingTabs}>
                        {browseFloors.map(floor => (
                          <Pressable
                            key={floor.floorId}
                            style={[
                              styles.buildingTab,
                              activeBrowseFloor?.floorId === floor.floorId && styles.buildingTabActive,
                            ]}
                            onPress={() => {
                              browseRequestSeq.current += 1;
                              setActiveBrowseFloor(floor);
                              setApartmentUnits([]);
                              setSelectedApartmentUnit(null);
                              setRoomGroups([]);
                            }}>
                            <Text
                              style={[
                                styles.buildingTabText,
                                activeBrowseFloor?.floorId === floor.floorId &&
                                  styles.buildingTabTextActive,
                              ]}>
                              {floor.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}

                    {apartmentUnits.length > 0 &&
                    activeBuilding &&
                    browseUsesApartmentUnitPicker(activeBuilding) &&
                    activeBrowseFloor ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.buildingTabs}>
                        {apartmentUnits.map(unit => (
                          <Pressable
                            key={unit.unitId}
                            style={[
                              styles.buildingTab,
                              selectedApartmentUnit?.unitId === unit.unitId &&
                                styles.buildingTabActive,
                            ]}
                            onPress={() => {
                              browseRequestSeq.current += 1;
                              setSelectedApartmentUnit(unit);
                              setRoomGroups([]);
                            }}>
                            <Text
                              style={[
                                styles.buildingTabText,
                                selectedApartmentUnit?.unitId === unit.unitId &&
                                  styles.buildingTabTextActive,
                              ]}>
                              {unit.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}

                    {coLivingUnits.length > 0 &&
                    activeBuilding &&
                    browseUsesCoLivingUnits(spaceType, activeBuilding) ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.buildingTabs}>
                        {coLivingUnits.map(unit => (
                          <Pressable
                            key={unit.unitId}
                            style={[
                              styles.buildingTab,
                              coLivingUnit?.unitId === unit.unitId && styles.buildingTabActive,
                            ]}
                            onPress={() => {
                              browseRequestSeq.current += 1;
                              setCoLivingUnit(unit);
                              setRoomGroups([]);
                            }}>
                            <Text
                              style={[
                                styles.buildingTabText,
                                coLivingUnit?.unitId === unit.unitId && styles.buildingTabTextActive,
                              ]}>
                              {unit.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}

                    {groupsLoading ? (
                      <ActivityIndicator color={colors.primary} style={styles.loader} />
                    ) : null}

                    {!groupsLoading &&
                    activeBuilding &&
                    browseUsesApartmentUnitPicker(activeBuilding) &&
                    activeBrowseFloor &&
                    apartmentUnits.length === 0 ? (
                      <Text style={styles.empty}>{t('occupancy.picker.noAvailable')}</Text>
                    ) : null}

                    {!groupsLoading && activeBuilding && browseUsesUnitsOnly(spaceType, activeBuilding) ? (
                      <View style={styles.section}>
                        {browseUnits.map(unit => (
                          <Pressable
                            key={unit.unitId}
                            style={styles.row}
                            onPress={() => pickTarget(unit.selection)}>
                            <View style={styles.rowBody}>
                              <Text style={styles.rowTitle}>{unit.unitName}</Text>
                              <AccommodationStatusBadge status={unit.status} />
                            </View>
                            <Text style={styles.pickMark}>›</Text>
                          </Pressable>
                        ))}
                        {browseUnits.length === 0 ? (
                          <Text style={styles.empty}>{t('occupancy.picker.noAvailable')}</Text>
                        ) : null}
                      </View>
                    ) : null}

                    {!groupsLoading &&
                    activeBuilding &&
                    browseUsesRoomGroups(spaceType, activeBuilding) &&
                    (!browseUsesCoLivingUnits(spaceType, activeBuilding) || coLivingUnit) &&
                    (!browseUsesFloorTabs(spaceType, activeBuilding) ||
                      activeBrowseFloor) &&
                    (!browseUsesApartmentUnitPicker(activeBuilding) ||
                      selectedApartmentUnit) ? (
                      <View style={styles.section}>
                        {roomGroups.map(group => (
                          <View key={group.key} style={styles.roomGroup}>
                            <View style={styles.roomGroupHeader}>
                              <Text style={styles.roomGroupTitle}>{group.roomName}</Text>
                              <Text style={styles.roomGroupMeta}>
                                {t('occupancy.picker.roomAvailability', {
                                  type: t(`accommodation.roomType.${group.roomType}`),
                                  available: group.availableCount,
                                  capacity: group.bedCount,
                                })}
                              </Text>
                              {[group.floorName, group.unitName].filter(Boolean).length > 0 ? (
                                <Text style={styles.roomGroupContext}>
                                  {[group.floorName, group.unitName].filter(Boolean).join(' · ')}
                                </Text>
                              ) : null}
                            </View>
                            <View style={styles.bedChipRow}>
                              {group.beds.map(bed => (
                                <Pressable
                                  key={bed.bedId}
                                  style={styles.bedChip}
                                  onPress={() => pickTarget(bed.selection)}
                                  disabled={interactionLocked}>
                                  <Text style={styles.bedChipText}>
                                    {t('accommodation.beds.bedNumber', { value: bed.label })}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        ))}
                        {roomGroups.length === 0 ? (
                          <Text style={styles.empty}>{t('occupancy.picker.noAvailable')}</Text>
                        ) : null}
                      </View>
                    ) : null}

                    {!groupsLoading && !activeBuilding && buildings.length > 1 ? (
                      <Text style={styles.empty}>{t('occupancy.picker.selectBuilding')}</Text>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}

            {phase === 'details' && pendingSelection ? (
              <View style={styles.section}>
                <SelectionSummaryCard
                  selection={pendingSelection}
                  label={t('occupancy.picker.selectedAccommodation')}
                />

                {mode === 'RESERVE' ? (
                  <FormInput
                    label={t('occupancy.section.moveInDate')}
                    value={moveInDate}
                    onChangeText={setMoveInDate}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  <View style={styles.readonlyField}>
                    <Text style={styles.readonlyLabel}>{t('occupancy.section.moveInDate')}</Text>
                    <Text style={styles.readonlyValue}>
                      {formatOccupancyAllocatedDate(todayIso)} ({t('occupancy.picker.today')})
                    </Text>
                  </View>
                )}

                {(showCheckoutDate || mode === 'RESERVE' || mode === 'WALK_IN') ? (
                  <FormInput
                    label={t('occupancy.fields.expectedExit')}
                    value={expectedCheckoutDate}
                    onChangeText={setExpectedCheckoutDate}
                    placeholder="YYYY-MM-DD"
                  />
                ) : null}

                {mode === 'RESERVE' ? (
                  <>
                    <Text style={styles.categoryLabel}>{t('occupancy.fields.memberCategory')}</Text>
                    <View style={styles.categoryRow}>
                      {MEMBER_CATEGORIES.map(category => (
                        <Pressable
                          key={category}
                          style={[
                            styles.categoryChip,
                            memberCategory === category && styles.categoryChipSelected,
                          ]}
                          onPress={() =>
                            setMemberCategory(memberCategory === category ? undefined : category)
                          }>
                          <Text
                            style={[
                              styles.categoryChipText,
                              memberCategory === category && styles.categoryChipTextSelected,
                            ]}>
                            {t(`occupancy.memberCategory.${category}`)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}

                <FormInput
                  label={t('occupancy.fields.remarks')}
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder={t('occupancy.fields.remarksPlaceholder')}
                />

                {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                <Button
                  label={t('occupancy.picker.continueToReview')}
                  onPress={handleContinueToReview}
                  disabled={interactionLocked}
                  style={styles.footerButton}
                />
              </View>
            ) : null}

            {phase === 'review' && pendingSelection ? (
              <View style={styles.section}>
                {memberName ? (
                  <Card style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>{t('occupancy.picker.member')}</Text>
                    <Text style={styles.summaryPrimary}>{memberName}</Text>
                  </Card>
                ) : null}

                <SelectionSummaryCard
                  selection={pendingSelection}
                  label={t('occupancy.picker.selectedAccommodation')}
                />

                {showDetailsPhase ? (
                  <Card style={styles.reviewFacts}>
                    {mode === 'RESERVE' ? (
                      <Text style={styles.reviewLine}>
                        {t('occupancy.section.moveInDate')}: {formatOccupancyAllocatedDate(moveInDate)}
                      </Text>
                    ) : (
                      <Text style={styles.reviewLine}>
                        {t('occupancy.section.moveInDate')}: {formatOccupancyAllocatedDate(todayIso)} ({t('occupancy.picker.today')})
                      </Text>
                    )}
                    {expectedCheckoutDate ? (
                      <Text style={styles.reviewLine}>
                        {t('occupancy.fields.expectedExit')}: {formatOccupancyAllocatedDate(expectedCheckoutDate)}
                      </Text>
                    ) : null}
                    {memberCategory ? (
                      <Text style={styles.reviewLine}>
                        {t('occupancy.fields.memberCategory')}: {t(`occupancy.memberCategory.${memberCategory}`)}
                      </Text>
                    ) : null}
                    {remarks ? (
                      <Text style={styles.reviewLine}>
                        {t('occupancy.fields.remarks')}: {remarks}
                      </Text>
                    ) : null}
                  </Card>
                ) : (
                  <FormInput
                    label={t('occupancy.fields.remarks')}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder={t('occupancy.fields.remarksPlaceholder')}
                  />
                )}

                <ComingSoonSection
                  title={t('occupancy.picker.financialTerms')}
                  items={[
                    t('occupancy.picker.rent'),
                    t('occupancy.picker.deposit'),
                    t('occupancy.picker.foodCharges'),
                  ]}
                />
                <ComingSoonSection title={t('occupancy.picker.amenities')} />
                <ComingSoonSection title={t('occupancy.picker.policies')} />

                {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                <Button
                  label={
                    mode === 'RESERVE'
                      ? t('occupancy.picker.confirmReserve')
                      : mode === 'WALK_IN'
                        ? t('occupancy.picker.confirmAllocate')
                        : t('occupancy.picker.confirmTransfer')
                  }
                  onPress={handleFinalConfirm}
                  loading={loading || selecting}
                  disabled={interactionLocked}
                  style={styles.footerButton}
                />
              </View>
            ) : null}
          </ScrollView>

          {loading || selecting ? (
            <View style={styles.savingOverlay}>
              <ActivityIndicator color={colors.white} size="large" />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    maxHeight: '92%',
    minHeight: '55%',
    ...shadows.md,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backText: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  body: {
    flexGrow: 1,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  browseDivider: {
    ...typography.caption,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  buildingTabs: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  buildingTab: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buildingTabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  buildingTabText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  buildingTabTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  section: {
    paddingBottom: spacing.xl,
  },
  sectionHeading: {
    ...typography.bodyStrong,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.bodyStrong,
  },
  rowSub: {
    ...typography.caption,
    color: colors.muted,
  },
  pickMark: {
    fontSize: 20,
    color: colors.muted,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    padding: spacing.xl,
  },
  roomGroup: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  roomGroupHeader: {
    marginBottom: spacing.sm,
    gap: 2,
  },
  roomGroupTitle: {
    ...typography.bodyStrong,
  },
  roomGroupMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  roomGroupContext: {
    ...typography.caption,
    color: colors.muted,
  },
  bedChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bedChip: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bedChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  coLivingBack: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  coLivingBackText: {
    ...typography.caption,
    color: colors.primary,
  },
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  summaryPrimary: {
    ...typography.bodyStrong,
  },
  summaryLine: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  readonlyField: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  readonlyLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  readonlyValue: {
    ...typography.bodyStrong,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  reviewFacts: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  reviewLine: {
    ...typography.body,
  },
  comingSoonBlock: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  comingSoonTitle: {
    ...typography.bodyStrong,
  },
  comingSoonItem: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  comingSoonHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  footerButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    width: 'auto',
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
});
