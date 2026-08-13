import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  defaultSpaceResponseToSpace,
  mySpaceResponseToSpace,
  mySpacesApi,
  spaceApi,
  spaceDetailsResponseToSpace,
} from '../api';
import type {
  DefaultSpaceResponse,
  MySpaceResponse,
  Space,
  UpdateSpaceRequest,
  UUID,
} from '../api/types';
import { getSpaceErrorMessage } from '../utils/spaceErrors';
import { resolveStartupSpace, type StartupSpaceResolution } from '../utils/resolveStartupSpace';
import { navigateBootstrapResult } from '../navigation/navigationRef';

const LOG_TAG = '[SpaceStore]';
const CURRENT_SPACE_KEY = '@acomi/current_space';

export type SpaceBootstrapRoute =
  | 'SpaceTabs'
  | 'MySpaces'
  | 'CreateSpace'
  | 'AcceptInvitations'
  | 'OnboardingChoice'
  | 'JoinSpace';

export type SpaceBootstrapResult = {
  route: SpaceBootstrapRoute;
  spaceId?: UUID;
};

interface SpaceState {
  currentSpace: DefaultSpaceResponse | null;
  selectedSpaceId: UUID | null;
  selectedSpace: Space | null;
  mySpaces: MySpaceResponse[];
  loading: boolean;
  searching: boolean;
  searchQuery: string;
  error: string | null;
  isSpaceBootstrapping: boolean;
  hasSpaceBootstrapped: boolean;
  /** Set during bootstrap so MainNavigator can open the correct first screen. */
  startupRoute: SpaceBootstrapRoute | null;

  hydrateCurrentSpace: () => Promise<void>;
  bootstrapSpaces: () => Promise<SpaceBootstrapResult>;
  /** Re-check invitations and memberships; navigate when status changes. */
  refreshStartupNavigation: () => Promise<SpaceBootstrapResult>;
  loadMySpaces: () => Promise<void>;
  loadDefaultSpace: () => Promise<DefaultSpaceResponse | null>;
  searchSpaces: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  switchSpace: (spaceId: UUID) => Promise<boolean>;
  loadSpaceDetails: (spaceId: UUID) => Promise<Space | null>;
  setSelectedSpace: (space: Space) => Promise<void>;
  updateSpace: (
    spaceId: UUID,
    payload: UpdateSpaceRequest,
  ) => Promise<Space | null>;
  deactivateSpace: (spaceId: UUID) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearSelectedSpace: () => Promise<void>;
  resetSpaceSession: () => Promise<void>;

  /** @deprecated Use loadMySpaces */
  loadUserSpaces: () => Promise<void>;
  /** @deprecated Use refresh */
  refreshSpaces: () => Promise<void>;
}

async function persistCurrentSpace(
  space: DefaultSpaceResponse | null,
): Promise<void> {
  if (space) {
    await AsyncStorage.setItem(CURRENT_SPACE_KEY, JSON.stringify(space));
  } else {
    await AsyncStorage.removeItem(CURRENT_SPACE_KEY);
  }
}

function applyCurrentSpace(
  space: DefaultSpaceResponse | null,
): Pick<SpaceState, 'currentSpace' | 'selectedSpace' | 'selectedSpaceId'> {
  if (!space) {
    return { currentSpace: null, selectedSpace: null, selectedSpaceId: null };
  }

  const mapped = defaultSpaceResponseToSpace(space);
  return {
    currentSpace: space,
    selectedSpace: mapped,
    selectedSpaceId: space.spaceId,
  };
}

