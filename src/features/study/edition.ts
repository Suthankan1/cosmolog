import { fixedObjects, movingBodies } from '../sky/catalog';
import { satelliteObjects } from '../sky/satelliteCatalog';

export interface StudyEntry {
  id: string;
  title: string;
  category: string;
  body: string;
  source: string;
  url: string;
  aliases: string[];
  related: string[];
  chapter?: number;
  sky?: boolean;
}

export const edition = 'Field Guide · first edition';
const nasa = 'https://science.nasa.gov/';
type Lesson = [id: string, title: string, sourcePath: string, sections: string[], related: string[]];
const lessons: Lesson[] = [
  [
    'observing',
    'Reading the sky',
    'skywatching/',
    [
      'Find your horizon\nStand where you can see the skyline. Imagine a line from your feet to the point directly above you. That point is the zenith. Altitude measures the angle up from the horizon, from zero at the horizon to ninety degrees at the zenith.',
      'Read a bearing\nAzimuth runs clockwise from true north. East is 90 degrees and south is 180 degrees. Two people in different cities can get different bearings for the same star at the same instant. Earth’s rotation also changes the direction during the night.',
      'Try it · Compare two cities\nChoose a star in My sky. Record its altitude, change the observing city, and compare. A target above the geometric horizon can still be hidden by a building, daylight or cloud.',
    ],
    ['messier:31', 'body:Moon'],
  ],
  [
    'sun-earth-moon',
    'The Sun, Earth and Moon',
    'solar-system/',
    [
      'A day and a year\nEarth spins about its axis while following an orbit around the Sun. Daily rising and setting follow from the spin. Earth’s tilted axis changes the angle and duration of sunlight during the year, producing the seasons.',
      'Phases and tides\nExcept during a lunar eclipse, sunlight illuminates half of the Moon. As the Moon orbits Earth we see changing fractions of that lit hemisphere. Differences in lunar gravity across Earth help raise the tides. The Sun contributes too.',
      'Try it · Sketch a phase\nDraw the Sun, Earth and Moon as viewed from above. Shade the lunar hemisphere facing away from the Sun. From Earth’s position, identify the illuminated part you would see.',
    ],
    ['body:Earth', 'body:Sun', 'body:Moon'],
  ],
  [
    'worlds',
    'Planets, moons and rings',
    'solar-system/planets/',
    [
      'Families of worlds\nMercury, Venus, Earth and Mars have rocky surfaces. Jupiter and Saturn are gas giants. Uranus and Neptune are ice giants. A dwarf planet such as Pluto orbits the Sun and is rounded by gravity, but shares its orbital neighbourhood with other comparable bodies.',
      'Saturn and its rings\nSaturn’s rings contain countless orbiting particles, many made of water ice. Inner particles complete an orbit faster than outer particles. Moons can shape ring edges and open gaps through their gravity.',
      'Two ocean worlds\nTitan has a thick atmosphere and surface lakes of liquid hydrocarbons. Europa has an icy shell with evidence for a liquid-water ocean beneath it. Similar-looking cold worlds can hold liquids in different places and of different compositions.',
    ],
    ['body:Saturn', 'moon:titan', 'moon:europa', 'dwarf:pluto'],
  ],
  [
    'small-bodies',
    'Small bodies and visitors',
    'asteroids-comets-meteors/',
    [
      'Asteroids and comets\nSmall bodies preserve material from the early Solar System. Many asteroids orbit between Mars and Jupiter. A comet approaching the Sun can release gas and dust as its ices warm. Solar radiation and the solar wind shape its tails.',
      'Three names for a journey\nA small fragment in space is a meteoroid. Its luminous passage through an atmosphere produces a meteor. Material that survives to reach the surface is a meteorite. A meteor shower occurs when Earth passes through a stream of debris.',
      'Compare two paths\nCeres stays in the main asteroid belt. Halley’s Comet travels far beyond the inner planets between visits. An orbital period describes a whole trip around the Sun.',
    ],
    ['dwarf:ceres', 'comet:halley'],
  ],
  [
    'stars',
    'Stars and constellations',
    'universe/stars/',
    [
      'Reading starlight\nStars emit energy from their hot surfaces. A blue star generally has a hotter surface than a red star. Apparent brightness depends on luminosity, distance and dust between the star and observer.',
      'A stellar lifetime\nFor most of its luminous life a star fuses hydrogen into helium in its core. Its initial mass strongly influences what follows. Low-mass stars can leave white dwarfs. Massive stars can leave neutron stars or black holes.',
      'Patterns and pairs\nA constellation marks a defined region of sky. Its apparent pattern may contain stars at very different distances. A binary system consists of two stars orbiting a common centre of mass.',
    ],
    ['hip:32349'],
  ],
  [
    'deep-sky',
    'Beyond the Solar System',
    'universe/',
    [
      'Clouds, clusters and galaxies\nA nebula is a cloud of gas or dust. Some nebulae form stars, while others contain material expelled by dying stars. A star cluster holds a population of stars together. A galaxy contains stars, gas, dust and dark matter on a much larger scale.',
      'Finding unseen objects\nA planet passing in front of its star can cause a repeating dip in brightness. A black hole can reveal itself through the orbits of nearby stars or light from hot material around it. These observations connect a measured signal to an otherwise difficult target.',
      'Looking back in time\nLight travels at a finite speed. A light-year measures the distance light travels in one year. Viewing a distant galaxy shows it at an earlier stage in its history.',
    ],
    ['messier:31', 'messier:42', 'exo:51-peg-b', 'black-hole:sgr-a'],
  ],
  [
    'spaceflight',
    'Rockets, spacecraft and stations',
    'missions/',
    [
      'Reaching orbit\nA launch vehicle lifts a payload through the atmosphere and builds sideways speed. In orbit a spacecraft continually falls toward Earth while moving far enough sideways to miss the surface. Dropping spent stages reduces the mass the remaining engines must accelerate.',
      'Different jobs in space\nA probe travels to study a target. A lander operates on a surface, and a rover can move between sites. A crewed station provides a working environment and relies on supplies, thermal control and life support.',
      'Follow a mission\nDistinguish a vehicle family, an individual launch and its payload. Saturn V names a launch vehicle design. Voyager 1 names an individual spacecraft. ISS names a station assembled from many launches.',
    ],
    ['rocket:saturn-v', 'rocket:falcon-9', 'probe:voyager-1', 'station:tiangong', 'satellite:25544'],
  ],
  [
    'satellites',
    'Satellites, Starlink and orbital debris',
    'earth/',
    [
      'What satellites do\nEarth-observing spacecraft measure land, oceans and weather. Navigation spacecraft broadcast timing signals. Communications satellites relay information between distant locations. Orbit choice determines coverage and how often a spacecraft returns over a region.',
      'A constellation of spacecraft\nStarlink uses many individual communications satellites. Search its family name to study the system. Each cataloged spacecraft has a separate identifier and orbit. An orbit estimate belongs to that particular object.',
      'Reading a prediction\nAn orbital epoch is the reference time of an orbit estimate. Atmospheric drag and manoeuvres can change a satellite’s path afterward. A pass above your horizon may be invisible when the spacecraft is in Earth’s shadow or your sky is too bright. Spent rocket bodies and fragments also orbit Earth.',
    ],
    ['group:starlink', 'satellite:25544', 'satellite:20580', 'satellite:44714', 'satellite:44718'],
  ],
];

