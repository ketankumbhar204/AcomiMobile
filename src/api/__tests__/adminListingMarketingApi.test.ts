import { adminApi } from '../adminApi';
import apiClient from '../client';

jest.mock('../client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedClient = apiClient as unknown as {
  get: jest.Mock;
  patch: jest.Mock;
};

describe('admin listing marketing API', () => {
  beforeEach(() => {
    mockedClient.get.mockReset();
    mockedClient.patch.mockReset();
  });

  it('loads property marketing details', async () => {
    mockedClient.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          marketingStatus: 'NOT_SHARED',
          whatsappAvailability: 'UNKNOWN',
          activities: [],
        },
      },
    });
    const result = await adminApi.getPropertyRegistrationMarketing('reg-1');
    expect(mockedClient.get).toHaveBeenCalledWith(
      '/admin/property-registrations/reg-1/marketing',
    );
    expect(result.marketingStatus).toBe('NOT_SHARED');
  });

  it('patches space marketing status', async () => {
    mockedClient.patch.mockResolvedValue({
      data: {
        success: true,
        data: {
          marketingStatus: 'SHARED',
          whatsappAvailability: 'AVAILABLE',
          activities: [],
        },
      },
    });
    const result = await adminApi.updateSpaceMarketing('space-1', {
      marketingStatus: 'SHARED',
      activity: { channel: 'WHATSAPP', outcome: 'SHARED_CONFIRMED' },
    });
    expect(mockedClient.patch).toHaveBeenCalledWith('/admin/spaces/space-1/marketing', {
      marketingStatus: 'SHARED',
      activity: { channel: 'WHATSAPP', outcome: 'SHARED_CONFIRMED' },
    });
    expect(result.marketingStatus).toBe('SHARED');
  });

  it('passes marketing filters on property list', async () => {
    mockedClient.get.mockResolvedValue({
      data: {
        success: true,
        data: { content: [], totalElements: 0, last: true },
      },
    });
    await adminApi.listPropertyRegistrations({
      leadsOnly: true,
      marketingStatus: 'NOT_SHARED',
      whatsappAvailability: 'UNAVAILABLE',
      page: 0,
      size: 20,
    });
    expect(mockedClient.get).toHaveBeenCalledWith('/admin/property-registrations', {
      params: {
        leadsOnly: true,
        marketingStatus: 'NOT_SHARED',
        whatsappAvailability: 'UNAVAILABLE',
        page: 0,
        size: 20,
      },
    });
  });
});
