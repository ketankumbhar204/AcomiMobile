import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../api/mealsApi';
import type {
  MealDeliveryLocation,
  MealPollPaymentChoice,
  MealPollPaymentStatus,
  MealPollSlot,
  MealType,
  SpaceType,
  SubmitMealPollSelection,
  UUID,
} from '../api/types';
import { useToastStore } from '../store/toastStore';
import { useNavigationFocusReload } from './useNavigationFocusReload';

type SingleSelections = Partial<Record<MealType, UUID>>;
type QuantitySelections = Partial<Record<MealType, Record<UUID, number>>>;
type DeliverySelections = Partial<Record<MealType, UUID>>;

function buildInitialQuantities(poll: MealPollSlot): Record<UUID, number> {
  const quantities: Record<UUID, number> = {};
  for (const option of poll.options) {
    if (option.optionType === 'MENU_ENTRY') {
      quantities[option.id] = 0;
    }
  }
  for (const selection of poll.mySelections ?? []) {
    quantities[selection.optionId] = selection.quantity;
  }
  return quantities;
}

function sumQuantities(quantities: Record<UUID, number> | undefined): number {
  if (!quantities) {
    return 0;
  }
  return Object.values(quantities).reduce((total, qty) => total + qty, 0);
}

type UseMealPollDayOptions = {
  onSaved?: () => void;
  autoReload?: boolean;
};

