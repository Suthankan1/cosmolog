import { useTabContentInset } from '../../src/navigation/useTabContentInset';
import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { logoutThunk } from '../../src/store/slices/authSlice';
import { refreshImagesThunk } from '../../src/store/slices/favouritesSlice';
import { refreshArchive } from '../../src/store/archiveLifecycle';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/ThemeContext';
import { Button } from '../../src/components/common/Button';
import { Icon, type FeatherIconName } from '../../src/components/common/Icon';
import { formatSyncTimestamp } from '../../src/utils/text';

function Stat({ value, label, icon }: { value: string; label: string; icon: FeatherIconName }) {
  const { isNight, colors: themeColors } = useTheme();
  return (
    <View style={[styles.stat, isNight && { backgroundColor: themeColors.surface }]}>
      <Icon name={icon} size={19} color={isNight ? themeColors.forest : colors.forest} />
      <Text style={[styles.statValue, isNight && { color: themeColors.ink }]}>{value}</Text>
      <Text style={[styles.secondary, isNight && { color: themeColors.muted }]}>{label}</Text>
    </View>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  const divisor = bytes < 1024 ** 2 ? 1024 : 1024 ** 2;
  return (bytes / divisor).toLocaleString(undefined, { maximumFractionDigits: 1 }) + (divisor === 1024 ? ' KB' : ' MB');
}

export default function ProfileScreen() {
  const router = useRouter();
  const paddingBottom = useTabContentInset();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isNight, colors: themeColors, toggleTheme } = useTheme();
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
    <ScrollView style={[styles.screen, isNight && { backgroundColor: themeColors.background }]} contentContainerStyle={[styles.scroll, { paddingBottom }]}>
      {focused && <StatusBar style="light" />}
      <View style={[styles.masthead, { paddingTop: insets.top + spacing[4] }, isNight && { backgroundColor: themeColors.surface }]}>
        <Image source={require('../../assets/brand/cosmolog-mark-ivory.png')} style={styles.mark} accessible={false} />
        <Text accessibilityRole="header" style={styles.heading}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            {user.image && !avatarFailed && connection !== 'offline'
              ? <Image source={{ uri: user.image }} style={StyleSheet.absoluteFill} onError={() => setAvatarFailed(true)} />
              : <Icon name="user" size={25} color={isNight ? themeColors.forest : colors.forest} />}
          </View>
          <View style={styles.identityCopy}>
            <Text style={[styles.name, isNight && { color: themeColors.forest }]}>{user.fullName}</Text>
            <Text style={[styles.secondary, isNight && { color: themeColors.muted }]}>@{user.username}</Text>
          </View>
        </View>
        <View style={[styles.connection, isNight && { backgroundColor: themeColors.sageLight }]}>
          <Icon name={connection === 'offline' ? 'wifi-off' : 'download-cloud'} color={isNight ? themeColors.forest : colors.forest} size={21} />
          <View style={styles.identityCopy}>
            <Text style={[styles.connectionTitle, isNight && { color: themeColors.forest }]}>{connection === 'offline' ? 'You’re offline' : 'Offline library'}</Text>
            <Text style={[styles.secondary, isNight && { color: themeColors.muted }]}>{items.length} feed discoveries · {downloadCount} downloaded favourite images</Text>
          </View>
        </View>
        <Button
          title="Expedition packs"
          icon="compass"
          variant="outline"
          onPress={() => router.push('/reading-packs' as never)}
        />
        <Button
          title="Offline library & storage"
          icon="hard-drive"
          variant="outline"
          onPress={() => router.push('/offline-library' as never)}
        />
        <View style={[styles.settingCard, isNight && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.settingCardHeader}>
            <Icon name="moon" size={20} color={isNight ? themeColors.forest : colors.forest} />
            <View style={styles.settingCardCopy}>
              <Text style={[styles.settingTitle, isNight && { color: themeColors.forest }]}>Night Observation Mode</Text>
              <Text style={[styles.settingDescription, isNight && { color: themeColors.muted }]}>
                High-contrast red-on-charcoal theme designed for dark sky viewing at the telescope. System dialogs use OS appearance.
              </Text>
            </View>
            <Switch
              value={isNight}
              onValueChange={() => { void toggleTheme(); }}
              trackColor={{ false: isNight ? themeColors.border : colors.border, true: themeColors.forest }}
              thumbColor={isNight ? themeColors.brass : colors.surface}
              accessibilityRole="switch"
              accessibilityLabel="Night Observation Mode"
              accessibilityHint="Toggles between default editorial and night observation palettes"
              testID="night-mode-switch"
            />
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

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  scroll: { paddingBottom: spacing[8] },
  masthead: { backgroundColor: colors.forestDark, paddingHorizontal: layout.horizontalInset, paddingBottom: spacing[5], flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  mark: { width: 44, height: 44 },
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
  sources: { gap: spacing[2], borderTopWidth: 2, borderColor: colors.terracotta, paddingTop: spacing[4] },
  section: { ...typography.h2, color: colors.forest },
  sourceRow: { paddingVertical: spacing[2], borderBottomWidth: 1, borderColor: colors.border },
  sourceLabel: { ...typography.body, color: colors.ink },
  signOut: { borderRadius: radii.pill },
  error: { ...typography.bodySmall, color: colors.danger },
  settingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  settingCardCopy: {
    flex: 1,
  },
  settingTitle: {
    ...typography.label,
    fontSize: 15,
    color: colors.forest,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: 2,
  },
});
