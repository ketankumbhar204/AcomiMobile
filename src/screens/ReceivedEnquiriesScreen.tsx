import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '../api/enquiryApi';
import type { EnquiryInboxListing, ReceivedEnquiry, SpaceEnquiryStatus } from '../api/types';
import { Button, Card, EmptyState } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';

const STATUSES: Array<SpaceEnquiryStatus | ''> = ['', 'PENDING', 'SHARED', 'EXPIRED', 'REJECTED', 'CANCELLED'];

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function ReceivedEnquiriesScreen({ listings }: { listings: EnquiryInboxListing[] }) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [rows, setRows] = useState<ReceivedEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SpaceEnquiryStatus | ''>('');
  const [spaceId, setSpaceId] = useState('');
  const [selected, setSelected] = useState<ReceivedEnquiry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await enquiryApi.listReceived({
        spaceId: spaceId || undefined,
        status: status || undefined,
        size: 50,
      });
      setRows(page.content ?? []);
    } catch {
      setError(
        t('spaces.enquiries.receivedError', {
          defaultValue: 'Enquiries could not be loaded. You can only see listings you own or manage.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [spaceId, status, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>
        {t('spaces.enquiries.receivedTitle', { defaultValue: 'Enquiries received' })}
      </Text>
      <View style={styles.filters}>
        <Pressable onPress={() => setSpaceId('')} style={[styles.chip, spaceId === '' && styles.chipOn]}>
          <Text style={styles.chipText}>{t('spaces.enquiries.filterAllListings', { defaultValue: 'All listings' })}</Text>
        </Pressable>
        {listings.map(listing => (
          <Pressable
            key={listing.spaceId}
            onPress={() => setSpaceId(listing.spaceId)}
            style={[styles.chip, spaceId === listing.spaceId && styles.chipOn]}>
            <Text style={styles.chipText} numberOfLines={1}>
              {listing.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.filters}>
        {STATUSES.map(item => (
          <Pressable
            key={item || 'all'}
            onPress={() => setStatus(item)}
            style={[styles.chip, status === item && styles.chipOn]}>
            <Text style={styles.chipText}>
              {item
                ? t(`spaces.enquiries.status.${item}`, { defaultValue: item })
                : t('spaces.enquiries.filterAllStatuses', { defaultValue: 'All statuses' })}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.emptyWrap}>
          <EmptyState title={t('common.error', { defaultValue: 'Something went wrong' })} description={error} />
          <Button label={t('common.retry', { defaultValue: 'Try again' })} onPress={() => void load()} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.enquiryId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title={t('spaces.enquiries.receivedEmptyTitle', { defaultValue: 'No enquiries received' })}
              description={t('spaces.enquiries.receivedEmpty', {
                defaultValue: 'When a member enquires about one of your listings, it will show up here.',
              })}
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelected(item)}>
              <Card style={styles.card}>
                <Text style={styles.name}>
                  {item.requesterName?.trim() || t('spaces.enquiries.member', { defaultValue: 'Member' })}
                </Text>
                <Text style={styles.listing}>{item.spaceName}</Text>
                <Text style={styles.meta}>
                  {item.spaceType ? `${item.spaceType} · ` : ''}
                  {t(`spaces.enquiries.status.${item.status}`, { defaultValue: item.status })}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
      {selected ? (
        <Card style={styles.detail}>
          <Text style={styles.name}>{selected.requesterName}</Text>
          <Text style={styles.listing}>{selected.spaceName}</Text>
          {selected.locationLabel ? <Text style={styles.meta}>{selected.locationLabel}</Text> : null}
          <Text style={styles.meta}>
            {t(`spaces.enquiries.status.${selected.status}`, { defaultValue: selected.status })}
          </Text>
          {selected.requesterMobile ? (
            <Button
              label={t('spaces.enquiries.callMember', { defaultValue: 'Call member' })}
              onPress={() => void Linking.openURL(`tel:${selected.requesterMobile}`)}
            />
          ) : null}
          {selected.requesterEmail ? (
            <Button
              label={t('spaces.enquiries.emailMember', { defaultValue: 'Email member' })}
              variant="secondary"
              onPress={() => void Linking.openURL(`mailto:${selected.requesterEmail}`)}
            />
          ) : null}
          {!selected.requesterMobile && !selected.requesterEmail ? (
            <Text style={styles.meta}>
              {t('spaces.enquiries.memberContactUnavailable', { defaultValue: 'Member contact is not available.' })}
            </Text>
          ) : null}
          <Button
            label={t('spaces.enquiries.openListing', { defaultValue: 'Open listing' })}
            variant="secondary"
            onPress={() => navigation.navigate('FindAPlaceDetail', { spaceId: selected.spaceId })}
          />
          <Button
            label={t('common.done', { defaultValue: 'Done' })}
            variant="ghost"
            onPress={() => setSelected(null)}
          />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heading: { ...typography.h3, color: colors.textPrimary, padding: spacing.md, paddingBottom: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 180,
  },
  chipOn: { backgroundColor: '#E7F6EE', borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textPrimary },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  card: { marginBottom: spacing.sm, gap: 4 },
  name: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  listing: { ...typography.body, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  emptyWrap: { padding: spacing.md, gap: spacing.md },
  detail: { margin: spacing.md, gap: spacing.sm },
});
