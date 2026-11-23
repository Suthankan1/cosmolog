import type { SkyObject } from './catalog';

export const satelliteIds = [25544, 20580] as const;
export type SatelliteId = typeof satelliteIds[number];

export const satelliteObjects: readonly (SkyObject & { noradId: SatelliteId })[] = [
  {
    noradId: 25544,
    id: 'satellite:25544',
    kind: 'satellite',
    name: 'ISS',
    category: 'Artificial satellite',
    summary: 'The International Space Station is a crewed laboratory in low Earth orbit.',
    source: 'CelesTrak · NORAD 25544',
    sourceUrl: 'https://celestrak.org/satcat/table-satcat.php?CATNR=25544',
    readMoreUrl: 'https://www.nasa.gov/spot-the-station/',
  },
  {
    noradId: 20580,
    id: 'satellite:20580',
    kind: 'satellite',
    name: 'Hubble',
    category: 'Artificial satellite',
    summary: 'The Hubble Space Telescope observes the universe from above Earth’s atmosphere.',
    source: 'CelesTrak · NORAD 20580',
    sourceUrl: 'https://celestrak.org/satcat/table-satcat.php?CATNR=20580',
    readMoreUrl: 'https://science.nasa.gov/mission/hubble/observatory/',
  },
];
