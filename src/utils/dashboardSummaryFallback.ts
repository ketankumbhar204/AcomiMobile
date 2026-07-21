import { accommodationApi } from '../api/accommodationApi';
import { mealsApi } from '../api/mealsApi';
import { memberApi } from '../api/memberApi';
import { occupancyApi } from '../api/occupancyApi';
import { subscriptionPlansApi } from '../api/subscriptionPlansApi';
import type {
  DashboardAccommodationOperations,
  DashboardAttentionItem,
  DashboardFinancialSummary,
  DashboardSummaryResponse,
  MemberPaymentLedgerResponse,
  MemberPaymentLedgerRow,
  OccupancyResponse,
  SpaceType,
  UUID,
} from '../api/types';
import {
  aggregateFinancialFromRows,
  buildFinancialSummary,
  computePending,
  currentMonthKey,
  derivePaymentStatus,
  mergeFinancialSummaries,
  monthDateRange,
  sumNullable,
} from './dashboardFinancial';
import { resolveDashboardAttention } from './dashboardTomorrowMenu';
import { isAccommodationApplicable } from './accommodationProfile';
import { computeOccupancyMonthlyTotalForMonth, isOccupancyBillableInMonth } from './occupancyContract';
import { tomorrowIsoDate } from './mealDates';

async function aggregateMealFinancial(
  spaceId: UUID,
  memberIds: UUID[],
  month: string,
): Promise<DashboardFinancialSummary> {
  if (memberIds.length === 0) {
    return buildFinancialSummary(null, null, 'INR', 'MEAL_ACTIVITY');
  }

  const activities = await Promise.all(
    memberIds.map(memberId =>
      mealsApi.getMemberMealActivity(spaceId, memberId, month).catch(() => null),
    ),
  );

  const currencyCode =
    activities.find(row => row?.summary?.currencyCode)?.summary?.currencyCode ?? 'INR';

  return buildFinancialSummary(
    sumNullable(activities.map(row => row?.summary?.amountGenerated ?? null)),
    sumNullable(activities.map(row => row?.summary?.paidAmount ?? null)),
    currencyCode,
    'MEAL_ACTIVITY',
  );
}

async function loadActiveOccupancies(spaceId: UUID): Promise<OccupancyResponse[]> {
  const page = await occupancyApi.listOccupancies(spaceId, { status: 'ACTIVE', size: 500 }).catch(
    () => ({ content: [] as OccupancyResponse[] }),
  );
  return page.content ?? [];
}

function aggregateOccupancyFinancial(
  occupancies: OccupancyResponse[],
  month: string,
): DashboardFinancialSummary {
  const billable = occupancies.filter(occupancy => isOccupancyBillableInMonth(occupancy, month));
  const expected = sumNullable(
    billable.map(occupancy => computeOccupancyMonthlyTotalForMonth(occupancy, month)),
  );
  return buildFinancialSummary(expected, null, 'INR', 'OCCUPANCY');
}

function countMoveInsThisMonth(occupancies: OccupancyResponse[], month: string): number {
  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = `${month}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`;

  return occupancies.filter(occupancy => {
    const moveIn = (occupancy.actualMoveInAt ?? occupancy.moveInDate)?.slice(0, 10);
    if (!moveIn) {
      return false;
    }
    return moveIn >= monthStart && moveIn <= monthEnd;
  }).length;
}

async function loadAccommodationOperations(
  spaceId: UUID,
  occupancies: OccupancyResponse[],
  month: string,
  pendingPaymentsCount: number,
): Promise<DashboardAccommodationOperations> {
  // Space-level bed totals only — never N× getBuildingSummary (that is the COUNT storm).
  const [availablePage, occupiedPage] = await Promise.all([
    accommodationApi
      .searchBeds(spaceId, { status: 'AVAILABLE', page: 0, size: 1 })
      .catch(() => null),
    accommodationApi
      .searchBeds(spaceId, { status: 'OCCUPIED', page: 0, size: 1 })
      .catch(() => null),
  ]);

  return {
    occupiedBeds: occupiedPage?.totalElements ?? 0,
    vacantBeds: availablePage?.totalElements ?? 0,
    moveInsThisMonth: countMoveInsThisMonth(occupancies, month),
    pendingPaymentsCount,
  };
}

