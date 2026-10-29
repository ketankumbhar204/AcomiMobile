jest.mock('../../../../api/accommodationApi', () => ({
  accommodationApi: {
    createBuilding: jest.fn(),
    createUnit: jest.fn(),
    updateUnit: jest.fn(),
  },
}));

import { accommodationApi } from '../../../../api/accommodationApi';
import { executeSetupStructure } from '../executeSetupStructure';
import type { EditableSetupStructure } from '../setupStructureTypes';

const api = accommodationApi as unknown as {
  createBuilding: jest.Mock;
  createUnit: jest.Mock;
  updateUnit: jest.Mock;
};

function rentalStructure(units: EditableSetupStructure['units']): EditableSetupStructure {
  return {
    building: { name: 'Test Rental', code: 'R1' },
    kind: 'building_units',
    layoutMode: 'RENTAL',
    spaceType: 'RENTAL',
    roomType: 'PRIVATE',
    floors: [],
    units,
  };
}

describe('executeSetupStructure unit pricing', () => {
  beforeEach(() => {
    api.createBuilding.mockReset();
    api.createUnit.mockReset();
    api.updateUnit.mockReset();
    api.createBuilding.mockResolvedValue({ buildingId: 'b1' });
    api.createUnit.mockImplementation(async (_spaceId: string, _buildingId: string, body: { name: string }) => ({
      unitId: `created-${body.name}`,
    }));
    api.updateUnit.mockResolvedValue({});
  });

  it('persists rent and deposit after creating a priced unit', async () => {
    await executeSetupStructure(
      'space-1',
      rentalStructure([
        {
          id: 'u1',
          name: '101',
          number: '101',
          rooms: [],
          defaultRent: 8000,
          defaultDeposit: 16000,
        },
      ]),
    );

    expect(api.updateUnit).toHaveBeenCalledWith('space-1', 'b1', 'created-101', {
      name: '101',
      unitNumber: '101',
      status: 'AVAILABLE',
      defaultRent: 8000,
      defaultDeposit: 16000,
    });
  });

  it('does not send a pricing update when rent and deposit are blank', async () => {
    await executeSetupStructure(
      'space-1',
      rentalStructure([{ id: 'u1', name: '101', number: '101', rooms: [] }]),
    );

    expect(api.createUnit).toHaveBeenCalledTimes(1);
    expect(api.updateUnit).not.toHaveBeenCalled();
  });
});
