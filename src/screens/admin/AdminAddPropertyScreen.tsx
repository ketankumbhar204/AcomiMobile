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
import { Building2, IndianRupee, MapPin, UserRound } from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import type { AdminCreatePropertyRegistrationRequest, SpaceType } from '../../api/types';
import {
  AdminFormHero,
  AdminFormSection,
  AdminSavedAddressPicker,
  AdminTestLeadToggle,
  adminErrorBanner,
} from '../../components/admin';
import { FormInput, SpaceTypePicker } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { AdminStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { isValidIndianMobile } from '../../utils/indianMobile';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminAddProperty'>;

const PROPERTY_TYPES: SpaceType[] = ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL'];

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
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
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
    if (pincode.trim() && !isValidPincode(pincode.trim())) {
      setError(t('admin.property.errors.pincode'));
      return;
    }
    if (mapUrl.trim() && !isValidMapUrl(mapUrl)) {
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

    const payload: AdminCreatePropertyRegistrationRequest = {
      propertyType: (propertyType ?? 'PG') as Exclude<SpaceType, 'MESS'>,
    };
    const name = optionalText(propertyName);
    const owner = optionalText(ownerName);
    const mobile = optionalText(mobileNumber);
    const alternateMobile = optionalText(alternateMobileNumber);
    const address = optionalText(addressLine);
    const cityValue = optionalText(city);
    const stateValue = optionalText(state);
    const pincodeValue = optionalText(pincode);
    const map = optionalText(mapUrl);
    if (name) payload.propertyName = name;
    if (owner) payload.ownerName = owner;
    if (mobile) payload.mobileNumber = mobile;
    if (alternateMobile) payload.alternateMobileNumber = alternateMobile;
    if (address) payload.addressLine = address;
    if (cityValue) payload.city = cityValue;
    if (stateValue) payload.state = stateValue;
    if (pincodeValue) payload.pincode = pincodeValue;
    if (map) payload.mapUrl = map;
    if (price !== undefined) payload.startingPrice = price;
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
                  onChange={setPropertyType}
                  allowedTypes={PROPERTY_TYPES}
                />
                <FormInput
                  label={t('admin.property.name')}
                  value={propertyName}
                  onChangeText={setPropertyName}
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
                  value={{ addressLine, city, state, pincode, mapUrl }}
                  onChange={next => {
                    setAddressLine(next.addressLine);
                    setCity(next.city);
                    setState(next.state);
                    setPincode(next.pincode);
                    setMapUrl(next.mapUrl);
                  }}
                />
                <FormInput
                  label={t('admin.common.address')}
                  value={addressLine}
                  onChangeText={setAddressLine}
                  leadingIcon={MapPin}
                />
                <FormInput label={t('admin.common.city')} value={city} onChangeText={setCity} />
                <FormInput label={t('admin.common.state')} value={state} onChangeText={setState} />
                <FormInput
                  label={t('admin.common.pincode')}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <FormInput
                  label={t('admin.common.mapLink')}
                  value={mapUrl}
                  onChangeText={setMapUrl}
                  placeholder={t('admin.common.mapLinkPlaceholder')}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </AdminFormSection>

              <AdminFormSection title={t('admin.common.pricingOptions')}>
                <FormInput
                  label={t('admin.property.startingPriceLabel')}
                  value={startingPrice}
                  onChangeText={setStartingPrice}
                  keyboardType="numeric"
                  leadingIcon={IndianRupee}
                />
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
