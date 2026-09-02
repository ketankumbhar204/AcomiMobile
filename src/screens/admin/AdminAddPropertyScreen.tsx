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
      setError('Enter a valid mobile number, or leave it blank.');
      return;
    }
    if (alternateMobileNumber.trim() && !isValidIndianMobile(alternateMobileNumber)) {
      setError('Enter a valid alternate mobile number, or leave it blank.');
      return;
    }
    if (
      mobileNumber.trim() &&
      alternateMobileNumber.trim() &&
      mobileNumber.trim() === alternateMobileNumber.trim()
    ) {
      setError('Alternate mobile number must be different from the primary mobile number.');
      return;
    }
    if (pincode.trim() && !isValidPincode(pincode.trim())) {
      setError('Enter a valid pincode, or leave it blank.');
      return;
    }
    if (mapUrl.trim() && !isValidMapUrl(mapUrl)) {
      setError('Map link must start with http:// or https://');
      return;
    }

    let price: number | undefined;
    if (startingPrice.trim()) {
      price = Number(startingPrice);
      if (!Number.isFinite(price) || price < 0) {
        setError('Enter a valid starting price, or leave it blank.');
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
      setError('Could not save property registration.');
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
              eyebrow="Admin"
              heading="Add property lead"
              subheading="Create a registration record for the admin lead list."
            />

            {error ? (
              <View style={adminErrorBanner.box}>
                <Text style={adminErrorBanner.text}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.sections}>
              <AdminFormSection title="Property details" description="Type and name shown on the lead list.">
                <SpaceTypePicker
                  value={propertyType}
                  onChange={setPropertyType}
                  allowedTypes={PROPERTY_TYPES}
                />
                <FormInput label="Property name" value={propertyName} onChangeText={setPropertyName} />
              </AdminFormSection>

              <AdminFormSection title="Owner contact" description="Optional — can be filled when the owner claims.">
                <FormInput
                  label="Owner name"
                  value={ownerName}
                  onChangeText={setOwnerName}
                  leadingIcon={UserRound}
                />
                <FormInput
                  label="Primary mobile"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <FormInput
                  label="Alternate mobile"
                  value={alternateMobileNumber}
                  onChangeText={setAlternateMobileNumber}
                  keyboardType="number-pad"
                  maxLength={10}
                  hint="Optional secondary contact"
                />
              </AdminFormSection>

              <AdminFormSection title="Location" description="Reuse a recent address or enter a new one.">
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
                <FormInput label="Address" value={addressLine} onChangeText={setAddressLine} leadingIcon={MapPin} />
                <FormInput label="City" value={city} onChangeText={setCity} />
                <FormInput label="State" value={state} onChangeText={setState} />
                <FormInput
                  label="Pincode"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <FormInput
                  label="Google Maps link"
                  value={mapUrl}
                  onChangeText={setMapUrl}
                  placeholder="https://maps.google.com/..."
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </AdminFormSection>

              <AdminFormSection title="Pricing & options">
                <FormInput
                  label="Starting price (₹)"
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
              label: 'Save property',
              onPress: () => {
                handleSubmit().catch(() => undefined);
              },
              loading,
              disabled: loading,
            }}
            secondary={{
              label: 'Cancel',
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