function resolveSubscriptionActivationAttention(
  pendingCount: number,
): DashboardAttentionItem | null {
  if (pendingCount <= 0) {
    return null;
  }

  return {
    kind: 'subscription_activation_pending',
    pendingSubscriptionRequestCount: pendingCount,
  };
}

async function loadSubscriptionActivationAttention(spaceId: UUID): Promise<DashboardAttentionItem | null> {
  try {
    const requests = await subscriptionPlansApi.listPendingRequests(spaceId);
    return resolveSubscriptionActivationAttention(requests.length);
  } catch {
    return null;
  }
}

async function loadMessAttention(spaceId: UUID): Promise<DashboardAttentionItem[]> {
  const tomorrow = tomorrowIsoDate();
  const [menus, eligibility, pollDay] = await Promise.all([
    mealsApi.getDailyMenusByDate(spaceId, tomorrow),
    mealsApi.getEligibilitySummary(spaceId, tomorrow).catch(() => null),
    mealsApi.getMealPolls(spaceId, tomorrow).catch(() => ({ pollDate: tomorrow, polls: [] })),
  ]);

  const menuAttention = resolveDashboardAttention(menus, eligibility, pollDay.polls);
  return menuAttention ? [menuAttention] : [];
}

/**
 * @deprecated Do not use for Action Center. Dashboard-summary is served by the backend;
 * Pending Actions is the single source of truth. Kept only for historical reference —
 * prefer failing closed over synthesizing attention.
 */
export async function buildDashboardSummaryFallback(
  spaceId: UUID,
  spaceType: SpaceType,
  month = currentMonthKey(),
): Promise<DashboardSummaryResponse> {
  const accommodationApplicable = isAccommodationApplicable(spaceType);
  const isMess = spaceType === 'MESS';

  let financialParts: DashboardFinancialSummary[] = [];
  let messOperations = null;
  let accommodationOperations: DashboardAccommodationOperations | null = null;
  let attention: DashboardAttentionItem[] = [];

  const participations = await mealsApi
    .getMealParticipations(spaceId, { status: 'ACTIVE' })
    .catch(() => []);
  const mealMemberIds = participations.map(row => row.memberId);

  if (isMess || mealMemberIds.length > 0) {
    financialParts.push(await aggregateMealFinancial(spaceId, mealMemberIds, month));
  }

  let activeOccupancies: OccupancyResponse[] = [];
  if (accommodationApplicable) {
    activeOccupancies = await loadActiveOccupancies(spaceId);
    financialParts.push(aggregateOccupancyFinancial(activeOccupancies, month));
  }

  const financial = mergeFinancialSummaries(financialParts);

  const ledger = await buildMemberPaymentLedgerFallback(
    spaceId,
    spaceType,
    month,
    mealMemberIds,
    activeOccupancies,
  );
  // Payment pending actions come from the notification/payment sync path on the live API.
  // Do not invent a separate payments_overdue attention count in the client fallback.

  if (isMess) {
    // Mess operations summary cards were removed from the dashboard UI.
    const subscriptionAttention = await loadSubscriptionActivationAttention(spaceId);
    const messAttention = await loadMessAttention(spaceId);
    attention = [
      ...(subscriptionAttention ? [subscriptionAttention] : []),
      ...messAttention,
      ...attention,
    ];
  }

  if (accommodationApplicable) {
    const pendingPaymentsCount = ledger.members.filter(
      row =>
        row.status === 'PENDING' ||
        row.status === 'PARTIAL' ||
        row.status === 'UPDATE_REQUESTED' ||
        row.status === 'REJECTED',
    ).length;
    accommodationOperations = await loadAccommodationOperations(
      spaceId,
      activeOccupancies,
      month,
      pendingPaymentsCount,
    );
  }

  return {
    spaceType,
    month,
    financial,
    messOperations,
    accommodationOperations,
    attention,
    pendingActions: null,
  };
}

