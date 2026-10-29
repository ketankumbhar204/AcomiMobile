import { Linking } from 'react-native';
import { act } from 'react-test-renderer';
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { navigateMainStack } from '../mainStackNavigation';
import { navigationRef } from '../navigationRef';

jest.mock('../navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(() => true),
  },
}));
import {
  flushPendingMealPoll,
  ingestMealPollUrl,
  parseMealPollLink,
  peekPendingMealPoll,
  resetMealPollLinkState,
  setMealPollNavigationReady,
} from '../mealPollLink';
import { useMealPollDeepLink } from '../useMealPollDeepLink';

jest.mock('../mainStackNavigation', () => ({
  navigateMainStack: jest.fn(),
}));

const SPACE_ID = '8df4eeb9-fde8-42a0-ab02-c0c0c2def077';
const POLL_URL = `https://app.acomi.in/spaces/${SPACE_ID}/meals/poll?date=2026-10-14`;
const navigateMainStackMock = navigateMainStack as jest.MockedFunction<typeof navigateMainStack>;

function Harness({ canOpen }: { canOpen: boolean }) {
  useMealPollDeepLink(canOpen);
  return null;
}

describe('parseMealPollLink', () => {
  it('reads the space id, date, and optional meal', () => {
    expect(parseMealPollLink(POLL_URL)).toEqual({
      spaceId: SPACE_ID,
      menuDate: '2026-10-14',
    });
    expect(parseMealPollLink(`${POLL_URL}&meal=LUNCH`)).toEqual({
      spaceId: SPACE_ID,
      menuDate: '2026-10-14',
      mealType: 'LUNCH',
    });
    expect(parseMealPollLink(`${POLL_URL}&meal=breakfast`)).toMatchObject({
      mealType: 'BREAKFAST',
    });
    expect(parseMealPollLink(`${POLL_URL}&meal=DINNER`)).toMatchObject({
      mealType: 'DINNER',
    });
  });

  it('rejects invalid ids, dates, meals, and other routes', () => {
    expect(parseMealPollLink(`${POLL_URL.replace(SPACE_ID, 'not-a-space')}`)).toBeNull();
    expect(
      parseMealPollLink(
        'https://app.acomi.in/spaces/8df4eeb9-fde8-42a0-ab02-c0c0c2def077/meals/poll?date=2026-02-31',
      ),
    ).toBeNull();
    expect(
      parseMealPollLink(
        'https://app.acomi.in/spaces/8df4eeb9-fde8-42a0-ab02-c0c0c2def077/meals/poll',
      ),
    ).toBeNull();
    expect(parseMealPollLink(`${POLL_URL}&meal=SNACK`)).toBeNull();
    expect(parseMealPollLink('acomi://enquiries/abc')).toBeNull();
    expect(parseMealPollLink('https://www.acomi.in/open.html')).toBeNull();
    expect(
      parseMealPollLink('https://play.google.com/store/apps/details?id=com.acomi'),
    ).toBeNull();
    expect(
      parseMealPollLink(
        'https://app.acomi.in/spaces/8df4eeb9-fde8-42a0-ab02-c0c0c2def077/members',
      ),
    ).toBeNull();
  });
});

