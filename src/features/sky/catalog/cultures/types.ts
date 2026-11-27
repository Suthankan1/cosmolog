import { SourceRef } from '../../../study/evidence';

export interface CultureStarRef {
  hip: number;
  nativeName: string;
  transliteration?: string;
  meaning?: string;
  role?: string;
}

export interface CultureSegment {
  fromHip: number;
  toHip: number;
}

export interface CultureAsterism {
  id: string;
  name: string;
  nativeScript?: string;
  englishName: string;
  meaning: string;
  stars: CultureStarRef[];
  segments: CultureSegment[];
  historicalContext: string;
}

export interface CultureOverlay {
  id: string;
  revision: number;
  tradition: string;
  region: string;
  epoch: string;
  reviewedAt: string;
  summary: string;
  historicalContext: string;
  contrastWithIAU: string;
  asterisms: CultureAsterism[];
  sourceRefs: SourceRef[];
  licenses: {
    textLicense: string;
    dataLicense: string;
    attribution: string;
  };
}

export function validateCultureOverlay(
  data: unknown,
  availableStarHips?: Set<number>
): CultureOverlay {
  if (!data || typeof data !== 'object') {
    throw new Error('CultureOverlay must be a valid object');
  }
  const c = data as Partial<CultureOverlay>;

  if (!c.id || typeof c.id !== 'string' || !c.id.startsWith('culture:')) {
    throw new Error('CultureOverlay id must start with "culture:"');
  }
  if (typeof c.revision !== 'number' || !Number.isInteger(c.revision) || c.revision < 1) {
    throw new Error('CultureOverlay revision must be a positive integer');
  }
  if (!c.tradition || typeof c.tradition !== 'string' || !c.tradition.trim()) {
    throw new Error('CultureOverlay requires a non-empty tradition name');
  }
  if (!c.region || typeof c.region !== 'string' || !c.region.trim()) {
    throw new Error('CultureOverlay requires a non-empty geographic/cultural region');
  }
  if (!c.epoch || typeof c.epoch !== 'string' || !c.epoch.trim()) {
    throw new Error('CultureOverlay requires an astronomical epoch (e.g. J2000.0)');
  }
  if (!c.reviewedAt || typeof c.reviewedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(c.reviewedAt)) {
    throw new Error('CultureOverlay requires a valid reviewedAt date (YYYY-MM-DD)');
  }
  if (!c.summary || typeof c.summary !== 'string' || !c.summary.trim()) {
    throw new Error('CultureOverlay requires a non-empty summary');
  }
  if (!c.historicalContext || typeof c.historicalContext !== 'string' || !c.historicalContext.trim()) {
    throw new Error('CultureOverlay requires historicalContext documenting genuine cultural scope');
  }
  if (!c.contrastWithIAU || typeof c.contrastWithIAU !== 'string' || !c.contrastWithIAU.trim()) {
    throw new Error('CultureOverlay requires contrastWithIAU explicitly disclaiming modern 1-to-1 IAU equivalence');
  }

  if (!Array.isArray(c.asterisms) || c.asterisms.length === 0) {
    throw new Error('CultureOverlay requires at least one asterism');
  }

  for (const ast of c.asterisms) {
    if (!ast.id || typeof ast.id !== 'string') {
      throw new Error('CultureAsterism requires an id');
    }
    if (!ast.name || typeof ast.name !== 'string') {
      throw new Error('CultureAsterism requires a name');
    }
    if (!Array.isArray(ast.stars) || ast.stars.length === 0) {
      throw new Error(`CultureAsterism ${ast.id} requires at least one star reference`);
    }

    const astHips = new Set<number>();
    for (const star of ast.stars) {
      if (typeof star.hip !== 'number' || !Number.isInteger(star.hip) || star.hip <= 0) {
        throw new Error(`Invalid Hipparcos ID in asterism ${ast.id}: ${star.hip}`);
      }
      if (!star.nativeName || typeof star.nativeName !== 'string') {
        throw new Error(`Star ${star.hip} in asterism ${ast.id} requires a nativeName`);
      }
      if (availableStarHips && !availableStarHips.has(star.hip)) {
        throw new Error(`Star HIP ${star.hip} in asterism ${ast.id} is missing from bright star catalog`);
      }
      astHips.add(star.hip);
    }

    if (!Array.isArray(ast.segments) || ast.segments.length === 0) {
      throw new Error(`CultureAsterism ${ast.id} requires at least one line segment`);
    }

    for (const seg of ast.segments) {
      if (!astHips.has(seg.fromHip)) {
        throw new Error(`Segment endpoint fromHip ${seg.fromHip} not in asterism ${ast.id} stars`);
      }
      if (!astHips.has(seg.toHip)) {
        throw new Error(`Segment endpoint toHip ${seg.toHip} not in asterism ${ast.id} stars`);
      }
      if (seg.fromHip === seg.toHip) {
        throw new Error(`Segment in asterism ${ast.id} cannot connect star ${seg.fromHip} to itself`);
      }
    }
  }

  if (!Array.isArray(c.sourceRefs) || c.sourceRefs.length === 0) {
    throw new Error('CultureOverlay requires at least one sourceRef');
  }
  for (const s of c.sourceRefs) {
    if (!s.url || !s.url.startsWith('https://')) {
      throw new Error('CultureOverlay sourceRef requires a secure HTTPS url');
    }
    if (!s.publisher || !s.title) {
      throw new Error('CultureOverlay sourceRef requires publisher and title');
    }
  }

  if (!c.licenses || typeof c.licenses !== 'object') {
    throw new Error('CultureOverlay requires licenses object specifying data/text rights');
  }
  if (!c.licenses.textLicense || !c.licenses.dataLicense || !c.licenses.attribution) {
    throw new Error('CultureOverlay licenses must specify textLicense, dataLicense, and attribution');
  }

  return {
    id: c.id.trim(),
    revision: c.revision,
    tradition: c.tradition.trim(),
    region: c.region.trim(),
    epoch: c.epoch.trim(),
    reviewedAt: c.reviewedAt.trim(),
    summary: c.summary.trim(),
    historicalContext: c.historicalContext.trim(),
    contrastWithIAU: c.contrastWithIAU.trim(),
    asterisms: c.asterisms,
    sourceRefs: c.sourceRefs,
    licenses: {
      textLicense: c.licenses.textLicense.trim(),
      dataLicense: c.licenses.dataLicense.trim(),
      attribution: c.licenses.attribution.trim(),
    },
  };
}
