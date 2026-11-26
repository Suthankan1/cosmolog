/**
 * Account-Scoped Astronomical Observation Journal Repository (F05)
 *
 * Implements durable CRUD operations for independent field observations,
 * isolated by verified user account ID.
 */

import { getDatabase, writeDatabase } from '../db';
import { deleteObservationPhotoFile } from '../../services/storage/observationStorage';

export interface ObservationRecord {
  id: string;
  accountId: number;
  title: string;
  notes: string;
  /** ISO UTC timestamp string */
  observedAt: string;
  /** Original IANA timezone identifier (e.g. 'Asia/Colombo') */
  timezone: string;
  /** Optional celestial target identifier (e.g. 'body:Moon', 'body:Saturn', 'messier:31') */
  targetId: string | null;
  /** Optional human-readable celestial target name */
  targetName: string | null;
  /** Optional qualitative viewing conditions (e.g. 'Clear sky, Bortle 4') */
  conditions: string | null;
  /** Optional latitude in decimal degrees (-90 to +90) */
  latitude: number | null;
  /** Optional longitude in decimal degrees (-180 to +180) */
  longitude: number | null;
  /** Optional human-readable observation site name */
  locationName: string | null;
  /** Optional relative file name of user-captured photograph in app-private storage */
  imageFileName: string | null;
  /** Size of attached photograph in bytes */
  imageBytes: number;
  /** Optional foreign link to cached discovery plate */
  linkedDiscoveryId: string | null;
  /** Optional foreign link to Space Study chapter */
  linkedStudyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObservationInput {
  title: string;
  notes: string;
  observedAt?: string;
  timezone?: string;
  targetId?: string | null;
  targetName?: string | null;
  conditions?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  imageFileName?: string | null;
  imageBytes?: number;
  linkedDiscoveryId?: string | null;
  linkedStudyId?: string | null;
}

export interface UpdateObservationInput {
  title?: string;
  notes?: string;
  observedAt?: string;
  timezone?: string;
  targetId?: string | null;
  targetName?: string | null;
  conditions?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  imageFileName?: string | null;
  imageBytes?: number;
  linkedDiscoveryId?: string | null;
  linkedStudyId?: string | null;
}

interface ObservationRow {
  id: string;
  account_id: number;
  title: string;
  notes: string;
  observed_at: string;
  timezone: string;
  target_id: string | null;
  target_name: string | null;
  conditions: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  image_file_name: string | null;
  image_bytes: number;
  linked_discovery_id: string | null;
  linked_study_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToObservation(row: ObservationRow): ObservationRecord {
  return {
    id: row.id,
    accountId: row.account_id,
    title: row.title,
    notes: row.notes,
    observedAt: row.observed_at,
    timezone: row.timezone,
    targetId: row.target_id,
    targetName: row.target_name,
    conditions: row.conditions,
    latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
    locationName: row.location_name,
    imageFileName: row.image_file_name,
    imageBytes: Number(row.image_bytes ?? 0),
    linkedDiscoveryId: row.linked_discovery_id,
    linkedStudyId: row.linked_study_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function generateObservationId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `obs_${timestamp}_${randomPart}`;
}

export function validateCoordinates(latitude?: number | null, longitude?: number | null): void {
  if (latitude !== undefined && latitude !== null) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be a valid number between -90 and +90 degrees');
    }
  }

  if (longitude !== undefined && longitude !== null) {
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be a valid number between -180 and +180 degrees');
    }
  }
}

