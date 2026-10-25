import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mail, MapPin, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { OwnerContactResponse } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMemberContactNumber } from '../../utils/indianMobile';
import { openableMapsUrl } from '../../utils/mapsLink';

type OwnerContactCardProps = {
  contact: OwnerContactResponse | null | undefined;
  mapUrl?: string | null;
};

function dialable(value: string | null | undefined): string {
  return (value ?? '').replace(/[^\d+]/g, '');
}

export function OwnerContactCard({ contact, mapUrl }: OwnerContactCardProps) {
  const { t } = useTranslation();
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
      {hasDetails ? (
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
            const digits = dialable(shown);
            return (
              <View key={phone} style={styles.actions}>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    if (digits) void Linking.openURL(`tel:${digits}`);
                  }}
                  style={styles.row}>
                  <Phone size={16} color="#0369A1" />
                  <Text style={styles.value}>{shown}</Text>
                </Pressable>
                {digits.replace(/\D/g, '').length >= 10 ? (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => {
                      const numeric = digits.replace(/\D/g, '');
                      const full = numeric.length === 10 ? `91${numeric}` : numeric;
                      void Linking.openURL(`https://wa.me/${full}`);
                    }}
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
              <Text style={styles.map}>
                {t('spaces.findPlace.enquire.openMap', { defaultValue: 'Open in Google Maps' })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={styles.missing}>
          {t('spaces.findPlace.enquire.contactMissing', {
            defaultValue: 'Contact details are not available for this listing.',
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F3F8FF',
    padding: spacing.md,
  },
  kicker: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#075985',
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
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
  whatsapp: {
    borderRadius: radius.full,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  whatsappText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#166534',
  },
  map: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  missing: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
});
