import React, { useEffect, useState } from 'react';
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
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { locationsApi } from '../../api/locationsApi';
import type { LocationRecord } from '../../api/types';
import { ListSearchBar } from '../ui';
import {
  formatDiscoverLocationContext,
  locationRecordKey,
  toSelectedDiscoverLocation,
  type SelectedDiscoverLocation,
} from '../../utils/discoverLocation';
import { colors, spacing, typography } from '../../theme';

const SEARCH_DEBOUNCE_MS = 300;

type LocationRankingContext = {
  state?: string;
  district?: string;
  taluk?: string;
};

type DiscoverLocationSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: SelectedDiscoverLocation) => void;
  rankingContext?: LocationRankingContext;
};

type BrowseLevel = 'search' | 'states' | 'districts' | 'talukas' | 'areas';
type LoadState = 'idle' | 'loading' | 'error';

export function DiscoverLocationSheet({
  visible,
  onClose,
  onSelect,
  rankingContext,
}: DiscoverLocationSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState<LocationRecord[]>([]);
  const [searchState, setSearchState] = useState<LoadState>('idle');
  const [browseLevel, setBrowseLevel] = useState<BrowseLevel>('search');
  const [browseItems, setBrowseItems] = useState<string[]>([]);
  const [browseAreas, setBrowseAreas] = useState<LocationRecord[]>([]);
  const [browseState, setBrowseState] = useState<LoadState>('idle');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTaluk, setSelectedTaluk] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSearch('');
    setDebouncedSearch('');
    setResults([]);
    setSearchState('idle');
    setBrowseLevel('search');
    setBrowseItems([]);
    setBrowseAreas([]);
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedTaluk('');
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, visible]);

  useEffect(() => {
    if (!visible || debouncedSearch.length < 2) {
      setResults([]);
      setSearchState('idle');
      return;
    }
    let active = true;
    setSearchState('loading');
    locationsApi
      .search(debouncedSearch, {
        state: selectedState || rankingContext?.state,
        district: selectedDistrict || rankingContext?.district,
        taluk: selectedTaluk || rankingContext?.taluk,
      })
      .then(next => {
        if (active) {
          setResults(next);
          setSearchState('idle');
        }
      })
      .catch(() => {
        if (active) {
          setSearchState('error');
        }
      });
    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    rankingContext?.district,
    rankingContext?.state,
    rankingContext?.taluk,
    selectedDistrict,
    selectedState,
    selectedTaluk,
    visible,
  ]);

  const loadBrowse = (loader: () => Promise<string[] | LocationRecord[]>, level: BrowseLevel) => {
    setBrowseLevel(level);
    setBrowseState('loading');
    setBrowseItems([]);
    setBrowseAreas([]);
    loader()
      .then(next => {
        if (level === 'areas') {
          setBrowseAreas(next as LocationRecord[]);
        } else {
          setBrowseItems(next as string[]);
        }
        setBrowseState('idle');
      })
      .catch(() => {
        setBrowseState('error');
      });
  };

  const openBrowse = () => {
    setSearch('');
    setDebouncedSearch('');
    loadBrowse(() => locationsApi.listStates(), 'states');
  };

  const goBackBrowse = () => {
    if (browseLevel === 'areas') {
      setSelectedTaluk('');
      loadBrowse(
        () => locationsApi.listTalukas(selectedState, selectedDistrict),
        'talukas',
      );
      return;
    }
    if (browseLevel === 'talukas') {
      setSelectedDistrict('');
      setSelectedTaluk('');
      loadBrowse(() => locationsApi.listDistricts(selectedState), 'districts');
      return;
    }
    if (browseLevel === 'districts') {
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedTaluk('');
      loadBrowse(() => locationsApi.listStates(), 'states');
      return;
    }
    setBrowseLevel('search');
  };

  const chooseLocation = (record: LocationRecord) => {
    onSelect(toSelectedDiscoverLocation(record));
    onClose();
  };

  const browsing = browseLevel !== 'search';
  const showSearchResults = debouncedSearch.length >= 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          {browsing ? (
            <Pressable
              onPress={goBackBrowse}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}>
              <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
          ) : null}
          <Text style={styles.title}>{t('spaces.findPlace.chooseLocation')}</Text>
        </View>

        <ListSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('spaces.findPlace.locationSearchPlaceholder')}
        />
        {!browsing ? (
          <Pressable
            onPress={openBrowse}
            style={styles.browseLink}
            accessibilityRole="button">
            <Text style={styles.browseLinkText}>{t('spaces.findPlace.locationBrowse')}</Text>
          </Pressable>
        ) : (
          <Text style={styles.browseHint}>
            {browseLevel === 'states'
              ? t('spaces.findPlace.browseStates')
              : browseLevel === 'districts'
                ? t('spaces.findPlace.browseDistricts')
                : browseLevel === 'talukas'
                  ? t('spaces.findPlace.browseTalukas')
                  : t('spaces.findPlace.browseAreas')}
          </Text>
        )}

        {showSearchResults ? (
          searchState === 'loading' ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : searchState === 'error' ? (
            <Text style={styles.errorText}>{t('spaces.findPlace.locationSearchFailed')}</Text>
          ) : results.length === 0 ? (
            <Text style={styles.hintText}>{t('spaces.findPlace.locationNoResults')}</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={locationRecordKey}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <LocationResultRow record={item} onPress={() => chooseLocation(item)} />
              )}
              style={styles.list}
            />
          )
        ) : null}

        {browsing && !showSearchResults ? (
          browseState === 'loading' ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : browseState === 'error' ? (
            <Text style={styles.errorText}>{t('spaces.findPlace.locationSearchFailed')}</Text>
          ) : browseLevel === 'areas' ? (
            <FlatList
              data={browseAreas}
              keyExtractor={locationRecordKey}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <LocationResultRow record={item} onPress={() => chooseLocation(item)} />
              )}
              style={styles.list}
            />
          ) : (
            <FlatList
              data={browseItems}
              keyExtractor={item => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    if (browseLevel === 'states') {
                      setSelectedState(item);
                      setSelectedDistrict('');
                      setSelectedTaluk('');
                      loadBrowse(() => locationsApi.listDistricts(item), 'districts');
                    } else if (browseLevel === 'districts') {
                      setSelectedDistrict(item);
                      setSelectedTaluk('');
                      loadBrowse(
                        () => locationsApi.listTalukas(selectedState, item),
                        'talukas',
                      );
                    } else {
                      setSelectedTaluk(item);
                      loadBrowse(
                        () => locationsApi.listAreas(selectedState, selectedDistrict, item),
                        'areas',
                      );
                    }
                  }}
                  style={styles.plainRow}
                  accessibilityRole="button"
                  accessibilityLabel={item}>
                  <Text style={styles.plainRowText}>{item}</Text>
                </Pressable>
              )}
              style={styles.list}
            />
          )
        ) : null}

        {!showSearchResults && !browsing ? (
          <Text style={styles.hintText}>{t('spaces.findPlace.locationBrowseHint')}</Text>
        ) : null}
      </View>
    </Modal>
  );
}

function LocationResultRow({
  record,
  onPress,
}: {
  record: LocationRecord;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.resultRow}
      accessibilityRole="button"
      accessibilityLabel={`${record.location}, ${formatDiscoverLocationContext(record)}, ${record.pincode}`}>
      <View style={styles.pinWrap}>
        <MapPin size={16} color={colors.primaryDark} strokeWidth={2.2} />
      </View>
      <View style={styles.resultCopy}>
        <Text style={styles.resultTitle}>{record.location}</Text>
        <Text style={styles.resultMeta}>{formatDiscoverLocationContext(record)}</Text>
        <Text style={styles.resultPin}>{record.pincode}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
  },
  browseLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  browseLinkText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  browseHint: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: 360,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  hintText: {
    ...typography.caption,
    color: colors.muted,
    marginVertical: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginVertical: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pinWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCopy: {
    flex: 1,
  },
  resultTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  resultMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultPin: {
    ...typography.caption,
    color: colors.muted,
  },
  plainRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  plainRowText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