export function validateObservationInput(
  accountId: number,
  title: string,
  notes: string,
  observedAt?: string,
  latitude?: number | null,
  longitude?: number | null,
): void {
  if (!Number.isInteger(accountId) || accountId <= 0) {
    throw new Error('Valid verified account ID is required');
  }

  const trimmedTitle = title?.trim();
  if (!trimmedTitle || trimmedTitle.length === 0) {
    throw new Error('Observation title is required');
  }
  if (trimmedTitle.length > 200) {
    throw new Error('Observation title exceeds maximum length of 200 characters');
  }

  const trimmedNotes = notes?.trim();
  if (!trimmedNotes || trimmedNotes.length === 0) {
    throw new Error('Observation notes are required');
  }
  if (trimmedNotes.length > 5000) {
    throw new Error('Observation notes exceed maximum length of 5000 characters');
  }

  if (observedAt && isNaN(Date.parse(observedAt))) {
    throw new Error('Observed timestamp must be a valid ISO date string');
  }

  validateCoordinates(latitude, longitude);
}

/**
 * Retrieves all observations belonging to the specified account,
 * ordered with newest observation date first.
 */
export async function getObservations(accountId: number): Promise<ObservationRecord[]> {
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return [];
  }

  const db = await getDatabase();
  const rows = await db.getAllAsync<ObservationRow>(
    `SELECT * FROM observations
     WHERE account_id = ?
     ORDER BY observed_at DESC, created_at DESC`,
    [accountId],
  );

  return rows.map(mapRowToObservation);
}

/**
 * Retrieves a single observation by ID, strictly verifying account ownership.
 */
