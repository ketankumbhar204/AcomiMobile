import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../../api/accommodationApi';
import type {
  AllocationTargetType,
  BuildingResponse,
  FloorListItemResponse,
  RoomListItemResponse,
  SpaceType,
  UnitListItemResponse,
  BedListItemResponse,
} from '../../api/types';
import { AccommodationSearchBar } from '../accommodation/AccommodationSearchBar';
import { AccommodationStatusBadge } from '../accommodation/AccommodationStatusBadge';
import { Button, FormInput } from '../ui';
import { useOccupancyTargetSearch } from '../../hooks/useOccupancyTargetSearch';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getAccommodationUiProfile } from '../../utils/accommodationProfile';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import type { OccupancySearchResult } from '../../utils/occupancyTargetSearch';
import {
  defaultTargetType,
  getAllowedTargetTypes,
} from '../../utils/occupancyRules';

export type OccupancyTargetSelection = {
  targetType: AllocationTargetType;
  buildingId: string;
  buildingName: string;
  floorId?: string;
  floorName?: string;
  unitId?: string;
  unitName?: string;
  roomId?: string;
  roomName?: string;
  bedId?: string;
  bedName?: string;
};

type PickerStep = 'targetType' | 'building' | 'floor' | 'unit' | 'room' | 'bed';

type OccupancyTargetPickerModalProps = {
  visible: boolean;
  spaceId: string;
  spaceType: SpaceType;
  title: string;
  showCheckoutDate?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (
    selection: OccupancyTargetSelection,
    extras?: { expectedCheckoutDate?: string; remarks?: string },
  ) => void;
};

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

function SearchResultRow({
  result,
  disabled,
  onPress,
}: {
  result: OccupancySearchResult;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const lines = [
    result.buildingName,
    result.floorName,
    result.unitName,
    result.roomName,
    result.bedName ? t('accommodation.beds.bedNumber', { value: result.bedName }) : null,
  ].filter(Boolean);

  return (
    <Pressable
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}>
      <View style={styles.rowBody}>
        {lines.map((line, index) => (
          <Text key={`${result.key}-${index}`} style={index === 0 ? styles.rowTitle : styles.rowSub}>
            {line}
          </Text>
        ))}
      </View>
      <Text style={styles.chevron}>✓</Text>
    </Pressable>
  );
}

