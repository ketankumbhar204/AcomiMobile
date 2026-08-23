import { Platform } from 'react-native';
import { isAndroidEmulator } from './isAndroidEmulator';

type AgentDebugPayload = {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
};

const INGEST_PATH = '/ingest/f9f35980-71d6-4fcd-84a3-a0c24a6875ff';

function debugIngestUrl(): string {
  if (Platform.OS === 'android' && isAndroidEmulator()) {
    return `http://10.0.2.2:7467${INGEST_PATH}`;
  }
  return `http://127.0.0.1:7467${INGEST_PATH}`;
}

export function agentDebugLog({
  hypothesisId,
  location,
  message,
  data = {},
  runId = 'post-fix',
}: AgentDebugPayload): void {
  if (!__DEV__) {
    return;
  }

  const payload = {
    sessionId: '1a4af9',
    hypothesisId,
    location,
    message,
    data,
    runId,
    timestamp: Date.now(),
  };

  // #region agent log
  fetch(debugIngestUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '1a4af9',
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion

  if (__DEV__) {
    console.log('[agent-debug]', JSON.stringify(payload));
  }
}
