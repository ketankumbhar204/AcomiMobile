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

/** Handles DELETE endpoints that return 204 No Content with no envelope. */
export async function unwrapVoidResponse(
  request: Promise<AxiosResponse<ApiResponse<unknown> | string>>,
): Promise<void> {
  const response = await request;

  if (response.status === 204) {
    return;
  }

  const envelope = response.data;
  if (envelope && typeof envelope === 'object' && 'success' in envelope) {
    const typed = envelope as ApiResponse<unknown>;
    if (!typed.success) {
      throw new ApiError(
        typed.message ?? 'Request failed',
        response.status,
        typed as ApiErrorBody,
      );
    }
    return;
  }

  if (response.status >= 200 && response.status < 300) {
    return;
  }

  throw new ApiError('Request failed', response.status);
}
