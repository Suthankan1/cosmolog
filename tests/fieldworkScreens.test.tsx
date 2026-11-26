import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import FieldworkHubScreen from '../app/fieldwork/index';
import CreateObservationScreen from '../app/fieldwork/create';
import ObservationDetailScreen from '../app/fieldwork/[id]';
import { useAppSelector } from '../src/store';
import {
  getObservations,
  getObservationById,
  createObservation,
  updateObservation,
  deleteObservation,
  type ObservationRecord,
} from '../src/database/repositories/observationsRepository';

jest.mock('../src/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: () => jest.fn(),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => {
  const actualReact = jest.requireActual('react');
  return {
    useRouter: () => ({
      push: mockPush,
      replace: jest.fn(),
      back: mockBack,
    }),
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => void) => {
      actualReact.useEffect(() => {
        cb();
      }, [cb]);
    },
  };
});

jest.mock('../src/database/repositories/observationsRepository');

const sampleObservation: ObservationRecord = {
  id: 'obs_sample_123',
  accountId: 10,
  title: 'Saturn Ring Edge Transit',
  notes: 'Sharp Cassini division visible at 200x magnification.',
  observedAt: '2026-11-26T19:30:00.000Z',
  timezone: 'Asia/Colombo',
  targetId: 'body:Saturn',
  targetName: 'Saturn',
  conditions: 'Clear, Bortle 4',
  linkedDiscoveryId: 'nasa-apod:2026-11-26',
  linkedStudyId: 'chapter:worlds',
  createdAt: '2026-11-26T19:35:00.000Z',
  updatedAt: '2026-11-26T19:35:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  jest.mocked(useAppSelector).mockImplementation(selector =>
    selector({
      auth: { user: { id: 10, username: 'emilys' } },
      feed: {
        connection: 'online',
        metadata: { 'nasa-apod': { lastSyncedAt: '2026-11-26T12:00:00Z' } },
        legacySyncedAt: null,
      },
    } as never),
  );
  jest.mocked(getObservations).mockResolvedValue([sampleObservation]);
  jest.mocked(getObservationById).mockResolvedValue(sampleObservation);
  jest.mocked(createObservation).mockResolvedValue(sampleObservation);
  jest.mocked(updateObservation).mockResolvedValue({
    ...sampleObservation,
    title: 'Updated Saturn Observation',
  });
  jest.mocked(deleteObservation).mockResolvedValue(true);
});

describe('Fieldwork Hub Screen (FieldworkHubScreen)', () => {
  it('renders masthead, action button, and observation cards', async () => {
    await render(<FieldworkHubScreen />);

    expect(screen.getByText('Observational Fieldwork')).toBeTruthy();
    expect(screen.getByText(/INDEPENDENT ASTRONOMICAL RECORDS · F05/)).toBeTruthy();
    expect(screen.getByText('New observation')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Saturn Ring Edge Transit')).toBeTruthy();
      expect(screen.getByText('SATURN')).toBeTruthy();
      expect(screen.getByText(/Sharp Cassini division visible/)).toBeTruthy();
      expect(screen.getByText(/Conditions: Clear, Bortle 4/)).toBeTruthy();
    });
  });

  it('renders empty state when no observations exist', async () => {
    jest.mocked(getObservations).mockResolvedValue([]);

    await render(<FieldworkHubScreen />);

    await waitFor(() => {
      expect(screen.getByText('No field observations recorded')).toBeTruthy();
      expect(screen.getByText('Record first observation')).toBeTruthy();
    });
  });

  it('navigates to create screen on button press', async () => {
    await render(<FieldworkHubScreen />);

    const newBtn = screen.getByLabelText('Create a new astronomical observation record');
    fireEvent.press(newBtn);

    expect(mockPush).toHaveBeenCalledWith('/fieldwork/create');
  });

  it('navigates to detail screen when observation card is pressed', async () => {
    await render(<FieldworkHubScreen />);

    await waitFor(() => {
      expect(screen.getByText('Saturn Ring Edge Transit')).toBeTruthy();
    });

    const card = screen.getByLabelText(/Observation: Saturn Ring Edge Transit/);
    fireEvent.press(card);

    expect(mockPush).toHaveBeenCalledWith('/fieldwork/obs_sample_123');
  });
});

