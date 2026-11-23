import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { SkyDetailSheet } from '../src/features/sky/SkyDetailSheet';

const position = { id: 'messier:31', altitude: 32, azimuth: 89 } as const;

it('opens the selected catalog object offline and keeps its details readable', async () => {
  const close = jest.fn();
  await render(<SkyDetailSheet id={position.id} position={position} offline onClose={close} />);
  expect(screen.getByRole('header', { name: 'Andromeda Galaxy' })).toBeTruthy();
  expect(screen.getByText('Bearing 89° · Elevation 32°')).toBeTruthy();
  expect(screen.getByText('OpenNGC · Mattia Verga · CC BY-SA 4.0')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Read more', disabled: true })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(close).toHaveBeenCalledTimes(1);
});

it('opens the original educational link for the selected object when connected', async () => {
  const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  try {
    await render(<SkyDetailSheet id={position.id} position={position} offline={false} onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Read more' }));
    await waitFor(() => expect(openUrl).toHaveBeenCalledWith(
      'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/',
    ));
  } finally {
    openUrl.mockRestore();
  }
});
