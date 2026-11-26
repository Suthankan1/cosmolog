export type DistanceUnit = 'km' | 'AU' | 'ly' | 'pc';

export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
}

export interface LightTarget {
  id: string;
  name: string;
  category: 'Moon' | 'Sun' | 'Star' | 'Galaxy';
  tagline: string;
  description: string;
  distanceValue: number;
  distanceUnit: DistanceUnit;
  distanceDefinition: string;
  precision: 'exact' | 'mean' | 'approximate';
  referenceFrame: string;
  humanContext: string;
  sources: SourceReference[];
  studyId?: string;
  skyTargetId?: string;
}

export const LIGHT_TARGETS: readonly LightTarget[] = [
  {
    id: 'body:Moon',
    name: 'The Moon',
    category: 'Moon',
    tagline: 'Earth’s natural companion',
    description: 'The closest major natural celestial body to Earth, orbiting in an elliptical path.',
    distanceValue: 384400,
    distanceUnit: 'km',
    distanceDefinition: 'Mean Earth-Moon center-to-center distance (semi-major axis).',
    precision: 'mean',
    referenceFrame: 'Geocentric mean lunar orbit',
    humanContext: 'Slightly longer than a single human resting heartbeat.',
    sources: [
      {
        id: 'S03',
        title: 'Basics of Space Flight — Solar System',
        publisher: 'NASA Jet Propulsion Laboratory',
        url: 'https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/',
      },
    ],
    studyId: 'chapter:sun-earth-moon',
    skyTargetId: 'body:Moon',
  },
  {
    id: 'body:Sun',
    name: 'The Sun',
    category: 'Sun',
    tagline: 'Our planetary system’s central star',
    description: 'The G-type main-sequence star at the gravitational center of our Solar System.',
    distanceValue: 1,
    distanceUnit: 'AU',
    distanceDefinition: '1 Astronomical Unit (IAU exact definition: 149,597,870,700 meters).',
    precision: 'exact',
    referenceFrame: 'Heliocentric mean orbital radius',
    humanContext: 'Light reaching your eyes now began its journey while you were preparing tea.',
    sources: [
      {
        id: 'S02',
        title: 'Cosmic Distances and Light-Time',
        publisher: 'NASA Science',
        url: 'https://science.nasa.gov/solar-system/cosmic-distances/',
      },
      {
        id: 'S04',
        title: 'Our Sun: Facts & Exploration',
        publisher: 'NASA Science',
        url: 'https://science.nasa.gov/sun/facts/',
      },
    ],
    studyId: 'chapter:sun-earth-moon',
    skyTargetId: 'body:Sun',
  },
  {
    id: 'star:proxima-centauri',
    name: 'Proxima Centauri',
    category: 'Star',
    tagline: 'Nearest star beyond our Solar System',
    description: 'A red dwarf star in the Alpha Centauri triple star system in Centaurus.',
    distanceValue: 4.2465,
    distanceUnit: 'ly',
    distanceDefinition: 'Direct trigonometric parallax measurement (Gaia DR3 / Hipparcos catalog).',
    precision: 'approximate',
    referenceFrame: 'Barycentric Solar System frame',
    humanContext: 'Starlight arriving tonight began its journey more than four years ago.',
    sources: [
      {
        id: 'S04',
        title: 'Nearest Star Systems and Distances',
        publisher: 'NASA Science',
        url: 'https://science.nasa.gov/sun/facts/',
      },
      {
        id: 'S13',
        title: 'HYG Stellar Database Catalog',
        publisher: 'Astronexus / HYG Database',
        url: 'https://github.com/astronexus/HYG-Database',
      },
    ],
    studyId: 'chapter:stars',
    skyTargetId: 'star:proxima-centauri',
  },
  {
    id: 'messier:31',
    name: 'Andromeda Galaxy (M31)',
    category: 'Galaxy',
    tagline: 'Our closest major spiral galactic neighbor',
    description: 'A barred spiral galaxy approximately 2.5 million light-years away, visible to the unaided eye in dark skies.',
    distanceValue: 2500000,
    distanceUnit: 'ly',
    distanceDefinition: 'Standard-candle Cepheid and TRGB distance estimates across the Local Group.',
    precision: 'approximate',
    referenceFrame: 'Local Group intergalactic distance (approximate nearby-galaxy regime)',
    humanContext: 'Light from Andromeda left its stars before Homo sapiens walked the Earth.',
    sources: [
      {
        id: 'S06',
        title: 'Hubble Messier Catalog: Messier 31',
        publisher: 'NASA / Space Telescope Science Institute',
        url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/',
      },
    ],
    studyId: 'chapter:deep-sky',
    skyTargetId: 'messier:31',
  },
];

export function getLightTargetById(id: string): LightTarget | undefined {
  return LIGHT_TARGETS.find(target => target.id === id);
}

export function getAllLightTargets(): readonly LightTarget[] {
  return LIGHT_TARGETS;
}
