import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
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
  MealParticipationResponse,
  MealParticipationSearchParams,
  MealPlanResponse,
  MealSharePreviewResponse,
  MealType,
  UpdateMealParticipationRequest,
  UpdateFoodItemRequest,
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
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealParticipationResponse[]>>(path),
    );
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
