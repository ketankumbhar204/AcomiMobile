import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  adminNotificationTestApi,
  type AdminNotificationTestAttempt,
  type AdminNotificationTestPage,
  type AdminNotificationTestType,
} from '../../api/adminNotificationTestApi';
import { colors, radius, spacing, typography } from '../../theme';
import {
  channelLabel,
  maskDevice,
  previewTypes,
  resultCopy,
  statusChecks,
  statusHeading,
  typeLabel,
  TYPE_PREVIEW_COUNT,
} from './notificationTestingView';

function requestId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AdminNotificationTestingScreen() {
  const [page, setPage] = useState<AdminNotificationTestPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<'PUSH' | 'IN_APP'>('PUSH');
  const [pickDevices, setPickDevices] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [statusOpen, setStatusOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<AdminNotificationTestAttempt | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const sendingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const next = await adminNotificationTestApi.page();
      setPage(next);
      setType(current => current || next.types.find(item => item.safeToTest)?.notificationType || '');
      setCategory(current => current || next.types[0]?.category || 'Payments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notification tests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selected = useMemo(
    () => page?.types.find(item => item.notificationType === type),
    [page, type],
  );

  React.useEffect(() => {
    if (!selected) return;
    setTitle(selected.defaultTitle);
    setBody(selected.defaultBody);
    setCategory(selected.category);
  }, [selected?.notificationType]);

  const categories = useMemo(() => {
    const names = [...new Set((page?.types ?? []).map(item => item.category))];
    const preferred = ['Payments', 'Account', 'Enquiries', 'Inquiry credits', 'Members', 'Occupancy', 'Meals', 'Complaints'];
    return [...preferred.filter(name => names.includes(name)), ...names.filter(name => !preferred.includes(name))];
  }, [page]);

  const activeCategory = category || categories[0] || '';
  const categoryTypes = (page?.types ?? []).filter(item => item.category === activeCategory);
  const visibleTypes = previewTypes(categoryTypes, showAllTypes);

  function chooseType(item: AdminNotificationTestType) {
    if (!item.safeToTest) return;
    setType(item.notificationType);
  }

  async function send() {
    if (!selected || sendingRef.current) return;
    if (channel === 'PUSH' && page && !page.fcmSendPossible) {
      setError(page.pushHint || 'FCM send is not possible for this account.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }
    if (pickDevices && selectedDevices.length === 0) {
      setError('Choose one of this account’s registered devices.');
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setError('');
    setResult(null);
    try {
      const attempt = await adminNotificationTestApi.send({
        notificationType: selected.notificationType,
        testMode: true,
        channel,
        title: title.trim(),
        body: body.trim(),
        deviceTokenIds: pickDevices ? selectedDevices : undefined,
        clientRequestId: requestId(),
      });
      setResult(attempt);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test send failed.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function confirmSend() {
    if (sendingRef.current || !selected) return;
    Alert.alert(
      'Send Test Notification',
      'This sends only to the current admin account’s registered device. It does not change payments, members, enquiries, or other records.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Test Notification', onPress: () => void send() },
      ],
    );
  }

  async function removeOne(attemptId: string) {
    setActionMessage('');
    try {
      const response = await adminNotificationTestApi.deleteOne(attemptId);
      setActionMessage(response.deletedCount > 0 ? 'Test record deleted.' : 'That test record was already gone.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete that test record.');
    }
  }

  function confirmClear() {
    Alert.alert(
      'Clear all test notifications?',
      'This permanently deletes notification test-history records. It does not affect real notifications, payments, members, enquiries, or other business data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setClearing(true);
              try {
                const response = await adminNotificationTestApi.deleteAll();
                setActionMessage(`Deleted ${response.deletedCount} test record${response.deletedCount === 1 ? '' : 's'}.`);
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not clear test history.');
              } finally {
                setClearing(false);
              }
            })();
          },
        },
      ],
    );
  }

  if (loading && !page) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notification Testing</Text>
        <Pressable accessibilityLabel="About notification testing" onPress={() => setHelpOpen(open => !open)}>
          <Text style={styles.help}>?</Text>
        </Pressable>
      </View>
      {helpOpen ? (
        <Text style={styles.infoCopy}>
          A test sends a fixture to this admin account. Firebase acceptance means the request was taken, not that the phone showed a system notification. Browser push is not implemented.
        </Text>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoCopy}>
          Send a test notification to your admin account only. This does not change payments, members, enquiries, or other business records.
        </Text>
      </View>

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.typeName}>{result.status === 'FCM_ACCEPTED' ? 'Test notification sent' : result.status}</Text>
          <Text style={styles.typeMeta}>
            {resultCopy(result)} Targeted {result.targetedCount}, accepted {result.acceptedCount}, failed {result.failedCount}.
          </Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {actionMessage ? <Text style={styles.success}>{actionMessage}</Text> : null}

      <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityLabel="Push configuration status" onPress={() => setStatusOpen(open => !open)} style={styles.rowBetween}>
          <Text style={styles.section}>Push configuration status</Text>
          <Text style={styles.ready}>{statusHeading(page)}</Text>
        </Pressable>
        <Pressable accessibilityLabel="Refresh status" onPress={() => void load()}>
          <Text style={styles.link}>Refresh status</Text>
        </Pressable>
        {statusOpen && page
          ? statusChecks(page).map(row => (
              <View key={row.label} style={styles.rowBetween}>
                <Text style={styles.typeMeta} accessibilityLabel={row.ok ? 'Verified' : 'Not verified'}>{row.ok ? '●' : '○'} {row.label}</Text>
                <Text style={styles.typeMeta}>{row.value}</Text>
              </View>
            ))
          : null}
      </View>

      {page && !page.browserPushImplemented ? (
        <View style={styles.warnCard}>
          <Text style={styles.warnCopy}>Browser push is not implemented yet.</Text>
        </View>
      ) : null}

      <Text style={styles.section}>1. Select notification type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {categories.map(name => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: name === activeCategory }}
            onPress={() => {
              setCategory(name);
              setShowAllTypes(false);
            }}
            style={[styles.tab, name === activeCategory && styles.tabActive]}>
            <Text style={[styles.tabLabel, name === activeCategory && styles.tabLabelActive]}>{name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {visibleTypes.map(item => {
        const active = item.notificationType === type;
        return (
          <Pressable
            key={item.notificationType}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: !item.safeToTest }}
            onPress={() => chooseType(item)}
            style={[styles.typeRow, active && styles.typeRowActive]}>
            <Text style={styles.radio}>{active ? '●' : '○'}</Text>
            <View style={styles.flex}>
              <Text style={styles.typeName}>{item.name}</Text>
              <Text style={styles.typeMeta}>{item.description}</Text>
              <Text style={styles.typeMeta}>{item.channels.join(' · ')}</Text>
            </View>
            <Text style={styles.badge}>{item.safeToTest ? 'Testable' : 'Not testable'}</Text>
          </Pressable>
        );
      })}
      {categoryTypes.length > TYPE_PREVIEW_COUNT ? (
        <Pressable onPress={() => setShowAllTypes(value => !value)}>
          <Text style={styles.link}>{showAllTypes ? 'Show less' : `Show ${categoryTypes.length - TYPE_PREVIEW_COUNT} more`}</Text>
        </Pressable>
      ) : null}

      <View style={styles.rowBetween}>
        <Text style={styles.section}>2. Message content</Text>
        <Pressable
          onPress={() => {
            if (!selected) return;
            setTitle(selected.defaultTitle);
            setBody(selected.defaultBody);
          }}>
          <Text style={styles.link}>Reset</Text>
        </Pressable>
      </View>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} maxLength={120} />
      <Text style={styles.label}>Body</Text>
      <TextInput value={body} onChangeText={setBody} style={[styles.input, styles.multiline]} multiline maxLength={300} />

      <Text style={styles.section}>3. Recipient</Text>
      <Pressable onPress={() => setPickDevices(false)} style={[styles.typeRow, !pickDevices && styles.typeRowActive]}>
        <Text style={styles.typeName}>{pickDevices ? '○' : '●'} My admin account</Text>
        <Text style={styles.typeMeta}>Sends only to this account’s registered devices.</Text>
        {(page?.registrations ?? []).map(device => (
          <Text key={device.deviceTokenId} style={styles.typeMeta}>
            {device.platform} · {maskDevice(device.deviceId)} · {device.active ? 'Active' : 'Inactive'}
          </Text>
        ))}
      </Pressable>
      {(page?.registrations.length ?? 0) > 0 ? (
        <Pressable onPress={() => setPickDevices(value => !value)}>
          <Text style={styles.link}>{pickDevices ? 'Use every device on my account' : 'Choose a specific device'}</Text>
        </Pressable>
      ) : null}
      {pickDevices
        ? (page?.registrations ?? []).map(device => (
            <Pressable
              key={device.deviceTokenId}
              onPress={() =>
                setSelectedDevices(current =>
                  current.includes(device.deviceTokenId)
                    ? current.filter(id => id !== device.deviceTokenId)
                    : [...current, device.deviceTokenId],
                )
              }
              style={styles.choice}>
              <Text style={styles.typeName}>
                {selectedDevices.includes(device.deviceTokenId) ? '●' : '○'} {device.platform} · {maskDevice(device.deviceId)}
              </Text>
            </Pressable>
          ))
        : null}

      <Text style={styles.section}>4. Delivery channel</Text>
      <Pressable onPress={() => setChannel('PUSH')} style={styles.choice}>
        <Text style={styles.typeName}>{channel === 'PUSH' ? '●' : '○'} FCM mobile push</Text>
      </Pressable>
      <Pressable onPress={() => setChannel('IN_APP')} style={styles.choice}>
        <Text style={styles.typeName}>{channel === 'IN_APP' ? '●' : '○'} In-app only</Text>
      </Pressable>
      <Text style={styles.typeMeta}>Browser push — not implemented</Text>

      <Pressable
        accessibilityRole="button"
        disabled={sending || !selected}
        onPress={confirmSend}
        style={[styles.send, (sending || !selected) && styles.sendDisabled]}>
        <Text style={styles.sendLabel}>{sending ? 'Sending…' : 'Send Test Notification'}</Text>
      </Pressable>

      <View style={styles.rowBetween}>
        <Text style={styles.section}>Recent test notifications</Text>
        <Pressable accessibilityLabel="Clear all test notifications" disabled={!page?.history.length || clearing} onPress={confirmClear}>
          <Text style={styles.dangerLink}>{clearing ? 'Deleting…' : 'Clear all'}</Text>
        </Pressable>
      </View>
      {(page?.history ?? []).length === 0 ? (
        <Text style={styles.typeMeta}>No test notifications yet.</Text>
      ) : (
        (page?.history ?? []).map(item => (
          <View key={item.attemptId} style={styles.history}>
            <View style={styles.flex}>
              <Text style={styles.typeName}>{typeLabel(page?.types ?? [], item.notificationType)}</Text>
              <Text style={styles.typeMeta}>{item.status}</Text>
              <Text style={styles.typeMeta}>
                {item.createdAt || '—'} · {channelLabel(item.channel)} · targeted {item.targetedCount} · accepted {item.acceptedCount} · failed {item.failedCount}
                {item.errorDetail ? ` · ${item.errorDetail}` : ''}
              </Text>
            </View>
            <Pressable accessibilityLabel={`Delete test ${item.notificationType}`} onPress={() => void removeOne(item.attemptId)}>
              <Text style={styles.dangerLink}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.sm, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.h2, color: colors.textPrimary },
  help: { ...typography.body, color: colors.info, fontWeight: '700' },
  infoCard: { backgroundColor: '#EFF6FF', borderRadius: radius.card, padding: spacing.sm, borderWidth: 1, borderColor: '#BFDBFE' },
  infoCopy: { ...typography.caption, color: colors.textPrimary },
  warnCard: { backgroundColor: colors.warningTint, borderRadius: radius.card, padding: spacing.sm },
  warnCopy: { ...typography.caption, color: colors.warning },
  resultCard: { backgroundColor: colors.successTint, borderRadius: radius.card, padding: spacing.sm, gap: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: spacing.xs },
  section: { ...typography.label, color: colors.textPrimary },
  ready: { ...typography.caption, color: colors.success, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  tabs: { gap: spacing.xs, paddingVertical: 2 },
  tab: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabLabel: { ...typography.caption, color: colors.textPrimary },
  tabLabelActive: { color: colors.white, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.sm, backgroundColor: colors.surface },
  typeRowActive: { borderColor: colors.primary },
  radio: { color: colors.primary, marginTop: 2 },
  flex: { flex: 1 },
  badge: { ...typography.caption, color: colors.success },
  typeName: { ...typography.body, color: colors.textPrimary },
  typeMeta: { ...typography.caption, color: colors.textSecondary },
  label: { ...typography.caption, color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.sm, color: colors.textPrimary, backgroundColor: colors.surface },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  choice: { paddingVertical: spacing.xs },
  link: { ...typography.caption, color: colors.info },
  dangerLink: { ...typography.caption, color: colors.danger },
  send: { backgroundColor: colors.primary, borderRadius: radius.card, paddingVertical: spacing.md, alignItems: 'center' },
  sendDisabled: { opacity: 0.6 },
  sendLabel: { ...typography.body, color: colors.white, fontWeight: '700' },
  error: { ...typography.caption, color: colors.danger },
  success: { ...typography.caption, color: colors.success },
  history: { flexDirection: 'row', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.sm, backgroundColor: colors.surface },
});
