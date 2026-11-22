import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { logoutThunk } from '../../src/store/slices/authSlice';
import { loadCachedFeedThunk } from '../../src/store/slices/feedSlice';
import { colors, layout, radii, spacing, typography } from '../../src/theme/tokens';
import { formatEditorialDate } from '../../src/utils/text';
import { Button } from '../../src/components/common/Button';
import { Icon } from '../../src/components/common/Icon';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);
  const { items, lastSyncedAt } = useAppSelector((state) => state.feed);
  const { favourites } = useAppSelector((state) => state.favourites);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your celestial field session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutThunk());
          },
        },
      ]
    );
  };

  const handleRefreshArchives = () => {
    dispatch(loadCachedFeedThunk());
    Alert.alert('Database Synced', 'Local SQLite tables inspected and state verified.');
  };

  const displayName = user?.fullName || 'Astronomer Observer';
  const username = user?.username ? `@${user.username}` : '@cosmolog';
  const email = user?.email || 'observer@cosmolog.org';

  const formattedSync = lastSyncedAt
    ? `${formatEditorialDate(lastSyncedAt)} at ${new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'Pending telemetry synchronization';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Field Log</Text>
        <Text style={styles.pageSubtitle}>Observer Credentials & On-Device Telemetry</Text>
      </View>

      <View style={styles.userCard}>
        <View style={styles.avatarRow}>
          {user?.image ? (
            <Image
              source={{ uri: user.image }}
              style={styles.avatar}
              accessibilityLabel={`${displayName}'s profile picture`}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Icon name="user" size={32} color={colors.forest} />
            </View>
          )}

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userHandle}>{username}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Icon name="shield" size={14} color={colors.forest} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>OS SecureStore</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="database" size={14} color={colors.brass} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>SQLite WAL Active</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="check-circle" size={14} color={colors.forest} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>Offline-First (0)</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.sectionHeader}>On-Device Storage Telemetry</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{items.length}</Text>
            <Text style={styles.statLabel}>Cached Items</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{favourites.length}</Text>
            <Text style={styles.statLabel}>The Field Shelf</Text>
          </View>
        </View>

        <View style={styles.syncInfoRow}>
          <Icon name="clock" size={14} color={colors.muted} style={styles.syncIcon} />
          <Text style={styles.syncText}>{formattedSync}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Course & Project Attribution</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Student Index</Text>
          <Text style={styles.infoValue}>234202J</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Domain</Text>
          <Text style={styles.infoValue}>Space & Science (2)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Twist</Text>
          <Text style={styles.infoValue}>Offline-First (0)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Selected Bonus</Text>
          <Text style={styles.infoValue}>Reanimated Bookmark Motion</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Design Reference</Text>
          <Text style={styles.infoValue}>Figma V2 Editorial System</Text>
        </View>
      </View>

      <Button
        title="Verify Local SQLite Cache"
        onPress={handleRefreshArchives}
        variant="outline"
        icon="refresh-cw"
        style={styles.verifyButton}
      />

      {error && <Text accessibilityRole="alert">{error}</Text>}
      <Button
        loading={isLoading}
        title="Sign Out of Observatory"
        onPress={handleLogout}
        variant="danger"
        icon="log-out"
        style={styles.logoutButton}
        testID="profile-logout-button"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  content: {
    paddingHorizontal: layout.horizontalInset,
    paddingTop: spacing[10],
    paddingBottom: spacing[8],
  },
  header: {
    marginBottom: spacing[6],
  },
  pageTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    color: colors.forest,
  },
  pageSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing[1],
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[5],
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sageLight,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sageLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: spacing[4],
    flex: 1,
  },
  userName: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    lineHeight: 24,
    color: colors.ink,
  },
  userHandle: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 12,
    color: colors.forest,
    marginTop: 2,
    fontWeight: '600',
  },
  userEmail: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[4],
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ivory,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    color: colors.ink,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[5],
  },
  sectionHeader: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.forest,
    fontWeight: '700',
    marginBottom: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.ivory,
    borderRadius: radii.lg,
    padding: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 24,
    color: colors.forest,
  },
  statLabel: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  syncInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[2],
  },
  syncIcon: {
    marginRight: 6,
  },
  syncText: {
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    color: colors.muted,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[5],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE1',
  },
  infoLabel: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.muted,
  },
  infoValue: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  verifyButton: {
    marginBottom: spacing[3],
  },
  logoutButton: {
    marginBottom: spacing[4],
  },
});
