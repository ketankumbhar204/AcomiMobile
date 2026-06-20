import { accommodationApi } from '../api/accommodationApi';
import { mealsApi } from '../api/mealsApi';
import { memberApi } from '../api/memberApi';
import { occupancyApi } from '../api/occupancyApi';
import type {
  DashboardAccommodationOperations,
  DashboardAttentionItem,
  DashboardFinancialSummary,
  DashboardMessOperations,
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
import { computeOccupancyMonthlyTotal } from './occupancyContract';
import { todayIsoDate, tomorrowIsoDate } from './mealDates';

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
): DashboardFinancialSummary {
  const expected = sumNullable(
    occupancies.map(occupancy => computeOccupancyMonthlyTotal(occupancy)),
  );
  return buildFinancialSummary(expected, null, 'INR', 'OCCUPANCY');
}

function countMoveInsThisMonth(occupancies: OccupancyResponse[], month: string): number {
  const prefix = `${month}-`;
  return occupancies.filter(occupancy => {
    const moveIn = occupancy.moveInDate ?? occupancy.actualMoveInAt?.slice(0, 10);
    return moveIn?.startsWith(prefix);
  }).length;
}

async function loadAccommodationOperations(
  spaceId: UUID,
  occupancies: OccupancyResponse[],
  month: string,
  pendingPaymentsCount: number,
): Promise<DashboardAccommodationOperations> {
  const buildings = await accommodationApi.getBuildings(spaceId).catch(() => []);
  const summaries = await Promise.all(
    buildings.map(building =>
      accommodationApi.getBuildingSummary(spaceId, building.buildingId).catch(() => null),
    ),
  );

  const occupiedBeds = summaries.reduce(
    (total, row) => total + (row?.occupiedBeds ?? row?.occupied ?? 0),
    0,
  );
  const vacantBeds = summaries.reduce(
    (total, row) => total + (row?.availableBeds ?? row?.available ?? 0),
    0,
  );

  return {
    occupiedBeds,
    vacantBeds,
    moveInsThisMonth: countMoveInsThisMonth(occupancies, month),
    pendingPaymentsCount,
  };
}

async function loadMessOperations(spaceId: UUID): Promise<DashboardMessOperations> {
  const tomorrow = tomorrowIsoDate();
  const today = todayIsoDate();
  const month = currentMonthKey();
  const { from, to } = monthDateRange(month);

  const [eligibility, pollDay, menusMonth, participations, headcountDay] = await Promise.all([
    mealsApi.getEligibilitySummary(spaceId, tomorrow).catch(() => null),
    mealsApi.getMealPolls(spaceId, tomorrow).catch(() => ({ pollDate: tomorrow, polls: [] })),
    mealsApi.getDailyMenusRange(spaceId, from, to).catch(() => []),
    mealsApi.getMealParticipations(spaceId, { status: 'ACTIVE' }).catch(() => []),
    mealsApi.getMealHeadcountDay(spaceId, today).catch(() => ({ date: today, slots: [] })),
  ]);

  const openPolls = pollDay.polls.filter(poll => poll.status === 'OPEN');
  const eligibleCount =
    eligibility?.distinctEligibleMemberCount ??
    eligibility?.slots.reduce((max, slot) => Math.max(max, slot.eligibleCount), 0) ??
    participations.length;

  const todaysHeadcount = headcountDay.slots.reduce(
    (total, slot) => total + (slot.mealsToPrepare ?? 0),
    0,
  );

  return {
    membersReceivingMeals: eligibleCount,
    menusPublishedThisMonth: menusMonth.filter(menu => menu.status === 'PUBLISHED').length,
    openPollsCount: openPolls.length,
    todaysHeadcount: todaysHeadcount > 0 ? todaysHeadcount : null,
    pollRespondedCount:
      openPolls.length > 0 ? Math.max(...openPolls.map(poll => poll.responseCount)) : 0,
    pollEligibleCount: eligibleCount,
  };
}

function resolvePaymentsAttention(
  pendingCount: number,
  overdueAmount: number | null,
  currencyCode: string,
): DashboardAttentionItem | null {
  if (pendingCount <= 0) {
    return null;
  }

  return {
    kind: 'payments_overdue',
    overdueCount: pendingCount,
    overdueAmount,
    currencyCode,
  };
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

export async function buildDashboardSummaryFallback(
  spaceId: UUID,
  spaceType: SpaceType,
  month = currentMonthKey(),
): Promise<DashboardSummaryResponse> {
  const accommodationApplicable = isAccommodationApplicable(spaceType);
  const isMess = spaceType === 'MESS';

  let financialParts: DashboardFinancialSummary[] = [];
  let messOperations: DashboardMessOperations | null = null;
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
    financialParts.push(aggregateOccupancyFinancial(activeOccupancies));
  }

  const financial = mergeFinancialSummaries(financialParts);

  const ledger = await buildMemberPaymentLedgerFallback(
    spaceId,
    spaceType,
    month,
    mealMemberIds,
    activeOccupancies,
  );
  const pendingPaymentsCount = ledger.members.filter(row => row.status === 'PENDING' || row.status === 'PARTIAL').length;

  const paymentsAttention = resolvePaymentsAttention(
    pendingPaymentsCount,
    financial.pending,
    financial.currencyCode,
  );
  if (paymentsAttention) {
    attention.push(paymentsAttention);
  }

  if (isMess) {
    messOperations = await loadMessOperations(spaceId);
    attention = [...(await loadMessAttention(spaceId)), ...attention];
  }

  if (accommodationApplicable) {
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
    occupancies.forEach(occupancy => relevantMemberIds.add(occupancy.memberId));
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
      expectedParts.push(computeOccupancyMonthlyTotal(occupancy));
    }

    const expectedCharges = sumNullable(expectedParts);
    const collected = sumNullable(collectedParts);
    const pending = computePending(expectedCharges, collected);

    rows.push({
      memberId,
      memberName: member.fullName,
      expectedCharges,
      collected,
      pending,
      currencyCode,
      status: derivePaymentStatus(expectedCharges, collected),
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
