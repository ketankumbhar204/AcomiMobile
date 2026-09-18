import { env } from '../config/env';
import { getAuthToken } from '../api/client';
import {
  filesApi,
  type CreateUploadSessionRequest,
  type FilePurpose,
} from '../api/filesApi';
import { ApiError } from '../api/types';
import {
  ABSOLUTE_MAX_BYTES,
  FileUploadUserError,
  fileLimitMessage,
  isSupportedImageMime,
  purposeMaxBytes,
  purposeMaxMb,
} from '../utils/fileLimits';

export type LocalFileInput = {
  uri: string;
  mime: string;
  size: number;
  name?: string;
};

export type UploadLocalFileOptions = Omit<
  CreateUploadSessionRequest,
  'contentType' | 'byteSize' | 'originalFilename'
> & {
  purpose: FilePurpose;
};

export async function ensureUploadedFileId(
  existingFileId: string | undefined,
  file: LocalFileInput | undefined,
  options: UploadLocalFileOptions,
): Promise<string | undefined> {
  if (existingFileId) {
    return existingFileId;
  }
  if (!file) {
    return undefined;
  }
  return uploadLocalFile(file, options);
}

function resolveUploadUrl(uploadUrl: string): string {
  if (uploadUrl.startsWith('http://') || uploadUrl.startsWith('https://')) {
    return uploadUrl;
  }
  const path = uploadUrl.startsWith('/') ? uploadUrl : `/${uploadUrl}`;
  return `${env.apiBaseUrl}${path}`;
}

async function readLocalBody(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Unable to read the selected file');
  }
  return response.blob();
}

function isRetryableDownloadStatus(status: number): boolean {
  return status === 403 || status === 401 || status === 410;
}

export async function uploadLocalFile(
  file: LocalFileInput,
  options: UploadLocalFileOptions,
): Promise<string> {
  if (!isSupportedImageMime(file.mime)) {
    throw new FileUploadUserError('UNSUPPORTED', fileLimitMessage('UNSUPPORTED'));
  }
  if (file.size > purposeMaxBytes(options.purpose) || file.size > ABSOLUTE_MAX_BYTES) {
    throw new FileUploadUserError(
      'TOO_LARGE',
      fileLimitMessage('TOO_LARGE', purposeMaxMb(options.purpose)),
    );
  }

  const session = await filesApi.createUploadSession({
    ...options,
    contentType: file.mime,
    byteSize: file.size,
    originalFilename: file.name,
  });

  const body = await readLocalBody(file.uri);

  if (session.useAcomiUploadProxy || session.uploadUrl.startsWith('/')) {
    await filesApi.putContent(session.fileId, body, file.mime);
  } else {
    const headers: Record<string, string> = {
      'Content-Type': file.mime,
      ...(session.uploadHeaders ?? {}),
    };
    const uploadResponse = await fetch(resolveUploadUrl(session.uploadUrl), {
      method: session.uploadMethod || 'PUT',
      headers,
      body,
    });
    if (!uploadResponse.ok) {
      throw new ApiError('Unable to upload the file. Please try again.', uploadResponse.status);
    }
  }

  await filesApi.complete(session.fileId);
  return session.fileId;
}

export async function fetchSignedContentUrl(fileId: string): Promise<string> {
  const first = await filesApi.getContentUrl(fileId);
  return resolveDownloadUrl(first.contentUrl);
}

export async function fetchSignedContentUrlWithRetry(fileId: string): Promise<string> {
  try {
    return await fetchSignedContentUrl(fileId);
  } catch (error) {
    if (error instanceof ApiError && isRetryableDownloadStatus(error.status)) {
      return fetchSignedContentUrl(fileId);
    }
    throw error;
  }
}

function resolveDownloadUrl(contentUrl: string): string {
  if (contentUrl.startsWith('http://') || contentUrl.startsWith('https://')) {
    return contentUrl;
  }
  const path = contentUrl.startsWith('/') ? contentUrl : `/${contentUrl}`;
  const token = getAuthToken();
  if (!token) {
    return `${env.apiBaseUrl}${path}`;
  }
  return `${env.apiBaseUrl}${path}`;
}
