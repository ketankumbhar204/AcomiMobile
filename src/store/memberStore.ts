import { create } from 'zustand';
import { memberApi, PENDING_UPLOAD_FILE_URL } from '../api/memberApi';
import type {
  CreateInvitationRequest,
  CreateMemberDocumentRequest,
  CreateMemberNoteRequest,
  CreateMemberRequest,
  InvitationResponse,
  MemberDetailsResponse,
  MemberDocumentResponse,
  MemberHistoryResponse,
  MemberNoteResponse,
  MemberResponse,
  PendingInvitationResponse,
  UpdateDepositRequest,
  UpdateEmergencyContactRequest,
  UpdateMemberRequest,
  UpdateMemberStatusRequest,
  UUID,
} from '../api/types';
import { getMembershipErrorMessage } from '../utils/membershipErrors';
import { useAuthStore } from './authStore';
import { useSpaceStore } from './spaceStore';

const LOG_TAG = '[MemberStore]';

function getCurrentSpaceId(): UUID | null {
  return useSpaceStore.getState().currentSpace?.spaceId ?? null;
}

function mapDetailsToListItem(details: MemberDetailsResponse): MemberResponse {
  return {
    memberId: details.memberId,
    fullName: details.fullName,
    mobileNumber: details.mobileNumber,
    role: details.role,
    linkedUser: details.linkedUser,
    status: details.status,
    gender: details.gender,
    createdAt: details.createdAt,
  };
}

function clearTabCache() {
  return {
    documents: [] as MemberDocumentResponse[],
    notes: [] as MemberNoteResponse[],
    history: [] as MemberHistoryResponse[],
    documentsLoadedForMemberId: null as UUID | null,
    notesLoadedForMemberId: null as UUID | null,
    historyLoadedForMemberId: null as UUID | null,
    historyNeedsReload: false,
  };
}

async function invalidateHistoryAfterUpdate(
  get: () => MemberState,
  set: (
    partial:
      | Partial<MemberState>
      | ((state: MemberState) => Partial<MemberState>),
  ) => void,
  memberId: UUID,
): Promise<void> {
  const { historyLoadedForMemberId } = get();
  if (historyLoadedForMemberId === memberId) {
    await get().loadHistory(memberId, true);
  } else {
    set({ historyNeedsReload: true });
  }
}

interface MemberState {
  members: MemberResponse[];
  selectedMember: MemberDetailsResponse | null;
  pendingInvitations: PendingInvitationResponse[];
  documents: MemberDocumentResponse[];
  notes: MemberNoteResponse[];
  history: MemberHistoryResponse[];
  loading: boolean;
  memberLoading: boolean;
  documentsLoading: boolean;
  notesLoading: boolean;
  historyLoading: boolean;
  refreshing: boolean;
  error: string | null;
  documentsLoadedForMemberId: UUID | null;
  notesLoadedForMemberId: UUID | null;
  historyLoadedForMemberId: UUID | null;
  historyNeedsReload: boolean;

  loadMembers: () => Promise<void>;
  loadMemberDetails: (memberId: UUID) => Promise<MemberDetailsResponse | null>;
  refreshMember: (memberId: UUID) => Promise<MemberDetailsResponse | null>;
  addMember: (payload: CreateMemberRequest) => Promise<MemberResponse | null>;
  updateMember: (
    memberId: UUID,
    payload: UpdateMemberRequest,
  ) => Promise<MemberDetailsResponse | null>;
  updateStatus: (
    memberId: UUID,
    payload: UpdateMemberStatusRequest,
  ) => Promise<MemberDetailsResponse | null>;
  updateEmergencyContact: (
    memberId: UUID,
    payload: UpdateEmergencyContactRequest,
  ) => Promise<MemberDetailsResponse | null>;
  updateDeposit: (
    memberId: UUID,
    payload: UpdateDepositRequest,
  ) => Promise<MemberDetailsResponse | null>;
  removeMember: (memberId: UUID) => Promise<boolean>;
  loadDocuments: (memberId: UUID, force?: boolean) => Promise<void>;
  addDocument: (
    memberId: UUID,
    payload: Omit<CreateMemberDocumentRequest, 'fileUrl'> & { fileUrl?: string },
  ) => Promise<MemberDocumentResponse | null>;
  deleteDocument: (memberId: UUID, documentId: UUID) => Promise<boolean>;
  loadNotes: (memberId: UUID, force?: boolean) => Promise<void>;
  addNote: (memberId: UUID, payload: CreateMemberNoteRequest) => Promise<MemberNoteResponse | null>;
  loadHistory: (memberId: UUID, force?: boolean) => Promise<void>;
  loadPendingInvitations: () => Promise<void>;
  inviteMember: (
    payload: Omit<CreateInvitationRequest, 'invitedByUserId' | 'spaceId'>,
  ) => Promise<InvitationResponse | null>;
  cancelInvitation: (invitationId: UUID) => Promise<boolean>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  selectedMember: null,
  pendingInvitations: [],
  documents: [],
  notes: [],
  history: [],
  loading: false,
  memberLoading: false,
  documentsLoading: false,
  notesLoading: false,
  historyLoading: false,
  refreshing: false,
  error: null,
  documentsLoadedForMemberId: null,
  notesLoadedForMemberId: null,
  historyLoadedForMemberId: null,
  historyNeedsReload: false,

