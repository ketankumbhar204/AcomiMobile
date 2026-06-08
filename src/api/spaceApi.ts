import apiClient from './client';
import { CreateSpaceRequest, Space, UUID } from './types';

export const spaceApi = {
  create: async (payload: CreateSpaceRequest): Promise<Space> => {
    const { data } = await apiClient.post<Space>('/spaces', payload);
    return data;
  },

  getByUserId: async (userId: UUID): Promise<Space[]> => {
    const { data } = await apiClient.get<Space[]>(`/spaces/user/${userId}`);
    return data;
  },
};