type Profile = [string, string, string, string, string];
const profiles: Profile[] = [
  [
    'body:Earth',
    'Earth',
    'Planet',
    'Our home planet has liquid surface oceans, a nitrogen-rich atmosphere and one natural moon.',
    nasa + 'earth/',
  ],
  [
    'body:Sun',
    'Sun',
    'Star',
    'The Sun is the star at the centre of our planetary system. Fusion in its core supplies the energy it radiates.',
    nasa + 'sun/',
  ],
  [
    'dwarf:pluto',
    'Pluto',
    'Dwarf planet',
    'Pluto orbits beyond Neptune in the Kuiper Belt. Charon is its largest moon.',
    nasa + 'dwarf-planets/pluto/',
  ],
  [
    'moon:titan',
    'Titan',
    'Natural moon',
    'Saturn’s largest moon has a nitrogen-rich atmosphere. Methane cycles between its clouds, rain and surface lakes.',
    nasa + 'saturn/moons/titan/',
  ],
  [
    'moon:europa',
    'Europa',
    'Natural moon',
    'Europa orbits Jupiter. Its young icy surface and magnetic observations provide evidence for a subsurface ocean.',
    nasa + 'jupiter/moons/europa/',
  ],
  [
    'dwarf:ceres',
    'Ceres',
    'Dwarf planet',
    'Ceres is the largest body in the main asteroid belt. NASA’s Dawn spacecraft studied its surface from orbit.',
    nasa + 'dwarf-planets/ceres/',
  ],
  [
    'comet:halley',
    'Halley’s Comet',
    'Comet',
    'This periodic comet returns to the inner Solar System roughly every 76 years. Material from its orbit produces meteor showers on Earth.',
    nasa + 'solar-system/comets/1p-halley/',
  ],
  [
    'exo:51-peg-b',
    '51 Pegasi b',
    'Exoplanet',
    'This gas giant circles a Sun-like star in about four days. Astronomers detected it through changes in the star’s radial velocity.',
    nasa + 'exoplanet-catalog/51-pegasi-b/',
  ],
  [
    'black-hole:sgr-a',
    'Sagittarius A*',
    'Black hole',
    'Stellar orbits reveal a compact mass at the centre of the Milky Way. Radio observations resolve emission around its shadow.',
    nasa + 'universe/black-holes/',
  ],
  [
    'rocket:saturn-v',
    'Saturn V',
    'Launch vehicle',
    'This three-stage vehicle carried Apollo crews toward the Moon. A modified version launched Skylab.',
    'https://www.nasa.gov/history/apollo-program/',
  ],
  [
    'rocket:falcon-9',
    'Falcon 9',
    'Launch vehicle',
    'A two-stage launch vehicle built by SpaceX. Its first stage can return for landing and reuse.',
    'https://www.spacex.com/vehicles/falcon-9/',
  ],
  [
    'probe:voyager-1',
    'Voyager 1',
    'Space probe',
    'After encountering Jupiter and Saturn, Voyager 1 crossed the heliopause into interstellar space.',
    nasa + 'mission/voyager/',
  ],
  [
    'station:tiangong',
    'Tiangong',
    'Space station',
    'China’s modular crewed station includes the Tianhe core and two laboratory modules in low Earth orbit.',
    'https://en.cmse.gov.cn/',
  ],
  [
    'group:starlink',
    'Starlink',
    'Satellite constellation',
    'Starlink is a communications network using many spacecraft in low Earth orbit. Individual satellites move across the local sky as Earth turns beneath them.',
    'https://www.starlink.com/technology',
  ],
];

