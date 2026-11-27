import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';
import { Icon } from '../../src/components/common/Icon';
import { OfflineBanner } from '../../src/components/common/OfflineBanner';
import {
  deleteObservation,
  getObservationById,
  updateObservation,
  type ObservationRecord,
} from '../../src/database/repositories/observationsRepository';
import { useVoiceToText } from '../../src/hooks/useVoiceToText';
import {
  getObservationPhotoUri,
  stageObservationPhoto,
} from '../../src/services/storage/observationStorage';
import { useAppSelector } from '../../src/store';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ObservationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id;
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const [observation, setObservation] = useState<ObservationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editTargetName, setEditTargetName] = useState('');
  const [editConditions, setEditConditions] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Edit coordinates
  const [editLatitudeStr, setEditLatitudeStr] = useState('');
  const [editLongitudeStr, setEditLongitudeStr] = useState('');
  const [editLocationName, setEditLocationName] = useState('');
  const [locating, setLocating] = useState(false);

  // Edit photo
  const [editImageFileName, setEditImageFileName] = useState<string | null>(null);
  const [editImageBytes, setEditImageBytes] = useState<number>(0);
  const [editImageUri, setEditImageUri] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (userId && id) {
      void getObservationById(userId, id).then(record => {
        if (!active) return;
        setObservation(record);
        if (record) {
          setEditTitle(record.title);
          setEditTargetName(record.targetName ?? '');
          setEditConditions(record.conditions ?? '');
          setEditNotes(record.notes);
          setEditLatitudeStr(record.latitude != null ? String(record.latitude) : '');
          setEditLongitudeStr(record.longitude != null ? String(record.longitude) : '');
          setEditLocationName(record.locationName ?? '');
          setEditImageFileName(record.imageFileName);
          setEditImageBytes(record.imageBytes);
          setEditImageUri(getObservationPhotoUri(record.imageFileName));
        }
        setLoading(false);
      }).catch(() => {
        if (!active) return;
        setObservation(null);
        setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [userId, id]);

  // Voice dictation in edit mode
  const baseNotesRef = useRef('');
  const {
    isListening,
    startListening,
    stopListening,
  } = useVoiceToText({
    onTranscriptChange: (utterance, isFinal) => {
      const base = baseNotesRef.current.trim();
      const combined = base ? `${base} ${utterance}` : utterance;
      const bounded = combined.slice(0, 5000);
      setEditNotes(bounded);

      if (isFinal) {
        baseNotesRef.current = bounded;
      }
    },
    onError: msg => {
      setError(msg);
    },
    continuous: true,
    addsPunctuation: true,
    preferOffline: true,
  });

  const toggleDictation = async () => {
    setError(null);
    if (isListening) {
      stopListening();
      baseNotesRef.current = editNotes;
    } else {
      baseNotesRef.current = editNotes;
      await startListening();
    }
  };

  const handlePickImage = async () => {
    setError(null);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Media library access is needed to attach observation photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const staged = await stageObservationPhoto(asset.uri);
        setEditImageFileName(staged.fileName);
        setEditImageBytes(staged.bytes);
        setEditImageUri(staged.uri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not attach image.');
    }
  };

  const handleRemoveImage = () => {
    setEditImageFileName(null);
    setEditImageBytes(0);
    setEditImageUri(null);
  };

  const handleGetLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission', 'Foreground location permission is needed to record observing site coordinates.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setEditLatitudeStr(loc.coords.latitude.toFixed(4));
      setEditLongitudeStr(loc.coords.longitude.toFixed(4));
      if (!editLocationName.trim()) {
        setEditLocationName('Current Observing Site');
      }
    } catch {
      Alert.alert('Location unavailable', 'Could not obtain GPS coordinates.');
    } finally {
      setLocating(false);
    }
  };

  const handleUpdate = async () => {
    if (!user?.id || !id) return;

    if (!editTitle.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!editNotes.trim()) {
      setError('Notes cannot be empty.');
      return;
    }

    let lat: number | null = null;
    if (editLatitudeStr.trim()) {
      lat = parseFloat(editLatitudeStr);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        setError('Latitude must be between -90 and +90.');
        return;
      }
    }

    let lon: number | null = null;
    if (editLongitudeStr.trim()) {
      lon = parseFloat(editLongitudeStr);
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        setError('Longitude must be between -180 and +180.');
        return;
      }
    }

    if (isListening) stopListening();

    setSaving(true);
    setError(null);
    try {
      const updated = await updateObservation(user.id, id, {
        title: editTitle.trim(),
        targetName: editTargetName.trim() || null,
        conditions: editConditions.trim() || null,
        notes: editNotes.trim(),
        latitude: lat,
        longitude: lon,
        locationName: editLocationName.trim() || null,
        imageFileName: editImageFileName,
        imageBytes: editImageBytes,
      });

      if (updated) {
        setObservation(updated);
        setEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update observation.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user?.id || !id) return;

    Alert.alert(
      'Delete observation',
      'Are you sure you want to permanently delete this observation record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteObservation(user.id, id);
            if (success) {
              router.back();
            } else {
              Alert.alert('Error', 'Could not delete observation.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="Observation" showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading observation...</Text>
        </View>
      </View>
    );
  }

  if (!observation) {
    return (
      <View style={styles.screen}>
        <Header title="Observation Not Found" showBack />
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={32} color={colors.muted} />
          <Text style={styles.notFoundTitle}>Observation Not Found</Text>
          <Text style={styles.notFoundBody}>
            This record may have been deleted or belongs to a different account.
          </Text>
          <Button
            title="Return to fieldwork"
            icon="arrow-left"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  const formattedDate = new Date(observation.observedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const photoUri = getObservationPhotoUri(observation.imageFileName);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <Header
        title={editing ? 'Edit Observation' : (observation.targetName || 'Observation')}
        showBack
      />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert-triangle" size={15} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* VIEW MODE */}
        {!editing ? (
          <View style={styles.viewCard}>
            <View style={styles.metaRow}>
              <View style={styles.targetBadge}>
                <Icon name="crosshair" size={12} color={colors.forest} />
                <Text style={styles.targetBadgeText}>
                  {(observation.targetName || observation.targetId || 'GENERAL SKY').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>

            <Text accessibilityRole="header" style={styles.detailTitle}>{observation.title}</Text>

            {/* Conditions Box */}
            {observation.conditions ? (
              <View style={styles.conditionsBox}>
                <Icon name="cloud" size={14} color={colors.forest} />
                <Text style={styles.conditionsContent}>
                  Sky Conditions: {observation.conditions}
                </Text>
              </View>
            ) : null}

            {/* GPS Site Coordinates Box */}
            {typeof observation.latitude === 'number' && typeof observation.longitude === 'number' ? (
              <View style={styles.locationBox}>
                <Icon name="map-pin" size={14} color={colors.forest} />
                <View style={styles.locationTextCol}>
                  <Text style={styles.locationCoords}>
                    {observation.latitude.toFixed(4)}°, {observation.longitude.toFixed(4)}°
                  </Text>
                  {observation.locationName ? (
                    <Text style={styles.locationNameText}>{observation.locationName}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Attached Eyepiece Photo */}
            {photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoFull} resizeMode="cover" />
                <View style={styles.photoCaptionBar}>
                  <Text style={styles.photoCaptionName} numberOfLines={1}>{observation.imageFileName}</Text>
                  <Text style={styles.photoCaptionSize}>{formatFileSize(observation.imageBytes)}</Text>
                </View>
              </View>
            ) : null}

            {/* Celestial Field Instrument Sighting Snapshot */}
            {observation.instrumentSnapshot ? (
              <View style={styles.instrumentSnapshotCard}>
                <View style={styles.instrumentHeaderRow}>
                  <Icon name="compass" size={16} color={colors.forest} />
                  <Text style={styles.instrumentHeaderTitle}>Celestial Field Sighting (F06)</Text>
                </View>
                <View style={styles.instrumentReadingRow}>
                  <Text style={styles.instrumentHeadingText}>
                    {observation.instrumentSnapshot.azimuth.toFixed(1)}° {observation.instrumentSnapshot.cardinal}
                  </Text>
                  <Text style={styles.instrumentAltitudeText}>
                    {observation.instrumentSnapshot.altitude >= 0 ? '+' : ''}{observation.instrumentSnapshot.altitude.toFixed(1)}° Alt
                  </Text>
                </View>
                <View style={styles.instrumentMetaRow}>
                  <Text style={styles.instrumentMetaText}>
                    Reference: {observation.instrumentSnapshot.reference === 'true' ? 'True North' : observation.instrumentSnapshot.reference === 'magnetic' ? 'Magnetic North' : 'Manual'}
                  </Text>
                  <Text style={styles.instrumentMetaText}>
                    Quality: {observation.instrumentSnapshot.quality.toUpperCase()} ({observation.instrumentSnapshot.source})
                  </Text>
                </View>
                {observation.instrumentSnapshot.declination !== null && observation.instrumentSnapshot.declination !== undefined ? (
                  <Text style={styles.instrumentDeclinationText}>
                    Magnetic Declination: {observation.instrumentSnapshot.declination >= 0 ? '+' : ''}{observation.instrumentSnapshot.declination.toFixed(1)}°
                  </Text>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.notesBody}>{observation.notes}</Text>

            <View style={styles.provenanceBox}>
              <Text style={styles.provenanceLabel}>RECORD PROVENANCE</Text>
              <Text style={styles.provenanceText}>Recorded timezone: {observation.timezone}</Text>
              <Text style={styles.provenanceText}>Observed UTC: {observation.observedAt}</Text>
            </View>

            {/* Cross Links if present */}
            {observation.linkedDiscoveryId && (
              <Button
                title="View linked Discovery plate"
                icon="external-link"
                variant="outline"
                onPress={() => {
                  const parts = observation.linkedDiscoveryId?.split(':') ?? [];
                  const src = parts[0] ?? 'nasa-apod';
                  const extId = parts.slice(1).join(':');
                  router.push(`/details/${src}/${extId}` as never);
                }}
              />
            )}

            {observation.linkedStudyId && (
              <Button
                title="View linked Space Study guide"
                icon="book-open"
                variant="outline"
                onPress={() => router.push(`/study/${observation.linkedStudyId}` as never)}
              />
            )}

            {/* Actions: Edit & Delete */}
            <View style={styles.buttonRow}>
              <Button
                title="Edit observation"
                icon="edit-2"
                variant="outline"
                accessibilityLabel="Edit this observation record"
                onPress={() => setEditing(true)}
              />
              <Button
                title="Delete observation"
                icon="trash-2"
                variant="outline"
                accessibilityLabel="Delete this observation record"
                onPress={handleDelete}
              />
            </View>
          </View>
        ) : (
          /* EDIT MODE */
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observation Title *</Text>
              <TextInput
                accessibilityLabel="Observation Title input"
                value={editTitle}
                onChangeText={setEditTitle}
                maxLength={200}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Object (Optional)</Text>
              <TextInput
                accessibilityLabel="Target Object input"
                value={editTargetName}
                onChangeText={setEditTargetName}
                maxLength={100}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Site & Sky Conditions (Optional)</Text>
              <TextInput
                accessibilityLabel="Site and Sky Conditions input"
                value={editConditions}
                onChangeText={setEditConditions}
                maxLength={200}
                style={styles.textInput}
              />
            </View>

            {/* Coordinates in edit mode */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>Observing Coordinates (Optional)</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Capture current GPS coordinates"
                  style={styles.actionPill}
                  disabled={locating}
                  onPress={() => void handleGetLocation()}
                >
                  <Icon name="map-pin" size={12} color={colors.forest} />
                  <Text style={styles.actionPillText}>{locating ? 'Locating...' : 'Use GPS'}</Text>
                </Pressable>
              </View>

              <View style={styles.coordRow}>
                <TextInput
                  accessibilityLabel="Latitude input"
                  placeholder="Lat (-90 to 90)"
                  placeholderTextColor={colors.muted}
                  value={editLatitudeStr}
                  onChangeText={setEditLatitudeStr}
                  keyboardType="numeric"
                  style={[styles.textInput, styles.coordInput]}
                />
                <TextInput
                  accessibilityLabel="Longitude input"
                  placeholder="Lon (-180 to 180)"
                  placeholderTextColor={colors.muted}
                  value={editLongitudeStr}
                  onChangeText={setEditLongitudeStr}
                  keyboardType="numeric"
                  style={[styles.textInput, styles.coordInput]}
                />
              </View>
              <TextInput
                accessibilityLabel="Location name input"
                placeholder="Site name (e.g. Mount Wilson)"
                placeholderTextColor={colors.muted}
                value={editLocationName}
                onChangeText={setEditLocationName}
                maxLength={100}
                style={[styles.textInput, { marginTop: spacing[1] }]}
              />
            </View>

            {/* Photo in edit mode */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Eyepiece Photo Attachment</Text>
              {editImageUri ? (
                <View style={styles.photoPreviewCard}>
                  <Image source={{ uri: editImageUri }} style={styles.photoThumbnail} resizeMode="cover" />
                  <View style={styles.photoInfoCol}>
                    <Text style={styles.photoName} numberOfLines={1}>{editImageFileName}</Text>
                    <Text style={styles.photoSize}>{formatFileSize(editImageBytes)}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove attached eyepiece photo"
                      style={styles.removePhotoBtn}
                      onPress={handleRemoveImage}
                    >
                      <Icon name="trash-2" size={13} color={colors.danger} />
                      <Text style={styles.removePhotoText}>Remove photo</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Button
                  title="Attach photo from library"
                  icon="camera"
                  variant="outline"
                  accessibilityLabel="Attach telescope or eyepiece photo from device photo library"
                  onPress={() => void handlePickImage()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.notesHeaderRow}>
                <Text style={styles.label}>Fieldwork Notes *</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isListening ? 'Stop voice dictation' : 'Dictate observation notes'}
                  style={[styles.dictateBtn, isListening && styles.dictateBtnActive]}
                  onPress={() => void toggleDictation()}
                >
                  <Icon name="mic" size={13} color={isListening ? colors.ivory : colors.forest} />
                  <Text style={[styles.dictateText, isListening && styles.dictateTextActive]}>
                    {isListening ? 'Listening...' : 'Dictate notes'}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                accessibilityLabel="Fieldwork Notes input"
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={5000}
                style={styles.textArea}
              />
              <Text style={styles.characterCount}>{editNotes.length} / 5000</Text>
            </View>

            <View style={styles.buttonRow}>
              <Button
                title={saving ? 'Saving...' : 'Save changes'}
                icon="check"
                variant="primary"
                loading={saving}
                disabled={saving}
                accessibilityLabel="Save updated observation"
                onPress={() => void handleUpdate()}
              />
              <Button
                title="Cancel"
                icon="x"
                variant="outline"
                disabled={saving}
                accessibilityLabel="Cancel editing and revert"
                onPress={() => {
                  setEditing(false);
                  setEditTitle(observation.title);
                  setEditTargetName(observation.targetName ?? '');
                  setEditConditions(observation.conditions ?? '');
                  setEditNotes(observation.notes);
                  setEditLatitudeStr(observation.latitude !== null ? String(observation.latitude) : '');
                  setEditLongitudeStr(observation.longitude !== null ? String(observation.longitude) : '');
                  setEditLocationName(observation.locationName ?? '');
                  setEditImageFileName(observation.imageFileName);
                  setEditImageBytes(observation.imageBytes);
                  setEditImageUri(getObservationPhotoUri(observation.imageFileName));
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[2],
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  notFoundTitle: {
    ...typography.h2,
    color: colors.forest,
  },
  notFoundBody: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  viewCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sageLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  targetBadgeText: {
    ...typography.label,
    fontSize: 10,
    color: colors.forest,
  },
  dateText: {
    ...typography.meta,
    color: colors.muted,
  },
  detailTitle: {
    ...typography.h1,
    color: colors.forest,
  },
  conditionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ivory,
    padding: spacing[2],
    borderRadius: radii.sm,
  },
  conditionsContent: {
    ...typography.bodySmall,
    color: colors.forest,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ivory,
    padding: spacing[2],
    borderRadius: radii.sm,
  },
  locationTextCol: {
    flex: 1,
  },
  locationCoords: {
    ...typography.label,
    fontSize: 11,
    color: colors.forest,
  },
  locationNameText: {
    ...typography.meta,
    color: colors.muted,
  },
  photoContainer: {
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ivory,
  },
  photoFull: {
    width: '100%',
    height: 220,
    backgroundColor: colors.ivory,
  },
  photoCaptionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[2],
    backgroundColor: colors.surface,
  },
  photoCaptionName: {
    ...typography.meta,
    color: colors.ink,
    flex: 1,
  },
  photoCaptionSize: {
    ...typography.meta,
    color: colors.muted,
  },
  instrumentSnapshotCard: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    gap: 4,
  },
  instrumentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  instrumentHeaderTitle: {
    ...typography.label,
    color: colors.forest,
  },
  instrumentReadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  instrumentHeadingText: {
    ...typography.h2,
    fontSize: 20,
    color: colors.forest,
    fontWeight: '700',
  },
  instrumentAltitudeText: {
    ...typography.h2,
    fontSize: 16,
    color: colors.brass,
  },
  instrumentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  instrumentMetaText: {
    ...typography.meta,
    color: colors.ink,
  },
  instrumentDeclinationText: {
    ...typography.meta,
    color: colors.muted,
  },
  notesBody: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 22,
  },
  provenanceBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
    gap: 2,
  },
  provenanceLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.8,
  },
  provenanceText: {
    ...typography.meta,
    color: colors.muted,
  },
  buttonRow: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  editForm: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  inputGroup: {
    gap: spacing[1],
  },
  label: {
    ...typography.label,
    color: colors.ink,
  },
  textInput: {
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    ...typography.body,
    color: colors.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.sageLight,
  },
  actionPillText: {
    ...typography.label,
    fontSize: 11,
    color: colors.forest,
  },
  coordRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  coordInput: {
    flex: 1,
  },
  photoPreviewCard: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  photoThumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.ivory,
  },
  photoInfoCol: {
    flex: 1,
    gap: 2,
  },
  photoName: {
    ...typography.label,
    color: colors.forest,
  },
  photoSize: {
    ...typography.meta,
    color: colors.muted,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  removePhotoText: {
    ...typography.meta,
    color: colors.danger,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dictateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.sageLight,
    minHeight: 32,
  },
  dictateBtnActive: {
    backgroundColor: colors.terracotta,
  },
  dictateText: {
    ...typography.label,
    fontSize: 11,
    color: colors.forest,
  },
  dictateTextActive: {
    color: colors.ivory,
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing[3],
    ...typography.body,
    color: colors.ink,
  },
  characterCount: {
    ...typography.meta,
    color: colors.muted,
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FBF0EB',
    padding: spacing[2],
    borderRadius: radii.sm,
    marginBottom: spacing[3],
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
});
