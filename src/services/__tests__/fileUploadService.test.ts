import { filesApi } from '../../api/filesApi';
import { ApiError } from '../../api/types';
import { fetchSignedContentUrlWithRetry, uploadLocalFile } from '../fileUploadService';

jest.mock('../../api/filesApi', () => ({
  filesApi: {
    createUploadSession: jest.fn(),
    complete: jest.fn(),
    putContent: jest.fn(),
    getContentUrl: jest.fn(),
  },
}));

jest.mock('../../api/client', () => ({
  getAuthToken: () => 'token',
}));

jest.mock('../../config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8080/api/v1' },
}));

const mockedFilesApi = filesApi as jest.Mocked<typeof filesApi>;

describe('fileUploadService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('uploads via ACOMI proxy then completes', async () => {
    mockedFilesApi.createUploadSession.mockResolvedValue({
      fileId: 'file-1',
      purpose: 'PROFILE_PHOTO',
      status: 'PENDING',
      uploadUrl: '/files/file-1/content',
      uploadMethod: 'PUT',
      useAcomiUploadProxy: true,
    });
    mockedFilesApi.putContent.mockResolvedValue();
    mockedFilesApi.complete.mockResolvedValue({
      fileId: 'file-1',
      purpose: 'PROFILE_PHOTO',
      status: 'ACTIVE',
      contentType: 'image/jpeg',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob([new Uint8Array([1, 2, 3])]),
    }) as never;

    const fileId = await uploadLocalFile(
      { uri: 'file://photo.jpg', mime: 'image/jpeg', size: 3, name: 'photo.jpg' },
      { purpose: 'PROFILE_PHOTO' },
    );

    expect(fileId).toBe('file-1');
    expect(mockedFilesApi.putContent).toHaveBeenCalled();
    expect(mockedFilesApi.complete).toHaveBeenCalledWith('file-1');
  });

  it('PUTs directly to a signed URL without the session API client', async () => {
    mockedFilesApi.createUploadSession.mockResolvedValue({
      fileId: 'file-2',
      purpose: 'PAYMENT_PROOF',
      status: 'PENDING',
      uploadUrl: 'https://storage.example/signed',
      uploadMethod: 'PUT',
      uploadHeaders: { 'Content-Type': 'image/jpeg' },
      useAcomiUploadProxy: false,
    });
    mockedFilesApi.complete.mockResolvedValue({
      fileId: 'file-2',
      purpose: 'PAYMENT_PROOF',
      status: 'ACTIVE',
      contentType: 'image/jpeg',
    });
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob([new Uint8Array([1])]),
      })
      .mockResolvedValueOnce({ ok: true });
    global.fetch = fetchMock as never;

    await uploadLocalFile(
      { uri: 'file://proof.jpg', mime: 'image/jpeg', size: 1 },
      { purpose: 'PAYMENT_PROOF', spaceId: 'space-1', paymentId: 'pay-1' },
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://storage.example/signed',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(mockedFilesApi.putContent).not.toHaveBeenCalled();
  });

  it('retries signed URL fetch after 403', async () => {
    mockedFilesApi.getContentUrl
      .mockRejectedValueOnce(new ApiError('expired', 403))
      .mockResolvedValueOnce({
        fileId: 'file-3',
        contentUrl: '/files/file-3/content',
        contentType: 'image/jpeg',
        expiresAt: '2026-09-14T00:00:00Z',
      });

    const url = await fetchSignedContentUrlWithRetry('file-3');
    expect(url).toContain('/files/file-3/content');
    expect(mockedFilesApi.getContentUrl).toHaveBeenCalledTimes(2);
  });

  it('rejects files over the purpose limit before creating a session', async () => {
    await expect(
      uploadLocalFile(
        { uri: 'file://huge.jpg', mime: 'image/jpeg', size: 5 * 1024 * 1024 + 1, name: 'huge.jpg' },
        { purpose: 'PROFILE_PHOTO' },
      ),
    ).rejects.toMatchObject({ code: 'TOO_LARGE' });
    expect(mockedFilesApi.createUploadSession).not.toHaveBeenCalled();
  });

  it('rejects unsupported document types', async () => {
    await expect(
      uploadLocalFile(
        { uri: 'file://doc.pdf', mime: 'application/pdf', size: 100, name: 'doc.pdf' },
        { purpose: 'MEMBER_DOCUMENT' },
      ),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED' });
  });
});
