import React, { useRef, useState } from 'react';
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
  createObservation,
  type InstrumentSnapshot,
} from '../../src/database/repositories/observationsRepository';
import { useVoiceToText } from '../../src/hooks/useVoiceToText';
import { stageObservationPhoto } from '../../src/services/storage/observationStorage';
import { useAppSelector } from '../../src/store';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreateObservationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetId?: string;
    targetName?: string;
    linkedDiscoveryId?: string;
    linkedStudyId?: string;
    prefilledNotes?: string;
    snapshotJson?: string;
  }>();

  const { user } = useAppSelector(state => state.auth);
  const { connection, metadata, legacySyncedAt } = useAppSelector(state => state.feed);
  const offline = connection === 'offline';
  const syncedAt = metadata['nasa-apod'].lastSyncedAt ?? legacySyncedAt;

  const [title, setTitle] = useState('');
  const [targetName, setTargetName] = useState(params.targetName ?? '');
  const [targetId] = useState(params.targetId ?? '');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState(params.prefilledNotes ?? '');

  // Optional celestial instrument snapshot
  const [instrumentSnapshot, setInstrumentSnapshot] = useState<InstrumentSnapshot | null>(() => {
    if (params.snapshotJson) {
      try {
        return JSON.parse(params.snapshotJson) as InstrumentSnapshot;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Optional coordinates
  const [latitudeStr, setLatitudeStr] = useState('');
  const [longitudeStr, setLongitudeStr] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locating, setLocating] = useState(false);

  // Optional photo attachment
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageBytes, setImageBytes] = useState<number>(0);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice dictation
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
      setNotes(bounded);

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
      baseNotesRef.current = notes;
    } else {
      baseNotesRef.current = notes;
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
        setImageFileName(staged.fileName);
        setImageBytes(staged.bytes);
        setImageUri(staged.uri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not attach image.');
    }
  };

  const handleRemoveImage = () => {
    setImageFileName(null);
    setImageBytes(0);
    setImageUri(null);
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
      setLatitudeStr(loc.coords.latitude.toFixed(4));
      setLongitudeStr(loc.coords.longitude.toFixed(4));
      if (!locationName.trim()) {
        setLocationName('Current Observing Site');
      }
    } catch {
      Alert.alert('Location unavailable', 'Could not obtain current GPS coordinates.');
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Authentication required', 'Please sign in to record observations.');
      return;
    }

    if (!title.trim()) {
      setError('Observation title is required.');
      return;
    }

    if (!notes.trim()) {
      setError('Observation notes are required.');
      return;
    }

    let lat: number | undefined;
    if (latitudeStr.trim()) {
      lat = parseFloat(latitudeStr);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        setError('Latitude must be a valid number between -90 and +90.');
        return;
      }
    }

    let lon: number | undefined;
    if (longitudeStr.trim()) {
      lon = parseFloat(longitudeStr);
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        setError('Longitude must be a valid number between -180 and +180.');
        return;
      }
    }

    if (isListening) {
      stopListening();
    }

    setSaving(true);
    setError(null);

    try {
      await createObservation(user.id, {
        title: title.trim(),
        notes: notes.trim(),
        targetId: targetId.trim() || undefined,
        targetName: targetName.trim() || undefined,
        conditions: conditions.trim() || undefined,
        latitude: lat,
        longitude: lon,
        locationName: locationName.trim() || undefined,
        imageFileName: imageFileName || undefined,
        imageBytes: imageBytes || undefined,
        instrumentSnapshot: instrumentSnapshot || undefined,
        linkedDiscoveryId: params.linkedDiscoveryId,
        linkedStudyId: params.linkedStudyId,
      });

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save observation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <Header title="New Observation" showBack />
      {offline && <OfflineBanner lastSyncedAt={syncedAt} />}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.masthead}>
          <Text style={styles.kicker}>FIELDWORK LOGBOOK</Text>
          <Text accessibilityRole="header" style={styles.title}>Record Observation</Text>
          <Text style={styles.summary}>
            Record eyepiece observations, celestial coordinates, and observing site conditions.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert-triangle" size={15} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observation Title *</Text>
          <TextInput
            accessibilityLabel="Observation Title input"
            placeholder="e.g. Saturn Ring Shadow & Titan"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            style={styles.textInput}
          />
        </View>

        {/* Target Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Object (Optional)</Text>
          <TextInput
            accessibilityLabel="Target Object input"
            placeholder="e.g. Saturn, M31, Lunar Terminator"
            placeholderTextColor={colors.muted}
            value={targetName}
            onChangeText={setTargetName}
            maxLength={100}
            style={styles.textInput}
          />
        </View>

        {/* Conditions */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Site & Sky Conditions (Optional)</Text>
          <TextInput
            accessibilityLabel="Site and Sky Conditions input"
            placeholder="e.g. Clear, Bortle 4, Transparency 4/5"
            placeholderTextColor={colors.muted}
            value={conditions}
            onChangeText={setConditions}
            maxLength={200}
            style={styles.textInput}
          />
        </View>

        {/* Observing Site Coordinates */}
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
              value={latitudeStr}
              onChangeText={setLatitudeStr}
              keyboardType="numeric"
              style={[styles.textInput, styles.coordInput]}
            />
            <TextInput
              accessibilityLabel="Longitude input"
              placeholder="Lon (-180 to 180)"
              placeholderTextColor={colors.muted}
              value={longitudeStr}
              onChangeText={setLongitudeStr}
              keyboardType="numeric"
              style={[styles.textInput, styles.coordInput]}
            />
          </View>
          <TextInput
            accessibilityLabel="Location name input"
            placeholder="Site name (e.g. Mount Wilson Observatory)"
            placeholderTextColor={colors.muted}
            value={locationName}
            onChangeText={setLocationName}
            maxLength={100}
            style={[styles.textInput, { marginTop: spacing[1] }]}
          />
        </View>

        {/* Photo Attachment */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Eyepiece Photo Attachment (Optional)</Text>

          {imageUri ? (
            <View style={styles.photoPreviewCard}>
              <Image source={{ uri: imageUri }} style={styles.photoThumbnail} resizeMode="cover" />
              <View style={styles.photoInfoCol}>
                <Text style={styles.photoName} numberOfLines={1}>{imageFileName}</Text>
                <Text style={styles.photoSize}>{formatFileSize(imageBytes)}</Text>
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

        {/* Celestial Field Instrument Sighting Snapshot */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Celestial Instrument Sighting (Optional)</Text>

          {instrumentSnapshot ? (
            <View style={styles.snapshotCard}>
              <View style={styles.snapshotHeader}>
                <Icon name="compass" size={15} color={colors.forest} />
                <Text style={styles.snapshotTitle}>
                  Bearing: {instrumentSnapshot.azimuth}° {instrumentSnapshot.cardinal} · {instrumentSnapshot.altitude >= 0 ? '+' : ''}{instrumentSnapshot.altitude}° Alt
                </Text>
              </View>
              <Text style={styles.snapshotMeta}>
                Reference: {instrumentSnapshot.reference.toUpperCase()} NORTH · Quality: {instrumentSnapshot.quality.toUpperCase()}
              </Text>
              {instrumentSnapshot.declination !== null && instrumentSnapshot.declination !== undefined && (
                <Text style={styles.snapshotMeta}>
                  Magnetic Declination: {instrumentSnapshot.declination >= 0 ? '+' : ''}{instrumentSnapshot.declination}°
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove attached instrument snapshot"
                style={styles.removeSnapshotBtn}
                onPress={() => setInstrumentSnapshot(null)}
              >
                <Icon name="trash-2" size={13} color={colors.danger} />
                <Text style={styles.removePhotoText}>Remove snapshot</Text>
              </Pressable>
            </View>
          ) : (
            <Button
              title="Open field instrument"
              icon="compass"
              variant="outline"
              accessibilityLabel="Open celestial field instrument to measure bearing and elevation"
              onPress={() =>
                router.push({
                  pathname: '/fieldwork/instrument',
                  params: {
                    targetId: targetId || undefined,
                    targetName: targetName || undefined,
                  },
                } as never)
              }
            />
          )}
        </View>

        {/* Notes Input + Voice Dictation Header */}
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
            placeholder="Record eyepiece visual details, magnification used, seeing stability, filters, and personal observations..."
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={5000}
            style={styles.textArea}
          />
          <Text style={styles.characterCount}>{notes.length} / 5000</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Button
            title={saving ? 'Saving...' : 'Save observation'}
            icon="check"
            variant="primary"
            loading={saving}
            disabled={saving}
            accessibilityLabel="Save observation to durable local storage"
            onPress={() => void handleSave()}
          />
        </View>
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
  masthead: {
    marginBottom: spacing[4],
  },
  kicker: {
    ...typography.label,
    color: colors.terracotta,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    ...typography.h1,
    color: colors.forest,
    marginBottom: 4,
  },
  summary: {
    ...typography.body,
    color: colors.muted,
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
  inputGroup: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.label,
    color: colors.ink,
    marginBottom: spacing[1],
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
  snapshotCard: {
    padding: spacing[3],
    backgroundColor: colors.sageLight,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  snapshotTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.forest,
  },
  snapshotMeta: {
    ...typography.meta,
    color: colors.ink,
    marginBottom: 2,
  },
  removeSnapshotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing[2],
    minHeight: layout.minimumTouchTarget,
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
    marginBottom: spacing[1],
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
    marginTop: 4,
  },
  actionRow: {
    marginTop: spacing[2],
  },
});
