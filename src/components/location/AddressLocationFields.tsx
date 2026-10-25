import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { locationsApi } from '../../api/locationsApi';
import { FormInput } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  AUTOCOMPLETE_MIN_LENGTH,
  addressCaptureIssue,
  captureFromSuggestion,
  suggestionDetail,
  suggestionKey,
  suggestionTitle,
  withAddressQuery,
  type AddressCapture,
  type LocationAutocompleteSuggestion,
} from '../../utils/locationAutocomplete';

type AddressLocationFieldsProps = {
  value: AddressCapture;
  onChange: (value: AddressCapture) => void;
  required?: boolean;
  requireBuilding?: boolean;
  showBuildingName?: boolean;
  allowManual?: boolean;
  pincodeRequired?: boolean;
  disabled?: boolean;
  error?: string | null;
};

export function AddressLocationFields({
  value,
  onChange,
  required = false,
  requireBuilding = false,
  showBuildingName = true,
  allowManual = false,
  pincodeRequired = false,
  disabled = false,
  error,
}: AddressLocationFieldsProps) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<LocationAutocompleteSuggestion[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const issue = addressCaptureIssue(value, { required, requireBuilding, pincodeRequired, allowManual });

  useEffect(() => {
    if (disabled || value.selected) {
      setSuggestions([]);
      setStatus('idle');
      return;
    }
    const text = value.query.trim();
    if (text.length < AUTOCOMPLETE_MIN_LENGTH) {
      setSuggestions([]);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setStatus('loading');
      locationsApi
        .autocompleteAddress(text)
        .then(rows => {
          if (cancelled) return;
          const next = rows.filter(row => captureFromSuggestion(value, row));
          setSuggestions(next);
          setStatus(next.length ? 'ready' : 'empty');
        })
        .catch(() => {
          if (cancelled) return;
          setSuggestions([]);
          setStatus('error');
        });
    }, AUTOCOMPLETE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [disabled, value]);

  const summary = [value.locality, value.city, value.state].filter(Boolean).join(', ');
  const fieldError =
    error ||
    (issue === 'building'
      ? t('locationCapture.buildingRequired', { defaultValue: 'Enter the apartment or building name.' })
      : issue === 'selection'
        ? t('locationCapture.selectionRequired', { defaultValue: 'Select a location from the suggestions.' })
        : issue === 'pincode'
          ? t('locationCapture.pincodeRequired', { defaultValue: 'Enter a valid 6-digit pincode.' })
          : null);

  return (
    <View style={styles.wrap}>
      {showBuildingName ? (
        <FormInput
          label={t('locationCapture.buildingName', { defaultValue: 'Apartment / Building name' })}
          placeholder={t('locationCapture.buildingPlaceholder', { defaultValue: 'e.g. Sunrise Residency' })}
          value={value.buildingName}
          editable={!disabled}
          onChangeText={buildingName => onChange({ ...value, buildingName })}
          error={issue === 'building' ? fieldError : null}
        />
      ) : null}
      <FormInput
        label={t('locationCapture.searchLabel', { defaultValue: 'Search location' })}
        placeholder={t('locationCapture.searchPlaceholder', {
          defaultValue: 'Search building, road, area, locality or landmark',
        })}
        value={value.query}
        editable={!disabled}
        autoCorrect={false}
        autoCapitalize="words"
        onChangeText={query => onChange(withAddressQuery(value, query))}
        error={issue === 'selection' || issue === 'pincode' ? fieldError : error}
      />
      {status !== 'idle' && !value.selected ? (
        <View style={styles.list}>
          {status === 'loading' ? (
            <Text style={styles.status}>
              {t('locationCapture.searching', { defaultValue: 'Searching locations...' })}
            </Text>
          ) : null}
          {status === 'empty' ? (
            <Text style={styles.status}>
              {t('locationCapture.empty', {
                defaultValue: 'No locations found. Try a road, area, locality or city.',
              })}
            </Text>
          ) : null}
          {status === 'error' ? (
            <Text style={styles.errorText}>
              {t('locationCapture.failed', { defaultValue: 'Unable to search locations. Please try again.' })}
            </Text>
          ) : null}
          {status === 'ready'
            ? suggestions.map((suggestion, index) => (
                <Pressable
                  key={suggestionKey(suggestion, index)}
                  onPress={() => {
                    const next = captureFromSuggestion(value, suggestion);
                    if (next) onChange(next);
                  }}
                  style={styles.option}>
                  <Text style={styles.optionTitle}>{suggestionTitle(suggestion)}</Text>
                  {suggestionDetail(suggestion) ? (
                    <Text style={styles.optionDetail}>{suggestionDetail(suggestion)}</Text>
                  ) : null}
                </Pressable>
              ))
            : null}
        </View>
      ) : null}
      {value.selected ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmTitle}>
            {t('locationCapture.selected', { defaultValue: 'Location selected' })}
          </Text>
          {value.buildingName.trim() ? <Text style={styles.building}>{value.buildingName.trim()}</Text> : null}
          <Text style={styles.address}>{value.address}</Text>
          {summary ? (
            <Text style={styles.meta}>{[summary, value.pincode].filter(Boolean).join(' - ')}</Text>
          ) : null}
          {value.latitude != null && value.longitude != null ? (
            <Text style={styles.meta}>
              {`Latitude: ${value.latitude} · Longitude: ${value.longitude}`}
            </Text>
          ) : null}
          {disabled ? null : (
            <Pressable onPress={() => onChange(withAddressQuery({ ...value, query: '' }, ''))}>
              <Text style={styles.change}>
                {t('locationCapture.change', { defaultValue: 'Change location' })}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
      {value.selected && pincodeRequired && !value.pincode ? (
        <FormInput
          label={t('locationCapture.pincode', { defaultValue: 'Pincode' })}
          value={value.pincode}
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={text => onChange({ ...value, pincode: text.replace(/\D/g, '').slice(0, 6) })}
          error={issue === 'pincode' ? fieldError : null}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  status: { ...typography.body, color: colors.textSecondary, padding: spacing.md },
  errorText: { ...typography.body, color: colors.danger, padding: spacing.md },
  option: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  optionTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  optionDetail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  confirm: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: 4,
  },
  confirmTitle: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  building: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  address: { ...typography.body, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  change: { ...typography.caption, color: colors.primary, fontWeight: '700', marginTop: 4 },
});
