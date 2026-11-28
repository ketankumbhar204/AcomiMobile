import { Platform, Share } from 'react-native';
import {
  MARKETING_MEDIA_MAX_FILES,
  MARKETING_MEDIA_MAX_IMAGE_BYTES,
  MARKETING_MEDIA_MAX_VIDEO_BYTES,
  marketingMediaKind,
  shareMarketingMediaNatively,
  validateMarketingMediaAddition,
  type SelectedMarketingMedia,
} from '../marketingMediaLimits';

const sampleImage = (overrides: Partial<SelectedMarketingMedia> = {}): SelectedMarketingMedia => ({
  id: '1',
  uri: 'file:///tmp/a.jpg',
  mime: 'image/jpeg',
  size: 1024,
  name: 'a.jpg',
  kind: 'image',
  ...overrides,
});

describe('marketingMediaLimits', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
    jest.restoreAllMocks();
  });

  it('classifies supported image and video mime types', () => {
    expect(marketingMediaKind('image/png')).toBe('image');
    expect(marketingMediaKind('video/mp4')).toBe('video');
    expect(marketingMediaKind('application/pdf')).toBeNull();
  });

  it('accepts multiple valid images and videos under limits', () => {
    const result = validateMarketingMediaAddition(0, [
      { name: 'a.jpg', mime: 'image/jpeg', size: 1000 },
      { name: 'b.mp4', mime: 'video/mp4', size: 2000 },
    ]);
    expect(result.ok).toBe(true);
  });

  it('rejects too many files', () => {
    const candidates = Array.from({ length: MARKETING_MEDIA_MAX_FILES }, (_, i) => ({
      name: `f${i}.jpg`,
      mime: 'image/jpeg',
      size: 10,
    }));
    const result = validateMarketingMediaAddition(1, candidates);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('TOO_MANY');
  });

  it('rejects oversized image and video', () => {
    const image = validateMarketingMediaAddition(0, [
      { name: 'big.jpg', mime: 'image/jpeg', size: MARKETING_MEDIA_MAX_IMAGE_BYTES + 1 },
    ]);
    expect(image.ok).toBe(false);
    if (!image.ok) expect(image.code).toBe('IMAGE_TOO_LARGE');

    const video = validateMarketingMediaAddition(0, [
      { name: 'big.mp4', mime: 'video/mp4', size: MARKETING_MEDIA_MAX_VIDEO_BYTES + 1 },
    ]);
    expect(video.ok).toBe(false);
    if (!video.ok) expect(video.code).toBe('VIDEO_TOO_LARGE');
  });

  it('rejects unsupported formats', () => {
    const result = validateMarketingMediaAddition(0, [
      { name: 'x.gif', mime: 'image/gif', size: 10 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('UNSUPPORTED');
  });

  it('attempts Android Share with the first media uri and no caption text', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    const result = await shareMarketingMediaNatively([sampleImage()], 'Hello');
    expect(result).toBe('shared');
    expect(shareSpy).toHaveBeenCalledWith({
      url: 'file:///tmp/a.jpg',
      title: 'a.jpg',
    });
  });

  it('shares a single file on iOS via Share.share without caption text', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    const result = await shareMarketingMediaNatively([sampleImage()], 'Hello owner');
    expect(result).toBe('shared');
    expect(shareSpy).toHaveBeenCalledWith({
      url: 'file:///tmp/a.jpg',
    });
  });

  it('shares each file on iOS when multiple are selected', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    const result = await shareMarketingMediaNatively(
      [sampleImage(), sampleImage({ id: '2', uri: 'file:///tmp/b.jpg', name: 'b.jpg' })],
      'Hello',
    );
    expect(result).toBe('shared');
    expect(shareSpy).toHaveBeenCalledTimes(2);
    expect(shareSpy).toHaveBeenCalledWith({
      url: 'file:///tmp/a.jpg',
    });
  });

  it('shares text-only when no media is selected', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    await expect(shareMarketingMediaNatively([], 'Hello')).resolves.toBe('shared');
    expect(shareSpy).toHaveBeenCalledWith({
      message: 'Hello',
      title: 'ACOMI listing message',
    });
  });

  it('treats empty media and empty message as unsupported', async () => {
    await expect(shareMarketingMediaNatively([], '  ')).resolves.toBe('unsupported');
  });

  it('shares multiple files one-by-one so WhatsApp can attach media', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    const result = await shareMarketingMediaNatively(
      [
        sampleImage(),
        sampleImage({ id: '2', uri: 'content://media/b.jpg', name: 'b.jpg' }),
      ],
      'Hello',
    );
    expect(result).toBe('shared');
    expect(shareSpy).toHaveBeenCalledTimes(2);
    expect(shareSpy.mock.calls[0][0]).toMatchObject({
      url: 'file:///tmp/a.jpg',
      title: 'a.jpg',
    });
  });
});
