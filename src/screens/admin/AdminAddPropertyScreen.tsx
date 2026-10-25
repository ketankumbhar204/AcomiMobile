import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, IndianRupee, UserRound } from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import type { AdminCreatePropertyRegistrationRequest, SpaceType } from '../../api/types';
import { defaultPriceBasis, type ListingPriceBasis } from '../../utils/priceBasis';
import {
  AdminFormHero,
  AdminFormSection,
  AdminSavedAddressPicker,
  AdminTestLeadToggle,
  adminErrorBanner,
} from '../../components/admin';
import { AddressLocationFields } from '../../components/location/AddressLocationFields';
import { FormInput, SpaceTypePicker } from '../../components/ui';
import { PriceBasisPicker } from '../../components/ui/PriceBasisPicker';
import {
  EMPTY_ADDRESS_CAPTURE,
  addressCaptureIssue,
  captureFromParts,
} from '../../utils/locationAutocomplete';
import { StickyFormActions } from '../../components/progressive';
import type { AdminStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { isValidIndianMobile } from '../../utils/indianMobile';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminAddProperty'>;

const PROPERTY_TYPES: SpaceType[] = ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL', 'CORPORATE_STAY'];

function isValidPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value);
}

function isValidMapUrl(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function AdminAddPropertyScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [propertyType, setPropertyType] = useState<SpaceType | null>('PG');
  const [propertyName, setPropertyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobileNumber, setAlternateMobileNumber] = useState('');
  const [location, setLocation] = useState(EMPTY_ADDRESS_CAPTURE);
  const [startingPrice, setStartingPrice] = useState('');
  const [priceBasis, setPriceBasis] = useState<ListingPriceBasis>(defaultPriceBasis('PG') ?? 'PER_BED');
  const [description, setDescription] = useState('');
  const [capacityEstimate, setCapacityEstimate] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');
  const [testLead, setTestLead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    Keyboard.dismiss();
    setError(null);

    if (mobileNumber.trim() && !isValidIndianMobile(mobileNumber)) {
      setError(t('admin.property.errors.mobile'));
      return;
    }
    if (alternateMobileNumber.trim() && !isValidIndianMobile(alternateMobileNumber)) {
      setError(t('admin.property.errors.alternateMobile'));
      return;
    }
    if (
      mobileNumber.trim() &&
      alternateMobileNumber.trim() &&
      mobileNumber.trim() === alternateMobileNumber.trim()
    ) {
      setError(t('admin.property.errors.alternateDifferent'));
      return;
    }
    const locationIssue = addressCaptureIssue(location, { allowManual: true });
    if (locationIssue === 'selection') {
      setError(t('locationCapture.selectionRequired', { defaultValue: 'Select a location from the suggestions.' }));
      return;
    }
    if (locationIssue === 'pincode' || (location.pincode.trim() && !isValidPincode(location.pincode.trim()))) {
      setError(t('admin.property.errors.pincode'));
      return;
    }
    if (location.mapUrl.trim() && !isValidMapUrl(location.mapUrl)) {
      setError(t('admin.property.errors.mapUrl'));
      return;
    }

    let price: number | undefined;
    if (startingPrice.trim()) {
      price = Number(startingPrice);
      if (!Number.isFinite(price) || price < 0) {
        setError(t('admin.property.errors.startingPrice'));
        return;
      }
    }

    let capacity: number | undefined;
    if (capacityEstimate.trim()) {
      capacity = Number(capacityEstimate);
      if (!Number.isFinite(capacity) || capacity < 0 || !Number.isInteger(capacity)) {
        setError(
          t('admin.property.errors.capacity', {
            defaultValue: 'Enter a valid capacity estimate, or leave it blank.',
          }),
        );
        return;
      }
    }

    const amenities = amenitiesText
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(label => ({
        code: label
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/^_|_$/g, ''),
        label,
      }))
      .filter(item => item.code.length > 0);

    const payload: AdminCreatePropertyRegistrationRequest = {
      propertyType: (propertyType ?? 'PG') as Exclude<SpaceType, 'MESS'>,
    };
    const name = optionalText(propertyName);
    const owner = optionalText(ownerName);
    const mobile = optionalText(mobileNumber);
    const alternateMobile = optionalText(alternateMobileNumber);
    const address = optionalText(location.selected ? location.address : location.query);
    const cityValue = optionalText(location.city);
    const stateValue = optionalText(location.state);
    const pincodeValue = optionalText(location.pincode);
    const map = optionalText(location.mapUrl);
    const descriptionValue = optionalText(description);
    if (name) payload.propertyName = name;
    if (owner) payload.ownerName = owner;
    if (descriptionValue) payload.description = descriptionValue;
    if (mobile) payload.mobileNumber = mobile;
    if (alternateMobile) payload.alternateMobileNumber = alternateMobile;
    if (address) payload.addressLine = address;
    if (cityValue) payload.city = cityValue;
    if (stateValue) payload.state = stateValue;
    if (pincodeValue) payload.pincode = pincodeValue;
    if (map) payload.mapUrl = map;
    if (location.latitude != null && location.longitude != null) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
    }
    if (price !== undefined) payload.startingPrice = price;
    payload.priceBasis = priceBasis;
    if (capacity !== undefined) payload.capacityEstimate = capacity;
    if (amenities.length > 0) payload.amenities = amenities;
    if (testLead) payload.testLead = true;

    setLoading(true);
    try {
      await adminApi.createPropertyRegistration(payload);
      navigation.goBack();
    } catch {
      setError(t('admin.property.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AdminFormHero
              icon={Building2}
              eyebrow={t('admin.property.addEyebrow')}
              heading={t('admin.property.addHeading')}
              subheading={t('admin.property.addSubheading')}
            />

            {error ? (
              <View style={adminErrorBanner.box}>
                <Text style={adminErrorBanner.text}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.sections}>
              <AdminFormSection
                title={t('admin.property.detailsTitle')}
                description={t('admin.property.detailsHint')}>
                <SpaceTypePicker
                  value={propertyType}
                  onChange={next => {
                    setPropertyType(next);
                    const basis = defaultPriceBasis(next);
                    if (basis) {
                      setPriceBasis(basis);
                    }
                  }}
                  allowedTypes={PROPERTY_TYPES}
                />
                <FormInput
                  label={t('admin.property.name')}
                  value={propertyName}
                  onChangeText={setPropertyName}
                />
                <FormInput
                  label={t('admin.common.description', { defaultValue: 'Description' })}
                  value={description}
                  onChangeText={setDescription}
                  hint={t('admin.common.optionalHint', { defaultValue: 'Optional' })}
                />
                <FormInput
                  label={t('admin.common.capacityEstimate', {
                    defaultValue: 'Capacity estimate',
                  })}
                  value={capacityEstimate}
                  onChangeText={setCapacityEstimate}
                  keyboardType="number-pad"
                  hint={t('admin.common.optionalHint', { defaultValue: 'Optional' })}
                />
                <FormInput
                  label={t('admin.property.amenities', { defaultValue: 'Amenities' })}
                  value={amenitiesText}
                  onChangeText={setAmenitiesText}
                  hint={t('admin.property.amenitiesHint', {
                    defaultValue: 'Optional — comma-separated (e.g. WiFi, Parking)',
                  })}
                />
              </AdminFormSection>

              <AdminFormSection
                title={t('admin.common.ownerContact')}
                description={t('admin.common.ownerContactHint')}>
                <FormInput
                  label={t('admin.common.ownerName')}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  leadingIcon={UserRound}
                />
                <FormInput
                  label={t('admin.common.primaryMobile')}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <FormInput
                  label={t('admin.common.alternateMobileLabel')}
                  value={alternateMobileNumber}
                  onChangeText={setAlternateMobileNumber}
                  keyboardType="number-pad"
                  maxLength={10}
                  hint={t('admin.common.alternateMobileHint')}
                />
              </AdminFormSection>

              <AdminFormSection
                title={t('admin.common.location')}
                description={t('admin.common.locationHint')}>
                <AdminSavedAddressPicker
                  value={{
                    addressLine: location.address,
                    city: location.city,
                    state: location.state,
                    pincode: location.pincode,
                    mapUrl: location.mapUrl,
                  }}
                  onChange={next => setLocation(captureFromParts(next))}
                />
                <AddressLocationFields value={location} onChange={setLocation} showBuildingName={false} allowManual />
              </AdminFormSection>

              <AdminFormSection title={t('admin.common.pricingOptions')}>
                <FormInput
                  label={t('admin.property.startingPriceLabel')}
                  value={startingPrice}
                  onChangeText={setStartingPrice}
                  keyboardType="numeric"
                  leadingIcon={IndianRupee}
                />
                <PriceBasisPicker value={priceBasis} onChange={setPriceBasis} />
                <AdminTestLeadToggle embedded value={testLead} onValueChange={setTestLead} />
              </AdminFormSection>
            </View>
          </ScrollView>

          <StickyFormActions
            primary={{
              label: t('admin.property.save'),
              onPress: () => {
                handleSubmit().catch(() => undefined);
              },
              loading,
              disabled: loading,
            }}
            secondary={{
              label: t('common.cancel'),
              onPress: () => navigation.goBack(),
              disabled: loading,
            }}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sections: { gap: spacing.md },
});
