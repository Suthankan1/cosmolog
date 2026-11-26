import { z } from 'zod';

const slugRegex = /^[a-z0-9-]{1,60}$/;

export const expeditionStepKindSchema = z.enum(['discovery', 'study', 'prompt']);
export type ExpeditionStepKind = z.infer<typeof expeditionStepKindSchema>;

export const sourceRefSchema = z.object({
  title: z.string().min(1).max(150),
  publisher: z.string().min(1).max(100),
  url: z.string().url().refine(u => /^https:\/\//.test(u), { message: 'URL must use HTTPS protocol' }),
});
export type SourceRef = z.infer<typeof sourceRefSchema>;

export const expeditionStepSchema = z.object({
  id: z.string().regex(slugRegex, 'Step id must be a lowercase alphanumeric slug'),
  kind: expeditionStepKindSchema,
  order: z.number().int().positive(),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  targetId: z.string().min(1).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  sectionAnchor: z.string().min(1).max(100).optional(),
  promptInstruction: z.string().min(1).max(1000).optional(),
  required: z.boolean(),
});
export type ExpeditionStep = z.infer<typeof expeditionStepSchema>;

export const expeditionManifestSchema = z.object({
  id: z.string().regex(slugRegex, 'Expedition id must be a lowercase alphanumeric slug'),
  revision: z.number().int().positive(),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  estimatedBytes: z.number().int().nonnegative(),
  sources: z.array(sourceRefSchema).min(1).max(10),
  steps: z.array(expeditionStepSchema).min(1).max(50),
}).refine(
  manifest => new Set(manifest.steps.map(s => s.id)).size === manifest.steps.length,
  { message: 'Step IDs must be unique within an expedition', path: ['steps'] },
).refine(
  manifest => new Set(manifest.steps.map(s => s.order)).size === manifest.steps.length,
  { message: 'Step order numbers must be unique within an expedition', path: ['steps'] },
);
export type ExpeditionManifest = z.infer<typeof expeditionManifestSchema>;

export const expeditions: readonly ExpeditionManifest[] = [
  {
    id: 'saturn',
    revision: 1,
    title: 'A Tour of Saturn',
    description: 'A guided science expedition through the Saturnian system: Cassini orbital ring plates, planetary science study on ring dynamics, and hands-on observational fieldwork.',
    estimatedBytes: 3_500_000,
    sources: [
      {
        title: 'NASA Astronomy Picture of the Day Archive',
        publisher: 'NASA / APOD',
        url: 'https://science.nasa.gov/astronomy/',
      },
      {
        title: 'Cassini-Huygens Mission at Saturn',
        publisher: 'NASA / JPL-Caltech',
        url: 'https://science.nasa.gov/mission/cassini/',
      },
      {
        title: 'Planets, Moons and Rings (Field Guide)',
        publisher: 'COSMOLOG Space Study',
        url: 'https://science.nasa.gov/solar-system/planets/',
      },
    ],
    steps: [
      {
        id: 'step-saturn-shadow',
        kind: 'discovery',
        order: 1,
        title: 'In the Shadow of Saturn',
        summary: 'Cassini looks back at Saturn and its ring system in eclipse from interplanetary shadow.',
        targetId: 'nasa-apod:2013-11-13',
        date: '2013-11-13',
        required: true,
      },
      {
        id: 'step-saturn-density-waves',
        kind: 'discovery',
        order: 2,
        title: 'Density Waves in Saturn’s Rings',
        summary: 'High-resolution Cassini imaging reveals spiral density waves driven by orbital moon resonances.',
        targetId: 'nasa-apod:2017-08-08',
        date: '2017-08-08',
        required: true,
      },
      {
        id: 'step-saturn-study-rings',
        kind: 'study',
        order: 3,
        title: 'Study: Saturn and Its Rings',
        summary: 'Examine ring particle composition, orbital mechanics, and shepherd moons from the Worlds study chapter.',
        targetId: 'worlds',
        sectionAnchor: 'Saturn and its rings',
        required: true,
      },
      {
        id: 'step-saturn-last-portrait',
        kind: 'discovery',
        order: 4,
        title: 'Cassini’s Last Ring Portrait at Saturn',
        summary: 'The final wide-angle mosaic of Saturn’s ring system before the Grand Finale plunge.',
        targetId: 'nasa-apod:2017-09-26',
        date: '2017-09-26',
        required: true,
      },
      {
        id: 'step-saturn-field-observation',
        kind: 'prompt',
        order: 5,
        title: 'Field Observation: Saturn & Ring Tilt',
        summary: 'Record your telescope or binocular sighting of Saturn, noting apparent ring inclination, Cassini division visibility, and observing conditions.',
        promptInstruction: 'Locate Saturn in the evening sky using the Sky Viewer. Observe and note the apparent ring tilt angle and any visible moons such as Titan.',
        required: false,
      },
    ],
  },
  {
    id: 'apollo',
    revision: 1,
    title: 'Apollo at the Moon',
    description: 'Follow the historic Apollo lunar expeditions: orbital views, lunar surface panoramas, and Earth-Moon orbital science.',
    estimatedBytes: 3_200_000,
    sources: [
      {
        title: 'NASA Apollo Lunar Missions Archive',
        publisher: 'NASA History Division',
        url: 'https://science.nasa.gov/moon/',
      },
      {
        title: 'The Sun, Earth and Moon (Field Guide)',
        publisher: 'COSMOLOG Space Study',
        url: 'https://science.nasa.gov/solar-system/',
      },
    ],
    steps: [
      {
        id: 'step-apollo-earthrise',
        kind: 'discovery',
        order: 1,
        title: 'Earthrise',
        summary: 'Apollo 8 crew captures Earth rising above the lunar limb during lunar orbit.',
        targetId: 'nasa-apod:2015-09-06',
        date: '2015-09-06',
        required: true,
      },
      {
        id: 'step-apollo-panorama',
        kind: 'discovery',
        order: 2,
        title: 'Apollo 11 Landing Panorama',
        summary: 'Tranquility Base surface panorama showing the lunar module and seismic equipment.',
        targetId: 'nasa-apod:2024-07-20',
        date: '2024-07-20',
        required: true,
      },
      {
        id: 'step-apollo-study-moon',
        kind: 'study',
        order: 3,
        title: 'Study: The Sun, Earth and Moon',
        summary: 'Understand lunar phases, orbital geometry, and tidal interactions with Earth.',
        targetId: 'sun-earth-moon',
        sectionAnchor: 'Phases and tides',
        required: true,
      },
      {
        id: 'step-apollo-return',
        kind: 'discovery',
        order: 4,
        title: 'From the Moon to the Earth',
        summary: 'View of Earth from lunar orbit during the trans-Earth injection maneuver.',
        targetId: 'nasa-apod:2009-07-19',
        date: '2009-07-19',
        required: true,
      },
      {
        id: 'step-apollo-observation',
        kind: 'prompt',
        order: 5,
        title: 'Field Observation: Lunar Terminator',
        summary: 'Inspect the lunar terminator with binoculars or small telescope where crater relief and shadows are sharpest.',
        promptInstruction: 'Inspect the lunar terminator. Identify the current phase and record crater shadow definition and surface contrast.',
        required: false,
      },
    ],
  },
];

export function getExpeditionById(id: string): ExpeditionManifest | undefined {
  return expeditions.find(e => e.id === id);
}

export function getAllExpeditions(): readonly ExpeditionManifest[] {
  return expeditions;
}

export function getExpeditionDiscoveryDates(manifest: ExpeditionManifest): { date: string; title: string }[] {
  return manifest.steps
    .filter((step): step is ExpeditionStep & { date: string } => step.kind === 'discovery' && Boolean(step.date))
    .map(step => ({ date: step.date, title: step.title }));
}
