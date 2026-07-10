import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import apiClient from './client';
import { normalizeMemberMealActivityDayDetail } from '../utils/memberMealActivityDayDetail';
import type {
  ApiResponse,
  CreateMealPlanRequest,
  CreateMealParticipationRequest,
  CreateFoodCategoryRequest,
  CreateFoodItemRequest,
  CreateMealComboRequest,
  DailyMenuResponse,
  FoodCategoryResponse,
  FoodItemResponse,
  MealComboResponse,
  MealEligibilitySummaryResponse,
  MealEligibleParticipantResponse,
  MealDeliveryLocation,
  MealHeadcountDayResponse,
  MealHeadcountDeliveryLocation,
  MealHeadcountDetailResponse,
  MealParticipationResponse,
  MemberMealActivityDayDetail,
  MemberMealActivityMonth,
  MealParticipationSearchParams,
  MealPlanResponse,
  MealSharePreviewResponse,
  MealPollDayResponse,
  MealPollPaymentChoice,
  MealPollPaymentEvent,
  MealPollSlot,
  MemberMealParticipationSummary,
  PagedResponse,
  MealType,
  SubmitMealPollSelection,
  UpdateMealParticipationRequest,
  UpdateFoodItemRequest,
  UpdateFoodItemDefaultPriceRequest,
  UpdateMealComboRequest,
  UpsertDailyMenuRequest,
  UUID,
} from './types';

