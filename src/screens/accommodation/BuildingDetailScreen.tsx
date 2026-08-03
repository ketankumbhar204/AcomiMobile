import React, { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard } from 'lucide-react-native';
import { accommodationApi } from '../../api/accommodationApi';
import type { BuildingResponse } from '../../api/types';
import {
  AccommodationDetailRow,
  AccommodationEntityHero,
  AccommodationLifecycleActions,
  formatAccommodationDate,
} from '../../components/accommodation';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import { DashboardActionRow } from '../../components/dashboard/shared/DashboardActionRow';
import {
  Card,
  HeaderBackButton,
  RequireAccommodationAccess,
  Screen,
  SkeletonCard,
} from '../../components/ui';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import {
  useDeactivateBuilding,
  useDeleteBuilding,
  useRestoreBuilding,
} from '../../hooks/accommodationLifecycle';
import { useAccommodationLifecycleConfirm } from '../../hooks/useAccommodationLifecycleConfirm';
import { resetToAccommodationHome } from '../../navigation/navigationRef';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';

type Nav = NativeStackNavigationProp<MainStackParamList, 'BuildingDetail'>;
type Route = NativeStackScreenProps<
  MainStackParamList,
  'BuildingDetail'
>['route'];

export function BuildingDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { buildingId } = route.params;
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const showToast = useToastStore(state => state.showToast);
  const { confirmDeactivate, confirmRestore, confirmDelete } =
    useAccommodationLifecycleConfirm();
  const { mutate: deactivateBuilding, loading: deactivating } =
    useDeactivateBuilding();
  const { mutate: restoreBuilding, loading: restoring } = useRestoreBuilding();
  const { mutate: deleteBuilding, loading: deleting } = useDeleteBuilding();
  const lifecycleLoading = deactivating || restoring || deleting;

  const permissions = useSpacePermissions(spaceId);

  const [building, setBuilding] = useState<BuildingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('accommodation.buildings.detailTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  const loadBuilding = useCallback(async () => {
    console.log('[BuildingDetail] load', buildingId);
    setLoading(true);
    setError(null);
    try {
      const data = await accommodationApi.getBuilding(spaceId, buildingId);
      setBuilding(data);
    } catch (err) {
      setError(
        getAccommodationErrorMessage(err, 'accommodation.errors.loadBuildings'),
      );
    } finally {
      setLoading(false);
    }
  }, [buildingId, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void loadBuilding();
    }, [loadBuilding]),
  );

  if (loading && !building) {
    return (
      <Screen contentStyle={styles.content}>
        <SkeletonCard />
        <View style={styles.gap} />
        <SkeletonCard />
        <View style={styles.gap} />
        <SkeletonCard />
      </Screen>
    );
  }

  return (
    <RequireAccommodationAccess spaceId={spaceId}>
      <Screen scrollable contentStyle={styles.content}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {building ? (
          <>
            <AccommodationEntityHero
              level="building"
              title={building.name}
              subtitle={building.code ?? t('accommodation.overview.title')}
              meta={t(`accommodation.layoutMode.${building.layoutMode}`)}
              badge={
                <View
                  style={[
                    styles.activityBadge,
                    !building.active && styles.activityBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.activityBadgeText,
                      !building.active && styles.activityBadgeTextInactive,
                    ]}
                  >
                    {building.active
                      ? t('accommodation.active', { defaultValue: 'Active' })
                      : t('accommodation.inactive.deactivated')}
                  </Text>
                </View>
              }
            />

            <DashboardSectionTitle
              title={t('accommodation.setup.buildingInformation')}
            />
            <Card style={styles.infoCard}>
              <AccommodationDetailRow
                label={t('accommodation.fields.name')}
                value={building.name}
              />
              <AccommodationDetailRow
                label={t('accommodation.fields.code')}
                value={building.code ?? '—'}
              />
              <AccommodationDetailRow
                label={t('accommodation.fields.created')}
                value={formatAccommodationDate(building.createdAt)}
              />
              <AccommodationDetailRow
                label={t('accommodation.fields.updated')}
                value={formatAccommodationDate(building.updatedAt)}
              />
            </Card>

            <View style={styles.actionsSection}>
              <DashboardSectionTitle
                title={t('membership.details.actionsHeading', {
                  defaultValue: 'Actions',
                })}
              />
              <DashboardActionRow
                icon={LayoutDashboard}
                accent="#2563EB"
                title={t('accommodation.overview.open')}
                subtitle={t('accommodation.overview.title')}
                onPress={() =>
                  navigation.navigate('AccommodationBuilder', {
                    spaceId,
                    buildingId,
                  })
                }
              />
            </View>

            <AccommodationLifecycleActions
              actions={building.actions}
              role={permissions.membershipRole}
              loading={lifecycleLoading}
              onEdit={() =>
                navigation.navigate('BuildingForm', {
                  spaceId,
                  mode: 'edit',
                  buildingId,
                })
              }
              onDeactivate={() =>
                confirmDeactivate(
                  () => deactivateBuilding(spaceId, buildingId),
                  () => {
                    showToast(t('accommodation.lifecycle.deactivateSuccess'));
                    navigation.goBack();
                  },
                )
              }
              onRestore={() =>
                confirmRestore(
                  () => restoreBuilding(spaceId, buildingId),
                  () => {
                    showToast(t('accommodation.lifecycle.restoreSuccess'));
                    void loadBuilding();
                  },
                )
              }
              onDelete={() =>
                confirmDelete(
                  'building',
                  () => deleteBuilding(spaceId, buildingId),
                  () => {
                    showToast(
                      t('accommodation.lifecycle.delete.building.success'),
                    );
                    resetToAccommodationHome(spaceId);
                  },
                )
              }
            />
          </>
        ) : null}
      </Screen>
    </RequireAccommodationAccess>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  infoCard: { borderRadius: 18, marginBottom: spacing.xl },
  actionsSection: { marginBottom: spacing.xl },
  gap: { height: spacing.md },
  activityBadge: {
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  activityBadgeInactive: { backgroundColor: colors.surface },
  activityBadgeText: {
    ...typography.caption,
    color: '#15803D',
    fontWeight: '700',
  },
  activityBadgeTextInactive: { color: colors.textSecondary },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.body, fontSize: 14, color: '#DC2626' },
});
