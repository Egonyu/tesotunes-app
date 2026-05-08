import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ArtworkImage } from '../../src/components/artwork-image';
import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { useMyPlaylists } from '../../src/hooks/use-playlists';
import { useUserLibrary } from '../../src/hooks/use-user-library';
import { useUserProfile } from '../../src/hooks/use-user-profile';
import { useCreditBalance, useWalletBalance } from '../../src/hooks/use-wallet';
import { signOut } from '../../src/services/auth/session';
import { useAuthStore } from '../../src/store/auth-store';
import { colors } from '../../src/theme/colors';

type Shortcut = {
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const MUSIC_SHORTCUTS: Shortcut[] = [
  { label: 'Charts', subtitle: 'Live ranking lanes', icon: 'stats-chart-outline', href: '/charts' },
  { label: 'Playlists', subtitle: 'Manage your mixes', icon: 'musical-notes-outline', href: '/playlists' },
  { label: 'Recently Played', subtitle: 'Resume your flow', icon: 'time-outline', href: '/library/recently-played' },
  { label: 'Downloads', subtitle: 'Offline-ready music', icon: 'download-outline', href: '/library/downloaded' },
  { label: 'Genres', subtitle: 'Browse by sound', icon: 'disc-outline', href: '/genres' },
  { label: 'Events', subtitle: 'Secondary for now', icon: 'calendar-outline', href: '/events' },
];

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ShortcutCard({ item }: { item: Shortcut }) {
  return (
    <Pressable style={styles.shortcutCard} onPress={() => router.push(item.href as never)}>
      <View style={styles.shortcutIconWrap}>
        <Ionicons name={item.icon} size={18} color="#f43f7f" />
      </View>
      <Text style={styles.shortcutLabel}>{item.label}</Text>
      <Text style={styles.shortcutSubtitle}>{item.subtitle}</Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = authStatus === 'authenticated';
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: libraryData, isLoading: isLibraryLoading } = useUserLibrary();
  const { data: playlists, isLoading: arePlaylistsLoading } = useMyPlaylists();
  const { data: walletData } = useWalletBalance();
  const { data: creditData } = useCreditBalance();

  if (!isAuthenticated) {
    return (
      <Screen contentContainerStyle={styles.guestScreen}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Your Space</Text>
          <Text style={styles.heroTitle}>Account, playlists, charts, and music controls live here.</Text>
          <Text style={styles.heroBody}>
            Sign in to manage your profile, jump into your playlists, and keep your listening synced across devices.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/sign-in')}>
            <Text style={styles.primaryButtonLabel}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shortcutGrid}>
          {MUSIC_SHORTCUTS.filter((item) => item.href !== '/events').map((item) => (
            <ShortcutCard key={item.label} item={item} />
          ))}
        </View>
      </Screen>
    );
  }

  const previewPlaylists = (libraryData?.playlists?.length ? libraryData.playlists : playlists ?? []).slice(0, 3);
  const counts = libraryData?.counts;
  const displayName = profile?.displayName || profile?.artistStageName || profile?.name || user?.name || 'TesoTunes Listener';
  const profileBadge = profile?.isArtist ? 'Artist account' : profile?.isPremium ? 'Premium listener' : 'Listener account';
  const locationLabel = [profile?.city, profile?.country].filter(Boolean).join(', ');

  return (
    <Screen>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.profileRow}>
            <ArtworkImage uri={profile?.avatarUrl} palette={['#402010', '#d73569']} style={styles.avatar} />
            <View style={styles.profileMeta}>
              <Text style={styles.eyebrow}>Account</Text>
              <Text style={styles.heroTitle}>{displayName}</Text>
              <Text style={styles.heroBody}>{profile?.email || user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeLabel}>{profileBadge}</Text>
          </View>
          {profile?.isVerified ? (
            <View style={styles.metaBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.accent} />
              <Text style={styles.metaBadgeLabel}>Verified</Text>
            </View>
          ) : null}
          {locationLabel ? (
            <View style={styles.metaBadge}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaBadgeLabel}>{locationLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statRow}>
          <StatPill label="Liked" value={String(counts?.liked_songs ?? 0)} />
          <StatPill label="Playlists" value={String(counts?.playlists ?? previewPlaylists.length)} />
          <StatPill label="Downloads" value={String(counts?.downloads ?? 0)} />
          <StatPill label="Artists" value={String(counts?.followed_artists ?? 0)} />
        </View>
      </View>

      {isProfileLoading || isLibraryLoading || arePlaylistsLoading ? <ActivityIndicator color={colors.accent} /> : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Music controls</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.sectionAction}>Open search</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.shortcutGrid}>
          {MUSIC_SHORTCUTS.map((item) => (
            <ShortcutCard key={item.label} item={item} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your playlists</Text>
          <TouchableOpacity onPress={() => router.push('/playlists')}>
            <Text style={styles.sectionAction}>Manage all</Text>
          </TouchableOpacity>
        </View>

        {previewPlaylists.length === 0 ? (
          <StateMessage
            compact
            title="No playlists yet"
            body="Create your first playlist to start organizing mixes, charts, and downloads."
            actionLabel="Create playlist"
            onActionPress={() => router.push('/playlists/new')}
          />
        ) : (
          previewPlaylists.map((playlist) => (
            <TouchableOpacity key={playlist.id} style={styles.playlistRow} onPress={() => router.push(`/playlists/${playlist.id}` as never)}>
              <ArtworkImage uri={playlist.artworkUrl} palette={playlist.palette} style={styles.playlistArt} />
              <View style={styles.playlistMeta}>
                <Text style={styles.playlistName}>{playlist.name}</Text>
                <Text style={styles.playlistInfo}>
                  {playlist.songCount} songs • {playlist.isPublic ? 'Public' : 'Private'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <TouchableOpacity onPress={() => router.push('/wallet' as never)}>
            <Text style={styles.sectionAction}>Open wallet</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.walletCard} onPress={() => router.push('/wallet' as never)} activeOpacity={0.88}>
          <View style={styles.walletBalances}>
            <View style={styles.walletBalanceBlock}>
              <Text style={styles.walletBalanceLabel}>UGX Balance</Text>
              <Text style={styles.walletBalanceAmount}>
                {walletData ? `UGX ${Math.floor(walletData.ugx_balance).toLocaleString()}` : '—'}
              </Text>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletBalanceBlock}>
              <View style={styles.walletCreditsRow}>
                <Ionicons name="star" size={12} color={colors.accent} />
                <Text style={styles.walletBalanceLabel}>Credits</Text>
              </View>
              <Text style={styles.walletCreditsAmount}>
                {creditData ? creditData.credits_balance.toLocaleString() : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.walletActionBtn} onPress={() => router.push('/wallet/topup' as never)} activeOpacity={0.86}>
              <Ionicons name="add" size={14} color="#07110d" />
              <Text style={styles.walletActionBtnLabel}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletActionBtnGhost} onPress={() => router.push('/wallet/credits' as never)} activeOpacity={0.86}>
              <Ionicons name="star-outline" size={14} color={colors.accent} />
              <Text style={styles.walletActionBtnGhostLabel}>Credits</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile and session</Text>
        </View>

        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/profile/edit')}>
          <View style={styles.actionRowLeft}>
            <Ionicons name="person-circle-outline" size={18} color={colors.text} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Edit profile</Text>
              <Text style={styles.actionSubtitle}>Update your name and account details from the live API.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/subscription' as never)}>
          <View style={styles.actionRowLeft}>
            <Ionicons name="diamond-outline" size={18} color={colors.accent} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Subscription</Text>
              <Text style={styles.actionSubtitle}>
                {profile?.isPremium ? 'Premium active — manage your plan.' : 'Upgrade for high quality audio and unlimited downloads.'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/settings' as never)}>
          <View style={styles.actionRowLeft}>
            <Ionicons name="settings-outline" size={18} color={colors.text} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSubtitle}>Audio quality, account security, and app preferences.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => void signOut()}>
          <View style={styles.actionRowLeft}>
            <Ionicons name="log-out-outline" size={18} color="#fb7185" />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Sign out</Text>
              <Text style={styles.actionSubtitle}>End this session on the device and return to guest mode.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guestScreen: {
    gap: 20,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 14,
    flex: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileMeta: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaBadgeLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: '#0d1522',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionAction: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shortcutCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  shortcutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(244,63,127,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  shortcutSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
  },
  playlistArt: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  playlistMeta: {
    flex: 1,
    gap: 4,
  },
  playlistName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  playlistInfo: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
  },
  actionRowLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  walletCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletBalances: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  walletBalanceBlock: {
    flex: 1,
    gap: 4,
  },
  walletBalanceLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  walletBalanceAmount: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  walletDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  walletCreditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletCreditsAmount: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 10,
  },
  walletActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 10,
  },
  walletActionBtnLabel: {
    color: '#07110d',
    fontSize: 13,
    fontWeight: '800',
  },
  walletActionBtnGhost: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 10,
  },
  walletActionBtnGhostLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
});
