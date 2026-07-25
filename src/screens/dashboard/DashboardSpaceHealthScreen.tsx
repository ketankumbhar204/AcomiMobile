import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Info,
  Lightbulb,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { Button, Screen } from '../../components/ui';
import { HealthScoreRing } from '../../components/dashboard/HealthScoreRing';
import { useActiveSpaceId } from '../../hooks/useActiveSpaceId';
import { useNavigateFromSpaceTab } from '../../hooks/useNavigateFromSpaceTab';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useSpaceLifecycle } from '../../hooks/useSpaceLifecycle';
import { useSpaceLifecycleSignals } from '../../hooks/useSpaceLifecycleSignals';
import {
  navigateToMembersTab,
  navigateToPaymentsTab,
  resetToAccommodationHome,
} from '../../navigation/navigationRef';
import type { MainStackParamList } from '../../navigation/types';
import {
  mapSetupNavigationTarget,
  resolveHealthBand,
  useSpaceHealth,
} from '../../spaceLifecycle';
import type {
  HealthCategoryBreakdown,
  HealthCategoryId,
  HealthFactor,
} from '../../spaceLifecycle/health';
import {
  bandAccent,
  categoryAccent,
  resolveHealthFactorAction,
  type HealthNavAction,
} from '../../spaceLifecycle/health/healthActionTargets';
import type {
  RecommendedAction,
  SetupNavigationTarget,
} from '../../spaceLifecycle/types';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { canManageNotifications } from '../../utils/spaceOperator';
import { peekPendingActions } from '../../utils/pendingActionsQueryCache';
import { peekDashboardSummary } from '../../utils/dashboardQueryCache';
import { currentMonthKey } from '../../utils/dashboardFinancial';
import { findMySpaceEntry } from '../../utils/spacePermissions';

type HealthRoute = RouteProp<MainStackParamList, 'DashboardSpaceHealth'>;
type HealthNav = NativeStackNavigationProp<MainStackParamList, 'DashboardSpaceHealth'>;

const CATEGORY_TITLE: Record<HealthCategoryId, string> = {
  setup: 'dashboard.health.categories.setup',
  operations: 'dashboard.health.categories.operations',
  attention: 'dashboard.health.categories.attention',
};

const CATEGORY_SHORT: Record<HealthCategoryId, string> = {
  setup: 'dashboard.health.categoriesShort.setup',
  operations: 'dashboard.health.categoriesShort.operations',
  attention: 'dashboard.health.categoriesShort.attention',
};

const CATEGORY_EXPLAIN: Record<HealthCategoryId, string> = {
  setup: 'dashboard.health.weightsInfo.setupExplain',
  operations: 'dashboard.health.weightsInfo.operationsExplain',
  attention: 'dashboard.health.weightsInfo.attentionExplain',
};

const CATEGORY_ICON: Record<HealthCategoryId, LucideIcon> = {
  setup: Settings2,
  operations: Building2,
  attention: Bell,
};

