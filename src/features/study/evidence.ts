export interface SourceRef {
  id: string;
  url: string;
  publisher: string;
  title: string;
  accessedAt: string;
  license?: string;
  credit?: string;
  notes?: string;
}

export interface EvidenceAsset {
  type: 'diagram' | 'spectrum' | 'photo' | 'astrometry';
  label: string;
  isArtistConcept: boolean;
  caption: string;
  credit: string;
  sourceUrl: string;
}

export interface EvidenceDossier {
  id: string;
  revision: number;
  headline: string;
  targetName: string;
  category: string;
  reviewedAt: string;
  observation: string;
  method: string;
  inference: string;
  uncertainty: string;
  sourceRefs: SourceRef[];
  relatedIds: string[];
  asset?: EvidenceAsset;
}

export function validateSourceRef(source: unknown): SourceRef {
  if (!source || typeof source !== 'object') {
    throw new Error('SourceRef must be a valid object');
  }
  const s = source as Partial<SourceRef>;
  if (!s.id || typeof s.id !== 'string' || !s.id.trim()) {
    throw new Error('SourceRef requires a non-empty id');
  }
  if (!s.url || typeof s.url !== 'string' || !s.url.startsWith('https://')) {
    throw new Error('SourceRef requires a secure HTTPS url');
  }
  if (!s.publisher || typeof s.publisher !== 'string' || !s.publisher.trim()) {
    throw new Error('SourceRef requires a non-empty publisher');
  }
  if (!s.title || typeof s.title !== 'string' || !s.title.trim()) {
    throw new Error('SourceRef requires a non-empty title');
  }
  if (!s.accessedAt || typeof s.accessedAt !== 'string' || !s.accessedAt.trim()) {
    throw new Error('SourceRef requires a non-empty accessedAt timestamp');
  }
  return {
    id: s.id.trim(),
    url: s.url.trim(),
    publisher: s.publisher.trim(),
    title: s.title.trim(),
    accessedAt: s.accessedAt.trim(),
    license: s.license?.trim(),
    credit: s.credit?.trim(),
    notes: s.notes?.trim(),
  };
}

export function validateEvidenceDossier(data: unknown): EvidenceDossier {
  if (!data || typeof data !== 'object') {
    throw new Error('EvidenceDossier must be a valid object');
  }
  const d = data as Partial<EvidenceDossier>;
  if (!d.id || typeof d.id !== 'string' || !d.id.startsWith('dossier:')) {
    throw new Error('EvidenceDossier id must start with "dossier:"');
  }
  if (typeof d.revision !== 'number' || !Number.isInteger(d.revision) || d.revision < 1) {
    throw new Error('EvidenceDossier revision must be a positive integer');
  }
  if (!d.headline || typeof d.headline !== 'string' || !d.headline.trim()) {
    throw new Error('EvidenceDossier requires a non-empty headline');
  }
  if (!d.targetName || typeof d.targetName !== 'string' || !d.targetName.trim()) {
    throw new Error('EvidenceDossier requires a non-empty targetName');
  }
  if (!d.category || typeof d.category !== 'string' || !d.category.trim()) {
    throw new Error('EvidenceDossier requires a non-empty category');
  }
  if (!d.reviewedAt || typeof d.reviewedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(d.reviewedAt)) {
    throw new Error('EvidenceDossier requires a valid reviewedAt ISO date (YYYY-MM-DD)');
  }
  if (!d.observation || typeof d.observation !== 'string' || !d.observation.trim()) {
    throw new Error('EvidenceDossier requires an empirical observation block');
  }
  if (!d.method || typeof d.method !== 'string' || !d.method.trim()) {
    throw new Error('EvidenceDossier requires an instrumentation/method block');
  }
  if (!d.inference || typeof d.inference !== 'string' || !d.inference.trim()) {
    throw new Error('EvidenceDossier requires a scientific inference block');
  }
  if (!d.uncertainty || typeof d.uncertainty !== 'string' || !d.uncertainty.trim()) {
    throw new Error('EvidenceDossier requires an uncertainty block detailing what evidence does NOT establish');
  }

  const lowerUncertainty = d.uncertainty.toLowerCase();
  const hasNegativeBoundary =
    lowerUncertainty.includes('not ') ||
    lowerUncertainty.includes('cannot') ||
    lowerUncertainty.includes('does not') ||
    lowerUncertainty.includes('distinguish');
  if (!hasNegativeBoundary) {
    throw new Error('EvidenceDossier uncertainty must explicitly disclose what the data does NOT establish');
  }

  if (!Array.isArray(d.sourceRefs) || d.sourceRefs.length === 0) {
    throw new Error('EvidenceDossier requires at least one primary sourceRef');
  }
  const sourceRefs = d.sourceRefs.map(validateSourceRef);

  if (!Array.isArray(d.relatedIds) || d.relatedIds.length === 0) {
    throw new Error('EvidenceDossier requires at least one related identifier');
  }
  for (const rel of d.relatedIds) {
    if (typeof rel !== 'string' || !rel.trim()) {
      throw new Error('EvidenceDossier relatedIds must be non-empty strings');
    }
  }

  let asset: EvidenceAsset | undefined;
  if (d.asset) {
    const a = d.asset as Partial<EvidenceAsset>;
    if (!a.label || !a.credit || !a.sourceUrl || typeof a.isArtistConcept !== 'boolean') {
      throw new Error('EvidenceAsset requires label, credit, sourceUrl, and isArtistConcept flag');
    }
    asset = {
      type: a.type ?? 'photo',
      label: a.label.trim(),
      isArtistConcept: a.isArtistConcept,
      caption: a.caption?.trim() ?? '',
      credit: a.credit.trim(),
      sourceUrl: a.sourceUrl.trim(),
    };
  }

  return {
    id: d.id.trim(),
    revision: d.revision,
    headline: d.headline.trim(),
    targetName: d.targetName.trim(),
    category: d.category.trim(),
    reviewedAt: d.reviewedAt.trim(),
    observation: d.observation.trim(),
    method: d.method.trim(),
    inference: d.inference.trim(),
    uncertainty: d.uncertainty.trim(),
    sourceRefs,
    relatedIds: d.relatedIds.map((r) => r.trim()),
    asset,
  };
}