export async function getObservationById(
  accountId: number,
  id: string,
): Promise<ObservationRecord | null> {
  if (!Number.isInteger(accountId) || accountId <= 0 || !id) {
    return null;
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync<ObservationRow>(
    `SELECT * FROM observations
     WHERE id = ? AND account_id = ?`,
    [id, accountId],
  );

  return row ? mapRowToObservation(row) : null;
}

/**
 * Creates a new astronomical observation record for the current account.
 */
export async function createObservation(
  accountId: number,
  input: CreateObservationInput,
  clock = () => new Date().toISOString(),
): Promise<ObservationRecord> {
  const now = clock();
  const observedAt = input.observedAt ?? now;
  validateObservationInput(
    accountId,
    input.title,
    input.notes,
    observedAt,
    input.latitude,
    input.longitude,
  );

  const id = generateObservationId();
  const timezone =
    input.timezone ?? (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC');

  const record: ObservationRecord = {
    id,
    accountId,
    title: input.title.trim(),
    notes: input.notes.trim(),
    observedAt,
    timezone,
    targetId: input.targetId?.trim() || null,
    targetName: input.targetName?.trim() || null,
    conditions: input.conditions?.trim() || null,
    latitude: input.latitude !== undefined && input.latitude !== null ? Number(input.latitude) : null,
    longitude: input.longitude !== undefined && input.longitude !== null ? Number(input.longitude) : null,
    locationName: input.locationName?.trim() || null,
    imageFileName: input.imageFileName?.trim() || null,
    imageBytes: Number(input.imageBytes ?? 0),
    linkedDiscoveryId: input.linkedDiscoveryId?.trim() || null,
    linkedStudyId: input.linkedStudyId?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  await writeDatabase(async writer => {
    await writer.runAsync(
      `INSERT INTO observations (
        id, account_id, title, notes, observed_at, timezone,
        target_id, target_name, conditions, latitude, longitude,
        location_name, image_file_name, image_bytes,
        linked_discovery_id, linked_study_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.accountId,
        record.title,
        record.notes,
        record.observedAt,
        record.timezone,
        record.targetId,
        record.targetName,
        record.conditions,
        record.latitude,
        record.longitude,
        record.locationName,
        record.imageFileName,
        record.imageBytes,
        record.linkedDiscoveryId,
        record.linkedStudyId,
        record.createdAt,
        record.updatedAt,
      ],
    );
  });

  return record;
}

/**
 * Updates an existing observation record, verifying account ownership.
 */
export async function updateObservation(
  accountId: number,
  id: string,
  input: UpdateObservationInput,
  clock = () => new Date().toISOString(),
): Promise<ObservationRecord | null> {
  const existing = await getObservationById(accountId, id);
  if (!existing) {
    return null;
  }

  const updatedTitle = input.title !== undefined ? input.title.trim() : existing.title;
  const updatedNotes = input.notes !== undefined ? input.notes.trim() : existing.notes;
  const updatedObservedAt = input.observedAt !== undefined ? input.observedAt : existing.observedAt;
  const updatedLat = input.latitude !== undefined ? input.latitude : existing.latitude;
  const updatedLon = input.longitude !== undefined ? input.longitude : existing.longitude;

  validateObservationInput(accountId, updatedTitle, updatedNotes, updatedObservedAt, updatedLat, updatedLon);

  // If photo attachment is being replaced or removed, clean up old file
  if (input.imageFileName !== undefined && existing.imageFileName && existing.imageFileName !== input.imageFileName) {
    deleteObservationPhotoFile(existing.imageFileName);
  }

  const now = clock();
  const updated: ObservationRecord = {
    ...existing,
    title: updatedTitle,
    notes: updatedNotes,
    observedAt: updatedObservedAt,
    timezone: input.timezone !== undefined ? input.timezone : existing.timezone,
    targetId: input.targetId !== undefined ? (input.targetId?.trim() || null) : existing.targetId,
    targetName: input.targetName !== undefined ? (input.targetName?.trim() || null) : existing.targetName,
    conditions: input.conditions !== undefined ? (input.conditions?.trim() || null) : existing.conditions,
    latitude: updatedLat !== null && updatedLat !== undefined ? Number(updatedLat) : null,
    longitude: updatedLon !== null && updatedLon !== undefined ? Number(updatedLon) : null,
    locationName: input.locationName !== undefined ? (input.locationName?.trim() || null) : existing.locationName,
    imageFileName: input.imageFileName !== undefined ? (input.imageFileName?.trim() || null) : existing.imageFileName,
    imageBytes: input.imageBytes !== undefined ? Number(input.imageBytes) : existing.imageBytes,
    linkedDiscoveryId: input.linkedDiscoveryId !== undefined ? (input.linkedDiscoveryId?.trim() || null) : existing.linkedDiscoveryId,
    linkedStudyId: input.linkedStudyId !== undefined ? (input.linkedStudyId?.trim() || null) : existing.linkedStudyId,
    updatedAt: now,
  };

  await writeDatabase(async writer => {
    await writer.runAsync(
      `UPDATE observations SET
        title = ?,
        notes = ?,
        observed_at = ?,
        timezone = ?,
        target_id = ?,
        target_name = ?,
        conditions = ?,
        latitude = ?,
        longitude = ?,
        location_name = ?,
        image_file_name = ?,
        image_bytes = ?,
        linked_discovery_id = ?,
        linked_study_id = ?,
        updated_at = ?
       WHERE id = ? AND account_id = ?`,
      [
        updated.title,
        updated.notes,
        updated.observedAt,
        updated.timezone,
        updated.targetId,
        updated.targetName,
        updated.conditions,
        updated.latitude,
        updated.longitude,
        updated.locationName,
        updated.imageFileName,
        updated.imageBytes,
        updated.linkedDiscoveryId,
        updated.linkedStudyId,
        updated.updatedAt,
        id,
        accountId,
      ],
    );
  });

  return updated;
}

/**
 * Deletes an observation record by ID, verifying account ownership and cleaning up private photo files.
 */
export async function deleteObservation(accountId: number, id: string): Promise<boolean> {
  if (!Number.isInteger(accountId) || accountId <= 0 || !id) {
    return false;
  }

  const existing = await getObservationById(accountId, id);
  if (!existing) {
    return false;
  }

  // Delete private image file if present
  if (existing.imageFileName) {
    deleteObservationPhotoFile(existing.imageFileName);
  }

  return writeDatabase(async writer => {
    const result = await writer.runAsync(
      'DELETE FROM observations WHERE id = ? AND account_id = ?',
      [id, accountId],
    );
    return result.changes > 0;
  });
}
