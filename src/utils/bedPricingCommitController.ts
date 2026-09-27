import type { PricingField } from './commitBedPricing';
import {
  buildSubmittedBedPricing,
  buildSubmittedBedPricingValues,
  changedPricingFields,
} from './commitBedPricing';

export type BedPricingPreviewScope = {
  affectedBedCount: number | null;
  affectedLocations: string[];
};

export type PendingBedPricing = {
  spaceId: string;
  roomId: string;
  bedId: string;
  bedLabel: string;
  changedFields: PricingField[];
  /** First changed field; kept for existing toast copy. */
  field: PricingField;
  currentRent: number | null;
  currentDeposit: number | null;
  defaultRent: number | null;
  defaultDeposit: number | null;
  name?: string;
  bedNumber?: string;
  status?: import('../api/types').AccommodationStatus;
  affectedBedCount: number | null;
  affectedLocations: string[];
};

export type BedPricingCommitDeps = {
  preview: (pending: PendingBedPricing) => Promise<BedPricingPreviewScope>;
  update: (pending: PendingBedPricing) => Promise<unknown>;
};

type RequestBase = {
  spaceId: string;
  roomId: string;
  bedId: string;
  bedLabel: string;
  currentRent: number | null | undefined;
  currentDeposit: number | null | undefined;
  name?: string;
  bedNumber?: string;
  status?: import('../api/types').AccommodationStatus;
};

export type BedPricingRequestInput = RequestBase &
  (
    | { field: PricingField; value: number | null }
    | { nextRent: number | null; nextDeposit: number | null }
  );

function resolveSubmitted(input: BedPricingRequestInput): {
  defaultRent: number | null;
  defaultDeposit: number | null;
  changedFields: PricingField[];
} {
  const currentRent = input.currentRent ?? null;
  const currentDeposit = input.currentDeposit ?? null;
  if ('nextRent' in input) {
    const submitted = buildSubmittedBedPricingValues(input.nextRent, input.nextDeposit);
    return {
      ...submitted,
      changedFields: changedPricingFields(
        currentRent,
        currentDeposit,
        submitted.defaultRent,
        submitted.defaultDeposit,
      ),
    };
  }
  const submitted = buildSubmittedBedPricing(currentRent, currentDeposit, input.field, input.value);
  return {
    ...submitted,
    changedFields: changedPricingFields(
      currentRent,
      currentDeposit,
      submitted.defaultRent,
      submitted.defaultDeposit,
    ),
  };
}

export class BedPricingCommitController {
  pending: PendingBedPricing | null = null;
  confirming = false;
  error: string | null = null;
  private confirmingLock = false;
  private requestSeq = 0;

  constructor(private readonly deps: BedPricingCommitDeps) {}

  get busy(): boolean {
    return this.pending != null || this.confirming;
  }

  async request(input: BedPricingRequestInput): Promise<PendingBedPricing | null> {
    if (this.confirmingLock || this.pending) {
      return this.pending;
    }
    const currentRent = input.currentRent ?? null;
    const currentDeposit = input.currentDeposit ?? null;
    const submitted = resolveSubmitted(input);
    if (submitted.changedFields.length === 0) {
      return null;
    }
    const next: PendingBedPricing = {
      spaceId: input.spaceId,
      roomId: input.roomId,
      bedId: input.bedId,
      bedLabel: input.bedLabel,
      changedFields: submitted.changedFields,
      field: submitted.changedFields[0],
      currentRent,
      currentDeposit,
      defaultRent: submitted.defaultRent,
      defaultDeposit: submitted.defaultDeposit,
      name: input.name,
      bedNumber: input.bedNumber,
      status: input.status,
      affectedBedCount: null,
      affectedLocations: [],
    };
    this.pending = next;
    this.error = null;
    const seq = ++this.requestSeq;
    try {
      const scope = await this.deps.preview(next);
      if (seq !== this.requestSeq || this.pending == null) {
        return this.pending;
      }
      this.pending = {
        ...this.pending,
        affectedBedCount: scope.affectedBedCount,
        affectedLocations: scope.affectedLocations ?? [],
      };
    } catch {
      if (seq === this.requestSeq && this.pending != null) {
        this.pending = {
          ...this.pending,
          affectedBedCount: null,
          affectedLocations: [],
        };
      }
    }
    return this.pending;
  }

  cancel(): void {
    if (this.confirmingLock) {
      return;
    }
    this.requestSeq += 1;
    this.pending = null;
    this.error = null;
  }

  async confirm(): Promise<'success' | 'idle' | 'error'> {
    if (!this.pending || this.confirmingLock) {
      return 'idle';
    }
    this.confirmingLock = true;
    this.confirming = true;
    this.error = null;
    try {
      await this.deps.update(this.pending);
      this.pending = null;
      return 'success';
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      return 'error';
    } finally {
      this.confirmingLock = false;
      this.confirming = false;
    }
  }
}
