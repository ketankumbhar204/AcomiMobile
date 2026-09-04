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
import { ChefHat, IndianRupee, MapPin, UserRound } from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import type { AdminCreateMessRegistrationRequest } from '../../api/types';
import {
  AdminFormHero,
  AdminFormSection,
  AdminSavedAddressPicker,
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
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [messName, setMessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobileNumber, setAlternateMobileNumber] = useState('');
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
      setError(t('admin.mess.errors.mobile'));
      return;
    }
    if (alternateMobileNumber.trim() && !isValidIndianMobile(alternateMobileNumber)) {
      setError(t('admin.mess.errors.alternateMobile'));
      return;
    }
    if (
      mobileNumber.trim() &&
      alternateMobileNumber.trim() &&
      mobileNumber.trim() === alternateMobileNumber.trim()
    ) {
      setError(t('admin.mess.errors.alternateDifferent'));
      return;
    }
    if (pincode.trim() && !isValidPincode(pincode.trim())) {
      setError(t('admin.mess.errors.pincode'));
      return;
    }
    if (mapUrl.trim() && !isValidMapUrl(mapUrl)) {
      setError(t('admin.mess.errors.mapUrl'));
      return;
    }

    let monthly: number | undefined;
    if (monthlyPrice.trim()) {
      monthly = Number(monthlyPrice);
      if (!Number.isFinite(monthly) || monthly < 0) {
        setError(t('admin.mess.errors.monthlyPrice'));
        return;
      }
    }
    let meal: number | undefined;
    if (mealPrice.trim()) {
      meal = Number(mealPrice);
      if (!Number.isFinite(meal) || meal < 0) {
        setError(t('admin.mess.errors.mealPrice'));
        return;
      }
    }

    const payload: AdminCreateMessRegistrationRequest = {};
    const name = optionalText(messName);
    const owner = optionalText(ownerName);
    const mobile = optionalText(mobileNumber);
    const alternateMobile = optionalText(alternateMobileNumber);
    const address = optionalText(addressLine);
    const cityValue = optionalText(city);
    const stateValue = optionalText(state);
    const pincodeValue = optionalText(pincode);
    const map = optionalText(mapUrl);
    if (name) payload.messName = name;
    if (owner) payload.ownerName = owner;
    if (mobile) payload.mobileNumber = mobile;
    if (alternateMobile) payload.alternateMobileNumber = alternateMobile;
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
      setError(t('admin.mess.saveFailed'));
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
              eyebrow={t('admin.mess.addEyebrow')}
              heading={t('admin.mess.addHeading')}
              subheading={t('admin.mess.addSubheading')}
            />

            {error ? (
              <View style={adminErrorBanner.box}>
                <Text style={adminErrorBanner.text}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.sections}>
              <AdminFormSection title={t('admin.mess.detailsTitle')}>
                <FormInput
                  label={t('admin.mess.name')}
                  value={messName}
                  onChangeText={setMessName}
                  leadingIcon={ChefHat}
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
                  label={t('admin.mess.monthlyPriceLabel')}
                  value={monthlyPrice}
                  onChangeText={setMonthlyPrice}
                  keyboardType="numeric"
                  leadingIcon={IndianRupee}
                />
                <FormInput
                  label={t('admin.mess.mealPriceLabel')}
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
              label: t('admin.mess.save'),
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