describe('Create Observation Screen (CreateObservationScreen)', () => {
  it('renders form inputs and pre-fills target params if provided', async () => {
    mockParams = { targetName: 'Jupiter', targetId: 'body:Jupiter' };

    await render(<CreateObservationScreen />);

    expect(screen.getByText('Record Observation')).toBeTruthy();
    expect(screen.getByDisplayValue('Jupiter')).toBeTruthy();
    expect(screen.getByText('Dictate notes')).toBeTruthy();
  });

  it('validates required title and notes before saving', async () => {
    await render(<CreateObservationScreen />);

    const saveBtn = screen.getByLabelText('Save observation to durable local storage');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    expect(screen.getByText('Observation title is required.')).toBeTruthy();
    expect(createObservation).not.toHaveBeenCalled();
  });

  it('creates observation and navigates back on valid submission', async () => {
    await render(<CreateObservationScreen />);

    const titleInput = screen.getByLabelText('Observation Title input');
    const notesInput = screen.getByLabelText('Fieldwork Notes input');
    const conditionsInput = screen.getByLabelText('Site and Sky Conditions input');

    await act(async () => {
      fireEvent.changeText(titleInput, 'Lunar Crater Copernicus');
      fireEvent.changeText(notesInput, 'Central peaks visible under oblique illumination.');
      fireEvent.changeText(conditionsInput, 'Bortle 3 dark sky');
    });

    const saveBtn = screen.getByLabelText('Save observation to durable local storage');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    expect(createObservation).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        title: 'Lunar Crater Copernicus',
        notes: 'Central peaks visible under oblique illumination.',
        conditions: 'Bortle 3 dark sky',
      }),
    );
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('Observation Detail & Edit Screen (ObservationDetailScreen)', () => {
  it('renders observation details, conditions, notes, and linked buttons in view mode', async () => {
    mockParams = { id: 'obs_sample_123' };

    await render(<ObservationDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Saturn Ring Edge Transit')).toBeTruthy();
      expect(screen.getByText('SATURN')).toBeTruthy();
      expect(screen.getByText('Sky Conditions: Clear, Bortle 4')).toBeTruthy();
      expect(screen.getByText('Sharp Cassini division visible at 200x magnification.')).toBeTruthy();
      expect(screen.getByText('Recorded timezone: Asia/Colombo')).toBeTruthy();
      expect(screen.getByText('View linked Discovery plate')).toBeTruthy();
      expect(screen.getByText('View linked Space Study guide')).toBeTruthy();
    });
  });

  it('switches to edit mode and saves changes', async () => {
    mockParams = { id: 'obs_sample_123' };

    await render(<ObservationDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Edit observation')).toBeTruthy();
    });

    // Enter edit mode
    const editBtn = screen.getByLabelText('Edit this observation record');
    await act(async () => {
      fireEvent.press(editBtn);
    });

    expect(screen.getByText('Edit Observation')).toBeTruthy();

    const titleInput = screen.getByLabelText('Observation Title input');
    await act(async () => {
      fireEvent.changeText(titleInput, 'Updated Saturn Observation');
    });

    const saveChangesBtn = screen.getByLabelText('Save updated observation');
    await act(async () => {
      fireEvent.press(saveChangesBtn);
    });

    expect(updateObservation).toHaveBeenCalledWith(
      10,
      'obs_sample_123',
      expect.objectContaining({
        title: 'Updated Saturn Observation',
      }),
    );
  });

  it('confirms and executes deletion with alert confirmation', async () => {
    mockParams = { id: 'obs_sample_123' };
    const alertSpy = jest.spyOn(Alert, 'alert');

    await render(<ObservationDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Delete observation')).toBeTruthy();
    });

    const deleteBtn = screen.getByLabelText('Delete this observation record');
    fireEvent.press(deleteBtn);

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete observation',
      expect.stringContaining('permanently delete'),
      expect.any(Array),
    );

    // Simulate clicking "Delete" button in the Alert dialog
    const deleteAction = alertSpy.mock.calls[0][2]?.find(btn => btn.text === 'Delete');
    expect(deleteAction).toBeDefined();

    await act(async () => {
      await deleteAction?.onPress?.();
    });

    expect(deleteObservation).toHaveBeenCalledWith(10, 'obs_sample_123');
    expect(mockBack).toHaveBeenCalled();
  });
});
