export type StayPaymentInput = {
  occupancyId?: string | null;
  paymentType?: string | null;
  paymentStatus?: string | null;
  settlementStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | null;
  amount?: number | null;
  paidAmount?: number | null;
  outstandingAmount?: number | null;
  month?: string | null;
};

export type StayPaymentStatus =
  | 'NO_RECORD'
  | 'UNAVAILABLE'
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'UNDER_REVIEW';

export type StayChargeKind = 'RENT' | 'DEPOSIT' | 'OTHER';

export type StayChargeSummary = {
  kind: StayChargeKind;
  amount: number | null;
  paid: number | null;
  outstanding: number | null;
  status: StayPaymentStatus;
};

export type OccupantPaymentSummary = {
  status: StayPaymentStatus;
  month: string;
  totalDue: number | null;
  amountPaid: number | null;
  outstanding: number | null;
  rent: StayChargeSummary | null;
  deposit: StayChargeSummary | null;
  other: StayChargeSummary | null;
};

const UNDER_REVIEW = new Set(['UNDER_REVIEW', 'PROOF_UPLOADED']);

function asMoney(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value);
}

/** Current-month charges for this stay, plus its deposit row from any month. */
export function selectStayCharges(
  payments: StayPaymentInput[],
  occupancyId: string,
  month: string,
): StayPaymentInput[] {
  return payments.filter(payment => {
    if (!occupancyId || payment.occupancyId !== occupancyId) {
      return false;
    }
    if (payment.paymentType === 'DEPOSIT') {
      return true;
    }
    return payment.month === month;
  });
}

export function linePaymentStatus(payment: StayPaymentInput): StayPaymentStatus {
  const status = payment.paymentStatus ?? '';
  if (UNDER_REVIEW.has(status)) {
    return 'UNDER_REVIEW';
  }
  if (payment.settlementStatus === 'PAID' || status === 'PAID') {
    return 'PAID';
  }
  if (payment.settlementStatus === 'PARTIALLY_PAID') {
    return 'PARTIALLY_PAID';
  }
  const paid = asMoney(payment.paidAmount);
  const outstanding = asMoney(payment.outstandingAmount);
  if (paid != null && paid > 0.009 && outstanding != null && outstanding > 0.009) {
    return 'PARTIALLY_PAID';
  }
  if (outstanding != null && outstanding > 0.009) {
    return 'PENDING';
  }
  if (
    payment.settlementStatus === 'UNPAID' ||
    status === 'PENDING' ||
    status === 'REJECTED' ||
    status === 'UPDATE_REQUESTED'
  ) {
    return outstanding == null && paid == null ? 'UNAVAILABLE' : 'PENDING';
  }
  return 'UNAVAILABLE';
}

function paidOf(payment: StayPaymentInput): number | null {
  const recorded = asMoney(payment.paidAmount);
  if (recorded != null) {
    return recorded;
  }
  if (linePaymentStatus(payment) === 'PAID') {
    return asMoney(payment.amount);
  }
  return null;
}

function outstandingOf(payment: StayPaymentInput): number | null {
  const recorded = asMoney(payment.outstandingAmount);
  if (recorded != null) {
    return recorded;
  }
  if (linePaymentStatus(payment) === 'PAID') {
    return 0;
  }
  return null;
}