export function useMealPollDay(
  spaceId: UUID,
  menuDate: string,
  spaceType?: SpaceType,
  options?: UseMealPollDayOptions,
) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const multiQuantity = spaceType === 'MESS';
  const requiresPayment = multiQuantity;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [myPaymentStatus, setMyPaymentStatus] = useState<MealPollPaymentStatus | null>(null);
  const [myRejectionReason, setMyRejectionReason] = useState<string | null>(null);
  const [selections, setSelections] = useState<SingleSelections>({});
  const [quantitySelections, setQuantitySelections] = useState<QuantitySelections>({});
  const [deliveryLocations, setDeliveryLocations] = useState<MealDeliveryLocation[]>([]);
  const [deliverySelections, setDeliverySelections] = useState<DeliverySelections>({});
  const [lastDeliveryLocations, setLastDeliveryLocations] = useState<DeliverySelections>({});
  const [editing, setEditing] = useState(true);

  const requiresDeliveryLocation = multiQuantity && deliveryLocations.length > 0;
  const openPolls = useMemo(() => polls.filter(poll => poll.status === 'OPEN'), [polls]);

  const pollHasResponse = useCallback(
    (poll: MealPollSlot) => {
      if (multiQuantity) {
        return (poll.mySelections?.length ?? 0) > 0;
      }
      return poll.mySelectedOptionId != null;
    },
    [multiQuantity],
  );

  const allResponded = useMemo(
    () => openPolls.length > 0 && openPolls.every(poll => pollHasResponse(poll)),
    [openPolls, pollHasResponse],
  );

  const anyResponded = useMemo(
    () => openPolls.some(poll => pollHasResponse(poll)),
    [openPolls, pollHasResponse],
  );

  const hasPartialSubmission = anyResponded && !allResponded;
  const showSummary = allResponded && !editing;

  const mealsWithPlates = useMemo(
    () =>
      openPolls
        .filter(poll => sumQuantities(quantitySelections[poll.mealType]) > 0)
        .map(poll => poll.mealType),
    [openPolls, quantitySelections],
  );

  const totalPlates = useMemo(
    () => mealsWithPlates.reduce((sum, mealType) => sum + sumQuantities(quantitySelections[mealType]), 0),
    [mealsWithPlates, quantitySelections],
  );

  const buildPayload = useCallback((): SubmitMealPollSelection[] | null => {
    if (multiQuantity) {
      return openPolls.map(poll => ({
        mealType: poll.mealType,
        options: poll.options
          .filter(option => option.optionType === 'MENU_ENTRY')
          .map(option => ({
            optionId: option.id,
            quantity: quantitySelections[poll.mealType]?.[option.id] ?? 0,
          })),
        ...(deliverySelections[poll.mealType]
          ? { deliveryLocationId: deliverySelections[poll.mealType] }
          : {}),
      }));
    }

    return openPolls
      .filter(poll => selections[poll.mealType] != null)
      .map(poll => ({
        mealType: poll.mealType,
        selectedOptionId: selections[poll.mealType] as UUID,
      }));
  }, [deliverySelections, multiQuantity, openPolls, quantitySelections, selections]);

  const validateForSave = useCallback((): boolean => {
    const payload = buildPayload();
    if (!payload || payload.length === 0) {
      showToast(t('meals.poll.selectAtLeastOne'));
      return false;
    }

    if (payload.length < openPolls.length) {
      showToast(t('meals.poll.selectAllOpen'));
      return false;
    }

    if (multiQuantity) {
      const incomplete = payload.some(entry => sumQuantities(quantitySelections[entry.mealType]) <= 0);
      if (incomplete) {
        showToast(t('meals.poll.selectAtLeastOnePlate'));
        return false;
      }

      if (requiresDeliveryLocation && mealsWithPlates.length > 0) {
        const missingLocation = mealsWithPlates.some(mealType => !deliverySelections[mealType]);
        if (missingLocation) {
          showToast(t('meals.poll.selectDeliveryLocation'));
          return false;
        }
      }
    }

    return true;
  }, [
    buildPayload,
    deliverySelections,
    mealsWithPlates,
    multiQuantity,
    openPolls.length,
    quantitySelections,
    requiresDeliveryLocation,
    showToast,
    t,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const day = await mealsApi.getMealPolls(spaceId, menuDate);
      setPolls(day.polls);
      setMyPaymentStatus(day.myPaymentStatus ?? null);
      setMyRejectionReason(day.myRejectionReason ?? null);
      setDeliveryLocations(day.deliveryLocations ?? []);

      const lastUsed: DeliverySelections = { ...(day.myLastDeliveryLocationIds ?? {}) };
      const initialSingle: SingleSelections = {};
      const initialQuantities: QuantitySelections = {};
      const initialDelivery: DeliverySelections = {};

      for (const poll of day.polls) {
        if (poll.mySelectedOptionId) {
          initialSingle[poll.mealType] = poll.mySelectedOptionId;
        }
        const mealPlates = sumQuantities(
          poll.multiQuantityEnabled || multiQuantity
            ? buildInitialQuantities(poll)
            : undefined,
        );
        if (poll.multiQuantityEnabled || multiQuantity) {
          initialQuantities[poll.mealType] = buildInitialQuantities(poll);
        }

        const prefilledLocation = poll.myDeliveryLocationId ?? lastUsed[poll.mealType] ?? undefined;
        if (prefilledLocation && poll.status === 'OPEN' && mealPlates > 0) {
          initialDelivery[poll.mealType] = prefilledLocation;
        }
      }

      setSelections(initialSingle);
      setQuantitySelections(initialQuantities);
      setDeliverySelections(initialDelivery);
      setLastDeliveryLocations(lastUsed);

      const open = day.polls.filter(poll => poll.status === 'OPEN');
      const responded = open.length > 0 && open.every(poll => pollHasResponse(poll));
      setEditing(!responded);
    } catch {
      setPolls([]);
      setMyPaymentStatus(null);
      setMyRejectionReason(null);
      setDeliveryLocations([]);
      setDeliverySelections({});
      setLastDeliveryLocations({});
      showToast(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [menuDate, multiQuantity, pollHasResponse, showToast, spaceId, t]);

  useNavigationFocusReload(load, options?.autoReload !== false);

  const handleSelect = useCallback((mealType: MealType, optionId: UUID) => {
    setSelections(prev => ({ ...prev, [mealType]: optionId }));
  }, []);

  const handleQuantityChange = useCallback(
    (mealType: MealType, optionId: UUID, quantity: number) => {
      setQuantitySelections(prev => ({
        ...prev,
        [mealType]: {
          ...(prev[mealType] ?? {}),
          [optionId]: quantity,
        },
      }));

      const nextMealQuantities = {
        ...(quantitySelections[mealType] ?? {}),
        [optionId]: quantity,
      };
      const mealTotal = Object.values(nextMealQuantities).reduce((sum, qty) => sum + qty, 0);

      if (mealTotal > 0) {
        setDeliverySelections(prev => {
          if (prev[mealType]) {
            return prev;
          }
          const lastUsed = lastDeliveryLocations[mealType];
          if (lastUsed) {
            return { ...prev, [mealType]: lastUsed };
          }
          return prev;
        });
      } else {
        setDeliverySelections(prev => {
          if (!prev[mealType]) {
            return prev;
          }
          const next = { ...prev };
          delete next[mealType];
          return next;
        });
      }
    },
    [lastDeliveryLocations, quantitySelections],
  );

  const handleDeliveryLocationChange = useCallback((mealType: MealType, locationId: UUID) => {
    setDeliverySelections(prev => ({ ...prev, [mealType]: locationId }));
  }, []);

  const handleUpdateChoices = useCallback(() => {
    setEditing(true);
  }, []);

  const submitWithPayment = useCallback(
    async (paymentChoice?: MealPollPaymentChoice, proofImageBase64?: string) => {
      const payload = buildPayload();
      if (!payload) {
        return false;
      }

      setSaving(true);
      try {
        const day = await mealsApi.submitMealPollResponses(
          spaceId,
          menuDate,
          payload,
          paymentChoice,
          proofImageBase64,
        );
        setPolls(day.polls);
        setMyPaymentStatus(day.myPaymentStatus ?? null);
        setMyRejectionReason(day.myRejectionReason ?? null);
        setDeliveryLocations(day.deliveryLocations ?? []);
        setLastDeliveryLocations({ ...(day.myLastDeliveryLocationIds ?? {}) });
        setEditing(false);
        showToast(
          paymentChoice === 'MARK_AS_PAID'
            ? t('meals.poll.proofSubmitted')
            : t('meals.poll.saved'),
        );
        options?.onSaved?.();
        return true;
      } catch {
        showToast(t('meals.errors.saveFailed'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, menuDate, options?.onSaved, showToast, spaceId, t],
  );

  const submitPaymentProof = useCallback(
    async (proofImageBase64: string) => {
      setSaving(true);
      try {
        const day = await mealsApi.submitMealPollPaymentProof(spaceId, menuDate, proofImageBase64);
        setPolls(day.polls);
        setMyPaymentStatus(day.myPaymentStatus ?? null);
        setMyRejectionReason(day.myRejectionReason ?? null);
        setDeliveryLocations(day.deliveryLocations ?? []);
        showToast(t('meals.poll.proofSubmitted'));
        return true;
      } catch {
        showToast(t('meals.errors.saveFailed'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [menuDate, showToast, spaceId, t],
  );

  const handleSave = useCallback(async () => {
    if (!validateForSave()) {
      return false;
    }
    if (requiresPayment) {
      return true;
    }
    return submitWithPayment();
  }, [requiresPayment, submitWithPayment, validateForSave]);

  const totalPlatesForMeal = useCallback(
    (mealType: MealType) => sumQuantities(quantitySelections[mealType]),
    [quantitySelections],
  );

  return {
    loading,
    saving,
    openPolls,
    allResponded,
    anyResponded,
    hasPartialSubmission,
    myPaymentStatus,
    myRejectionReason,
    requiresPayment,
    requiresDeliveryLocation,
    deliveryLocations,
    deliverySelections,
    lastDeliveryLocations,
    mealsWithPlates,
    totalPlates,
    selections,
    quantitySelections,
    multiQuantity,
    showSummary,
    totalPlatesForMeal,
    handleSelect,
    handleQuantityChange,
    handleDeliveryLocationChange,
    handleSave,
    validateForSave,
    submitWithPayment,
    submitPaymentProof,
    handleUpdateChoices,
    reload: load,
  };
}
