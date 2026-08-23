import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  AuthTokenResponse,
  CompleteUserProfileRequest,
  LoginRequest,
  RegisterRequest,
  SendOtpRequest,
  SendOtpResponse,
  UpdateUserRequest,
  UserResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from './types';

const LOG_TAG = '[Acomi Auth]';

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthTokenResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} login → mobile:`, payload.mobileNumber);
    }
    const result = await unwrapApiResponse(
      apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/login', {
        mobileNumber: payload.mobileNumber,
        password: payload.password,
      }),
    );
    if (__DEV__) {
      console.log(`${LOG_TAG} login ← userId:`, result.user.id, 'name:', result.user.fullName);
    }
    return result;
  },

  register: async (payload: RegisterRequest): Promise<AuthTokenResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} register → mobile:`, payload.mobileNumber);
    }
    const result = await unwrapApiResponse(
      apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/register', {
        fullName: payload.fullName,
        mobileNumber: payload.mobileNumber,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        ...(payload.verificationToken
          ? { verificationToken: payload.verificationToken }
          : {}),
      }),
    );
    if (__DEV__) {
      console.log(`${LOG_TAG} register ← userId:`, result.user.id, 'name:', result.user.fullName);
    }
    return result;
  },

  sendOtp: async (payload: SendOtpRequest): Promise<SendOtpResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} sendOtp →`, payload.mobileNumber, payload.purpose);
    }
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SendOtpResponse>>('/auth/send-otp', payload),
    );
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} verifyOtp → mobile:`, payload.mobileNumber, payload.purpose);
    }
    const result = await unwrapApiResponse(
      apiClient.post<ApiResponse<VerifyOtpResponse>>('/auth/verify-otp', payload),
    );
    if (__DEV__) {
      console.log(`${LOG_TAG} verifyOtp ← verified:`, result.verified);
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

  updateMe: async (payload: UpdateUserRequest): Promise<UserResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} updateMe →`, payload);
    }
    return unwrapApiResponse(
      apiClient.patch<ApiResponse<UserResponse>>('/auth/me', payload),
    );
  },

  completeProfile: async (payload: CompleteUserProfileRequest): Promise<UserResponse> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} completeProfile →`, {
        ...payload,
        profilePhotoUrl: payload.profilePhotoUrl ? '[redacted]' : null,
        addressProofFileUrl: payload.addressProofFileUrl ? '[redacted]' : null,
        identityProofFileUrl: payload.identityProofFileUrl ? '[redacted]' : null,
        additionalDocumentFileUrl: payload.additionalDocumentFileUrl ? '[redacted]' : null,
      });
    }
    return unwrapApiResponse(
      apiClient.patch<ApiResponse<UserResponse>>('/auth/me/profile', {
        ...payload,
        profileCompleted: true,
        profileStatus: 'COMPLETED',
      }),
    );
  },

  deleteAccount: async (): Promise<void> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} deleteAccount →`);
    }
    await unwrapVoidResponse(apiClient.delete('/auth/me'));
  },
};