function applyStartupResolution(
  resolved: StartupSpaceResolution,
): { patch: Partial<SpaceState>; result: SpaceBootstrapResult } {
  if (resolved.kind === 'dashboard') {
    return {
      patch: {
        ...applyCurrentSpace(resolved.space),
        startupRoute: 'SpaceTabs',
        hasSpaceBootstrapped: true,
        isSpaceBootstrapping: false,
        loading: false,
      },
      result: { route: 'SpaceTabs', spaceId: resolved.spaceId },
    };
  }

  if (resolved.kind === 'invitations') {
    return {
      patch: {
        ...applyCurrentSpace(null),
        mySpaces: [],
        startupRoute: 'AcceptInvitations',
        hasSpaceBootstrapped: true,
        isSpaceBootstrapping: false,
        loading: false,
      },
      result: { route: 'AcceptInvitations' },
    };
  }

  if (resolved.kind === 'onboardingChoice') {
    return {
      patch: {
        ...applyCurrentSpace(null),
        mySpaces: [],
        startupRoute: 'OnboardingChoice',
        hasSpaceBootstrapped: true,
        isSpaceBootstrapping: false,
        loading: false,
      },
      result: { route: 'OnboardingChoice' },
    };
  }

  return {
    patch: {
      ...applyCurrentSpace(null),
      mySpaces: resolved.spaces,
      startupRoute: 'MySpaces',
      hasSpaceBootstrapped: true,
      isSpaceBootstrapping: false,
      loading: false,
    },
    result: { route: 'MySpaces' },
  };
}