const chapters: StudyEntry[] = lessons.map(([id, title, path, sections, related], i) => ({
  id: 'chapter:' + id,
  title,
  category: 'Field Guide',
  body: sections.join('\n\n'),
  related,
  source: 'NASA Science',
  url: nasa + path,
  chapter: i + 1,
  aliases: [],
}));

const aliases: Record<string, string[]> = {
  'messier:31': ['Andromeda Galaxy', 'M31'],
  'satellite:25544': ['International Space Station'],
  'comet:halley': ['1P/Halley'],
  'black-hole:sgr-a': ['Sgr A*'],
};
const skyEntries = [...fixedObjects, ...movingBodies, ...satelliteObjects].map((o) => ({
  id: o.id,
  title: o.name,
  category: o.category,
  body: o.summary,
  url: o.sourceUrl,
  source: o.source,
  sky: true,
  aliases: [o.id.split(':')[1], ...(o.id.startsWith('messier:') ? ['M' + o.id.split(':')[1]] : [])],
  related: [] as string[],
}));
const objects: StudyEntry[] = [
  ...skyEntries,
  ...profiles.map(([id, title, category, body, url]) => ({
    id,
    title,
    category,
    body,
    url,
    source: new URL(url).hostname,
    aliases: [],
    related: [],
  })),
].map((o) => {
  const linked = chapters.filter((ch) => ch.related.includes(o.id));
  const family = o.id.startsWith('hip:') ? 4 : o.id.startsWith('messier:') ? 5 : 2;
  return {
    ...o,
    aliases: [...new Set([...o.aliases, ...(aliases[o.id] ?? [])])],
    related: (linked.length ? linked : [chapters[family]]).map((ch) => ch.id),
  };
});
const starlink = objects.find((o) => o.id === 'group:starlink')!;
starlink.related.push('satellite:44714', 'satellite:44718');
export const studyEntries = [...chapters, ...objects];