describe('meal poll destination', () => {
  beforeEach(() => {
    resetMealPollLinkState();
    navigateMainStackMock.mockClear();
    (navigationRef.isReady as jest.Mock).mockReturnValue(true);
  });

  it('keeps the full destination until login, then opens it once', () => {
    expect(ingestMealPollUrl(`${POLL_URL}&meal=LUNCH`)).toBe('queued');
    expect(navigateMainStackMock).not.toHaveBeenCalled();
    expect(peekPendingMealPoll()).toEqual({
      spaceId: SPACE_ID,
      menuDate: '2026-10-14',
      mealType: 'LUNCH',
    });

    setMealPollNavigationReady(true);

    expect(navigateMainStackMock).toHaveBeenCalledTimes(1);
    expect(navigateMainStackMock).toHaveBeenCalledWith('MealPollResponse', {
      spaceId: SPACE_ID,
      menuDate: '2026-10-14',
      mealType: 'LUNCH',
    });
    expect(peekPendingMealPoll()).toBeNull();
    expect(flushPendingMealPoll()).toBe(false);
    expect(navigateMainStackMock).toHaveBeenCalledTimes(1);
  });

  it('opens immediately when the user is already logged in', () => {
    setMealPollNavigationReady(true);
    expect(ingestMealPollUrl(POLL_URL)).toBe('opened');
    expect(navigateMainStackMock).toHaveBeenCalledWith('MealPollResponse', {
      spaceId: SPACE_ID,
      menuDate: '2026-10-14',
    });
  });

  it('ignores a second delivery of the same link and still opens a later one', () => {
    setMealPollNavigationReady(true);
    expect(ingestMealPollUrl(POLL_URL)).toBe('opened');
    expect(ingestMealPollUrl(POLL_URL)).toBe('duplicate');
    expect(navigateMainStackMock).toHaveBeenCalledTimes(1);

    const next = POLL_URL.replace('2026-10-14', '2026-10-15');
    expect(ingestMealPollUrl(next)).toBe('opened');
    expect(navigateMainStackMock).toHaveBeenCalledTimes(2);
    expect(navigateMainStackMock).toHaveBeenLastCalledWith('MealPollResponse', {
      spaceId: SPACE_ID,
      menuDate: '2026-10-15',
    });
  });

  it('keeps the destination when the navigator is not mounted yet', () => {
    (navigationRef.isReady as jest.Mock).mockReturnValue(false);
    setMealPollNavigationReady(true);
    ingestMealPollUrl(POLL_URL);
    expect(flushPendingMealPoll()).toBe(false);
    expect(peekPendingMealPoll()?.menuDate).toBe('2026-10-14');
    expect(navigateMainStackMock).not.toHaveBeenCalled();
  });

  it('does not replace a saved poll with an invalid or unrelated link', () => {
    ingestMealPollUrl(POLL_URL);
    expect(ingestMealPollUrl('acomi://enquiries/abc')).toBe('ignored');
    expect(ingestMealPollUrl(`${POLL_URL}&meal=SNACK`)).toBe('ignored');
    expect(peekPendingMealPoll()?.menuDate).toBe('2026-10-14');
    expect(navigateMainStackMock).not.toHaveBeenCalled();
  });
});

describe('useMealPollDeepLink', () => {
  const listeners: Array<(event: { url: string }) => void> = [];

  beforeEach(() => {
    resetMealPollLinkState();
    navigateMainStackMock.mockClear();
    listeners.length = 0;
    jest.useFakeTimers();
    (navigationRef.isReady as jest.Mock).mockReturnValue(true);
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest.spyOn(Linking, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener as (event: { url: string }) => void);
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('queues a cold-start link until navigation is allowed, then opens it once', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`${POLL_URL}&meal=DINNER`);
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness, { canOpen: false }));
    });
    expect(navigateMainStackMock).not.toHaveBeenCalled();
    expect(peekPendingMealPoll()?.mealType).toBe('DINNER');

    await act(async () => {
      renderer.update(React.createElement(Harness, { canOpen: true }));
    });
    expect(navigateMainStackMock).not.toHaveBeenCalled();
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(navigateMainStackMock).toHaveBeenCalledTimes(1);
    expect(navigateMainStackMock).toHaveBeenCalledWith('MealPollResponse', {
      spaceId: SPACE_ID,
      menuDate: '2026-10-14',
      mealType: 'DINNER',
    });

    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(navigateMainStackMock).toHaveBeenCalledTimes(1);
  });

  it('opens a background link when the app is already ready', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Harness, { canOpen: true }));
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(navigateMainStackMock).not.toHaveBeenCalled();

    await act(async () => {
      listeners[0]?.({ url: `${POLL_URL}&meal=BREAKFAST` });
    });
    expect(navigateMainStackMock).toHaveBeenCalledTimes(1);
    expect(navigateMainStackMock).toHaveBeenCalledWith('MealPollResponse', {
      spaceId: SPACE_ID,
      menuDate: '2026-10-14',
      mealType: 'BREAKFAST',
    });
    act(() => {
      renderer.unmount();
    });
  });
});