export function OccupancyTargetPickerModal({
  visible,
  spaceId,
  spaceType,
  title,
  showCheckoutDate = false,
  loading = false,
  onClose,
  onConfirm,
}: OccupancyTargetPickerModalProps) {
  const { t } = useTranslation();
  const allowedTypes = useMemo(() => getAllowedTargetTypes(spaceType), [spaceType]);

  const [step, setStep] = useState<PickerStep>('building');
  const [targetType, setTargetType] = useState<AllocationTargetType>(
    defaultTargetType(spaceType) ?? 'BED',
  );
  const [building, setBuilding] = useState<BuildingResponse | null>(null);
  const [floor, setFloor] = useState<FloorListItemResponse | null>(null);
  const [unit, setUnit] = useState<UnitListItemResponse | null>(null);
  const [room, setRoom] = useState<RoomListItemResponse | null>(null);

  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [floors, setFloors] = useState<FloorListItemResponse[]>([]);
  const [units, setUnits] = useState<UnitListItemResponse[]>([]);
  const [rooms, setRooms] = useState<RoomListItemResponse[]>([]);
  const [beds, setBeds] = useState<BedListItemResponse[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const isSearchMode = searchQuery.trim().length > 0;
  const interactionLocked = loading || selecting || listLoading;

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

  const profile = useMemo(
    () =>
      building
        ? getAccommodationUiProfile(spaceType, building.layoutMode)
        : null,
    [building, spaceType],
  );

  const reset = useCallback(() => {
    const initialStep = allowedTypes.length > 1 ? 'targetType' : 'building';
    setStep(initialStep);
    setTargetType(defaultTargetType(spaceType) ?? 'BED');
    setBuilding(null);
    setFloor(null);
    setUnit(null);
    setRoom(null);
    setBuildings([]);
    setFloors([]);
    setUnits([]);
    setRooms([]);
    setBeds([]);
    setListError(null);
    setSelecting(false);
    setSearchQuery('');
    setExpectedCheckoutDate('');
    setRemarks('');
    resetSearch();
  }, [allowedTypes.length, resetSearch, spaceType]);

  const handleDismiss = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    reset();
  }, [visible, reset]);

  useEffect(() => {
    if (!loading) {
      setSelecting(false);
    }
  }, [loading]);

  const isRootStep = useCallback(() => {
    return step === 'targetType' || (step === 'building' && allowedTypes.length === 1);
  }, [allowedTypes.length, step]);

  const loadBuildings = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const data = await accommodationApi.getBuildings(spaceId);
      setBuildings(data);
    } catch (err) {
      setListError(getAccommodationErrorMessage(err, 'accommodation.errors.loadBuildings'));
    } finally {
      setListLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (!visible || isSearchMode || step !== 'building') {
      return;
    }
    void loadBuildings();
  }, [isSearchMode, loadBuildings, step, visible]);

  const loadFloors = useCallback(async () => {
    if (!building) {
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const page = await accommodationApi.listFloors(spaceId, building.buildingId, {
        view: 'summary',
        size: 50,
      });
      setFloors(page.content);
    } catch (err) {
      setListError(getAccommodationErrorMessage(err, 'accommodation.errors.loadFloors'));
    } finally {
      setListLoading(false);
    }
  }, [building, spaceId]);

  const loadUnits = useCallback(async () => {
    if (!building) {
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      if (floor && profile?.showUnitsOnFloor) {
        const page = await accommodationApi.listUnitsByFloor(
          spaceId,
          building.buildingId,
          floor.floorId,
          { view: 'summary', size: 50 },
        );
        setUnits(page.content.filter(item => !item.synthetic));
      } else {
        const page = await accommodationApi.listUnits(spaceId, building.buildingId, {
          view: 'summary',
          size: 50,
        });
        setUnits(page.content.filter(item => !item.synthetic));
      }
    } catch (err) {
      setListError(getAccommodationErrorMessage(err, 'accommodation.errors.loadUnits'));
    } finally {
      setListLoading(false);
    }
  }, [building, floor, profile?.showUnitsOnFloor, spaceId]);

  const loadRooms = useCallback(async () => {
    if (!building) {
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      let page;
      if (unit) {
        page = await accommodationApi.listRoomsByUnit(spaceId, unit.unitId, {
          view: 'summary',
          size: 50,
        });
      } else if (floor) {
        page = await accommodationApi.listRoomsByFloor(spaceId, floor.floorId, {
          view: 'summary',
          size: 50,
        });
      } else {
        setRooms([]);
        return;
      }
      const available =
        targetType === 'ROOM'
          ? page.content.filter(r => r.availableBeds >= r.bedCount && r.bedCount > 0)
          : page.content.filter(r => r.availableBeds > 0);
      setRooms(available);
    } catch (err) {
      setListError(getAccommodationErrorMessage(err, 'accommodation.errors.loadRooms'));
    } finally {
      setListLoading(false);
    }
  }, [building, floor, spaceId, targetType, unit]);

  const loadBeds = useCallback(async () => {
    if (!room) {
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const page = await accommodationApi.listBeds(spaceId, room.roomId, {
        view: 'summary',
        size: 50,
      });
      setBeds(page.content.filter(b => b.status === 'AVAILABLE'));
    } catch (err) {
      setListError(getAccommodationErrorMessage(err, 'accommodation.errors.loadBeds'));
    } finally {
      setListLoading(false);
    }
  }, [room, spaceId]);

  useEffect(() => {
    if (isSearchMode) {
      return;
    }
    if (step === 'floor') {
      void loadFloors();
    } else if (step === 'unit') {
      void loadUnits();
    } else if (step === 'room') {
      void loadRooms();
    } else if (step === 'bed') {
      void loadBeds();
    }
  }, [isSearchMode, loadBeds, loadFloors, loadRooms, loadUnits, step]);

  function goBack() {
    if (step === 'bed') {
      setStep('room');
      return;
    }
    if (step === 'room') {
      if (unit) {
        setStep('unit');
        setRoom(null);
      } else if (floor) {
        setStep('floor');
        setRoom(null);
      }
      return;
    }
    if (step === 'unit') {
      if (floor && profile?.showUnitsOnFloor) {
        setStep('floor');
        setUnit(null);
      } else {
        setStep('building');
        setBuilding(null);
        setUnit(null);
      }
      return;
    }
    if (step === 'floor') {
      setStep('building');
      setBuilding(null);
      setFloor(null);
      return;
    }
    if (step === 'building') {
      if (allowedTypes.length > 1) {
        setStep('targetType');
      }
      return;
    }
    handleDismiss();
  }

  function handleHeaderBack() {
    if (isRootStep()) {
      handleDismiss();
      return;
    }
    goBack();
  }

  function afterBuildingSelected(selected: BuildingResponse) {
    setBuilding(selected);
    const p = getAccommodationUiProfile(spaceType, selected.layoutMode);
    if (!p) {
      return;
    }
    if (targetType === 'UNIT') {
      setStep('unit');
      return;
    }
    if (targetType === 'ROOM' || targetType === 'BED') {
      if (p.showFloors && !p.showUnits) {
        setStep('floor');
      } else if (p.showUnits) {
        setStep(p.showUnitsOnFloor ? 'floor' : 'unit');
      }
    }
  }

  function afterFloorSelected(selected: FloorListItemResponse) {
    setFloor(selected);
    if (profile?.showUnitsOnFloor) {
      setStep('unit');
    } else {
      setStep('room');
    }
  }

  function afterUnitSelected(selected: UnitListItemResponse) {
    setUnit(selected);
    if (targetType === 'UNIT') {
      return;
    }
    setStep('room');
  }

  function afterRoomSelected(selected: RoomListItemResponse) {
    setRoom(selected);
    if (targetType === 'BED') {
      setStep('bed');
    }
  }

  function confirmSelection(
    selection: OccupancyTargetSelection,
    extras?: { expectedCheckoutDate?: string; remarks?: string },
  ) {
    if (interactionLocked) {
      return;
    }
    setSelecting(true);
    onConfirm(selection, extras);
  }

  function handleSelectBed(selected: BedListItemResponse) {
    if (!building) {
      return;
    }
    confirmSelection(
      {
        targetType: 'BED',
        buildingId: building.buildingId,
        buildingName: building.name,
        floorId: floor?.floorId,
        floorName: floor?.name,
        unitId: unit?.unitId,
        unitName: unit?.name,
        roomId: room?.roomId,
        roomName: room?.name,
        bedId: selected.bedId,
        bedName: selected.label,
      },
      {
        expectedCheckoutDate: expectedCheckoutDate.trim() || undefined,
        remarks: remarks.trim() || undefined,
      },
    );
  }

  function handleSelectRoom(selected: RoomListItemResponse) {
    if (!building || targetType !== 'ROOM') {
      return;
    }
    confirmSelection(
      {
        targetType: 'ROOM',
        buildingId: building.buildingId,
        buildingName: building.name,
        floorId: floor?.floorId,
        floorName: floor?.name,
        unitId: unit?.unitId,
        unitName: unit?.name,
        roomId: selected.roomId,
        roomName: selected.name,
      },
      {
        expectedCheckoutDate: expectedCheckoutDate.trim() || undefined,
        remarks: remarks.trim() || undefined,
      },
    );
  }

  function handleSelectUnit(selected: UnitListItemResponse) {
    if (!building || targetType !== 'UNIT') {
      return;
    }
    if (selected.status !== 'AVAILABLE') {
      return;
    }
    confirmSelection(
      {
        targetType: 'UNIT',
        buildingId: building.buildingId,
        buildingName: building.name,
        unitId: selected.unitId,
        unitName: selected.name,
      },
      {
        expectedCheckoutDate: expectedCheckoutDate.trim() || undefined,
        remarks: remarks.trim() || undefined,
      },
    );
  }

  function handleSearchResultPress(result: OccupancySearchResult) {
    confirmSelection(searchResultToSelection(result), {
      expectedCheckoutDate: expectedCheckoutDate.trim() || undefined,
      remarks: remarks.trim() || undefined,
    });
  }

  const stepTitle = useMemo(() => {
    if (isSearchMode) {
      return t('occupancy.picker.searchResults');
    }
    switch (step) {
      case 'targetType':
        return t('occupancy.picker.targetType');
      case 'building':
        return t('occupancy.picker.building');
      case 'floor':
        return t('occupancy.picker.floor');
      case 'unit':
        return t('occupancy.picker.unit');
      case 'room':
        return t('occupancy.picker.room');
      case 'bed':
        return t('occupancy.picker.bed');
      default:
        return title;
    }
  }, [isSearchMode, step, t, title]);

  const showExtrasOnRoom =
    showCheckoutDate && step === 'room' && targetType === 'ROOM';

  const availableUnits = units.filter(u => u.status === 'AVAILABLE');
  const activeError = searchError ?? listError;
  const showHierarchyLoader = !isSearchMode && listLoading;
  const showSearchLoader = isSearchMode && searchLoading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={handleHeaderBack} hitSlop={8} disabled={interactionLocked}>
              <Text style={styles.backText}>
                {isRootStep() ? t('common.cancel') : '‹ ' + t('common.back')}
              </Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.stepLabel}>{stepTitle}</Text>
          </View>

          <View style={styles.searchWrap}>
            <AccommodationSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('occupancy.picker.searchPlaceholder')}
            />
          </View>

          {activeError ? <Text style={styles.errorText}>{activeError}</Text> : null}

          {showSearchLoader || showHierarchyLoader ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}

          {isSearchMode && !showSearchLoader ? (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.key}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <SearchResultRow
                  result={item}
                  disabled={interactionLocked}
                  onPress={() => handleSearchResultPress(item)}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>{t('occupancy.picker.searchEmpty')}</Text>
              }
            />
          ) : null}

          {!isSearchMode && step === 'targetType' ? (
            <View style={styles.typeRow}>
              {allowedTypes.map(type => (
                <Button
                  key={type}
                  label={t(`occupancy.targetType.${type}`)}
                  variant={targetType === type ? 'primary' : 'secondary'}
                  onPress={() => {
                    setTargetType(type);
                    setStep('building');
                  }}
                  disabled={interactionLocked}
                  style={styles.typeButton}
                />
              ))}
            </View>
          ) : null}

          {!isSearchMode && step === 'building' && !showHierarchyLoader ? (
            <FlatList
              data={buildings}
              keyExtractor={item => item.buildingId}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.row, interactionLocked && styles.rowDisabled]}
                  onPress={() => afterBuildingSelected(item)}
                  disabled={interactionLocked}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>{t('accommodation.buildings.emptyTitle')}</Text>
              }
            />
          ) : null}

          {!isSearchMode && step === 'floor' && !showHierarchyLoader ? (
            <FlatList
              data={floors}
              keyExtractor={item => item.floorId}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.row, interactionLocked && styles.rowDisabled]}
                  onPress={() => afterFloorSelected(item)}
                  disabled={interactionLocked}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              )}
            />
          ) : null}

          {!isSearchMode && step === 'unit' && !showHierarchyLoader ? (
            <>
              {showCheckoutDate && targetType === 'UNIT' ? (
                <View style={styles.extras}>
                  <FormInput
                    label={t('occupancy.fields.expectedCheckout')}
                    value={expectedCheckoutDate}
                    onChangeText={setExpectedCheckoutDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <FormInput
                    label={t('occupancy.fields.remarks')}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder={t('occupancy.fields.remarksPlaceholder')}
                  />
                </View>
              ) : null}
              <FlatList
                data={availableUnits}
                keyExtractor={item => item.unitId}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.row, interactionLocked && styles.rowDisabled]}
                    onPress={() =>
                      targetType === 'UNIT' ? handleSelectUnit(item) : afterUnitSelected(item)
                    }
                    disabled={interactionLocked}>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>{item.name}</Text>
                      <AccommodationStatusBadge status={item.status} />
                    </View>
                    <Text style={styles.chevron}>{targetType === 'UNIT' ? '✓' : '›'}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.empty}>{t('occupancy.picker.noAvailable')}</Text>
                }
              />
            </>
          ) : null}

          {!isSearchMode && step === 'room' && !showHierarchyLoader ? (
            <>
              {showExtrasOnRoom ? (
                <View style={styles.extras}>
                  <FormInput
                    label={t('occupancy.fields.expectedCheckout')}
                    value={expectedCheckoutDate}
                    onChangeText={setExpectedCheckoutDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <FormInput
                    label={t('occupancy.fields.remarks')}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder={t('occupancy.fields.remarksPlaceholder')}
                  />
                </View>
              ) : null}
              <FlatList
                data={rooms}
                keyExtractor={item => item.roomId}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.row, interactionLocked && styles.rowDisabled]}
                    onPress={() =>
                      targetType === 'ROOM' ? handleSelectRoom(item) : afterRoomSelected(item)
                    }
                    disabled={interactionLocked}>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>{item.name}</Text>
                      <Text style={styles.rowSub}>
                        {t('accommodation.listItem.room', {
                          type: t(`accommodation.roomType.${item.roomType}`),
                          bedCount: item.bedCount,
                          availableBeds: item.availableBeds,
                          occupiedBeds: item.occupiedBeds,
                        })}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>{targetType === 'ROOM' ? '✓' : '›'}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.empty}>{t('occupancy.picker.noAvailable')}</Text>
                }
              />
            </>
          ) : null}

          {!isSearchMode && step === 'bed' && !showHierarchyLoader ? (
            <>
              {showCheckoutDate ? (
                <View style={styles.extras}>
                  <FormInput
                    label={t('occupancy.fields.expectedCheckout')}
                    value={expectedCheckoutDate}
                    onChangeText={setExpectedCheckoutDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <FormInput
                    label={t('occupancy.fields.remarks')}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder={t('occupancy.fields.remarksPlaceholder')}
                  />
                </View>
              ) : null}
              <FlatList
                data={beds}
                keyExtractor={item => item.bedId}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.row, interactionLocked && styles.rowDisabled]}
                    onPress={() => handleSelectBed(item)}
                    disabled={interactionLocked}>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>
                        {t('accommodation.beds.bedNumber', { value: item.label })}
                      </Text>
                      <AccommodationStatusBadge status={item.status} />
                    </View>
                    <Text style={styles.chevron}>✓</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.empty}>{t('occupancy.picker.noAvailable')}</Text>
                }
              />
            </>
          ) : null}

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
    paddingBottom: spacing.xl,
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
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  typeRow: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  typeButton: {
    width: '100%',
  },
  loader: {
    marginVertical: spacing.lg,
  },
  list: {
    flexGrow: 1,
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
  chevron: {
    fontSize: 20,
    color: colors.muted,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  extras: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
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