function sumKnown(values: Array<number | null>): number | null {
  if (values.length === 0 || values.some(value => value == null)) {
    return null;
  }
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function rollup(statuses: StayPaymentStatus[]): StayPaymentStatus {
  if (statuses.length === 0) {
    return 'NO_RECORD';
  }
  if (statuses.every(status => status === 'PAID')) {
    return 'PAID';
  }
  if (statuses.some(status => status === 'PARTIALLY_PAID')) {
    return 'PARTIALLY_PAID';
  }
  const pending = statuses.some(status => status === 'PENDING');
  const settled = statuses.some(status => status === 'PAID');
  if (pending && settled) {
    return 'PARTIALLY_PAID';
  }
  if (pending) {
    return 'PENDING';
  }
  if (statuses.some(status => status === 'UNDER_REVIEW')) {
    return 'UNDER_REVIEW';
  }
  return 'UNAVAILABLE';
}

function summarizeKind(
  kind: StayChargeKind,
  lines: StayPaymentInput[],
): StayChargeSummary | null {
  if (lines.length === 0) {
    return null;
  }
  const statuses = lines.map(linePaymentStatus);
  return {
    kind,
    amount: sumKnown(lines.map(line => asMoney(line.amount))),
    paid: sumKnown(lines.map(paidOf)),
    outstanding: sumKnown(lines.map(outstandingOf)),
    status: rollup(statuses),
  };
}

export function summarizeStayCharges(
  payments: StayPaymentInput[],
  month: string,
): OccupantPaymentSummary {
  const rentLines = payments.filter(payment => payment.paymentType === 'RENT');
  const depositLines = payments.filter(payment => payment.paymentType === 'DEPOSIT');
  const otherLines = payments.filter(
    payment => payment.paymentType !== 'RENT' && payment.paymentType !== 'DEPOSIT',
  );
  const rent = summarizeKind('RENT', rentLines);
  const deposit = summarizeKind('DEPOSIT', depositLines);
  const other = summarizeKind('OTHER', otherLines);
  const groups = [rent, deposit, other].filter((group): group is StayChargeSummary => group != null);

  return {
    status: rollup(groups.map(group => group.status)),
    month,
    totalDue: sumKnown(groups.map(group => group.amount)),
    amountPaid: sumKnown(groups.map(group => group.paid)),
    outstanding: sumKnown(groups.map(group => group.outstanding)),
    rent,
    deposit,
    other,
  };
}

export type BedCardChargeLine = {
  kind: StayChargeKind;
  /** Context for the headline. Not a second amount to add to the outstanding balance. */
  amount: number;
};

export type BedCardBalanceFace =
  | {
      kind: 'balance';
      outstanding: number;
      paid: number | null;
      lines: BedCardChargeLine[];
    }
  | { kind: 'paid'; paid: number | null }
  | { kind: 'note'; status: 'NO_RECORD' | 'UNAVAILABLE' | 'UNDER_REVIEW' };

function chargeLineAmount(charge: StayChargeSummary, preferOutstanding: boolean): number | null {
  const value = preferOutstanding
    ? (charge.outstanding ?? charge.amount)
    : (charge.amount ?? charge.outstanding);
  if (value == null || value <= 0.009) {
    return null;
  }
  return value;
}

/**
 * Compact bed-card copy. The headline is only the outstanding balance.
 * A partial payment shows the amount already paid plus the original rent and
 * deposit, so those lines are not added again to the balance.
 */
export function bedCardBalanceFace(summary: OccupantPaymentSummary): BedCardBalanceFace {
  if (summary.status === 'PAID') {
    return { kind: 'paid', paid: summary.amountPaid };
  }
  if (
    summary.status === 'NO_RECORD' ||
    summary.status === 'UNAVAILABLE' ||
    summary.status === 'UNDER_REVIEW'
  ) {
    return { kind: 'note', status: summary.status };
  }
  if (summary.outstanding == null || summary.outstanding <= 0.009) {
    return { kind: 'paid', paid: summary.amountPaid };
  }

  const paid =
    summary.amountPaid != null && summary.amountPaid > 0.009 ? summary.amountPaid : null;
  const lines = [summary.rent, summary.deposit, summary.other]
    .filter((charge): charge is StayChargeSummary => charge != null)
    .flatMap(charge => {
      const amount = chargeLineAmount(charge, paid == null);
      return amount == null ? [] : [{ kind: charge.kind, amount }];
    });

  return {
    kind: 'balance',
    outstanding: summary.outstanding,
    paid,
    lines,
  };
}
