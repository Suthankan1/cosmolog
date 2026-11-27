import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import SkyCulturesScreen from '../app/explore/cultures';
import ExploreHubScreen from '../app/explore/index';
import { useAppSelector } from '../src/store';
import {
  projectCultureStar,
  projectAllCultureStars,
} from '../src/features/sky/catalog/cultures/cultureProjection';
import { cultureOverlays } from '../src/features/sky/catalog/cultures/cultureRepository';

jest.mock('../src/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: () => jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAppSelector).mockImplementation((selector) =>
    selector({
      auth: { user: { id: 10, username: 'emilys' } },
      feed: {
        connection: 'online',
        metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T12:00:00Z' } },
        legacySyncedAt: null,
      },
    } as never)
  );
});

describe('Cultural Sky Projection (cultureProjection)', () => {
  it('correctly maps astronomical coordinates with North up and East left', () => {
    const width = 360;
    const height = 400;

    const betelgeuse = projectCultureStar(27989, 'Betelgeuse', width, height);
    const rigel = projectCultureStar(24436, 'Rigel', width, height);

    expect(betelgeuse).not.toBeNull();
    expect(rigel).not.toBeNull();

    // North is UP: higher Dec means smaller y (nearer to top)
    expect(betelgeuse!.dec).toBeGreaterThan(rigel!.dec);
    expect(betelgeuse!.y).toBeLessThan(rigel!.y);

    // East is LEFT: higher RA means smaller x (towards East/left in sky view)
    expect(betelgeuse!.ra).toBeGreaterThan(rigel!.ra);
    expect(betelgeuse!.x).toBeLessThan(rigel!.x);
  });

  it('guarantees identical stable pixel positions across cultural traditions', () => {
    const width = 350;
    const height = 350;

    const arabicOverlay = cultureOverlays.find((c) => c.id === 'culture:arabic-bedouin')!;
    const chineseOverlay = cultureOverlays.find((c) => c.id === 'culture:chinese-traditional')!;

    const arabicMap = projectAllCultureStars(arabicOverlay.asterisms[0].stars, width, height);
    const chineseMap = projectAllCultureStars(chineseOverlay.asterisms[0].stars, width, height);

    expect(arabicMap.size).toBe(7);
    expect(chineseMap.size).toBe(7);

    for (const [hip, arabicStar] of arabicMap) {
      const chineseStar = chineseMap.get(hip);
      expect(chineseStar).toBeDefined();
      expect(chineseStar!.x).toBeCloseTo(arabicStar.x, 5);
      expect(chineseStar!.y).toBeCloseTo(arabicStar.y, 5);
    }
  });

  it('returns null for nonexistent Hipparcos IDs', () => {
    const ghost = projectCultureStar(999999, 'Ghost', 300, 300);
    expect(ghost).toBeNull();
  });
});

describe('One Sky Many Stories Screen (SkyCulturesScreen)', () => {
  it('renders masthead, mode tabs, cultural sky chart, and historical context', async () => {
    await render(<SkyCulturesScreen />);

    expect(screen.getByText('CULTURAL ASTRONOMY · F08')).toBeTruthy();
    expect(screen.getAllByText('One Sky, Many Stories').length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(screen.getByTestId('culture-sky-chart')).toBeTruthy();
      expect(screen.getAllByText(/Al-Jawza/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Distinct from Modern IAU Orion')).toBeTruthy();
    });

    expect(screen.getByText('Accessible Star & Segment Telemetry')).toBeTruthy();
    expect(screen.getAllByText(/Ibt al-Jawza'/).length).toBeGreaterThanOrEqual(1);
  });

  it('toggles between Al-Jawza, Shen, and Compare Both modes with non-gesture controls', async () => {
    await render(<SkyCulturesScreen />);

    await waitFor(() => {
      expect(screen.getAllByText(/Al-Jawza/).length).toBeGreaterThanOrEqual(1);
    });

    // Toggle to Shen (Chinese)
    const shenTab = screen.getByLabelText(/Shen: Chinese Traditional Twenty-Eight Mansions/);
    fireEvent.press(shenTab);

    await waitFor(() => {
      expect(screen.getByText(/Shen \(参宿\)/)).toBeTruthy();
      expect(screen.getByText(/Western White Tiger/)).toBeTruthy();
    });

    // Telemetry updates to Chinese general names
    expect(screen.getAllByText(/Shensu I/).length).toBeGreaterThanOrEqual(1);

    // Toggle to Compare Both
    const compareTab = screen.getByLabelText(/Side-by-side comparative overlay/);
    fireEvent.press(compareTab);

    await waitFor(() => {
      expect(screen.getByText('Cross-Cultural Astrological Comparison')).toBeTruthy();
      expect(screen.getByText('Al-Jawza’ (Brass)')).toBeTruthy();
      expect(screen.getByText('Shen (Terracotta)')).toBeTruthy();
    });
  });

  it('handles external citation opening and offline status', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue();

    await render(<SkyCulturesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Cultural References & Rights')).toBeTruthy();
    });

    const openButtons = screen.getAllByText('View authoritative catalog');
    expect(openButtons.length).toBeGreaterThan(0);
    fireEvent.press(openButtons[0]);

    expect(Linking.canOpenURL).toHaveBeenCalledWith('https://stellarium.org/en_US/skycultures.html');
  });

  it('navigates to Sky Viewer when Inspect in Sky Viewer button is pressed', async () => {
    await render(<SkyCulturesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Inspect in Sky Viewer')).toBeTruthy();
    });

    const skyViewerButton = screen.getByText('Inspect in Sky Viewer');
    fireEvent.press(skyViewerButton);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/sky-viewer',
      params: { target: 'hip:27989' },
    });
  });
});

describe('Explore Hub Screen Links to Cultural Sky Overlays (ExploreHubScreen)', () => {
  it('renders One Sky, Many Stories card and navigates to /explore/cultures', async () => {
    await render(<ExploreHubScreen />);

    expect(screen.getByText('ONE SKY, MANY STORIES · F08')).toBeTruthy();
    expect(screen.getByText('Cross-Cultural Asterism Comparison')).toBeTruthy();

    const card = screen.getByLabelText(/Open One Sky, Many Stories: Cross-cultural celestial comparison/);
    fireEvent.press(card);

    expect(mockPush).toHaveBeenCalledWith('/explore/cultures');
  });
});
