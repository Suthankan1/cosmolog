import type { SkyObject } from './catalog';

export const satelliteIds = [25544, 20580, 44714, 44718] as const;
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
  ...([{ noradId:44714, name:'STARLINK-1008' },{ noradId:44718, name:'STARLINK-1012' }] as const).map(({noradId,name})=>({
    noradId, name, id: `satellite:${noradId}` as const, kind:'satellite' as const, category:'Starlink spacecraft',
    summary: name+' is an individually cataloged member of the Starlink communications constellation. Use its NORAD number to distinguish it from other spacecraft.',
    source: 'CelesTrak · NORAD '+noradId, sourceUrl:'https://celestrak.org/satcat/table-satcat.php?CATNR='+noradId,
    readMoreUrl:'https://www.starlink.com/technology',
  })),
];
