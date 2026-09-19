import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/adminApi';
import type { AdminRegisteredUser } from '../../api/types';
import { AdminLeadCard, adminList } from '../../components/admin';
import type { AdminStackParamList } from '../../navigation/types';
import {
  formatAdminAssociatedSpaces,
  formatAdminDate,
  formatAdminOnboardingStatus,
  formatAdminUserMobile,
  formatAdminUserName,
  formatAdminUserRole,
} from '../../utils/adminLabels';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminRegisteredUsers'>;

export function AdminRegisteredUsersScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [users, setUsers] = useState<AdminRegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        try {
          const page = await adminApi.listRegisteredUsers({ size: 100 });
          if (!cancelled) setUsers(page.content);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      void load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>{t('admin.users.hint')}</Text>
      <View style={styles.actions}>
        <Pressable
          style={adminList.addBtn}
          onPress={() => navigation.navigate('AdminCreateTestUser')}>
          <Text style={adminList.addBtnText}>{t('admin.users.createTestUser')}</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AdminLeadCard
              title={formatAdminUserName(item.fullName)}
              subtitle={`${formatAdminUserMobile(item.mobileNumber)} · ${
                item.mobileVerified ? t('admin.labels.verified') : t('admin.labels.notVerified')
              }`}
              meta={`${formatAdminUserRole(item.selectedRole)} · ${formatAdminOnboardingStatus(
                item.onboardingStatus,
              )} · ${formatAdminDate(item.registeredAt)}`}
              sourceLabel={formatAdminAssociatedSpaces(item.spaces)}
              testLead={item.testUser ? true : undefined}
              onPress={() => navigation.navigate('AdminRegisteredUserDetail', { user: item })}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('admin.users.empty')}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
  },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
});