function formatPercent(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Actionable Space Health dashboard — score, category chips, fix-it rows.
 * Calculation and Recommendation Engine remain unchanged.
 */
export function DashboardSpaceHealthScreen() {
  const { t } = useTranslation();
  const route = useRoute<HealthRoute>();
  const navigation = useNavigation<HealthNav>();
  const spaceId = useActiveSpaceId(route.params.spaceId);
  const navigateFromTab = useNavigateFromSpaceTab();
  const permissions = useSpacePermissions(spaceId);
  const mySpaces = useSpaceStore(s => s.mySpaces);
  const spaceEntry = findMySpaceEntry(mySpaces, spaceId);
  const spaceType = spaceEntry?.spaceType ?? null;
  const showOwner = canManageNotifications(permissions);
  const [weightsOpen, setWeightsOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Partial<Record<HealthCategoryId, number>>>({});

  const pendingActionCount = spaceId
    ? peekPendingActions(spaceId)?.length ?? 0
    : 0;
  const summary = spaceId
    ? peekDashboardSummary(spaceId, currentMonthKey())
    : null;
  const ops = summary?.accommodationOperations;
  const financial = summary?.financial;

  const extras = useMemo(
    () => ({
      occupiedBeds: ops?.occupiedBeds ?? null,
      vacantBeds: ops?.vacantBeds ?? null,
      underReviewPaymentCount:
        financial?.underReview != null && financial.underReview > 0 ? 1 : 0,
    }),
    [financial?.underReview, ops?.occupiedBeds, ops?.vacantBeds],
  );

  const { context } = useSpaceLifecycleSignals({
    spaceId,
    spaceType,
    permissions,
    enabled: showOwner,
    pendingActionCount,
    hasOperationalSignal: Boolean(
      ops && (ops.occupiedBeds > 0 || ops.moveInsThisMonth > 0),
    ),
  });
  const { evaluation } = useSpaceLifecycle({
    spaceType,
    context,
    enabled: showOwner,
  });
  const { health } = useSpaceHealth({
    evaluation,
    context,
    extras,
    enabled: showOwner,
  });

  const navigateSetupTarget = useCallback(
    (target: SetupNavigationTarget) => {
      const dest = mapSetupNavigationTarget(target, { spaceType });
      if (dest.kind === 'tab') {
        if (dest.tab === 'Accommodation' && permissions.canViewAccommodation) {
          resetToAccommodationHome(spaceId);
          return;
        }
        if (dest.tab === 'Members' && permissions.canManageMembers) {
          navigateToMembersTab(spaceId);
        }
        return;
      }
      switch (dest.screen) {
        case 'QuickSetupWizard':
          navigateFromTab('QuickSetupWizard', { spaceId });
          break;
        case 'BuildingForm':
          navigateFromTab('BuildingForm', { spaceId, mode: 'create' });
          break;
        case 'AddMember':
          navigateFromTab('AddMember', { spaceId });
          break;
        case 'AddCustomersHub':
          navigateFromTab('AddCustomersHub', { spaceId });
          break;
        case 'MenuLibrary':
          navigateFromTab('MenuLibrary', { spaceId });
          break;
        case 'MenuPlanning':
          navigateFromTab('MenuPlanning', { spaceId });
          break;
        case 'MenuSharePreview':
          navigateFromTab('MenuSharePreview', {
            spaceId,
            menuDate: new Date().toISOString().slice(0, 10),
          });
          break;
        case 'MealDeliveryLocations':
          navigateFromTab('MealDeliveryLocations', { spaceId });
          break;
        case 'DashboardPendingActions':
          navigateFromTab('DashboardPendingActions', { spaceId });
          break;
        default:
          break;
      }
    },
    [
      navigateFromTab,
      permissions.canManageMembers,
      permissions.canViewAccommodation,
      spaceId,
      spaceType,
    ],
  );

  const runNavAction = useCallback(
    (action: HealthNavAction) => {
      switch (action.kind) {
        case 'setupTarget':
          navigateSetupTarget(action.target);
          break;
        case 'pendingActions':
          navigateFromTab('DashboardPendingActions', { spaceId });
          break;
        case 'paymentsUnderReview':
          navigateToPaymentsTab(spaceId, { initialFilter: 'underReview' });
          break;
        case 'vacantBeds':
          navigateFromTab('DashboardBedInventory', {
            spaceId,
            status: 'AVAILABLE',
          });
          break;
        case 'occupiedBeds':
          navigateFromTab('DashboardBedInventory', {
            spaceId,
            status: 'OCCUPIED',
          });
          break;
        default:
          break;
      }
    },
    [navigateFromTab, navigateSetupTarget, spaceId],
  );

  const scrollToCategory = useCallback((category: HealthCategoryId) => {
    const y = sectionY.current[category];
    if (y == null) {
      return;
    }
    scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.sm), animated: true });
  }, []);

  const onSectionLayout = useCallback(
    (category: HealthCategoryId) => (event: LayoutChangeEvent) => {
      sectionY.current[category] = event.nativeEvent.layout.y;
    },
    [],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setWeightsOpen(true)}
          hitSlop={12}
          style={styles.headerInfo}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.health.weightsInfo.a11y')}>
          <Info size={20} color={colors.muted} strokeWidth={2.2} />
        </Pressable>
      ),
    });
  }, [navigation, t]);

  const exampleRows = useMemo(() => {
    if (!health?.available) {
      return [];
    }
    return health.categories.map(category => {
      const weightPct = Math.round(category.weight * 100);
      const contribution = Math.round(category.score * category.weight);
      return {
        id: category.category,
        shortLabel: t(CATEGORY_SHORT[category.category]),
        scorePct: formatPercent(category.score),
        weightPct: `${weightPct}%`,
        contribution,
      };
    });
  }, [health, t]);

  const ringColor = health?.available
    ? bandAccent(health.band)
    : colors.primaryDark;

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {!health || !health.available ? (
          <View style={styles.card}>
            <Text style={styles.title}>{t('dashboard.health.title')}</Text>
            <Text style={styles.empty}>{t('dashboard.health.emptyBody')}</Text>
          </View>
        ) : (
          <>
            <View
              style={styles.summaryCard}
              accessibilityRole="summary"
              accessibilityLabel={t('dashboard.health.a11y.summary', {
                score: health.score,
                band: t(health.bandLabelKey),
              })}>
              <Text style={styles.eyebrow}>{t('dashboard.health.title')}</Text>
              <View style={styles.summaryRow}>
                <HealthScoreRing
                  score={health.score}
                  color={ringColor}
                  size={100}
                  strokeWidth={8}
                  footer={
                    <ShieldCheck
                      size={14}
                      color={ringColor}
                      strokeWidth={2.4}
                      style={styles.ringShield}
                    />
                  }
                />
                <View style={styles.summaryCopy}>
                  <Text style={[styles.band, { color: ringColor }]}>
                    {t(health.bandLabelKey)}
                  </Text>
                  <Text style={styles.summary}>{t(health.summaryKey)}</Text>
                </View>
              </View>

              <View style={styles.chipRow}>
                {health.categories.map(category => {
                  const accent = categoryAccent(category.category);
                  const Icon = CATEGORY_ICON[category.category];
                  return (
                    <Pressable
                      key={category.category}
                      onPress={() => scrollToCategory(category.category)}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: accent.soft },
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${t(
                        CATEGORY_SHORT[category.category],
                      )} ${formatPercent(category.score)}`}>
                      <View
                        style={[
                          styles.chipIcon,
                          { backgroundColor: colors.white },
                        ]}>
                        <Icon size={14} color={accent.accent} strokeWidth={2.2} />
                      </View>
                      <Text style={styles.chipLabel} numberOfLines={1}>
                        {t(CATEGORY_SHORT[category.category])}
                      </Text>
                      <Text style={[styles.chipScore, { color: accent.accent }]}>
                        {formatPercent(category.score)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {health.categories.map(category => (
              <CategoryCard
                key={category.category}
                category={category}
                recommendation={health.recommendation}
                onLayout={onSectionLayout(category.category)}
                onRunAction={runNavAction}
                t={t}
              />
            ))}

            <Pressable
              onPress={() => setWeightsOpen(true)}
              style={({ pressed }) => [
                styles.infoCard,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.health.weightsInfo.a11y')}>
              <View style={styles.infoIconWrap}>
                <Lightbulb size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>
                  {t('dashboard.health.weightsInfo.footerTitle')}
                </Text>
                <Text style={styles.infoSubtitle}>
                  {t('dashboard.health.weightsInfo.footerSubtitle')}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal
        visible={weightsOpen && health?.available === true}
        transparent
        animationType="fade"
        onRequestClose={() => setWeightsOpen(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen">
        <View style={styles.dialogBackdrop}>
          <Pressable
            style={styles.dialogBackdropTap}
            onPress={() => setWeightsOpen(false)}
            accessibilityRole="button"
          />
          <View style={styles.dialogCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.dialogScroll}>
              <Text style={styles.dialogTitle}>
                {t('dashboard.health.weightsInfo.title')}
              </Text>
              <Text style={styles.dialogBody}>
                {t('dashboard.health.weightsInfo.intro')}
              </Text>
              <Text style={styles.dialogBody}>
                {t('dashboard.health.weightsInfo.combines')}
              </Text>

              {(['setup', 'operations', 'attention'] as HealthCategoryId[]).map(
                id => {
                  const weightPct = Math.round(
                    (health?.categories.find(c => c.category === id)?.weight ??
                      0) * 100,
                  );
                  return (
                    <View key={id} style={styles.dialogBullet}>
                      <Text style={styles.dialogBulletTitle}>
                        •{' '}
                        <Text style={styles.dialogStrong}>
                          {t(CATEGORY_TITLE[id])} ({weightPct}%)
                        </Text>
                      </Text>
                      <Text style={styles.dialogBulletBody}>
                        {t(CATEGORY_EXPLAIN[id])}
                      </Text>
                    </View>
                  );
                },
              )}

              <Text style={[styles.dialogSectionTitle, styles.dialogSectionGap]}>
                {t('dashboard.health.weightsInfo.exampleTitle')}
              </Text>

              {exampleRows.map(row => (
                <View key={row.id} style={styles.exampleBlock}>
                  <Text style={styles.dialogStrong}>{row.shortLabel}</Text>
                  <Text style={styles.dialogBody}>
                    <Text style={styles.dialogStrong}>{row.scorePct}</Text>
                    {' × '}
                    <Text style={styles.dialogStrong}>{row.weightPct}</Text>
                    {' = '}
                    <Text style={styles.dialogStrong}>{row.contribution}</Text>
                  </Text>
                </View>
              ))}

              <View style={styles.exampleTotal}>
                <Text style={styles.dialogStrong}>
                  {t('dashboard.health.weightsInfo.overallLabel')}
                </Text>
                <Text style={styles.dialogBody}>
                  {exampleRows.map(r => r.contribution).join(' + ')}
                  {' = '}
                  <Text style={styles.dialogStrong}>
                    {formatPercent(health?.score ?? 0)}
                  </Text>
                </Text>
              </View>
            </ScrollView>

            <Button
              label={t('dashboard.health.weightsInfo.gotIt')}
              onPress={() => setWeightsOpen(false)}
              style={styles.dialogCta}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

type CategoryCardProps = {
  category: HealthCategoryBreakdown;
  recommendation: RecommendedAction | null;
  onLayout: (event: LayoutChangeEvent) => void;
  onRunAction: (action: HealthNavAction) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

function CategoryCard({
  category,
  recommendation,
  onLayout,
  onRunAction,
  t,
}: CategoryCardProps) {
  const accent = categoryAccent(category.category);
  const Icon = CATEGORY_ICON[category.category];
  const categoryBand = resolveHealthBand(category.score);

  const positiveFactors = category.factors.filter(f => f.tone === 'positive');
  const concernFactors = category.factors.filter(f => f.tone !== 'positive');

  const recommended = useMemo(() => {
    const fromSuggestion = category.suggestions[0];
    if (fromSuggestion) {
      const action = resolveHealthFactorAction(fromSuggestion, recommendation);
      return {
        title: t(fromSuggestion.labelKey, fromSuggestion.labelParams),
        action,
        Icon: Users,
      };
    }
    const occupancy = concernFactors.find(f => f.id === 'ops.occupancy');
    if (occupancy) {
      return {
        title: t('dashboard.health.actions.improveOccupancy'),
        action: resolveHealthFactorAction(occupancy, recommendation),
        Icon: Building2,
      };
    }
    return null;
  }, [category.suggestions, concernFactors, recommendation, t]);

  return (
    <View
      style={[styles.categoryCard, { borderLeftColor: accent.accent }]}
      onLayout={onLayout}>
      <View style={styles.catHeader}>
        <View style={[styles.catIconWrap, { backgroundColor: accent.soft }]}>
          <Icon size={22} color={accent.accent} strokeWidth={2.2} />
        </View>
        <View style={styles.catTitleBlock}>
          <Text style={styles.catTitle}>{t(CATEGORY_TITLE[category.category])}</Text>
          <Text style={[styles.catBand, { color: accent.accent }]}>
            {t(categoryBand.labelKey)}
          </Text>
        </View>
        <Text style={[styles.catScore, { color: accent.accent }]}>
          {formatPercent(category.score)}
        </Text>
      </View>

      <View style={styles.factorList}>
        {positiveFactors.map(factor => (
          <FactorRow key={factor.id} factor={factor} t={t} />
        ))}
        {concernFactors.map(factor => (
          <FactorRow
            key={factor.id}
            factor={factor}
            t={t}
            onPress={
              resolveHealthFactorAction(factor, recommendation)
                ? () => {
                    const action = resolveHealthFactorAction(
                      factor,
                      recommendation,
                    );
                    if (action) {
                      onRunAction(action);
                    }
                  }
                : undefined
            }
          />
        ))}
      </View>

      {recommended?.action ? (
        <Pressable
          onPress={() => {
            if (recommended.action) {
              onRunAction(recommended.action);
            }
          }}
          style={({ pressed }) => [
            styles.recCard,
            { backgroundColor: accent.soft },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={recommended.title}>
          <Text style={[styles.recEyebrow, { color: accent.accent }]}>
            {t('dashboard.health.recommendedAction')}
          </Text>
          <View style={styles.recRow}>
            <recommended.Icon
              size={18}
              color={accent.accent}
              strokeWidth={2.2}
            />
            <Text style={styles.recTitle} numberOfLines={2}>
              {recommended.title}
            </Text>
            <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function FactorRow({
  factor,
  t,
  onPress,
}: {
  factor: HealthFactor;
  t: (key: string, params?: Record<string, string | number>) => string;
  onPress?: () => void;
}) {
  const positive = factor.tone === 'positive';
  const label = t(factor.labelKey, factor.labelParams);
  const iconColor = positive
    ? colors.success
    : factor.tone === 'negative'
      ? '#DC2626'
      : '#D97706';

  const content = (
    <>
      {positive ? (
        <CheckCircle2 size={18} color={iconColor} strokeWidth={2.2} />
      ) : (
        <TriangleAlert size={18} color={iconColor} strokeWidth={2.2} />
      )}
      <Text
        style={[styles.factorLabel, !positive && { color: iconColor }]}
        numberOfLines={2}>
        {label}
      </Text>
      {onPress ? (
        <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
      ) : (
        <View style={styles.factorChevronSpacer} />
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.factorRow}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.factorRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 0,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerInfo: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  summaryCard: {
    padding: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.eyebrow,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ringShield: {
    marginTop: 2,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  band: {
    ...typography.h3,
    fontWeight: '800',
  },
  summary: {
    ...typography.caption,
    color: colors.muted,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 4,
    minHeight: 72,
  },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipScore: {
    ...typography.bodyStrong,
    fontWeight: '800',
  },
  categoryCard: {
    padding: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    ...shadows.sm,
    gap: spacing.sm,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  catTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  catBand: {
    ...typography.caption,
    fontWeight: '700',
  },
  catScore: {
    ...typography.h3,
    fontWeight: '800',
  },
  factorList: {
    gap: 2,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  factorLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  factorChevronSpacer: {
    width: 18,
  },
  recCard: {
    marginTop: spacing.xs,
    borderRadius: radius.button,
    padding: spacing.md,
    gap: spacing.xs,
  },
  recEyebrow: {
    ...typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    ...shadows.sm,
    minHeight: 64,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primaryDark}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  infoSubtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.88,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialogBackdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    zIndex: 1,
    elevation: 8,
    ...shadows.md,
  },
  dialogScroll: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  dialogTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dialogBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  dialogStrong: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dialogBullet: {
    gap: 2,
    marginTop: spacing.xs,
  },
  dialogBulletTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dialogBulletBody: {
    ...typography.caption,
    color: colors.muted,
    paddingLeft: spacing.md,
    lineHeight: 18,
  },
  dialogSectionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  dialogSectionGap: {
    marginTop: spacing.md,
  },
  exampleBlock: {
    gap: 2,
    marginTop: spacing.xs,
  },
  exampleTotal: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 2,
  },
  dialogCta: {
    marginTop: spacing.sm,
  },
});