const LOG_TAG = '[MealsApi]';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const mealsApi = {
  getMealPlans: async (spaceId: UUID): Promise<MealPlanResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/meal-plans`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealPlanResponse[]>>(`/spaces/${spaceId}/meal-plans`),
    );
  },

  createMealPlan: async (
    spaceId: UUID,
    body: CreateMealPlanRequest,
  ): Promise<MealPlanResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/meal-plans`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealPlanResponse>>(`/spaces/${spaceId}/meal-plans`, body),
    );
  },

  getMealParticipations: async (
    spaceId: UUID,
    params?: MealParticipationSearchParams,
  ): Promise<MealParticipationResponse[]> => {
    const q = new URLSearchParams();
    if (params?.status) {
      q.set('status', params.status);
    }
    if (params?.mealPlanCode) {
      q.set('mealPlanCode', params.mealPlanCode);
    }
    if (params?.search?.trim()) {
      q.set('search', params.search.trim());
    }
    const query = q.toString();
    const path = `/spaces/${spaceId}/meal-participations${query ? `?${query}` : ''}`;
    console.log(`${LOG_TAG} GET ${path}`);
    const page = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<MealParticipationResponse>>>(path),
    );
    return page.content ?? [];
  },

  getMemberMealActivity: async (
    spaceId: UUID,
    memberId: UUID,
    month?: string,
  ): Promise<MemberMealActivityMonth> => {
    const q = month ? `?month=${encodeURIComponent(month)}` : '';
    const path = `/spaces/${spaceId}/members/${memberId}/meal-activity${q}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberMealActivityMonth>>(path),
    );
  },

  getMemberMealActivityDay: async (
    spaceId: UUID,
    memberId: UUID,
    date: string,
  ): Promise<MemberMealActivityDayDetail> => {
    const encoded = encodeURIComponent(date);
    const pathVar = `/spaces/${spaceId}/members/${memberId}/meal-activity/${encoded}`;
    const pathQuery = `/spaces/${spaceId}/members/${memberId}/meal-activity?date=${encoded}`;

    const fetchDetail = async (path: string) => {
      console.log(`${LOG_TAG} GET ${path}`);
      const raw = await unwrapApiResponse(
        apiClient.get<ApiResponse<Record<string, unknown>>>(path),
      );
      return normalizeMemberMealActivityDayDetail(raw);
    };

    try {
      return await fetchDetail(pathVar);
    } catch {
      return fetchDetail(pathQuery);
    }
  },

  createMealParticipation: async (
    spaceId: UUID,
    body: CreateMealParticipationRequest,
  ): Promise<MealParticipationResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/meal-participations`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealParticipationResponse>>(
        `/spaces/${spaceId}/meal-participations`,
        body,
      ),
    );
  },

  updateMealParticipation: async (
    spaceId: UUID,
    participationId: UUID,
    body: UpdateMealParticipationRequest,
  ): Promise<MealParticipationResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/meal-participations/${participationId}`, body);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MealParticipationResponse>>(
        `/spaces/${spaceId}/meal-participations/${participationId}`,
        body,
      ),
    );
  },

  pauseMealParticipation: async (
    spaceId: UUID,
    participationId: UUID,
  ): Promise<MealParticipationResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealParticipationResponse>>(
        `/spaces/${spaceId}/meal-participations/${participationId}/pause`,
      ),
    );
  },

  resumeMealParticipation: async (
    spaceId: UUID,
    participationId: UUID,
  ): Promise<MealParticipationResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealParticipationResponse>>(
        `/spaces/${spaceId}/meal-participations/${participationId}/resume`,
      ),
    );
  },

  stopMealParticipation: async (
    spaceId: UUID,
    participationId: UUID,
  ): Promise<void> => {
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/meal-participations/${participationId}/stop`),
    );
  },

  getMealCombos: async (spaceId: UUID): Promise<MealComboResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/meal-combos`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealComboResponse[]>>(`/spaces/${spaceId}/meal-combos`),
    );
  },

  createMealCombo: async (
    spaceId: UUID,
    body: CreateMealComboRequest,
  ): Promise<MealComboResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/meal-combos`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealComboResponse>>(`/spaces/${spaceId}/meal-combos`, body),
    );
  },

  updateMealCombo: async (
    spaceId: UUID,
    comboId: UUID,
    body: UpdateMealComboRequest,
  ): Promise<MealComboResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/meal-combos/${comboId}`, body);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MealComboResponse>>(
        `/spaces/${spaceId}/meal-combos/${comboId}`,
        body,
      ),
    );
  },

  updateMealComboPrice: async (
    spaceId: UUID,
    comboId: UUID,
    body: UpdateFoodItemDefaultPriceRequest,
  ): Promise<MealComboResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/meal-combos/${comboId}/price`, body);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MealComboResponse>>(
        `/spaces/${spaceId}/meal-combos/${comboId}/price`,
        body,
      ),
    );
  },

  deactivateMealCombo: async (spaceId: UUID, comboId: UUID): Promise<void> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/meal-combos/${comboId}/deactivate`);
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/meal-combos/${comboId}/deactivate`),
    );
  },

  getFoodCategories: async (spaceId: UUID): Promise<FoodCategoryResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/food-categories`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<FoodCategoryResponse[]>>(`/spaces/${spaceId}/food-categories`),
    );
  },

  createFoodCategory: async (
    spaceId: UUID,
    body: CreateFoodCategoryRequest,
  ): Promise<FoodCategoryResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/food-categories`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<FoodCategoryResponse>>(
        `/spaces/${spaceId}/food-categories`,
        body,
      ),
    );
  },

  deactivateFoodCategory: async (spaceId: UUID, categoryId: UUID): Promise<void> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/food-categories/${categoryId}/deactivate`);
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/food-categories/${categoryId}/deactivate`),
    );
  },

  getFoodItems: async (
    spaceId: UUID,
    categoryId?: UUID,
  ): Promise<FoodItemResponse[]> => {
    const q = categoryId ? `?categoryId=${categoryId}` : '';
    const path = `/spaces/${spaceId}/food-items${q}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<FoodItemResponse[]>>(path),
    );
  },

  createFoodItem: async (
    spaceId: UUID,
    body: CreateFoodItemRequest,
  ): Promise<FoodItemResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/food-items`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<FoodItemResponse>>(`/spaces/${spaceId}/food-items`, body),
    );
  },

  updateFoodItem: async (
    spaceId: UUID,
    itemId: UUID,
    body: UpdateFoodItemRequest,
  ): Promise<FoodItemResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/food-items/${itemId}`, body);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<FoodItemResponse>>(
        `/spaces/${spaceId}/food-items/${itemId}`,
        body,
      ),
    );
  },

  updateFoodItemDefaultPrice: async (
    spaceId: UUID,
    itemId: UUID,
    body: UpdateFoodItemDefaultPriceRequest,
  ): Promise<FoodItemResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/food-items/${itemId}/default-price`, body);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<FoodItemResponse>>(
        `/spaces/${spaceId}/food-items/${itemId}/default-price`,
        body,
      ),
    );
  },

  deactivateFoodItem: async (spaceId: UUID, itemId: UUID): Promise<void> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/food-items/${itemId}/deactivate`);
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/food-items/${itemId}/deactivate`),
    );
  },

  getDailyMenusToday: async (spaceId: UUID): Promise<DailyMenuResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/daily-menus/today`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<DailyMenuResponse[]>>(`/spaces/${spaceId}/daily-menus/today`),
    );
  },

  getDailyMenusByDate: async (spaceId: UUID, menuDate: string): Promise<DailyMenuResponse[]> => {
    const path = `/spaces/${spaceId}/daily-menus/${menuDate}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<DailyMenuResponse[]>>(path),
    );
  },

  getDailyMenusRange: async (
    spaceId: UUID,
    from: string,
    to: string,
  ): Promise<DailyMenuResponse[]> => {
    const path = `/spaces/${spaceId}/daily-menus?from=${from}&to=${to}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<DailyMenuResponse[]>>(path),
    );
  },

  getDailyMenu: async (
    spaceId: UUID,
    menuDate: string,
    mealType: MealType,
  ): Promise<DailyMenuResponse> => {
    const path = `/spaces/${spaceId}/daily-menus/${menuDate}/${mealType}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(apiClient.get<ApiResponse<DailyMenuResponse>>(path));
  },

  upsertDailyMenu: async (
    spaceId: UUID,
    menuDate: string,
    mealType: MealType,
    body: UpsertDailyMenuRequest,
  ): Promise<DailyMenuResponse> => {
    const path = `/spaces/${spaceId}/daily-menus/${menuDate}/${mealType}`;
    console.log(`${LOG_TAG} PUT ${path}`, body);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<DailyMenuResponse>>(path, body),
    );
  },

  publishDailyMenu: async (
    spaceId: UUID,
    menuDate: string,
    mealType: MealType,
  ): Promise<DailyMenuResponse> => {
    const path = `/spaces/${spaceId}/daily-menus/${menuDate}/${mealType}/publish`;
    console.log(`${LOG_TAG} POST ${path}`);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<DailyMenuResponse>>(path),
    );
  },

  deleteDailyMenu: async (
    spaceId: UUID,
    menuDate: string,
    mealType: MealType,
  ): Promise<void> => {
    const path = `/spaces/${spaceId}/daily-menus/${menuDate}/${mealType}`;
    console.log(`${LOG_TAG} DELETE ${path}`);
    await unwrapVoidResponse(apiClient.delete(path));
  },

  copyDailyMenu: async (
    spaceId: UUID,
    targetDate: string,
    mealType: MealType,
    sourceDate: string,
    body?: { force?: boolean; publish?: boolean },
  ): Promise<DailyMenuResponse> => {
    const path = `/spaces/${spaceId}/daily-menus/${targetDate}/${mealType}/copy-from/${sourceDate}`;
    console.log(`${LOG_TAG} POST ${path}`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<DailyMenuResponse>>(path, body ?? {}),
    );
  },

  getSharePreview: async (
    spaceId: UUID,
    menuDate: string,
    mealType?: MealType,
  ): Promise<MealSharePreviewResponse> => {
    const q = new URLSearchParams({ date: menuDate });
    if (mealType) {
      q.set('mealType', mealType);
    }
    const path = `/spaces/${spaceId}/meals/share-preview?${q.toString()}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealSharePreviewResponse>>(path),
    );
  },

  getEligibilitySummary: async (
    spaceId: UUID,
    date?: string,
  ): Promise<MealEligibilitySummaryResponse> => {
    const menuDate = date ?? todayIsoDate();
    const path = `/spaces/${spaceId}/meals/eligibility-summary?date=${menuDate}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealEligibilitySummaryResponse>>(path),
    );
  },

  getEligibleParticipants: async (
    spaceId: UUID,
    menuDate: string,
    mealType: MealType,
  ): Promise<MealEligibleParticipantResponse[]> => {
    const path = `/spaces/${spaceId}/meals/eligible-participants?date=${menuDate}&mealType=${mealType}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealEligibleParticipantResponse[]>>(path),
    );
  },

  getMealHeadcountDay: async (
    spaceId: UUID,
    menuDate: string,
  ): Promise<MealHeadcountDayResponse> => {
    const path = `/spaces/${spaceId}/meals/headcount?date=${menuDate}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealHeadcountDayResponse>>(path),
    );
  },

  getMealHeadcountDetail: async (
    spaceId: UUID,
    menuDate: string,
    mealType: MealType,
  ): Promise<MealHeadcountDetailResponse> => {
    const path = `/spaces/${spaceId}/meals/headcount?date=${menuDate}&mealType=${mealType}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealHeadcountDetailResponse>>(path),
    );
  },

  getMealPolls: async (spaceId: UUID, menuDate: string): Promise<MealPollDayResponse> => {
    const path = `/spaces/${spaceId}/meal-polls?date=${menuDate}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(apiClient.get<ApiResponse<MealPollDayResponse>>(path));
  },

  openMealPoll: async (
    spaceId: UUID,
    menuDate: string,
    mealType: MealType,
  ): Promise<MealPollSlot> => {
    const path = `/spaces/${spaceId}/meal-polls/${menuDate}/${mealType}/open`;
    console.log(`${LOG_TAG} POST ${path}`);
    return unwrapApiResponse(apiClient.post<ApiResponse<MealPollSlot>>(path));
  },

  closeMealPoll: async (
    spaceId: UUID,
    menuDate: string,
    mealType: MealType,
  ): Promise<MealPollSlot> => {
    const path = `/spaces/${spaceId}/meal-polls/${menuDate}/${mealType}/close`;
    console.log(`${LOG_TAG} POST ${path}`);
    return unwrapApiResponse(apiClient.post<ApiResponse<MealPollSlot>>(path));
  },

  submitMealPollResponses: async (
    spaceId: UUID,
    menuDate: string,
    selections: SubmitMealPollSelection[],
    paymentChoice?: MealPollPaymentChoice,
    proofImageBase64?: string,
  ): Promise<MealPollDayResponse> => {
    const path = `/spaces/${spaceId}/meal-polls/${menuDate}/responses`;
    console.log(`${LOG_TAG} POST ${path}`, selections, paymentChoice);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(path, {
        selections,
        ...(paymentChoice ? { paymentChoice } : {}),
        ...(proofImageBase64 ? { proofImageBase64 } : {}),
      }),
    );
  },

  submitMealPollPaymentProof: async (
    spaceId: UUID,
    menuDate: string,
    proofImageBase64: string,
  ): Promise<MealPollDayResponse> => {
    const path = `/spaces/${spaceId}/meal-polls/${menuDate}/payment-proof`;
    console.log(`${LOG_TAG} POST ${path}`);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(path, { proofImageBase64 }),
    );
  },

  approveMealPollPayment: async (
    spaceId: UUID,
    menuDate: string,
    memberId: UUID,
    approvalRemarks?: string,
  ): Promise<MealPollDayResponse> => {
    const path = `/spaces/${spaceId}/meal-polls/${menuDate}/payments/${memberId}/approve`;
    console.log(`${LOG_TAG} POST ${path}`);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(path, {
        ...(approvalRemarks ? { approvalRemarks } : {}),
      }),
    );
  },

  rejectMealPollPayment: async (
    spaceId: UUID,
    menuDate: string,
    memberId: UUID,
    rejectionReason?: string,
  ): Promise<MealPollDayResponse> => {
    const path = `/spaces/${spaceId}/meal-polls/${menuDate}/payments/${memberId}/reject`;
    console.log(`${LOG_TAG} POST ${path}`);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealPollDayResponse>>(path, {
        ...(rejectionReason ? { rejectionReason } : {}),
      }),
    );
  },

  sendMealPollPaymentReminder: async (
    spaceId: UUID,
    menuDate: string,
    memberId: UUID,
  ): Promise<MealPollDayResponse> => {
    const path = `/spaces/${spaceId}/meal-polls/${menuDate}/payments/${memberId}/remind`;
    console.log(`${LOG_TAG} POST ${path}`);
    return unwrapApiResponse(apiClient.post<ApiResponse<MealPollDayResponse>>(path));
  },

  getMemberMealPaymentEvents: async (
    spaceId: UUID,
    memberId: UUID,
    month: string,
  ): Promise<MealPollPaymentEvent[]> => {
    const path = `/spaces/${spaceId}/members/${memberId}/meal-payment-events?month=${encodeURIComponent(month)}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(apiClient.get<ApiResponse<MealPollPaymentEvent[]>>(path));
  },

  getMealDeliveryLocations: async (spaceId: UUID): Promise<MealDeliveryLocation[]> => {
    const path = `/spaces/${spaceId}/meal-delivery-locations`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(apiClient.get<ApiResponse<MealDeliveryLocation[]>>(path));
  },

  getMealDeliveryLocationsManage: async (spaceId: UUID): Promise<MealDeliveryLocation[]> => {
    const path = `/spaces/${spaceId}/meal-delivery-locations/manage`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(apiClient.get<ApiResponse<MealDeliveryLocation[]>>(path));
  },

  createMealDeliveryLocation: async (
    spaceId: UUID,
    body: { name: string; description?: string; address?: string; sortOrder?: number },
  ): Promise<MealDeliveryLocation> => {
    const path = `/spaces/${spaceId}/meal-delivery-locations`;
    console.log(`${LOG_TAG} POST ${path}`, body);
    return unwrapApiResponse(apiClient.post<ApiResponse<MealDeliveryLocation>>(path, body));
  },

  updateMealDeliveryLocation: async (
    spaceId: UUID,
    locationId: UUID,
    body: { name?: string; description?: string; address?: string; active?: boolean; sortOrder?: number },
  ): Promise<MealDeliveryLocation> => {
    const path = `/spaces/${spaceId}/meal-delivery-locations/${locationId}`;
    console.log(`${LOG_TAG} PUT ${path}`, body);
    return unwrapApiResponse(apiClient.put<ApiResponse<MealDeliveryLocation>>(path, body));
  },

  reorderMealDeliveryLocations: async (
    spaceId: UUID,
    locationIdsInOrder: UUID[],
  ): Promise<MealDeliveryLocation[]> => {
    const path = `/spaces/${spaceId}/meal-delivery-locations/reorder`;
    console.log(`${LOG_TAG} POST ${path}`, locationIdsInOrder);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MealDeliveryLocation[]>>(path, { locationIdsInOrder }),
    );
  },
};

export async function enrollMemberInFullMeals(
  spaceId: UUID,
  memberId: UUID,
): Promise<MealParticipationResponse | null> {
  const plans = await mealsApi.getMealPlans(spaceId);
  const fullPlan = plans.find(plan => plan.code === 'FULL' && plan.isActive);
  if (!fullPlan) {
    return null;
  }

  return mealsApi.createMealParticipation(spaceId, {
    memberId,
    mealPlanId: fullPlan.mealPlanId,
    effectiveFrom: todayIsoDate(),
  });
}

export async function setMemberMealAccess(
  spaceId: UUID,
  memberId: UUID,
  enabled: boolean,
  participation?: MemberMealParticipationSummary | null,
): Promise<void> {
  if (enabled) {
    if (participation?.status === 'ACTIVE') {
      return;
    }
    if (participation?.status === 'PAUSED') {
      await mealsApi.resumeMealParticipation(spaceId, participation.participationId);
      return;
    }
    const created = await enrollMemberInFullMeals(spaceId, memberId);
    if (!created) {
      throw new Error('FULL meal plan not available');
    }
    return;
  }

  if (participation && participation.status !== 'STOPPED') {
    await mealsApi.stopMealParticipation(spaceId, participation.participationId);
  }
}
