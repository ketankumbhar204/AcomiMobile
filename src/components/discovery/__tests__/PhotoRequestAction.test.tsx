import React from 'react';
import { Linking } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { PhotoRequestAction } from '../PhotoRequestAction';

const mockRequestPhotos = jest.fn();
const mockCreateEnquiry = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../../api/enquiryApi', () => ({
  enquiryApi: {
    requestPhotos: (...args: unknown[]) => mockRequestPhotos(...args),
    create: (...args: unknown[]) => mockCreateEnquiry(...args),
  },
}));

function renderAction(kind: 'property' | 'mess' = 'property', name = 'Sri Sai Venkateshwara PG') {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <PhotoRequestAction
        spaceId="space-1"
        kind={kind}
        name={name}
        spaceType={kind === 'mess' ? 'MESS' : 'PG'}
        location="Hinjawadi"
        photoUrls={[]}
      />,
    );
  });
  return renderer!;
}

function press(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  act(() => {
    renderer.root.findByProps({ testID }).props.onPress();
  });
}

describe('PhotoRequestAction', () => {
  beforeEach(() => {
    mockRequestPhotos.mockReset();
    mockCreateEnquiry.mockReset();
    jest.spyOn(Linking, 'openURL').mockReset();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    mockRequestPhotos.mockResolvedValue({
      notificationPersisted: true,
      notificationDuplicate: false,
      fcmQueued: true,
      phoneAvailable: true,
      internationalPhone: '919876543210',
    });
  });

  it('opens the editable composer and does not open the contact chooser', () => {
    const renderer = renderAction();
    press(renderer, 'photo-request-open');
    const message = renderer.root.findByProps({ testID: 'photo-request-message' });
    expect(message.props.value).toContain('Sri Sai Venkateshwara PG');
    expect(message.props.value).toContain('property and available rooms');
    expect(renderer.root.findAllByProps({ children: 'Request property photos' }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: 'Continue to WhatsApp' }).length).toBeGreaterThan(0);
    const tree = JSON.stringify(renderer.toJSON());
    expect(tree).not.toContain('Get owner contact details');
    expect(tree).not.toContain('Send on ACOMI App');
    expect(tree).not.toContain('View contact details here');
    expect(mockRequestPhotos).not.toHaveBeenCalled();
    expect(mockCreateEnquiry).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('uses a mess message for mess listings', () => {
    const renderer = renderAction('mess', 'Annapurna Mess');
    press(renderer, 'photo-request-open');
    const message = renderer.root.findByProps({ testID: 'photo-request-message' });
    expect(message.props.value).toContain('Annapurna Mess');
    expect(message.props.value).toContain('menu, food, and service');
    expect(message.props.value).not.toContain('available rooms');
  });

  it('cancel closes the composer without WhatsApp or a notification', () => {
    const renderer = renderAction();
    press(renderer, 'photo-request-open');
    press(renderer, 'photo-request-cancel');
    expect(mockRequestPhotos).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(mockCreateEnquiry).not.toHaveBeenCalled();
  });

  it('sends the edited message to WhatsApp and does not create a contact enquiry', async () => {
    const renderer = renderAction();
    press(renderer, 'photo-request-open');
    await act(async () => {
      renderer.root.findByProps({ testID: 'photo-request-message' }).props.onChangeText('Edited photo request');
    });
    await act(async () => {
      renderer.root.findByProps({ testID: 'photo-request-confirm' }).props.onPress();
    });
    expect(mockCreateEnquiry).not.toHaveBeenCalled();
    expect(mockRequestPhotos).toHaveBeenCalledWith('space-1');
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    const opened = String((Linking.openURL as jest.Mock).mock.calls[0][0]);
    expect(decodeURIComponent(opened.split('?text=')[1])).toBe('Edited photo request');
    expect(opened).toContain('wa.me/919876543210');
  });

  it('keeps the composer open when WhatsApp cannot start', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('no app'));
    const renderer = renderAction();
    press(renderer, 'photo-request-open');
    await act(async () => {
      renderer.root.findByProps({ testID: 'photo-request-confirm' }).props.onPress();
    });
    expect(mockRequestPhotos).toHaveBeenCalledTimes(1);
    expect(renderer.root.findByProps({ testID: 'photo-request-notice' }).props.children).toContain(
      'photo request was saved',
    );
    expect(renderer.root.findByProps({ testID: 'photo-request-message' })).toBeTruthy();
  });

  it('keeps the composer open when the listing has no phone', async () => {
    mockRequestPhotos.mockResolvedValueOnce({
      notificationPersisted: true,
      notificationDuplicate: false,
      fcmQueued: true,
      phoneAvailable: false,
      internationalPhone: null,
    });
    const renderer = renderAction();
    press(renderer, 'photo-request-open');
    await act(async () => {
      renderer.root.findByProps({ testID: 'photo-request-confirm' }).props.onPress();
    });
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(renderer.root.findByProps({ testID: 'photo-request-notice' }).props.children).toContain(
      'doesn’t have a WhatsApp number',
    );
  });
});
