import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { logoutThunk } from '../../src/store/slices/authSlice';
import { refreshImagesThunk } from '../../src/store/slices/favouritesSlice';
import { refreshArchive } from '../../src/store/archiveLifecycle';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';
import { Button } from '../../src/components/common/Button';
import { Earthrise } from '../../src/components/common/Earthrise';
import { Icon, type FeatherIconName } from '../../src/components/common/Icon';
import { formatSyncTimestamp } from '../../src/utils/text';

function Stat({ value, label, icon }: { value: string; label: string; icon: FeatherIconName }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={19} color={colors.forest} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.secondary}>{label}</Text>
    </View>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  const divisor = bytes < 1024 ** 2 ? 1024 : 1024 ** 2;
  return (bytes / divisor).toLocaleString(undefined, { maximumFractionDigits: 1 }) + (divisor === 1024 ? ' KB' : ' MB');
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector(state => state.auth);
  const { items, metadata, connection, isRefreshing } = useAppSelector(state => state.feed);
  const { favourites, isDownloading, error: shelfError } = useAppSelector(state => state.favourites);
  const [focused, setFocused] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const downloadCount = favourites.filter(item => item.mediaStatus === 'ready').length;
  const pendingImages = favourites.filter(item => item.mediaStatus === 'waiting' || item.mediaStatus === 'failed' || item.mediaStatus === 'previous').length;
  const imageBytes = favourites.reduce((total, item) => total + item.imageBytes, 0);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  if (!user) return null;

  const signOut = () => {
    Alert.alert('Sign out?', 'Your saved library stays on this device for this account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { void dispatch(logoutThunk()); } },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      {focused && <StatusBar style="light" />}
      <View style={[styles.masthead, { paddingTop: insets.top + spacing[4] }]}>
        <Earthrise style={styles.horizon} />
        <Text accessibilityRole="header" style={styles.heading}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            {user.image && !avatarFailed && connection !== 'offline'
              ? <Image source={{ uri: user.image }} style={StyleSheet.absoluteFill} onError={() => setAvatarFailed(true)} />
              : <Icon name="user" size={25} color={colors.forest} />}
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.secondary}>@{user.username}</Text>
          </View>
        </View>
        <View style={styles.connection}>
          <Icon name={connection === 'offline' ? 'wifi-off' : 'download-cloud'} color={colors.forest} size={21} />
          <View style={styles.identityCopy}>
            <Text style={styles.connectionTitle}>{connection === 'offline' ? 'You’re offline' : 'Offline library'}</Text>
            <Text style={styles.secondary}>{items.length} feed discoveries · {downloadCount} downloaded favourite images</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Stat label="Saved discoveries" value={String(favourites.length)} icon="bookmark" />
          <Stat label="Favourite images" value={formatBytes(imageBytes)} icon="hard-drive" />
        </View>
        <View style={styles.sources}>
          <Text accessibilityRole="header" style={styles.section}>Source updates</Text>
          {([
            ['nasa-apod', 'NASA Daily Plate'],
            ['spaceflight-news', 'Space Dispatches'],
          ] as const).map(([id, label]) => (
            <View key={id} style={styles.sourceRow}>
              <Text style={styles.sourceLabel}>{label}</Text>
              <Text style={styles.secondary}>{formatSyncTimestamp(metadata[id].lastSyncedAt)}</Text>
              {metadata[id].error && <Text style={styles.error}>{metadata[id].error}</Text>}
            </View>
          ))}
          {connection === 'online' && <Button title="Refresh sources" icon="refresh-cw" variant="outline"
            loading={isRefreshing} onPress={() => { void dispatch(refreshArchive()); }} />}
          {pendingImages > 0 && (
            <Button title="Retry downloads" icon="download" variant="outline"
              loading={isDownloading} disabled={connection !== 'online'}
              onPress={() => { void dispatch(refreshImagesThunk()); }} />
          )}
          {shelfError && <Text accessibilityRole="alert" style={styles.error}>{shelfError}</Text>}
        </View>
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Button loading={isLoading} title="Sign out" onPress={signOut} variant="danger" icon="log-out"
          style={styles.signOut} testID="profile-logout-button" />
        <Text style={styles.secondary}>Earthrise photograph · NASA / Bill Anders</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  scroll: { paddingBottom: spacing[8] },
  masthead: { backgroundColor: colors.forestDark, paddingHorizontal: layout.horizontalInset, paddingBottom: 68 },
  horizon: { ...StyleSheet.absoluteFill },
  heading: { ...typography.display, color: colors.ivory },
  content: { paddingHorizontal: layout.horizontalInset, gap: spacing[4], paddingTop: spacing[3] },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  identityCopy: { flex: 1 },
  avatar: {
    width: 58, height: 58, borderRadius: radii.pill, backgroundColor: colors.sageLight, alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: colors.surface,
  },
  name: { ...typography.h1, color: colors.ink },
  secondary: { ...typography.bodySmall, color: colors.muted },
  connection: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: colors.sageLight,
    padding: spacing[4], borderRadius: radii.md,
  },
  connectionTitle: { ...typography.label, color: colors.forest, fontSize: 14, lineHeight: 20 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  stat: { flexGrow: 1, flexBasis: 116, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing[4], gap: spacing[1] },
  statValue: { ...typography.h2, color: colors.ink },
  sources: { gap: spacing[2] },
  section: { ...typography.h2, color: colors.forest },
  sourceRow: { paddingVertical: spacing[2], borderBottomWidth: 1, borderColor: colors.border },
  sourceLabel: { ...typography.body, color: colors.ink },
  signOut: { borderRadius: radii.pill },
  error: { ...typography.bodySmall, color: colors.danger },
});
