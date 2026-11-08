import React from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mail, MapPin, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { OwnerContactResponse } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMemberContactNumber } from '../../utils/indianMobile';
import { canOpenContactOptions } from '../../utils/contactActions';
import { openableMapsUrl } from '../../utils/mapsLink';
import { ContactNumberLine } from '../member/ContactAndStayMeta';
import { useOptionalContactOptions } from '../contact/ContactOptionsProvider';

type OwnerContactCardProps = {
  contact: OwnerContactResponse | null | undefined;
  mapUrl?: string | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

export function OwnerContactCard({ contact, mapUrl, loading = false, error = false, onRetry }: OwnerContactCardProps) {
  const { t } = useTranslation();
  const { openContactOptions } = useOptionalContactOptions();
  if (!contact && !loading && !error) return null;
  const phones = [contact?.mobileNumber, contact?.alternateMobileNumber, contact?.additionalMobileNumber]
    .map(value => value?.trim() ?? '')
    .filter(value => value.length > 0);
  const email = contact?.email?.trim() ?? '';
  const name = contact?.ownerName?.trim() ?? '';
  const mapHref = openableMapsUrl(mapUrl);
  const hasDetails = phones.length > 0 || email.length > 0 || name.length > 0 || mapHref.length > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>
        {t('spaces.findPlace.enquire.contactTitle', { defaultValue: 'Contact details' })}
      </Text>
      {loading ? (
        <View style={styles.statusRow} accessibilityRole="progressbar">
          <ActivityIndicator size="small" color="#0369A1" />
          <Text style={styles.status}>
            {t('spaces.findPlace.enquire.contactLoading', { defaultValue: 'Loading contact details…' })}
          </Text>
        </View>
      ) : error ? (
        <View accessibilityRole="alert">
          <Text style={styles.missing}>
            {t('spaces.findPlace.enquire.contactFailed', {
              defaultValue: 'Contact details could not be loaded. Try again.',
            })}
          </Text>
          {onRetry ? (
            <Pressable onPress={onRetry} accessibilityRole="button">
              <Text style={styles.retry}>
                {t('spaces.findPlace.enquire.contactRetry', { defaultValue: 'Try again' })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : hasDetails ? (
        <View style={styles.list}>
          {name ? (
            <View>
              <Text style={styles.caption}>
                {t('spaces.findPlace.enquire.contactOwner', { defaultValue: 'Owner' })}
              </Text>
              <Text style={styles.value}>{name}</Text>
            </View>
          ) : null}
          {phones.map(phone => {
            const shown = formatMemberContactNumber(phone) ?? phone;
            const actionable = canOpenContactOptions(phone);
            return (
              <View key={phone} style={styles.actions}>
                {actionable ? (
                  <ContactNumberLine
                    value={phone}
                    label={shown}
                    name={name || t('spaces.findPlace.enquire.contactOwner', { defaultValue: 'Owner' })}
                    roleLabel={t('spaces.findPlace.enquire.contactOwner', { defaultValue: 'Owner' })}
                    textStyle={styles.value}
                  />
                ) : (
                  <View style={styles.row}>
                    <Phone size={16} color="#0369A1" />
                    <Text style={styles.value}>{shown}</Text>
                  </View>
                )}
                {actionable ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      openContactOptions({
                        phoneNumber: phone,
                        displayName: name || undefined,
                        roleLabel: t('spaces.findPlace.enquire.contactOwner', {
                          defaultValue: 'Owner',
                        }),
                      })
                    }
                    style={styles.whatsapp}>
                    <Text style={styles.whatsappText}>
                      {t('spaces.findPlace.enquire.whatsapp', { defaultValue: 'WhatsApp' })}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
          {email ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(`mailto:${email}`)}
              style={styles.row}>
              <Mail size={16} color="#0369A1" />
              <View style={styles.flex}>
                <Text style={styles.caption}>
                  {t('spaces.findPlace.enquire.contactEmail', { defaultValue: 'Email' })}
                </Text>
                <Text style={styles.value} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </Pressable>
          ) : null}
          {mapHref ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(mapHref)}
              style={styles.row}>
              <MapPin size={16} color="#0369A1" />
              <Text style={styles.value}>
                {t('spaces.findPlace.enquire.openMap', { defaultValue: 'Open in Maps' })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={styles.missing}>
          {t('spaces.findPlace.enquire.contactEmpty', {
            defaultValue: 'No contact details available yet.',
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  kicker: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  caption: {
    ...typography.caption,
    color: colors.muted,
  },
  value: {
    ...typography.bodyStrong,
    color: '#0369A1',
  },
  whatsapp: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: `${colors.primary}55`,
  },
  whatsappText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  status: {
    ...typography.body,
    color: colors.textSecondary,
  },
  missing: {
    ...typography.body,
    color: colors.textSecondary,
  },
  retry: {
    ...typography.bodyStrong,
    color: '#0369A1',
    marginTop: spacing.xs,
  },
});
