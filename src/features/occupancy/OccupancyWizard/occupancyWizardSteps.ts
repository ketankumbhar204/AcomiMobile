import type { OccupancyWizardMode, OccupancyWizardParams, OccupancyWizardStep } from './types';

export function getWizardSteps(
  mode: OccupancyWizardMode,
  params: Pick<
    OccupancyWizardParams,
    'memberId' | 'bedId' | 'roomId' | 'unitId' | 'occupancyId'
  >,
): OccupancyWizardStep[] {
  const hasMember = Boolean(params.memberId);
  const hasTarget = Boolean(params.bedId || params.unitId || params.roomId);

  switch (mode) {
    case 'ALLOCATE': {
      const steps: OccupancyWizardStep[] = [];
      if (!hasMember) {
        steps.push('member');
      }
      if (!hasTarget) {
        steps.push('target');
      }
      steps.push('contract', 'review');
      return steps;
    }
    case 'RESERVE': {
      const steps: OccupancyWizardStep[] = [];
      if (!hasMember) {
        steps.push('member');
      }
      if (!hasTarget) {
        steps.push('target');
      }
      steps.push('reserve_dates', 'review');
      return steps;
    }
    case 'MOVE_IN':
      return ['contract', 'review'];
    case 'TRANSFER': {
      const steps: OccupancyWizardStep[] = [];
      if (!hasMember) {
        steps.push('member');
      }
      steps.push('transfer_current', 'target', 'contract', 'review');
      return steps;
    }
    case 'VACATE': {
      const steps: OccupancyWizardStep[] = [];
      if (!hasMember) {
        steps.push('member');
      }
      steps.push('vacate_confirm');
      return steps;
    }
    default:
      return [];
  }
}

export function getWizardTitleKey(mode: OccupancyWizardMode): string {
  switch (mode) {
    case 'ALLOCATE':
      return 'occupancyWizard.title.allocate';
    case 'RESERVE':
      return 'occupancyWizard.title.reserve';
    case 'MOVE_IN':
      return 'occupancyWizard.title.moveIn';
    case 'TRANSFER':
      return 'occupancyWizard.title.transfer';
    case 'VACATE':
      return 'occupancyWizard.title.vacate';
    default:
      return 'occupancyWizard.title.default';
  }
}
