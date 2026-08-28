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
import { ChefHat, IndianRupee, MapPin, UserRound } from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import type { AdminCreateMessRegistrationRequest } from '../../api/types';
import {
  AdminFormHero,
  AdminFormSection,
  AdminTestLeadToggle,
  adminErrorBanner,
} from '../../components/admin';
import { FormInput } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { AdminStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { isValidIndianMobile } from '../../utils/indianMobile';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminAddMess'>;

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

export function AdminAddMessScreen() {
  const navigation = useNavigation<Nav>();
  const [messName, setMessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [mealPrice, setMealPrice] = useState('');
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
    if (pincode.trim() && !isValidPincode(pincode.trim())) {
      setError('Enter a valid pincode, or leave it blank.');
      return;
    }
    if (mapUrl.trim() && !isValidMapUrl(mapUrl)) {
      setError('Map link must start with http:// or https://');
      return;
    }

    let monthly: number | undefined;
    if (monthlyPrice.trim()) {
      monthly = Number(monthlyPrice);
      if (!Number.isFinite(monthly) || monthly < 0) {
        setError('Enter a valid monthly price, or leave it blank.');
        return;
      }
    }
    let meal: number | undefined;
    if (mealPrice.trim()) {
      meal = Number(mealPrice);
      if (!Number.isFinite(meal) || meal < 0) {
        setError('Enter a valid meal price, or leave it blank.');
        return;
      }
    }

    const payload: AdminCreateMessRegistrationRequest = {};
    const name = optionalText(messName);
    const owner = optionalText(ownerName);
    const mobile = optionalText(mobileNumber);
    const address = optionalText(addressLine);
    const cityValue = optionalText(city);
    const stateValue = optionalText(state);
    const pincodeValue = optionalText(pincode);
    const map = optionalText(mapUrl);
    if (name) payload.messName = name;
    if (owner) payload.ownerName = owner;
    if (mobile) payload.mobileNumber = mobile;
    if (address) payload.addressLine = address;
    if (cityValue) payload.city = cityValue;
    if (stateValue) payload.state = stateValue;
    if (pincodeValue) payload.pincode = pincodeValue;
    if (map) payload.mapUrl = map;
    if (monthly !== undefined) payload.monthlyPrice = monthly;
    if (meal !== undefined) payload.mealPrice = meal;
    if (testLead) payload.testLead = true;

    setLoading(true);
    try {
      await adminApi.createMessRegistration(payload);
      navigation.goBack();
    } catch {
      setError('Could not save mess registration.');
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
              icon={ChefHat}
              eyebrow="Admin"
              heading="Add mess lead"
              subheading="Create a registration record for the admin lead list."
            />

            {error ? (
              <View style={adminErrorBanner.box}>
                <Text style={adminErrorBanner.text}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.sections}>
              <AdminFormSection title="Mess details">
                <FormInput label="Mess name" value={messName} onChangeText={setMessName} leadingIcon={ChefHat} />
              </AdminFormSection>

              <AdminFormSection title="Owner contact" description="Optional — can be filled when the owner claims.">
                <FormInput
                  label="Owner name"
                  value={ownerName}
                  onChangeText={setOwnerName}
                  leadingIcon={UserRound}
                />
                <FormInput
                  label="Mobile"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </AdminFormSection>

              <AdminFormSection title="Location">
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
                  label="Monthly price (₹)"
                  value={monthlyPrice}
                  onChangeText={setMonthlyPrice}
                  keyboardType="numeric"
                  leadingIcon={IndianRupee}
                />
                <FormInput
                  label="Per meal price (₹)"
                  value={mealPrice}
                  onChangeText={setMealPrice}
                  keyboardType="numeric"
                  leadingIcon={IndianRupee}
                />
                <AdminTestLeadToggle embedded value={testLead} onValueChange={setTestLead} />
              </AdminFormSection>
            </View>
          </ScrollView>

          <StickyFormActions
            primary={{
              label: 'Save mess',
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
