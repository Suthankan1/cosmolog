/**
 * COSMOLOG Cosmic Scale Laboratory — Authoritative Reference Dataset (F04)
 *
 * All physical dimensions adhere to standard planetary physical conventions
 * (volumetric mean diameter in kilometres) and mean heliocentric / geocentric
 * distances cited from NASA Planetary Fact Sheets (S05) and SI base standards (S01).
 *
 * Source citations:
 * - S01: BIPM SI base unit definition (metre)
 * - S05: NASA Planetary Fact Sheets / NASA Science Solar System
 */

import { type SourceReference } from './lighttrace';

export type BodyCategory = 'star' | 'planet' | 'moon';

export interface CosmicBody {
  id: string;
  name: string;
  category: BodyCategory;
  /** Volumetric mean diameter in kilometres */
  diameterKm: number;
  diameterConvention: string;
  /** Semi-major axis (mean heliocentric orbital distance) in kilometres */
  meanSunDistanceKm: number;
  /** Semi-major axis in Astronomical Units (AU) */
  meanSunDistanceAU: number;
  /**
   * Average geocentric distance from Earth in kilometres.
   * Explicitly separated from heliocentric semi-major axis.
   */
  meanEarthDistanceKm: number;
  /** Minimum distance to Earth (closest approach / opposition or perigee) */
  minEarthDistanceKm: number;
  /** Maximum distance to Earth (superior conjunction or apogee) */
  maxEarthDistanceKm: number;
  /** Associated Space Study chapter ID, if present */
  studyId?: string;
  /** Associated Expedition ID, if present */
  expeditionId?: string;
  /** Associated Sky Viewer target identifier */
  skyTargetId?: string;
  /** Explanatory physical context for scale comparison */
  context: string;
  /** Authoritative scientific citations */
  sources: SourceReference[];
}

export interface TravelSpeedPreset {
  id: string;
  name: string;
  speedKmPerHour: number;
  speedDescription: string;
  context: string;
}

