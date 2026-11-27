import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import EvidenceDossiersIndexScreen from '../app/study/dossiers';
import EvidenceDossierScreen from '../app/study/dossier/[id]';
import ExploreHubScreen from '../app/explore/index';
import StudyReader from '../app/study/[id]';
import { useAppSelector } from '../src/store';
import * as studyRepo from '../src/features/study/repository';

jest.mock('../src/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: () => jest.fn(),
}));

const mockPush = jest.fn();
let mockParams: { id?: string } = { id: 'dossier:wasp-39b-co2' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 'dossier:wasp-39b-co2' };
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

describe('Evidence Dossiers Index Screen (EvidenceDossiersIndexScreen)', () => {
  it('renders masthead, curated dossiers, and scientific integrity statement', async () => {
    await render(<EvidenceDossiersIndexScreen />);

    expect(screen.getByText('SCIENCE BEHIND SPACE · F07')).toBeTruthy();
    expect(screen.getAllByText('Behind the Discovery').length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(screen.getByText('WASP-39 b')).toBeTruthy();
      expect(screen.getByText('Europa')).toBeTruthy();
      expect(screen.getByText('Sagittarius A*')).toBeTruthy();
    });

    expect(screen.getByText('Scientific Integrity Standard')).toBeTruthy();
    expect(screen.getByText(/Every dossier is authored from authoritative primary research papers/)).toBeTruthy();
  });

  it('navigates to the selected dossier when tapped', async () => {
    await render(<EvidenceDossiersIndexScreen />);

    await waitFor(() => {
      expect(screen.getByText('WASP-39 b')).toBeTruthy();
    });

    const card = screen.getByLabelText(/Open evidence dossier: Transmission Spectrum of Exoplanet WASP-39 b/);
    fireEvent.press(card);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/study/dossier/[id]',
      params: { id: 'dossier:wasp-39b-co2' },
    });
  });
});

describe('Evidence Dossier Reader Screen (EvidenceDossierScreen)', () => {
  it('renders all four ruled blocks with truthful empirical and boundary text', async () => {
    mockParams = { id: 'dossier:wasp-39b-co2' };
    await render(<EvidenceDossierScreen />);

    await waitFor(() => {
      expect(screen.getByText('Transmission Spectrum of Exoplanet WASP-39 b')).toBeTruthy();
    });

    // Check badges
    expect(screen.getByText('REV 1')).toBeTruthy();
    expect(screen.getByText('WASP-39 b')).toBeTruthy();
    expect(screen.getByText('Exoplanet Transmission Spectroscopy')).toBeTruthy();
    expect(screen.getByText('Peer reviewed & verified: 2026-11-26')).toBeTruthy();

    // Check 4 Ruled Blocks
    expect(screen.getByTestId('dossier-block-observation')).toBeTruthy();
    expect(screen.getByText('Empirical Observation')).toBeTruthy();
    expect(screen.getByText(/4.3-micron absorption feature/)).toBeTruthy();

    expect(screen.getByTestId('dossier-block-method')).toBeTruthy();
    expect(screen.getByText('Method & Instrumentation')).toBeTruthy();
    expect(screen.getByText(/Near-Infrared Spectrograph \(NIRSpec\)/)).toBeTruthy();

    expect(screen.getByTestId('dossier-block-inference')).toBeTruthy();
    expect(screen.getByText('Scientific Inference')).toBeTruthy();
    expect(screen.getByText(/carbon dioxide \(CO2\)/)).toBeTruthy();

    expect(screen.getByTestId('dossier-block-uncertainty')).toBeTruthy();
    expect(screen.getByText('What Evidence Does NOT Establish')).toBeTruthy();
    expect(screen.getByText(/Crucially, atmospheric carbon dioxide detection is NOT evidence of biological life/)).toBeTruthy();
    expect(screen.getByText(/distinguished from illustrative artist renderings/)).toBeTruthy();

    // Check Asset badge
    expect(screen.getByText('EMPIRICAL DATA')).toBeTruthy();
    expect(screen.getByText('NIRSpec Transmission Spectrum (Measured Data)')).toBeTruthy();

    // Check Sources
    expect(screen.getByText('Authoritative Primary References')).toBeTruthy();
    expect(screen.getByText('Exoplanet WASP-39 b NIRSpec Transmission Spectrum')).toBeTruthy();
  });

  it('handles external source link navigation', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue();

    mockParams = { id: 'dossier:wasp-39b-co2' };
    await render(<EvidenceDossierScreen />);

    await waitFor(() => {
      expect(screen.getByText('Exoplanet WASP-39 b NIRSpec Transmission Spectrum')).toBeTruthy();
    });

    const openButtons = screen.getAllByText('Open primary reference');
    expect(openButtons.length).toBeGreaterThan(0);
    fireEvent.press(openButtons[0]);

    expect(Linking.canOpenURL).toHaveBeenCalledWith(
      'https://science.nasa.gov/asset/webb/exoplanet-wasp-39-b-nirspec-transmission-spectrum/'
    );
  });

  it('disables source links in offline mode', async () => {
    jest.mocked(useAppSelector).mockImplementation((selector) =>
      selector({
        auth: { user: { id: 10, username: 'emilys' } },
        feed: {
          connection: 'offline',
          metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T12:00:00Z' } },
          legacySyncedAt: null,
        },
      } as never)
    );

    mockParams = { id: 'dossier:wasp-39b-co2' };
    await render(<EvidenceDossierScreen />);

    await waitFor(() => {
      expect(screen.getByText('Exoplanet WASP-39 b NIRSpec Transmission Spectrum')).toBeTruthy();
    });

    const offlineButtons = screen.getAllByText('Source link (offline)');
    expect(offlineButtons.length).toBeGreaterThan(0);
  });

  it('renders fallback error card when dossier ID is nonexistent', async () => {
    mockParams = { id: 'dossier:unknown' };
    await render(<EvidenceDossierScreen />);

    await waitFor(() => {
      expect(screen.getByText('Dossier Unavailable')).toBeTruthy();
    });

    expect(screen.getByText(/The requested evidence dossier could not be found in the local archive/)).toBeTruthy();

    const browseButton = screen.getByText('Browse all dossiers');
    fireEvent.press(browseButton);

    expect(mockPush).toHaveBeenCalledWith('/study/dossiers');
  });
});

