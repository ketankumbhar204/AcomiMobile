import { BedPricingCommitController } from '../bedPricingCommitController';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('BedPricingCommitController', () => {
  const baseInput = {
    spaceId: 'space-1',
    roomId: 'room-1',
    bedId: 'bed-b',
    bedLabel: 'Bed B',
    currentRent: 6000,
    currentDeposit: 3000,
  };

  it('does not call update when requesting a rent confirm', async () => {
    const preview = jest.fn().mockResolvedValue({
      affectedBedCount: 12,
      affectedLocations: ['PG 1', 'Floor 1'],
    });
    const update = jest.fn();
    const controller = new BedPricingCommitController({ preview, update });

    await controller.request({ ...baseInput, field: 'defaultRent', value: 250 });

    expect(update).not.toHaveBeenCalled();
    expect(preview).toHaveBeenCalledTimes(1);
    expect(controller.pending?.currentRent).toBe(6000);
    expect(controller.pending?.defaultRent).toBe(250);
    expect(controller.pending?.changedFields).toEqual(['defaultRent']);
    expect(controller.pending?.affectedBedCount).toBe(12);
  });

  it('does not call update when requesting a deposit confirm', async () => {
    const preview = jest.fn().mockResolvedValue({
      affectedBedCount: 12,
      affectedLocations: ['PG 1'],
    });
    const update = jest.fn();
    const controller = new BedPricingCommitController({ preview, update });

    await controller.request({ ...baseInput, field: 'defaultDeposit', value: 2500 });

    expect(update).not.toHaveBeenCalled();
    expect(controller.pending?.currentDeposit).toBe(3000);
    expect(controller.pending?.defaultDeposit).toBe(2500);
    expect(controller.pending?.changedFields).toEqual(['defaultDeposit']);
  });

  it('previews rent and deposit together in one request', async () => {
    const preview = jest.fn().mockResolvedValue({
      affectedBedCount: 12,
      affectedLocations: ['PG 1'],
    });
    const update = jest.fn();
    const controller = new BedPricingCommitController({ preview, update });

    await controller.request({
      ...baseInput,
      nextRent: 7000,
      nextDeposit: 3500,
      name: 'C',
      bedNumber: 'C',
    });

    expect(preview).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(controller.pending?.defaultRent).toBe(7000);
    expect(controller.pending?.defaultDeposit).toBe(3500);
    expect(controller.pending?.changedFields).toEqual(['defaultRent', 'defaultDeposit']);
    expect(controller.pending?.name).toBe('C');
  });

  it('does not open confirm when pricing is unchanged', async () => {
    const preview = jest.fn();
    const update = jest.fn();
    const controller = new BedPricingCommitController({ preview, update });

    const pending = await controller.request({
      ...baseInput,
      nextRent: 6000,
      nextDeposit: 3000,
    });

    expect(pending).toBeNull();
    expect(preview).not.toHaveBeenCalled();
    expect(controller.pending).toBeNull();
  });

  it('cancel does not call update and clears pending', async () => {
    const preview = jest.fn().mockResolvedValue({
      affectedBedCount: 12,
      affectedLocations: [],
    });
    const update = jest.fn();
    const controller = new BedPricingCommitController({ preview, update });
    await controller.request({ ...baseInput, field: 'defaultRent', value: 250 });

    controller.cancel();

    expect(update).not.toHaveBeenCalled();
    expect(controller.pending).toBeNull();
  });

  it('confirm calls update exactly once and shows confirming', async () => {
    const preview = jest.fn().mockResolvedValue({
      affectedBedCount: 12,
      affectedLocations: ['PG 1'],
    });
    const gate = deferred<void>();
    const update = jest.fn().mockReturnValue(gate.promise);
    const controller = new BedPricingCommitController({ preview, update });
    await controller.request({ ...baseInput, nextRent: 250, nextDeposit: 3000 });

    const confirmPromise = controller.confirm();
    expect(controller.confirming).toBe(true);
    const duplicate = await controller.confirm();
    expect(duplicate).toBe('idle');
    expect(update).toHaveBeenCalledTimes(1);

    gate.resolve();
    await expect(confirmPromise).resolves.toBe('success');
    expect(controller.pending).toBeNull();
    expect(controller.confirming).toBe(false);
  });

  it('keeps the modal pending and sets error when update fails', async () => {
    const preview = jest.fn().mockResolvedValue({
      affectedBedCount: 12,
      affectedLocations: [],
    });
    const update = jest.fn().mockRejectedValue(new Error('network'));
    const controller = new BedPricingCommitController({ preview, update });
    await controller.request({ ...baseInput, field: 'defaultRent', value: 250 });

    await expect(controller.confirm()).resolves.toBe('error');

    expect(controller.pending).not.toBeNull();
    expect(controller.error).toBe('network');
    expect(controller.confirming).toBe(false);
  });

  it('does not open a second confirm while one is pending', async () => {
    const preview = jest.fn().mockResolvedValue({
      affectedBedCount: 1,
      affectedLocations: [],
    });
    const update = jest.fn();
    const controller = new BedPricingCommitController({ preview, update });
    await controller.request({ ...baseInput, field: 'defaultRent', value: 250 });
    await controller.request({ ...baseInput, nextRent: 1, nextDeposit: 1 });

    expect(preview).toHaveBeenCalledTimes(1);
    expect(controller.pending?.field).toBe('defaultRent');
    expect(controller.pending?.defaultRent).toBe(250);
  });
});