// Published section IDs stay stable if an edition changes a heading or its order.
const sectionAnchors: Record<string, string[]> = {
  observing: ['horizon', 'bearing', 'compare'],
  'sun-earth-moon': ['rotation', 'phases', 'sketch'],
  worlds: ['families', 'rings', 'ocean-worlds'],
  'small-bodies': ['asteroids', 'meteors', 'orbits'],
  stars: ['starlight', 'lifetime', 'pairs'],
  'deep-sky': ['galaxies', 'detection', 'light-time'],
  spaceflight: ['orbit', 'jobs', 'mission'],
  satellites: ['purposes', 'constellation', 'prediction'],
};
export function sectionAnchor(id: string, index: number) {
  const chapterSlug = id.startsWith('chapter:') ? id.slice(8) : id;
  return sectionAnchors[chapterSlug]?.[index] ?? null;
}
export function sectionNumber(id: string, anchor: string | null, fallback = 0) {
  const chapterSlug = id.startsWith('chapter:') ? id.slice(8) : id;
  const anchors = sectionAnchors[chapterSlug];
  if (anchor && anchors) {
    const index = anchors.indexOf(anchor);
    if (index >= 0) return index;
    // Also resolve by section heading text if passed
    const lesson = lessons.find(([lid]) => lid === chapterSlug);
    if (lesson) {
      const headingIndex = lesson[3].findIndex(section => {
        const [heading] = section.split('\n');
        return heading.toLowerCase().trim() === anchor.toLowerCase().trim();
      });
      if (headingIndex >= 0) return headingIndex;
    }
  }
  return fallback;
}

export function isValidStudyTarget(targetId: string, anchor?: string | null): boolean {
  if (!targetId) return false;
  const chapterSlug = targetId.startsWith('chapter:') ? targetId.slice(8) : targetId;
  const lesson = lessons.find(([lid]) => lid === chapterSlug);
  if (!lesson) {
    return objects.some(o => o.id === targetId);
  }
  if (anchor != null && anchor !== '') {
    return sectionNumber(chapterSlug, anchor, -1) >= 0;
  }
  return true;
}

export const glossary: Record<string, [string, string][]> = {
  'chapter:observing': [
    ['Zenith', 'The point in the sky directly above the observer.'],
    ['Azimuth', 'Direction measured clockwise along the horizon from true north.'],
  ],
  'chapter:sun-earth-moon': [
    ['Phase', 'The apparent shape of the illuminated part of a body.'],
    ['Axis', 'An imaginary line about which a body rotates.'],
  ],
  'chapter:worlds': [
    ['Orbit', 'The curved path of a body moving under gravity.'],
    ['Moon', 'A natural satellite orbiting another body.'],
  ],
  'chapter:small-bodies': [
    ['Sublimation', 'The transition of a solid directly into a gas.'],
    ['Period', 'The time required to complete one orbit.'],
  ],
  'chapter:stars': [
    ['Luminosity', 'The total power radiated by an object.'],
    ['Fusion', 'A reaction that joins light atomic nuclei and can release energy.'],
  ],
  'chapter:deep-sky': [
    ['Light-year', 'The distance light travels in one year.'],
    ['Transit', 'The passage of one object across the apparent face of another.'],
  ],
  'chapter:spaceflight': [
    ['Payload', 'The spacecraft, instrument or cargo a vehicle carries.'],
    ['Stage', 'A propulsion section of a rocket used during part of a flight.'],
  ],
  'chapter:satellites': [
    ['Epoch', 'The reference instant for a set of orbital elements.'],
    ['Drag', 'A force from surrounding gas that opposes relative motion.'],
  ],
};
