import { EvidenceDossier, validateEvidenceDossier } from './evidence';
import { evidenceDossiers } from './evidenceData';

/**
 * Repository layer for Evidence Dossiers (F07 Behind the Discovery).
 * Offline-first: returns verified, revisioned evidence dossiers bundled in-app.
 */

export async function listEvidenceDossiers(): Promise<EvidenceDossier[]> {
  // Return validated dossiers
  return evidenceDossiers.map(validateEvidenceDossier);
}

export async function getEvidenceDossierById(id: string): Promise<EvidenceDossier | null> {
  const match = evidenceDossiers.find((d) => d.id === id);
  if (!match) return null;
  return validateEvidenceDossier(match);
}

export async function getEvidenceDossiersForTarget(targetOrRelatedId: string): Promise<EvidenceDossier[]> {
  const normalized = targetOrRelatedId.trim().toLowerCase();
  return evidenceDossiers
    .filter((d) => {
      if (d.id.toLowerCase() === normalized) return true;
      if (d.targetName.toLowerCase() === normalized) return true;
      if (d.relatedIds.some((r) => r.toLowerCase() === normalized)) return true;
      // Also match chapter: or target prefixes
      if (normalized.startsWith('chapter:') && d.relatedIds.includes(targetOrRelatedId)) return true;
      return false;
    })
    .map(validateEvidenceDossier);
}