export async function buildMemberPaymentLedgerFallback(
  spaceId: UUID,
  spaceType: SpaceType,
  month: string,
  mealMemberIds?: UUID[],
  activeOccupancies?: OccupancyResponse[],
): Promise<MemberPaymentLedgerResponse> {
  const members = await memberApi.getMembers(spaceId).catch(() => []);
  const isMess = spaceType === 'MESS';
  const accommodationApplicable = isAccommodationApplicable(spaceType);

  const participations =
    mealMemberIds != null
      ? mealMemberIds
      : (await mealsApi.getMealParticipations(spaceId, { status: 'ACTIVE' }).catch(() => [])).map(
          row => row.memberId,
        );

  const occupancies =
    activeOccupancies ??
    (accommodationApplicable ? await loadActiveOccupancies(spaceId) : []);

  const occupancyByMember = new Map<UUID, OccupancyResponse>();
  for (const occupancy of occupancies) {
    occupancyByMember.set(occupancy.memberId, occupancy);
  }

  const relevantMemberIds = new Set<UUID>();
  if (isMess || participations.length > 0) {
    participations.forEach(memberId => relevantMemberIds.add(memberId));
  }
  if (accommodationApplicable) {
    occupancies
      .filter(occupancy => isOccupancyBillableInMonth(occupancy, month))
      .forEach(occupancy => relevantMemberIds.add(occupancy.memberId));
  }

  const rows: MemberPaymentLedgerRow[] = [];

  for (const memberId of relevantMemberIds) {
    const member = members.find(row => row.memberId === memberId);
    if (!member) {
      continue;
    }

    let expectedParts: Array<number | null> = [];
    let collectedParts: Array<number | null> = [];
    let currencyCode = 'INR';

    if (isMess || participations.includes(memberId)) {
      const activity = await mealsApi
        .getMemberMealActivity(spaceId, memberId, month)
        .catch(() => null);
      if (activity?.summary) {
        expectedParts.push(activity.summary.amountGenerated ?? null);
        collectedParts.push(activity.summary.paidAmount ?? null);
        currencyCode = activity.summary.currencyCode ?? currencyCode;
      }
    }

    const occupancy = occupancyByMember.get(memberId);
    if (occupancy && accommodationApplicable) {
      expectedParts.push(computeOccupancyMonthlyTotalForMonth(occupancy, month));
    }

    const expectedCharges = sumNullable(expectedParts);
    const collected = sumNullable(collectedParts);
    const underReview = null;
    const pending = computePending(expectedCharges, collected, underReview);

    rows.push({
      memberId,
      memberName: member.fullName,
      expectedCharges,
      collected,
      underReview,
      pending,
      currencyCode,
      status: derivePaymentStatus(expectedCharges, collected, underReview),
    });
  }

  rows.sort((a, b) => {
    const pendingDiff = (b.pending ?? 0) - (a.pending ?? 0);
    if (pendingDiff !== 0) {
      return pendingDiff;
    }
    return a.memberName.localeCompare(b.memberName);
  });

  const hasMealParticipation = participations.length > 0;
  const summarySource =
    isMess ? 'MEAL_ACTIVITY'
    : hasMealParticipation && accommodationApplicable ? 'HYBRID'
    : accommodationApplicable ? 'OCCUPANCY'
    : 'API';

  const summary = aggregateFinancialFromRows(rows, summarySource);

  return {
    month,
    spaceType,
    summary,
    members: rows,
  };
}
