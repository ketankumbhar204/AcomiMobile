import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../api/mealsApi';
import type {
  MealBillingType,
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
import { hasPrepaidOverflow } from '../utils/mealPollPayment';
import { isPastMenuDate } from '../utils/mealDates';
import { resolvePreferredDeliveryLocationId } from '../utils/mealPollDeliveryLocations';

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
  /** When true, the poll screen opens in edit mode even if the tenant already responded. */
  startInEditMode?: boolean;
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
  const [mealBillingType, setMealBillingType] = useState<MealBillingType>('PAY_PER_MEAL');
  const requiresPayment = multiQuantity && mealBillingType !== 'PREPAID_BALANCE';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [myPaymentStatus, setMyPaymentStatus] = useState<MealPollPaymentStatus | null>(null);
  const [myRejectionReason, setMyRejectionReason] = useState<string | null>(null);
  const [myPaymentChargedAmount, setMyPaymentChargedAmount] = useState<number | null>(null);
  const [myPrepaidOverflowAmount, setMyPrepaidOverflowAmount] = useState<number | null>(null);
  const [myPrepaidDebitedAmount, setMyPrepaidDebitedAmount] = useState<number | null>(null);
  const [myPrepaidOverflowPayment, setMyPrepaidOverflowPayment] = useState<boolean | null>(null);
  const [selections, setSelections] = useState<SingleSelections>({});
  const [quantitySelections, setQuantitySelections] = useState<QuantitySelections>({});
  const [deliveryLocations, setDeliveryLocations] = useState<MealDeliveryLocation[]>([]);
  const [deliverySelections, setDeliverySelections] = useState<DeliverySelections>({});
  const [lastDeliveryLocations, setLastDeliveryLocations] = useState<DeliverySelections>({});
  const [editing, setEditing] = useState(true);

  const requiresDeliveryLocation = multiQuantity && deliveryLocations.length > 0;
  const dateReadOnly = isPastMenuDate(menuDate);
  const mealEditsLocked = myPaymentStatus === 'PENDING_APPROVAL';
  const effectiveReadOnly = dateReadOnly || mealEditsLocked;
  const openPolls = useMemo(() => polls.filter(poll => poll.status === 'OPEN'), [polls]);
  /**
   * Include CLOSED polls for today and past days so shared menus stay visible after
   * a meal's ordering window closes (OPEN-only made today look "not planned").
   * Mutations still use `openPolls` only.
   */
  const displayPolls = useMemo(
    () => polls.filter(poll => poll.status === 'OPEN' || poll.status === 'CLOSED'),
    [polls],
  );
  const loadGenerationRef = useRef(0);

  const pollHasResponse = useCallback(
    (poll: MealPollSlot) => {
      if (multiQuantity) {
        return (poll.mySelections ?? []).some(selection => selection.quantity > 0);
      }
      return poll.mySelectedOptionId != null;
    },
    [multiQuantity],
  );

  const responsePolls = displayPolls;

  const allResponded = useMemo(
    () => responsePolls.length > 0 && responsePolls.every(poll => pollHasResponse(poll)),
    [pollHasResponse, responsePolls],
  );

  const anyResponded = useMemo(
    () => responsePolls.some(poll => pollHasResponse(poll)),
    [pollHasResponse, responsePolls],
  );

  const hasPartialSubmission = anyResponded && !allResponded;
  const showSummary = allResponded && !editing && !effectiveReadOnly;

  const mealsWithPlates = useMemo(
    () =>
      displayPolls
        .filter(poll => sumQuantities(quantitySelections[poll.mealType]) > 0)
        .map(poll => poll.mealType),
    [displayPolls, quantitySelections],
  );

  const totalPlates = useMemo(
    () => mealsWithPlates.reduce((sum, mealType) => sum + sumQuantities(quantitySelections[mealType]), 0),
    [mealsWithPlates, quantitySelections],
  );

  const buildPayload = useCallback((): SubmitMealPollSelection[] | null => {
    if (multiQuantity) {
      // Include every open meal so the backend can record explicit skips (0 plates).
      return openPolls.map(poll => ({
        mealType: poll.mealType,
        options: poll.options
          .filter(option => option.optionType === 'MENU_ENTRY')
          .map(option => ({
            optionId: option.id,
            quantity: quantitySelections[poll.mealType]?.[option.id] ?? 0,
          })),
        ...(sumQuantities(quantitySelections[poll.mealType]) > 0 &&
        deliverySelections[poll.mealType]
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
    // Meals are optional: empty / partial days are valid (skipped = no response).
    // Only validate correctness of meals the customer actually selected.
    if (multiQuantity) {
      if (requiresDeliveryLocation && mealsWithPlates.length > 0) {
        const missingLocation = mealsWithPlates.some(mealType => !deliverySelections[mealType]);
        if (missingLocation) {
          showToast(t('meals.poll.selectDeliveryLocation'));
          return false;
        }
      }
      return true;
    }

    // PG / single-select: any subset of open meals is fine.
    return true;
  }, [
    deliverySelections,
    mealsWithPlates,
    multiQuantity,
    requiresDeliveryLocation,
    showToast,
    t,
  ]);

  const load = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    try {
      const day = await mealsApi.getMealPolls(spaceId, menuDate);
      // Ignore stale responses from overlapping first-load / focus / spaceType reloads.
      if (generation !== loadGenerationRef.current) {
        return;
      }
      const dayPolls = day.polls ?? [];
      setMealBillingType(day.myMealBillingType ?? 'PAY_PER_MEAL');
      setPolls(dayPolls);
      setMyPaymentStatus(day.myPaymentStatus ?? null);
      setMyRejectionReason(day.myRejectionReason ?? null);
      setMyPaymentChargedAmount(day.myPaymentChargedAmount ?? null);
      setMyPrepaidOverflowAmount(day.myPrepaidOverflowAmount ?? null);
      setMyPrepaidDebitedAmount(day.myPrepaidDebitedAmount ?? null);
      setMyPrepaidOverflowPayment(day.myPrepaidOverflowPayment ?? null);
      setDeliveryLocations(day.deliveryLocations ?? []);

      const lastUsed: DeliverySelections = { ...(day.myLastDeliveryLocationIds ?? {}) };
      const catalog = day.deliveryLocations ?? [];
      const initialSingle: SingleSelections = {};
      const initialQuantities: QuantitySelections = {};
      const initialDelivery: DeliverySelections = {};

      for (const poll of dayPolls) {
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

        const pastDay = isPastMenuDate(menuDate);
        const canPrefill =
          mealPlates > 0 &&
          (poll.status === 'OPEN' || poll.status === 'CLOSED');
        if (!canPrefill || catalog.length === 0) {
          continue;
        }

        // Prefer existing poll snapshot when still active; else last/first preferred.
        const preferred =
          poll.myDeliveryLocationId &&
          catalog.some(location => location.id === poll.myDeliveryLocationId)
            ? poll.myDeliveryLocationId
            : resolvePreferredDeliveryLocationId(catalog, lastUsed[poll.mealType]);
        if (preferred) {
          initialDelivery[poll.mealType] = preferred;
        }
      }

      setSelections(initialSingle);
      setQuantitySelections(initialQuantities);
      setDeliverySelections(initialDelivery);
      setLastDeliveryLocations(lastUsed);

      const pastDay = isPastMenuDate(menuDate);
      const paymentLocked = day.myPaymentStatus === 'PENDING_APPROVAL';
      const open = dayPolls.filter(poll => poll.status === 'OPEN');
      const display = dayPolls.filter(
        poll => poll.status === 'OPEN' || poll.status === 'CLOSED',
      );
      const responded =
        display.length > 0 &&
        display.every(poll => {
          if (multiQuantity) {
            return (poll.mySelections?.length ?? 0) > 0;
          }
          return poll.mySelectedOptionId != null;
        });
      if (paymentLocked) {
        setEditing(false);
      } else {
        setEditing(
          options?.startInEditMode || pastDay || open.length === 0 ? true : !responded,
        );
      }
    } catch {
      if (generation !== loadGenerationRef.current) {
        return;
      }
      setPolls([]);
      setMyPaymentStatus(null);
      setMyRejectionReason(null);
      setMyPaymentChargedAmount(null);
      setMyPrepaidOverflowAmount(null);
      setMyPrepaidDebitedAmount(null);
      setMyPrepaidOverflowPayment(null);
      setDeliveryLocations([]);
      setDeliverySelections({});
      setLastDeliveryLocations({});
      showToast(t('meals.errors.loadFailed'));
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [menuDate, multiQuantity, options?.startInEditMode, showToast, spaceId, t]);

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
          const preferred = resolvePreferredDeliveryLocationId(
            deliveryLocations,
            lastDeliveryLocations[mealType],
          );
          if (preferred) {
            return { ...prev, [mealType]: preferred };
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
    [deliveryLocations, lastDeliveryLocations, quantitySelections],
  );

  const handleDeliveryLocationChange = useCallback((mealType: MealType, locationId: UUID) => {
    setDeliverySelections(prev => ({ ...prev, [mealType]: locationId }));
  }, []);

  const handleUpdateChoices = useCallback(() => {
    if (mealEditsLocked) {
      showToast(t('meals.poll.paymentUnderReviewLock'));
      return;
    }
    setEditing(true);
  }, [mealEditsLocked, showToast, t]);

  const showPaymentAdjustmentToast = useCallback(
    (adjustment: number | null | undefined) => {
      if (adjustment == null || adjustment === 0) {
        showToast(t('meals.poll.saved'));
        return;
      }
      const amount = Math.abs(adjustment);
      if (adjustment < 0) {
        showToast(t('meals.poll.paidEditCredit', { amount }));
        return;
      }
      showToast(t('meals.poll.paidEditAdditional', { amount }));
    },
    [showToast, t],
  );

  const submitWithPayment = useCallback(
    async (paymentChoice?: MealPollPaymentChoice, proofImageBase64?: string) => {
      if (mealEditsLocked) {
        showToast(t('meals.poll.paymentUnderReviewLock'));
        return false;
      }

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
        setMyPaymentChargedAmount(day.myPaymentChargedAmount ?? null);
        setMyPrepaidOverflowAmount(day.myPrepaidOverflowAmount ?? null);
        setMyPrepaidDebitedAmount(day.myPrepaidDebitedAmount ?? null);
        setMyPrepaidOverflowPayment(day.myPrepaidOverflowPayment ?? null);
        setDeliveryLocations(day.deliveryLocations ?? []);
        setLastDeliveryLocations({ ...(day.myLastDeliveryLocationIds ?? {}) });
        setEditing(false);
        if (
          hasPrepaidOverflow(day.myPrepaidOverflowPayment, day.myPrepaidOverflowAmount)
        ) {
          showToast(
            t('meals.poll.prepaidOverflowSaved', {
              debited: day.myPrepaidDebitedAmount ?? 0,
              overflow: day.myPrepaidOverflowAmount ?? 0,
            }),
          );
        } else if (day.myPaymentAdjustment != null && day.myPaymentAdjustment !== 0) {
          showPaymentAdjustmentToast(day.myPaymentAdjustment);
        } else {
          showToast(
            paymentChoice === 'MARK_AS_PAID'
              ? t('meals.poll.proofSubmitted')
              : t('meals.poll.saved'),
          );
        }
        options?.onSaved?.();
        return true;
      } catch {
        showToast(t('meals.errors.saveFailed'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      buildPayload,
      mealEditsLocked,
      menuDate,
      options?.onSaved,
      showPaymentAdjustmentToast,
      showToast,
      spaceId,
      t,
    ],
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
    if (mealEditsLocked) {
      showToast(t('meals.poll.paymentUnderReviewLock'));
      return false;
    }
    // Already paid: save selections without Complete payment.
    if (myPaymentStatus === 'PAID') {
      return submitWithPayment();
    }
    // Payment only when the customer ordered at least one plate.
    if (requiresPayment && totalPlates > 0) {
      return true;
    }
    return submitWithPayment();
  }, [
    mealEditsLocked,
    myPaymentStatus,
    requiresPayment,
    showToast,
    submitWithPayment,
    t,
    totalPlates,
    validateForSave,
  ]);

  const totalPlatesForMeal = useCallback(
    (mealType: MealType) => sumQuantities(quantitySelections[mealType]),
    [quantitySelections],
  );

  return {
    loading,
    saving,
    openPolls,
    displayPolls,
    dateReadOnly,
    allResponded,
    anyResponded,
    hasPartialSubmission,
    myPaymentStatus,
    myRejectionReason,
    myPaymentChargedAmount,
    mealEditsLocked,
    myPrepaidOverflowAmount,
    myPrepaidDebitedAmount,
    myPrepaidOverflowPayment,
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