describe('Explore Hub Screen Links to Evidence Dossiers (ExploreHubScreen)', () => {
  it('renders Behind the Discovery card and navigates to dossiers index', async () => {
    await render(<ExploreHubScreen />);

    expect(screen.getByText('Behind the Discovery')).toBeTruthy();
    expect(screen.getByText('EVIDENCE DOSSIERS · F07')).toBeTruthy();
    expect(screen.getByText(/Peer-Reviewed Observational Dossiers/)).toBeTruthy();

    const card = screen.getByLabelText(/Open Behind the Discovery: Research-backed evidence dossiers/);
    fireEvent.press(card);

    expect(mockPush).toHaveBeenCalledWith('/study/dossiers');
  });
});

describe('Space Study Reader Links to Evidence Dossiers (StudyReader)', () => {
  it('renders Behind the Discovery links for related study chapters', async () => {
    jest.spyOn(studyRepo, 'readStudy').mockResolvedValue({
      entry: {
        id: 'chapter:deep-sky',
        title: 'Beyond the Solar System',
        category: 'Field Guide',
        body: 'Intro to Deep Sky\nParagraph explaining observations.',
        chapter: 6,
        related: '[]',
        url: 'https://science.nasa.gov/universe/',
        source: 'NASA Science',
        sky: 0,
      },
      marked: false,
      note: null,
    });
    jest.spyOn(studyRepo, 'checkpoint').mockResolvedValue(undefined);

    mockParams = { id: 'chapter:deep-sky' };
    await render(<StudyReader />);

    await waitFor(() => {
      expect(screen.getByText('Behind the Discovery')).toBeTruthy();
      expect(screen.getByText('Evidence Dossier: WASP-39 b')).toBeTruthy();
      expect(screen.getByText('Evidence Dossier: Sagittarius A*')).toBeTruthy();
    });

    const waspButton = screen.getByText('Evidence Dossier: WASP-39 b');
    fireEvent.press(waspButton);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/study/dossier/[id]',
      params: { id: 'dossier:wasp-39b-co2' },
    });
  });
});
