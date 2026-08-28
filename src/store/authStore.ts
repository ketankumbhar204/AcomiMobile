import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authApi } from '../api/authApi';
import { setAuthToken } from '../api/client';
import type { UserResponse, UUID } from '../api/types';
import { syncAdminModeForUser, useAdminStore } from './adminStore';
import { isUserProfileComplete } from '../utils/profileCompletion';

const TOKEN_KEY = '@acomi/access_token';
const USER_KEY = '@acomi/user';

const LOG_TAG = '[AuthStore]';

function mergeStoredUserProfile(
  apiUser: UserResponse,
  storedUser: UserResponse | null,
): UserResponse {
  if (!storedUser || storedUser.id !== apiUser.id) {
    return apiUser;
  }

  if (apiUser.profileCompleted === true || isUserProfileComplete(apiUser)) {
    return apiUser;
  }

  if (!storedUser.profileCompleted && !isUserProfileComplete(storedUser)) {
    return apiUser;
  }

  return {
    ...storedUser,
    ...apiUser,
    fullName: apiUser.fullName || storedUser.fullName,
    mobileNumber: apiUser.mobileNumber,
    active: apiUser.active,
    profilePhotoUrl: apiUser.profilePhotoUrl ?? storedUser.profilePhotoUrl ?? null,
    email: apiUser.email ?? storedUser.email ?? null,
    gender: apiUser.gender ?? storedUser.gender ?? null,
    dateOfBirth: apiUser.dateOfBirth ?? storedUser.dateOfBirth ?? null,
    permanentAddress: apiUser.permanentAddress ?? storedUser.permanentAddress ?? null,
    city: apiUser.city ?? storedUser.city ?? null,
    state: apiUser.state ?? storedUser.state ?? null,
    pincode: apiUser.pincode ?? storedUser.pincode ?? null,
    profileCompleted: apiUser.profileCompleted ?? storedUser.profileCompleted ?? false,
    profileStatus: apiUser.profileStatus ?? storedUser.profileStatus ?? null,
    profileCompletedAt: apiUser.profileCompletedAt ?? storedUser.profileCompletedAt ?? null,
    profileCompletionPercentage:
      apiUser.profileCompletionPercentage ?? storedUser.profileCompletionPercentage ?? null,
    documentsUploaded: apiUser.documentsUploaded ?? storedUser.documentsUploaded ?? null,
    kycStatus: apiUser.kycStatus ?? storedUser.kycStatus ?? null,
  };
}

async function readStoredUser(): Promise<UserResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as UserResponse;
  } catch {
    return null;
  }
}

interface AuthState {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  userId: UUID | null;
  user: UserResponse | null;
  accessToken: string | null;

  bootstrap: () => Promise<void>;
  setSession: (user: UserResponse, accessToken: string) => Promise<void>;
  updateUser: (user: UserResponse) => Promise<void>;
  refreshUser: () => Promise<UserResponse | null>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  isBootstrapping: true,
  userId: null,
  user: null,
  accessToken: null,

  bootstrap: async () => {
    if (__DEV__) {
      console.log(`${LOG_TAG} bootstrap starting...`);
    }

    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (__DEV__) {
          console.log(`${LOG_TAG} no stored token -> show login`);
        }

        set({
          isBootstrapping: false,
          isAuthenticated: false,
        });

        return;
      }

      setAuthToken(storedToken);

      if (__DEV__) {
        console.log(`${LOG_TAG} calling GET /auth/me`);
      }

      const user = await authApi.getMe();
      const storedUser = await readStoredUser();
      const mergedUser = mergeStoredUserProfile(user, storedUser);

      if (__DEV__) {
        console.log(`${LOG_TAG} session restored -> userId:`, mergedUser.id);
      }

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(mergedUser));

      syncAdminModeForUser(mergedUser.systemRole);

      set({
        isBootstrapping: false,
        isAuthenticated: true,
        userId: mergedUser.id,
        user: mergedUser,
        accessToken: storedToken,
      });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;

      if (__DEV__) {
        console.error(
          `${LOG_TAG} bootstrap failed (status ${status}) -> clearing session`,
          err,
        );
      }

      setAuthToken(null);

      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      set({
        isBootstrapping: false,
        isAuthenticated: false,
        userId: null,
        user: null,
        accessToken: null,
      });
    }
  },

  setSession: async (
    user: UserResponse,
    accessToken: string,
  ): Promise<void> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} setSession -> userId:`, user.id);
    }

    setAuthToken(accessToken);

    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    syncAdminModeForUser(user.systemRole);

    set({
      isAuthenticated: true,
      userId: user.id,
      user,
      accessToken,
    });
  },

  updateUser: async (user: UserResponse): Promise<void> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} updateUser -> userId:`, user.id);
    }

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      user,
      userId: user.id,
    });
  },

  refreshUser: async (): Promise<UserResponse | null> => {
    try {
      const user = await authApi.getMe();
      const storedUser = await readStoredUser();
      const mergedUser = mergeStoredUserProfile(user, storedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
      set({ user: mergedUser, userId: mergedUser.id });
      return mergedUser;
    } catch (err) {
      console.error(`${LOG_TAG} refreshUser failed`, err);
      return null;
    }
  },

  clearSession: async (): Promise<void> => {
    if (__DEV__) {
      console.log(`${LOG_TAG} clearSession`);
    }

    setAuthToken(null);

    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (err) {
      console.error(`${LOG_TAG} clearSession AsyncStorage error`, err);
    }

    useAdminStore.getState().setAdminMode(false);

    set({
      isAuthenticated: false,
      userId: null,
      user: null,
      accessToken: null,
    });
  },
}));