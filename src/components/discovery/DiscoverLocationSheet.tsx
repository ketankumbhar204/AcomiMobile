import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Map, MapPin, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { locationsApi } from '../../api/locationsApi';
import type { LocationRecord } from '../../api/types';
import { ListSearchBar } from '../ui';
import { toSelectedDiscoverLocation, type SelectedDiscoverLocation } from '../../utils/discoverLocation';
import { colors, radius, spacing, typography } from '../../theme';
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  AUTOCOMPLETE_MIN_LENGTH,
  suggestionDetail,
  suggestionKey,
  suggestionTitle,
  suggestionToLocationRecord,
  type LocationAutocompleteSuggestion,
} from '../../utils/locationAutocomplete';

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

type LoadState = 'idle' | 'loading' | 'error';
type PickerMode = 'search' | 'browse';

function recordDetail(record: LocationRecord): string {
  const place = [record.cityTaluka, record.district].filter(Boolean).join(', ');
  return [place, record.pincode].filter(Boolean).join(' • ');
}

function sameState(record: LocationRecord, state: string): boolean {
  return record.state.trim().toLowerCase() === state.trim().toLowerCase();
}

export function DiscoverLocationSheet({
  visible,
  onClose,
  onSelect,
  rankingContext,
}: DiscoverLocationSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<PickerMode>('search');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState<LocationAutocompleteSuggestion[]>([]);
  const [retryToken, setRetryToken] = useState(0);
  const [searchState, setSearchState] = useState<LoadState>('idle');
  const [searchPick, setSearchPick] = useState<LocationAutocompleteSuggestion | null>(null);
  const [stateName, setStateName] = useState('');
  const [areaPick, setAreaPick] = useState<LocationRecord | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [browseQuery, setBrowseQuery] = useState('');
  const [debouncedBrowse, setDebouncedBrowse] = useState('');
  const [browseHits, setBrowseHits] = useState<LocationRecord[]>([]);
  const [browseSearchState, setBrowseSearchState] = useState<LoadState>('idle');
  const [browseRetry, setBrowseRetry] = useState(0);
  const [browseLoad, setBrowseLoad] = useState<LoadState>('idle');
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    setMode('search');
    setSearch('');
    setDebouncedSearch('');
    setResults([]);
    setSearchState('idle');
    setSearchPick(null);
    setStateName('');
    setAreaPick(null);
    setStates([]);
    setBrowseQuery('');
    setDebouncedBrowse('');
    setBrowseHits([]);
    setBrowseSearchState('idle');
    setStateMenuOpen(false);
    setMenuQuery('');
    setBrowseLoad('idle');
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), AUTOCOMPLETE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, visible]);

  useEffect(() => {
    if (!visible || mode !== 'search' || debouncedSearch.length < AUTOCOMPLETE_MIN_LENGTH) {
      setResults([]);
      setSearchState('idle');
      return;
    }
    let active = true;
    setSearchState('loading');
    locationsApi
      .autocomplete(debouncedSearch, {
        state: rankingContext?.state,
        district: rankingContext?.district,
      })
      .then(next => {
        if (!active) return;
        setResults(Array.isArray(next) ? next : []);
        setSearchState('idle');
      })
      .catch(() => {
        if (!active) return;
        setResults([]);
        setSearchState('error');
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch, mode, rankingContext?.district, rankingContext?.state, retryToken, visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setDebouncedBrowse(browseQuery.trim()), AUTOCOMPLETE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [browseQuery, visible]);

  useEffect(() => {
    if (!visible || mode !== 'browse' || !stateName || debouncedBrowse.length < AUTOCOMPLETE_MIN_LENGTH) {
      return;
    }
    let active = true;
    setBrowseSearchState('loading');
    locationsApi
      .search(debouncedBrowse, { state: stateName })
      .then(next => {
        if (!active) return;
        const rows = Array.isArray(next) ? next : [];
        setBrowseHits(rows.filter(record => sameState(record, stateName) && record.location));
        setBrowseSearchState('idle');
      })
      .catch(() => {
        if (!active) return;
        setBrowseHits([]);
        setBrowseSearchState('error');
      });
    return () => {
      active = false;
    };
  }, [browseRetry, debouncedBrowse, mode, stateName, visible]);

  const enterBrowse = () => {
    Keyboard.dismiss();
    setMode('browse');
    setSearchPick(null);
    setStateMenuOpen(false);
    if (states.length > 0) return;
    setBrowseLoad('loading');
    locationsApi
      .listStates()
      .then(next => {
        setStates(next);
        setBrowseLoad('idle');
      })
      .catch(() => setBrowseLoad('error'));
  };

  const enterSearch = () => {
    setMode('search');
    setStateMenuOpen(false);
    setResults([]);
    setSearchPick(null);
    setSearchState('idle');
  };

  const chooseState = (value: string) => {
    setStateName(value);
    setAreaPick(null);
    setBrowseQuery('');
    setDebouncedBrowse('');
    setBrowseHits([]);
    setBrowseSearchState('idle');
    setStateMenuOpen(false);
    setMenuQuery('');
  };

  const searchRecord = searchPick ? suggestionToLocationRecord(searchPick) : null;
  const canConfirm = mode === 'search' ? Boolean(searchRecord?.location) : Boolean(areaPick?.location);
  const showSearchResults = mode === 'search' && !searchPick && debouncedSearch.length >= AUTOCOMPLETE_MIN_LENGTH;
  const showBrowseResults =
    mode === 'browse' && Boolean(stateName) && !areaPick && debouncedBrowse.length >= AUTOCOMPLETE_MIN_LENGTH;

  const confirm = () => {
    if (mode === 'search' && searchRecord?.location) {
      onSelect(toSelectedDiscoverLocation(searchRecord));
      onClose();
      return;
    }
    if (mode === 'browse' && areaPick?.location) {
      onSelect(toSelectedDiscoverLocation(areaPick));
      onClose();
    }
  };

  const needle = menuQuery.trim().toLowerCase();
  const filteredStates = needle ? states.filter(item => item.toLowerCase().includes(needle)) : states;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('spaces.findPlace.chooseLocation')}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <X size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
        <Text style={styles.intro}>{t('spaces.findPlace.locationSearchIntro')}</Text>
        <View style={styles.tabs}>
          <Pressable
            onPress={enterSearch}
            style={[styles.tab, mode === 'search' && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'search' }}
            accessibilityLabel={t('spaces.findPlace.locationSearchTab')}>
            <Text style={[styles.tabText, mode === 'search' && styles.tabTextActive]}>
              {t('spaces.findPlace.locationSearchTab')}
            </Text>
          </Pressable>
          <Pressable
            onPress={enterBrowse}
            style={[styles.tab, mode === 'browse' && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'browse' }}
            accessibilityLabel={t('spaces.findPlace.locationBrowseTab')}>
            <Map size={14} color={mode === 'browse' ? colors.tealDark : colors.muted} />
            <Text style={[styles.tabText, mode === 'browse' && styles.tabTextActive]}>
              {t('spaces.findPlace.locationBrowseTab')}
            </Text>
          </Pressable>
        </View>

        {mode === 'search' ? (
          <View style={styles.panel}>
            <ListSearchBar
              value={search}
              onChangeText={value => {
                setSearch(value);
                setSearchPick(null);
              }}
              placeholder={t('spaces.findPlace.locationSearchPlaceholder')}
            />
            {searchPick ? (
              <View style={styles.selectedCard}>
                <MapPin size={16} color={colors.primaryDark} />
                <View style={styles.resultCopy}>
                  <Text style={styles.resultTitle}>{suggestionTitle(searchPick)}</Text>
                  <Text style={styles.resultMeta}>
                    {[suggestionDetail(searchPick), searchPick.pincode].filter(Boolean).join(' • ')}
                  </Text>
                </View>
              </View>
            ) : null}
            {showSearchResults ? (
              searchState === 'loading' ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.hintText}>{t('spaces.findPlace.locationSearchingLocations')}</Text>
                </View>
              ) : searchState === 'error' ? (
                <View>
                  <Text style={styles.errorText}>{t('spaces.findPlace.locationAutocompleteUnavailable')}</Text>
                  <Pressable onPress={() => setRetryToken(current => current + 1)} accessibilityRole="button">
                    <Text style={styles.retry}>{t('spaces.findPlace.locationRetry')}</Text>
                  </Pressable>
                </View>
              ) : results.length === 0 ? (
                <Text style={styles.hintText}>{t('spaces.findPlace.locationAutocompleteEmpty')}</Text>
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(item, index) => suggestionKey(item, index)}
                  keyboardShouldPersistTaps="handled"
                  style={styles.list}
                  renderItem={({ item }) => {
                    const title = suggestionTitle(item);
                    if (!title) return null;
                    const detail = [suggestionDetail(item), item.pincode].filter(Boolean).join(' • ');
                    return (
                      <Pressable
                        onPress={() => setSearchPick(item)}
                        style={styles.resultRow}
                        accessibilityRole="button"
                        accessibilityLabel={[title, detail].filter(Boolean).join(', ')}>
                        <View style={styles.pinWrap}>
                          <MapPin size={16} color={colors.primaryDark} />
                        </View>
                        <View style={styles.resultCopy}>
                          <Text style={styles.resultTitle}>{title}</Text>
                          {detail ? <Text style={styles.resultMeta}>{detail}</Text> : null}
                        </View>
                      </Pressable>
                    );
                  }}
                />
              )
            ) : null}
            <Text style={styles.attribution}>
              <Text style={styles.attributionLink} onPress={() => Linking.openURL('https://www.geoapify.com/')}>
                {t('spaces.findPlace.locationAttributionGeoapify')}
              </Text>
              {' · '}
              <Text
                style={styles.attributionLink}
                onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}>
                {t('spaces.findPlace.locationAttributionOsm')}
              </Text>
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.panel} keyboardShouldPersistTaps="handled">
            <Field
              label={t('spaces.findPlace.locationStateLabel')}
              value={stateName}
              placeholder={t('spaces.findPlace.locationSelectState')}
              disabled={false}
              open={stateMenuOpen}
              query={menuQuery}
              onQuery={setMenuQuery}
              onOpen={() => {
                if (!stateMenuOpen) setStateMenuOpen(true);
              }}
              onToggle={() => {
                setMenuQuery('');
                setStateMenuOpen(open => !open);
              }}
            />
            {stateMenuOpen ? (
              filteredStates.length === 0 ? (
                <Text style={styles.hintText}>{t('spaces.findPlace.locationAutocompleteEmpty')}</Text>
              ) : (
                filteredStates.map(item => (
                  <Pressable
                    key={item}
                    onPress={() => chooseState(item)}
                    style={styles.plainRow}
                    accessibilityRole="button"
                    accessibilityLabel={item}>
                    <Text style={styles.plainRowText}>{item}</Text>
                  </Pressable>
                ))
              )
            ) : (
              <>
                <ListSearchBar
                  value={browseQuery}
                  onChangeText={value => {
                    setBrowseQuery(value);
                    setAreaPick(null);
                  }}
                  placeholder={t('spaces.findPlace.locationSearchPlaceholder')}
                  editable={Boolean(stateName)}
                />
                {areaPick ? (
                  <View style={styles.selectedCard}>
                    <MapPin size={16} color={colors.primaryDark} />
                    <View style={styles.resultCopy}>
                      <Text style={styles.resultTitle}>{areaPick.location}</Text>
                      <Text style={styles.resultMeta}>{recordDetail(areaPick)}</Text>
                    </View>
                  </View>
                ) : null}
                {showBrowseResults ? (
                  browseSearchState === 'loading' ? (
                    <View style={styles.statusRow}>
                      <ActivityIndicator color={colors.primary} />
                      <Text style={styles.hintText}>{t('spaces.findPlace.locationSearchingLocations')}</Text>
                    </View>
                  ) : browseSearchState === 'error' ? (
                    <View>
                      <Text style={styles.errorText}>{t('spaces.findPlace.locationAutocompleteUnavailable')}</Text>
                      <Pressable onPress={() => setBrowseRetry(current => current + 1)} accessibilityRole="button">
                        <Text style={styles.retry}>{t('spaces.findPlace.locationRetry')}</Text>
                      </Pressable>
                    </View>
                  ) : browseHits.length === 0 ? (
                    <Text style={styles.hintText}>{t('spaces.findPlace.locationAutocompleteEmpty')}</Text>
                  ) : (
                    browseHits.map(record => {
                      const detail = recordDetail(record);
                      return (
                        <Pressable
                          key={[record.location, record.pincode, record.cityTaluka, record.district].join('|')}
                          onPress={() => setAreaPick(record)}
                          style={styles.resultRow}
                          accessibilityRole="button"
                          accessibilityLabel={[record.location, detail].filter(Boolean).join(', ')}>
                          <View style={styles.pinWrap}>
                            <MapPin size={16} color={colors.primaryDark} />
                          </View>
                          <View style={styles.resultCopy}>
                            <Text style={styles.resultTitle}>{record.location}</Text>
                            {detail ? <Text style={styles.resultMeta}>{detail}</Text> : null}
                          </View>
                        </Pressable>
                      );
                    })
                  )
                ) : null}
              </>
            )}
            {browseLoad === 'loading' ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
            {browseLoad === 'error' ? (
              <Pressable onPress={enterBrowse} accessibilityRole="button">
                <Text style={styles.retry}>{t('spaces.findPlace.locationRetry')}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}

        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.cancelButton} accessibilityRole="button">
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={confirm}
            disabled={!canConfirm}
            style={[styles.confirmButton, !canConfirm && styles.confirmDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canConfirm }}>
            <Text style={styles.confirmText}>
              {mode === 'browse'
                ? t('spaces.findPlace.locationApplyAction')
                : t('spaces.findPlace.locationSelectAction')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  placeholder,
  disabled,
  open,
  query,
  onQuery,
  onOpen,
  onToggle,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  open: boolean;
  query: string;
  onQuery: (value: string) => void;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldButton, disabled && styles.fieldDisabled, open && styles.fieldOpen]}>
        <TextInput
          editable={!disabled}
          value={open ? query : value}
          placeholder={open ? label : placeholder}
          placeholderTextColor={colors.muted}
          onFocus={() => {
            if (!open) {
              onQuery('');
              onOpen();
            }
          }}
          onChangeText={text => {
            onQuery(text);
            if (!open) onOpen();
          }}
          style={value || open ? styles.fieldValue : styles.fieldPlaceholder}
          accessibilityLabel={label}
        />
        <Pressable onPress={onToggle} disabled={disabled} hitSlop={8} accessibilityRole="button" accessibilityLabel={placeholder}>
          <ChevronDown size={16} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '86%',
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.h3, fontSize: 18, color: colors.textPrimary, flex: 1 },
  intro: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  tabActive: { backgroundColor: colors.mintSubtle, borderColor: colors.primary },
  tabText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  tabTextActive: { color: colors.tealDark, fontWeight: '700' },
  panel: { maxHeight: 360 },
  list: { maxHeight: 280 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  hintText: { ...typography.caption, color: colors.muted, marginVertical: spacing.md },
  errorText: { ...typography.caption, color: colors.danger, marginVertical: spacing.sm },
  retry: { ...typography.caption, color: colors.primaryDark, fontWeight: '700', marginBottom: spacing.sm },
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
  resultCopy: { flex: 1 },
  resultTitle: { ...typography.bodyStrong, fontSize: 14, color: colors.textPrimary },
  resultMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  selectedCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.selected,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  attribution: { ...typography.caption, color: colors.muted, marginTop: spacing.sm },
  attributionLink: { ...typography.caption, color: colors.muted, textDecorationLine: 'underline' },
  field: { marginBottom: spacing.md },
  fieldLabel: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  fieldButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldDisabled: { backgroundColor: colors.section },
  fieldValue: { ...typography.body, color: colors.textPrimary, flex: 1 },
  fieldPlaceholder: { ...typography.body, color: colors.muted, flex: 1 },
  loader: { marginVertical: spacing.sm },
  fieldOpen: { borderColor: colors.primary },
  plainRowText: { ...typography.body, color: colors.textPrimary },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.md },
  cancelButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...typography.bodyStrong, color: colors.primaryDark },
  confirmButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: { opacity: 0.45 },
  confirmText: { ...typography.bodyStrong, color: colors.white },
});
