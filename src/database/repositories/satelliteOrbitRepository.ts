import type { SatelliteId } from '../../features/sky/satelliteCatalog';
import { parseSatelliteElements, type SatelliteElements } from '../../features/sky/satelliteElements';
import { getDatabase, writeDatabase } from '../db';

export type SatelliteFailure = 'unavailable' | 'paused';
export interface SatelliteCacheEntry {
  noradId: SatelliteId;
  elements: SatelliteElements | null;
  downloadedAt: number | null;
  failure: SatelliteFailure | null;
}

interface OrbitRow {
  norad_id: SatelliteId;
  elements_json: string | null;
  downloaded_at: number | null;
  failure: SatelliteFailure | null;
}

export const satelliteRefreshInterval = 2 * 60 * 60_000;

export async function readSatelliteCache(): Promise<SatelliteCacheEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<OrbitRow>('SELECT norad_id, elements_json, downloaded_at, failure FROM sky_satellite_orbits');
  return rows.map(row => {
    let elements: SatelliteElements | null = null;
    try {
      if (row.elements_json) elements = parseSatelliteElements(JSON.parse(row.elements_json), row.norad_id);
    } catch {
      // A corrupt row is treated as unavailable. It cannot erase another cached orbit.
    }
    return { noradId: row.norad_id, elements, downloadedAt: row.downloaded_at, failure: row.failure };
  });
}

export async function reserveSatelliteRefresh(noradId: SatelliteId, now: number): Promise<boolean> {
  return writeDatabase(async db => {
    const cutoff = now - satelliteRefreshInterval;
    const paused = await db.getFirstAsync(
      'SELECT 1 FROM sky_satellite_orbits WHERE failure = ? LIMIT 1', ['paused'],
    );
    if (paused) return false;
    const result = await db.runAsync(
      `INSERT INTO sky_satellite_orbits (norad_id, attempted_at) VALUES (?, ?)
       ON CONFLICT(norad_id) DO UPDATE SET attempted_at = excluded.attempted_at, failure = NULL
       WHERE sky_satellite_orbits.attempted_at <= ?`,
      [noradId, now, cutoff],
    );
    return result.changes > 0;
  });
}

export async function saveSatelliteOrbit(noradId: SatelliteId, elements: SatelliteElements, downloadedAt: number): Promise<void> {
  await writeDatabase(db => db.runAsync(
    `UPDATE sky_satellite_orbits SET elements_json = ?, epoch_at = ?, downloaded_at = ?, failure = NULL
     WHERE norad_id = ? AND (epoch_at IS NULL OR epoch_at <= ?)`,
    [JSON.stringify(elements.data), elements.epochAt, downloadedAt, noradId, elements.epochAt],
  ));
}

export async function recordSatelliteFailure(noradId: SatelliteId, failure: SatelliteFailure): Promise<void> {
  await writeDatabase(db => db.runAsync('UPDATE sky_satellite_orbits SET failure = ? WHERE norad_id = ?', [failure, noradId]));
}

export async function resumeOrbitSource(now:number) {
  await writeDatabase(db=>db.runAsync(
    "UPDATE sky_satellite_orbits SET failure=NULL WHERE failure='paused' AND attempted_at<=?",
    [now-satelliteRefreshInterval]));
}
