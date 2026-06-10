import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  AuthTokenResponse,
  SendOtpRequest,
  SendOtpResponse,
  UserResponse,
  VerifyOtpRequest,
} from './types';

const LOG_TAG = '[CountIn Auth]';

export const authApi = {
  sendOtp: async (payload: SendOtpRequest): Promise<SendOtpResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} sendOtp →`, payload.mobileNumber);
    }
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SendOtpResponse>>('/auth/send-otp', payload),
    );
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<AuthTokenResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} verifyOtp → mobile:`, payload.mobileNumber);
    }
    const result = await unwrapApiResponse(
      apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/verify-otp', payload),
    );
    if (__DEV__) {
      console.log(`${LOG_TAG} verifyOtp ← userId:`, result.user.id, 'name:', result.user.fullName);
    }
    return result;
  },

  getMe: async (): Promise<UserResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} getMe →`);
    }
    return unwrapApiResponse(
      apiClient.get<ApiResponse<UserResponse>>('/auth/me'),
    );
  },
};