export const COSMIC_SCALE_BODIES: CosmicBody[] = [
  {
    id: 'sun',
    name: 'The Sun',
    category: 'star',
    diameterKm: 1_392_700,
    diameterConvention: 'Mean volumetric diameter',
    meanSunDistanceKm: 0,
    meanSunDistanceAU: 0,
    meanEarthDistanceKm: 149_598_026,
    minEarthDistanceKm: 147_095_000, // Perihelion
    maxEarthDistanceKm: 152_100_000, // Aphelion
    studyId: 'chapter:sun-earth-moon',
    skyTargetId: 'body:Sun',
    context: 'The central star of our Solar System, containing 99.86% of the system’s total mass. Approximately 109 Earths fit across its diameter.',
    sources: [
      {
        id: 'S05',
        title: 'Sun Fact Sheet',
        publisher: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html',
      },
    ],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    category: 'planet',
    diameterKm: 4_879,
    diameterConvention: 'Mean volumetric diameter',
    meanSunDistanceKm: 57_909_000,
    meanSunDistanceAU: 0.387,
    meanEarthDistanceKm: 91_700_000,
    minEarthDistanceKm: 77_300_000,
    maxEarthDistanceKm: 221_900_000,
    studyId: 'chapter:worlds',
    skyTargetId: 'body:Mercury',
    context: 'The smallest terrestrial planet, only slightly larger than Earth’s Moon. It has no substantial atmosphere and severe temperature extremes.',
    sources: [
      {
        id: 'S05',
        title: 'Mercury Fact Sheet',
        publisher: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html',
      },
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    category: 'planet',
    diameterKm: 12_104,
    diameterConvention: 'Mean volumetric diameter',
    meanSunDistanceKm: 108_209_000,
    meanSunDistanceAU: 0.723,
    meanEarthDistanceKm: 41_400_000,
    minEarthDistanceKm: 38_200_000,
    maxEarthDistanceKm: 261_000_000,
    studyId: 'chapter:worlds',
    skyTargetId: 'body:Venus',
    context: 'Earth’s twin in size and bulk composition (95% of Earth diameter), wrapped in a runaway greenhouse carbon dioxide atmosphere with crushing surface pressure.',
    sources: [
      {
        id: 'S05',
        title: 'Venus Fact Sheet',
        publisher: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html',
      },
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    category: 'planet',
    diameterKm: 12_742,
    diameterConvention: 'Mean volumetric diameter',
    meanSunDistanceKm: 149_598_026,
    meanSunDistanceAU: 1.0,
    meanEarthDistanceKm: 0,
    minEarthDistanceKm: 0,
    maxEarthDistanceKm: 0,
    studyId: 'chapter:sun-earth-moon',
    context: 'Our home world and the standard reference body for terrestrial planetary diameter (1.00 Earth diameter) and distance ratios.',
    sources: [
      {
        id: 'S05',
        title: 'Earth Fact Sheet',
        publisher: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html',
      },
    ],
  },
  {
    id: 'moon',
    name: 'The Moon',
    category: 'moon',
    diameterKm: 3_475,
    diameterConvention: 'Mean volumetric diameter',
    meanSunDistanceKm: 149_598_026,
    meanSunDistanceAU: 1.0,
    meanEarthDistanceKm: 384_400,
    minEarthDistanceKm: 363_300, // Perigee
    maxEarthDistanceKm: 405_500, // Apogee
    studyId: 'chapter:sun-earth-moon',
    expeditionId: 'apollo',
    skyTargetId: 'body:Moon',
    context: 'Earth’s sole natural satellite, approximately 27.3% of Earth’s diameter. The average Earth-Moon gap could accommodate all other solar system planets placed edge to edge.',
    sources: [
      {
        id: 'S05',
        title: 'Moon Fact Sheet',
        publisher: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
      },
      {
        id: 'S03',
        title: 'Basics of Space Flight: Solar System',
        publisher: 'NASA Jet Propulsion Laboratory',
        url: 'https://science.nasa.gov/learn/basics-of-space-flight/chapter1-2/',
      },
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    category: 'planet',
    diameterKm: 6_779,
    diameterConvention: 'Mean volumetric diameter',
    meanSunDistanceKm: 227_943_824,
    meanSunDistanceAU: 1.524,
    meanEarthDistanceKm: 225_000_000,
    minEarthDistanceKm: 54_600_000,
    maxEarthDistanceKm: 401_000_000,
    studyId: 'chapter:worlds',
    skyTargetId: 'body:Mars',
    context: 'The Red Planet, roughly half the diameter of Earth (53%). Its elliptical orbit causes the distance from Earth to fluctuate dramatically between 54.6 and 401 million km.',
    sources: [
      {
        id: 'S05',
        title: 'Mars Fact Sheet',
        publisher: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
      },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    category: 'planet',
    diameterKm: 139_820,
    diameterConvention: 'Mean volumetric diameter',
    meanSunDistanceKm: 778_340_821,
    meanSunDistanceAU: 5.204,
    meanEarthDistanceKm: 628_700_000,
    minEarthDistanceKm: 588_000_000,
    maxEarthDistanceKm: 968_000_000,
    studyId: 'chapter:worlds',
    skyTargetId: 'body:Jupiter',
    context: 'The Solar System’s king planet, spanning 11 Earth diameters. More massive than all other solar system planets combined.',
    sources: [
      {
        id: 'S05',
        title: 'Jupiter Fact Sheet',
        publisher: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html',
      },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    category: 'planet',
    diameterKm: 116_460,
    diameterConvention: 'Mean volumetric diameter',
    meanSunDistanceKm: 1_433_529_000,
    meanSunDistanceAU: 9.582,
    meanEarthDistanceKm: 1_275_000_000,
    minEarthDistanceKm: 1_195_000_000,
    maxEarthDistanceKm: 1_660_000_000,
    studyId: 'chapter:worlds',
    expeditionId: 'saturn',
    skyTargetId: 'body:Saturn',
    context: 'The ringed giant, spanning over 9 Earth diameters. Its iconic ring system spans up to 282,000 km across while averaging only tens of metres in thickness.',
    sources: [
      {
        id: 'S05',
        title: 'Saturn Fact Sheet',
        publisher: 'NASA Goddard Space Flight Center',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturnfact.html',
      },
    ],
  },
];

export const TRAVEL_SPEED_PRESETS: TravelSpeedPreset[] = [
  {
    id: 'commercial-jet',
    name: 'Commercial Jet',
    speedKmPerHour: 900,
    speedDescription: '900 km/h (250 m/s)',
    context: 'Typical passenger airliner cruising speed. Helpful for relating cosmic gaps to human global travel.',
  },
  {
    id: 'voyager-1',
    name: 'Voyager 1 Outbound',
    speedKmPerHour: 61_200,
    speedDescription: '61,200 km/h (17.0 km/s)',
    context: 'Historic deep-space probe speed currently escaping the heliosphere into interstellar space.',
  },
  {
    id: 'parker-solar-probe',
    name: 'Parker Solar Probe (Peak)',
    speedKmPerHour: 692_000,
    speedDescription: '692,000 km/h (192.2 km/s)',
    context: 'Fastest human-made craft record at perihelion, accelerated by the Sun’s intense gravity well.',
  },
  {
    id: 'sub-relativistic',
    name: 'Hypothetical 0.1c',
    speedKmPerHour: 107_925_285,
    speedDescription: '107,925,285 km/h (0.10 c)',
    context: 'Theoretical laser-sail nanocraft speed proposed by Breakthrough Starshot for interstellar exploration.',
  },
];

export function getCosmicBodyById(id: string): CosmicBody | undefined {
  return COSMIC_SCALE_BODIES.find(b => b.id === id);
}