  loadMembers: async () => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return;
    }

    console.log(`${LOG_TAG} loadMembers`, spaceId);
    set({ loading: true, error: null });

    try {
      const members = await memberApi.getMembers(spaceId);
      console.log(`${LOG_TAG} loadMembers success`, members.length);
      set({ members, loading: false });
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.loadMembers');
      console.error(`${LOG_TAG} loadMembers failed`, err);
      set({ members: [], loading: false, error: message });
    }
  },

  loadMemberDetails: async memberId => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} loadMemberDetails`, { spaceId, memberId });

    const previousMemberId = get().selectedMember?.memberId ?? null;
    const isNewMember = previousMemberId !== memberId;

    set({
      memberLoading: true,
      error: null,
      ...(isNewMember ? clearTabCache() : {}),
    });

    try {
      const selectedMember = await memberApi.getMember(spaceId, memberId);
      console.log(`${LOG_TAG} loadMemberDetails success`, selectedMember.memberId);
      set({ selectedMember, memberLoading: false });
      return selectedMember;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.loadDetails');
      console.error(`${LOG_TAG} loadMemberDetails failed`, err);
      set({ memberLoading: false, error: message });
      return null;
    }
  },

  refreshMember: async memberId => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} refreshMember`, memberId);

    try {
      const selectedMember = await memberApi.getMember(spaceId, memberId);
      set(state => ({
        selectedMember,
        members: state.members.map(item =>
          item.memberId === memberId ? mapDetailsToListItem(selectedMember) : item,
        ),
      }));
      return selectedMember;
    } catch (err) {
      console.error(`${LOG_TAG} refreshMember failed`, err);
      return null;
    }
  },

  addMember: async payload => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} addMember`, spaceId);
    set({ loading: true, error: null });

    try {
      const member = await memberApi.createMember(spaceId, payload);
      console.log(`${LOG_TAG} addMember success`, member.memberId);
      set({ loading: false });
      await get().loadMembers();
      return member;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.add');
      console.error(`${LOG_TAG} addMember failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  updateMember: async (memberId, payload) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} updateMember`, { memberId, payload });
    set({ loading: true, error: null });

    try {
      const selectedMember = await memberApi.updateMember(spaceId, memberId, payload);
      console.log(`${LOG_TAG} updateMember success`, selectedMember.memberId);
      set(state => ({
        selectedMember:
          state.selectedMember?.memberId === memberId
            ? selectedMember
            : state.selectedMember,
        members: state.members.map(item =>
          item.memberId === memberId ? mapDetailsToListItem(selectedMember) : item,
        ),
        loading: false,
      }));
      return selectedMember;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.update');
      console.error(`${LOG_TAG} updateMember failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  updateStatus: async (memberId, payload) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} updateStatus`, { memberId, payload });
    set({ loading: true, error: null });

    try {
      const selectedMember = await memberApi.updateMemberStatus(spaceId, memberId, payload);
      console.log(`${LOG_TAG} updateStatus success`, selectedMember.status);
      set(state => ({
        selectedMember:
          state.selectedMember?.memberId === memberId
            ? selectedMember
            : state.selectedMember,
        members: state.members.map(item =>
          item.memberId === memberId ? mapDetailsToListItem(selectedMember) : item,
        ),
        loading: false,
      }));
      await invalidateHistoryAfterUpdate(get, set, memberId);
      return selectedMember;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.updateStatus');
      console.error(`${LOG_TAG} updateStatus failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  updateEmergencyContact: async (memberId, payload) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} updateEmergencyContact`, { memberId });
    set({ loading: true, error: null });

    try {
      const selectedMember = await memberApi.updateEmergencyContact(
        spaceId,
        memberId,
        payload,
      );
      console.log(`${LOG_TAG} updateEmergencyContact success`, selectedMember.memberId);
      set(state => ({
        selectedMember:
          state.selectedMember?.memberId === memberId
            ? selectedMember
            : state.selectedMember,
        loading: false,
      }));
      await invalidateHistoryAfterUpdate(get, set, memberId);
      return selectedMember;
    } catch (err) {
      const message = getMembershipErrorMessage(
        err,
        'membership.errors.updateEmergencyContact',
      );
      console.error(`${LOG_TAG} updateEmergencyContact failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  updateDeposit: async (memberId, payload) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} updateDeposit`, { memberId, payload });
    set({ loading: true, error: null });

    try {
      const selectedMember = await memberApi.updateDeposit(spaceId, memberId, payload);
      console.log(`${LOG_TAG} updateDeposit success`, selectedMember.depositBalance);
      set(state => ({
        selectedMember:
          state.selectedMember?.memberId === memberId
            ? selectedMember
            : state.selectedMember,
        loading: false,
      }));
      await invalidateHistoryAfterUpdate(get, set, memberId);
      return selectedMember;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.updateDeposit');
      console.error(`${LOG_TAG} updateDeposit failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  removeMember: async memberId => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return false;
    }

    console.log(`${LOG_TAG} removeMember`, memberId);
    set({ loading: true, error: null });

    try {
      await memberApi.removeMember(spaceId, memberId);
      console.log(`${LOG_TAG} removeMember success`);
      set(state => ({
        members: state.members.filter(item => item.memberId !== memberId),
        selectedMember:
          state.selectedMember?.memberId === memberId ? null : state.selectedMember,
        loading: false,
        ...(state.selectedMember?.memberId === memberId ? clearTabCache() : {}),
      }));
      return true;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.remove');
      console.error(`${LOG_TAG} removeMember failed`, err);
      set({ loading: false, error: message });
      return false;
    }
  },

  loadDocuments: async (memberId, force = false) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return;
    }

    const { documentsLoadedForMemberId } = get();
    if (!force && documentsLoadedForMemberId === memberId) {
      console.log(`${LOG_TAG} loadDocuments skipped (cached)`, memberId);
      return;
    }

    console.log(`${LOG_TAG} loadDocuments`, memberId);
    set({ documentsLoading: true, error: null });

    try {
      const documents = await memberApi.getMemberDocuments(spaceId, memberId);
      console.log(`${LOG_TAG} loadDocuments success`, documents.length);
      set({
        documents,
        documentsLoadedForMemberId: memberId,
        documentsLoading: false,
      });
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.loadDocuments');
      console.error(`${LOG_TAG} loadDocuments failed`, err);
      set({ documents: [], documentsLoading: false, error: message });
    }
  },

  addDocument: async (memberId, payload) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} addDocument`, memberId);
    set({ loading: true, error: null });

    try {
      const document = await memberApi.addMemberDocument(spaceId, memberId, {
        documentType: payload.documentType,
        documentNumber: payload.documentNumber,
        fileUrl: payload.fileUrl ?? PENDING_UPLOAD_FILE_URL,
      });
      console.log(`${LOG_TAG} addDocument success`, document.documentId);
      set({ loading: false });
      await get().loadDocuments(memberId, true);
      return document;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.addDocument');
      console.error(`${LOG_TAG} addDocument failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  deleteDocument: async (memberId, documentId) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return false;
    }

    console.log(`${LOG_TAG} deleteDocument`, { memberId, documentId });
    set({ loading: true, error: null });

    try {
      await memberApi.deleteMemberDocument(spaceId, memberId, documentId);
      console.log(`${LOG_TAG} deleteDocument success`);
      set({ loading: false });
      await get().loadDocuments(memberId, true);
      return true;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.deleteDocument');
      console.error(`${LOG_TAG} deleteDocument failed`, err);
      set({ loading: false, error: message });
      return false;
    }
  },

  loadNotes: async (memberId, force = false) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return;
    }

    const { notesLoadedForMemberId } = get();
    if (!force && notesLoadedForMemberId === memberId) {
      console.log(`${LOG_TAG} loadNotes skipped (cached)`, memberId);
      return;
    }

    console.log(`${LOG_TAG} loadNotes`, memberId);
    set({ notesLoading: true, error: null });

    try {
      const notes = await memberApi.getMemberNotes(spaceId, memberId);
      console.log(`${LOG_TAG} loadNotes success`, notes.length);
      set({
        notes,
        notesLoadedForMemberId: memberId,
        notesLoading: false,
      });
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.loadNotes');
      console.error(`${LOG_TAG} loadNotes failed`, err);
      set({ notes: [], notesLoading: false, error: message });
    }
  },

  addNote: async (memberId, payload) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return null;
    }

    console.log(`${LOG_TAG} addNote`, memberId);
    set({ loading: true, error: null });

    try {
      const note = await memberApi.addMemberNote(spaceId, memberId, payload);
      console.log(`${LOG_TAG} addNote success`, note.noteId);
      set({ loading: false });
      await get().loadNotes(memberId, true);
      return note;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.addNote');
      console.error(`${LOG_TAG} addNote failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  loadHistory: async (memberId, force = false) => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return;
    }

    const { historyLoadedForMemberId, historyNeedsReload } = get();
    if (!force && historyLoadedForMemberId === memberId && !historyNeedsReload) {
      console.log(`${LOG_TAG} loadHistory skipped (cached)`, memberId);
      return;
    }

    console.log(`${LOG_TAG} loadHistory`, { memberId, force });
    set({ historyLoading: true, error: null });

    try {
      const history = await memberApi.getMemberHistory(spaceId, memberId);
      console.log(`${LOG_TAG} loadHistory success`, history.length);
      set({
        history,
        historyLoadedForMemberId: memberId,
        historyNeedsReload: false,
        historyLoading: false,
      });
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.loadHistory');
      console.error(`${LOG_TAG} loadHistory failed`, err);
      set({ history: [], historyLoading: false, error: message });
    }
  },

  loadPendingInvitations: async () => {
    const spaceId = getCurrentSpaceId();
    if (!spaceId) {
      return;
    }

    console.log(`${LOG_TAG} loadPendingInvitations`, spaceId);
    set({ loading: true, error: null });

    try {
      const pendingInvitations = await memberApi.getPendingInvitations(spaceId);
      console.log(`${LOG_TAG} loadPendingInvitations success`, pendingInvitations.length);
      set({ pendingInvitations, loading: false });
    } catch (err) {
      const message = getMembershipErrorMessage(
        err,
        'membership.errors.loadInvitations',
      );
      console.error(`${LOG_TAG} loadPendingInvitations failed`, err);
      set({ pendingInvitations: [], loading: false, error: message });
    }
  },

  inviteMember: async payload => {
    const spaceId = getCurrentSpaceId();
    const invitedByUserId = useAuthStore.getState().userId;

    if (!spaceId || !invitedByUserId) {
      set({ error: getMembershipErrorMessage(null, 'common.errors.authRequired') });
      return null;
    }

    console.log(`${LOG_TAG} inviteMember`, spaceId);
    set({ loading: true, error: null });

    try {
      const invitation = await memberApi.createInvitation({
        ...payload,
        spaceId,
        invitedByUserId,
      });
      console.log(`${LOG_TAG} inviteMember success`, invitation.id);
      set({ loading: false });
      await get().loadPendingInvitations();
      return invitation;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.invite');
      console.error(`${LOG_TAG} inviteMember failed`, err);
      set({ loading: false, error: message });
      return null;
    }
  },

  cancelInvitation: async invitationId => {
    console.log(`${LOG_TAG} cancelInvitation`, invitationId);
    set({ loading: true, error: null });

    try {
      await memberApi.cancelInvitation(invitationId);
      console.log(`${LOG_TAG} cancelInvitation success`);
      set({ loading: false });
      await get().loadPendingInvitations();
      return true;
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.cancel');
      console.error(`${LOG_TAG} cancelInvitation failed`, err);
      set({ loading: false, error: message });
      return false;
    }
  },

  refresh: async () => {
    const spaceId = getCurrentSpaceId();
    console.log(`${LOG_TAG} refresh`, spaceId);
    set({ refreshing: true, error: null });

    if (!spaceId) {
      set({ refreshing: false });
      return;
    }

    try {
      const [members, pendingInvitations] = await Promise.all([
        memberApi.getMembers(spaceId),
        memberApi.getPendingInvitations(spaceId),
      ]);
      set({ members, pendingInvitations, refreshing: false });
    } catch (err) {
      const message = getMembershipErrorMessage(err, 'membership.errors.generic');
      console.error(`${LOG_TAG} refresh failed`, err);
      set({ refreshing: false, error: message });
    }
  },

  reset: () => {
    console.log(`${LOG_TAG} reset`);
    set({
      members: [],
      selectedMember: null,
      pendingInvitations: [],
      documents: [],
      notes: [],
      history: [],
      loading: false,
      memberLoading: false,
      documentsLoading: false,
      notesLoading: false,
      historyLoading: false,
      refreshing: false,
      error: null,
      documentsLoadedForMemberId: null,
      notesLoadedForMemberId: null,
      historyLoadedForMemberId: null,
      historyNeedsReload: false,
    });
  },
}));
