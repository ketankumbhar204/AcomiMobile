import { AxiosResponse } from 'axios';
import { ApiError, ApiErrorBody, ApiResponse } from './types';

export async function unwrapApiResponse<T>(
  request: Promise<AxiosResponse<ApiResponse<T>>>,
): Promise<T> {
  const response = await request;
  const envelope = response.data;

  if (!envelope?.success) {
    throw new ApiError(
      envelope?.message ?? 'Request failed',
      response.status,
      envelope as ApiErrorBody,
    );
  }

  if (envelope.data === undefined || envelope.data === null) {
    throw new ApiError(
      envelope.message ?? 'No data in response',
      response.status,
      envelope as ApiErrorBody,
    );
  }

  return envelope.data;
}
