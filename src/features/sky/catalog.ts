import { Body } from 'astronomy-engine';
import brightStars from './catalog/bright-stars.json';
import messierObjects from './catalog/messier.json';
import { satelliteObjects, type SatelliteId } from './satelliteCatalog';

export type SkyObjectId = `hip:${number}` | `messier:${number}` | `body:${Body}` | `satellite:${SatelliteId}`;
export type SkyObjectKind = 'star' | 'deep-sky' | 'moon' | 'planet' | 'satellite';

export interface SkyObject {
  id: SkyObjectId;
  kind: SkyObjectKind;
  name: string;
  category: string;
  summary: string;
  source: string;
  sourceUrl: string;
  readMoreUrl: string;
}

type FixedObject = SkyObject & { ra: number; dec: number };
type MovingBody = SkyObject & { body: Body };

export const fixedObjects: readonly FixedObject[] = [
  ...brightStars.map((star): FixedObject => ({
    id: `hip:${star.hip}`,
    kind: 'star',
    name: star.name,
    category: 'Star',
    summary: `Apparent magnitude ${star.magnitude}.`
      + (star.lightYears === null ? '' : ` Estimated distance ${star.lightYears.toLocaleString()} light-years.`),
    source: 'HYG Database v4.1 · CC BY-SA 4.0',
    sourceUrl: 'https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md',
    readMoreUrl: `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=HIP%20${star.hip}`,
    ra: star.ra,
    dec: star.dec,
  })),
  ...messierObjects.map((object): FixedObject => ({
    id: `messier:${object.messier}`,
    kind: 'deep-sky',
    name: object.name,
    category: object.category,
    summary: object.summary,
    source: 'OpenNGC · Mattia Verga · CC BY-SA 4.0',
    sourceUrl: 'https://github.com/mattiaverga/OpenNGC',
    readMoreUrl: `https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-${object.messier}/`,
    ra: object.ra,
    dec: object.dec,
  })),
];

const planetNotes = [
  [Body.Mercury, 'The smallest planet and the closest to the Sun. From Earth it usually appears near the evening or morning horizon.'],
  [Body.Venus, 'A rocky planet wrapped in thick clouds. It can shine brightly near sunrise or sunset.'],
  [Body.Mars, 'A rocky world whose iron-rich dust gives it a reddish colour.'],
  [Body.Jupiter, 'The largest planet in the solar system, known for its cloud bands and four large Galilean moons.'],
  [Body.Saturn, 'A gas giant surrounded by rings made mostly of ice and rock.'],
  [Body.Uranus, 'An ice giant that rotates on its side. A telescope or binoculars can help you find it.'],
  [Body.Neptune, 'A distant ice giant and the outermost planet in the solar system. Observing it requires a telescope.'],
] as const;

function solarSystemObject(body: Body, summary: string): MovingBody {
  const isMoon = body === Body.Moon;
  const readMoreUrl = `https://science.nasa.gov/${body.toLowerCase()}/`;
  return {
    id: `body:${body}`,
    kind: isMoon ? 'moon' : 'planet',
    name: body,
    category: isMoon ? 'Natural satellite' : 'Planet',
    summary,
    source: 'NASA Science',
    sourceUrl: readMoreUrl,
    readMoreUrl,
    body,
  };
}

export const movingBodies: readonly MovingBody[] = [
  solarSystemObject(Body.Moon, 'Earth’s natural satellite. Its illuminated shape changes as it travels around Earth.'),
  ...planetNotes.map(([body, summary]) => solarSystemObject(body, summary)),
];

const catalog = new Map<SkyObjectId, SkyObject>(
  [...fixedObjects, ...movingBodies, ...satelliteObjects].map(object => [object.id, object]),
);

export function findSkyObject(id: SkyObjectId): SkyObject | undefined {
  return catalog.get(id);
}
