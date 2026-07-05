export const PROFILE_CORRECTION_NOTE_PREFIX = '[Profile correction] ';

export function isProfileCorrectionNote(note: string): boolean {
  return note.trimStart().startsWith(PROFILE_CORRECTION_NOTE_PREFIX);
}

export function profileCorrectionMessage(note: string): string {
  return note.trimStart().slice(PROFILE_CORRECTION_NOTE_PREFIX.length).trim();
}

export function buildProfileCorrectionNote(message: string): string {
  return `${PROFILE_CORRECTION_NOTE_PREFIX}${message.trim()}`;
}