export const useSpaceStore = create<SpaceState>((set, get) => ({
  currentSpace: null,
  selectedSpaceId: null,
  selectedSpace: null,
  mySpaces: [],
  loading: false,
  searching: false,
  searchQuery: '',
  error: null,
  isSpaceBootstrapping: false,
  hasSpaceBootstrapped: false,
  startupRoute: null,

  hydrateCurrentSpace: async () => {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_SPACE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as DefaultSpaceResponse;
      console.log(`${LOG_TAG} hydrateCurrentSpace`, parsed.spaceId);
      set(applyCurrentSpace(parsed));
    } catch (err) {
      console.error(`${LOG_TAG} hydrateCurrentSpace failed`, err);
    }
  },

  bootstrapSpaces: async () => {
    if (get().isSpaceBootstrapping) {
      console.log(`${LOG_TAG} bootstrapSpaces skipped — already in flight`);
      return {
        route: get().startupRoute ?? 'MySpaces',
        spaceId: get().selectedSpaceId ?? undefined,
      };
    }

    if (get().hasSpaceBootstrapped && get().startupRoute) {
      console.log(`${LOG_TAG} bootstrapSpaces skipped — already resolved`);
      return {
        route: get().startupRoute,
        spaceId: get().selectedSpaceId ?? undefined,
      };
    }

    console.log(`${LOG_TAG} bootstrapSpaces started`);
    set({ isSpaceBootstrapping: true, loading: true, error: null, startupRoute: null });

    try {
      const resolved = await resolveStartupSpace();
      console.log(`${LOG_TAG} bootstrapSpaces resolved`, resolved.kind);

      if (resolved.kind === 'dashboard') {
        await persistCurrentSpace(resolved.space);
      } else {
        await persistCurrentSpace(null);
      }

      const { patch, result } = applyStartupResolution(resolved);
      set(patch);

      if (resolved.kind === 'dashboard') {
        void get().loadSpaceDetails(resolved.spaceId);
        void get().loadMySpaces();
      }

      return result;
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'common.errors.loadSpaces');
      console.error(`${LOG_TAG} bootstrapSpaces failed`, err);
      set({
        error: message,
        startupRoute: 'MySpaces',
        hasSpaceBootstrapped: true,
        isSpaceBootstrapping: false,
        loading: false,
      });
      return { route: 'MySpaces' };
    }
  },

  refreshStartupNavigation: async () => {
    console.log(`${LOG_TAG} refreshStartupNavigation`);
    set({ loading: true, error: null });

    try {
      const resolved = await resolveStartupSpace();
      console.log(`${LOG_TAG} refreshStartupNavigation resolved`, resolved.kind);

      if (resolved.kind === 'dashboard') {
        await persistCurrentSpace(resolved.space);
      } else if (resolved.kind === 'picker') {
        await persistCurrentSpace(null);
      } else {
        await persistCurrentSpace(null);
      }

      const { patch, result } = applyStartupResolution(resolved);
      set({ ...patch, loading: false });

      if (resolved.kind === 'dashboard') {
        void get().loadSpaceDetails(resolved.spaceId);
        void get().loadMySpaces();
      }

      navigateBootstrapResult(result);
      return result;
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'common.errors.loadSpaces');
      console.error(`${LOG_TAG} refreshStartupNavigation failed`, err);
      set({ loading: false, error: message });
      return { route: 'JoinSpace' };
    }
  },

  loadMySpaces: async () => {
    console.log(`${LOG_TAG} loadMySpaces started`);
    set({ loading: true, error: null });

    try {
      const spaces = await mySpacesApi.getMySpaces();
      console.log(`${LOG_TAG} loadMySpaces success`, spaces.length);
      set({ mySpaces: spaces, loading: false });
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'common.errors.loadSpaces');
      console.error(`${LOG_TAG} loadMySpaces failed`, err);
      set({ mySpaces: [], loading: false, error: message });
    }
  },

  loadDefaultSpace: async () => {
    console.log(`${LOG_TAG} loadDefaultSpace started`);
    set({ loading: true, error: null });

    try {
      const defaultSpace = await mySpacesApi.getDefaultSpace();
      console.log(`${LOG_TAG} loadDefaultSpace`, defaultSpace?.spaceId);

      if (defaultSpace) {
        await persistCurrentSpace(defaultSpace);
        set({ ...applyCurrentSpace(defaultSpace), loading: false });
      } else {
        set({ loading: false });
      }

      return defaultSpace;
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'common.errors.loadSpaces');
      console.error(`${LOG_TAG} loadDefaultSpace failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  searchSpaces: async (query: string) => {
    const trimmed = query.trim();
    console.log(`${LOG_TAG} searchSpaces`, trimmed || '(full list)');
    set({ searching: true, error: null });

    try {
      const spaces = trimmed
        ? await mySpacesApi.searchMySpaces(trimmed)
        : await mySpacesApi.getMySpaces();
      console.log(`${LOG_TAG} searchSpaces results`, spaces.length);
      set({ mySpaces: spaces, searching: false });
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'common.errors.loadSpaces');
      console.error(`${LOG_TAG} searchSpaces failed`, err);
      set({ mySpaces: [], searching: false, error: message });
    }
  },

  switchSpace: async (spaceId: UUID) => {
    console.log(`${LOG_TAG} switchSpace`, spaceId);
    set({ loading: true, error: null });

    try {
      const result = await mySpacesApi.setDefaultSpace(spaceId);
      const spaceType =
        get().mySpaces.find(item => item.spaceId === spaceId)?.spaceType ??
        get().currentSpace?.spaceType ??
        'PG';

      const currentSpace: DefaultSpaceResponse = {
        spaceId: result.spaceId,
        spaceName: result.spaceName,
        spaceType,
      };

      await persistCurrentSpace(currentSpace);
      set({
        ...applyCurrentSpace(currentSpace),
        loading: false,
      });

      await get().loadSpaceDetails(spaceId);
      await get().loadMySpaces();
      console.log(`${LOG_TAG} switchSpace success`, spaceId);
      return true;
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'common.errors.loadSpaces');
      console.error(`${LOG_TAG} switchSpace failed`, err);
      set({ loading: false, error: message });
      return false;
    }
  },

  loadSpaceDetails: async (spaceId: UUID) => {
    console.log(`${LOG_TAG} loadSpaceDetails`, spaceId);
    set({ loading: true, error: null });

    try {
      const response = await spaceApi.getSpaceById(spaceId);
      const space = spaceDetailsResponseToSpace(response);
      set({
        selectedSpaceId: space.id,
        selectedSpace: space,
        loading: false,
      });
      return space;
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'spaces.errors.loadDetails');
      console.error(`${LOG_TAG} loadSpaceDetails failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  setSelectedSpace: async (space: Space) => {
    console.log(`${LOG_TAG} setSelectedSpace`, space.id);
    const currentSpace: DefaultSpaceResponse = {
      spaceId: space.id,
      spaceName: space.name,
      spaceType: space.type,
    };
    await persistCurrentSpace(currentSpace);
    set({
      currentSpace,
      selectedSpaceId: space.id,
      selectedSpace: space,
    });
  },

  updateSpace: async (spaceId: UUID, payload: UpdateSpaceRequest) => {
    console.log(`${LOG_TAG} updateSpace`, { spaceId, payload });
    set({ loading: true, error: null });

    try {
      const response = await spaceApi.updateSpace(spaceId, payload);
      const space = spaceDetailsResponseToSpace(response);
      const currentSpace: DefaultSpaceResponse = {
        spaceId: space.id,
        spaceName: space.name,
        spaceType: space.type,
      };

      const isCurrent = get().currentSpace?.spaceId === spaceId;

      set(state => ({
        currentSpace: isCurrent ? currentSpace : state.currentSpace,
        selectedSpace: space,
        selectedSpaceId: space.id,
        mySpaces: state.mySpaces.map(item =>
          item.spaceId === space.id
            ? { ...item, spaceName: space.name, spaceType: space.type }
            : item,
        ),
        loading: false,
      }));

      if (isCurrent) {
        await persistCurrentSpace(currentSpace);
      }

      return space;
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'spaces.errors.update');
      console.error(`${LOG_TAG} updateSpace failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  deactivateSpace: async (spaceId: UUID) => {
    console.log(`${LOG_TAG} deactivateSpace`, spaceId);
    set({ loading: true, error: null });

    try {
      await spaceApi.deactivateSpace(spaceId);
      const wasCurrent = get().currentSpace?.spaceId === spaceId;

      set(state => ({
        mySpaces: state.mySpaces.filter(item => item.spaceId !== spaceId),
        ...(wasCurrent
          ? applyCurrentSpace(null)
          : {
              selectedSpace:
                state.selectedSpaceId === spaceId ? null : state.selectedSpace,
              selectedSpaceId:
                state.selectedSpaceId === spaceId ? null : state.selectedSpaceId,
            }),
        loading: false,
      }));

      if (wasCurrent) {
        await persistCurrentSpace(null);
      }

      return true;
    } catch (err) {
      const message = getSpaceErrorMessage(err, 'spaces.errors.deactivate');
      console.error(`${LOG_TAG} deactivateSpace failed`, err);
      set({ loading: false, error: message });
      return false;
    }
  },

  refresh: async () => {
    console.log(`${LOG_TAG} refresh`);
    const { searchQuery } = get();
    if (searchQuery.trim()) {
      await get().searchSpaces(searchQuery);
    } else {
      await get().loadMySpaces();
    }
    await get().loadDefaultSpace();
  },

  clearSelectedSpace: async () => {
    console.log(`${LOG_TAG} clearSelectedSpace`);
    set(applyCurrentSpace(null));
    await persistCurrentSpace(null);
  },

  resetSpaceSession: async () => {
    console.log(`${LOG_TAG} resetSpaceSession`);
    set({
      currentSpace: null,
      selectedSpaceId: null,
      selectedSpace: null,
      mySpaces: [],
      loading: false,
      searching: false,
      searchQuery: '',
      error: null,
      isSpaceBootstrapping: false,
      hasSpaceBootstrapped: false,
      startupRoute: null,
    });
    await persistCurrentSpace(null);
  },

  loadUserSpaces: async () => {
    await get().loadMySpaces();
  },

  refreshSpaces: async () => {
    await get().refresh();
  },
}));
