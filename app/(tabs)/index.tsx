import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureResponderEvent, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ArtworkImage } from '../../src/components/artwork-image';
import { AlbumCard, ArtistCard, ChartCard, SectionHeader, TrackRow } from '../../src/components/media';
import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { useMobileHome } from '../../src/hooks/use-mobile-home';
import { useAddToQueue } from '../../src/hooks/use-player-queue';
import { useUserLibrary } from '../../src/hooks/use-user-library';
import { ensureRemotePlaybackTrack } from '../../src/services/api/playback';
import { useAuthStore } from '../../src/store/auth-store';
import { usePlayerStore } from '../../src/store/player-store';
import { colors } from '../../src/theme/colors';

function buildArtistLedTitle(artists: Array<{ name: string }>, fallback: string) {
  return artists[0] ? `More like ${artists[0].name}` : fallback;
}

function buildArtistLedSubtitle(artists: Array<{ name: string }>, fallback: string) {
  if (artists.length >= 2) {
    return `${artists[0].name}, ${artists[1].name} and more`;
  }

  if (artists[0]) {
    return `${artists[0].name} and related sounds`;
  }

  return fallback;
}

function normalizeName(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function buildContextActionLabel(prefix: string, value?: string | null, fallback = 'Open') {
  if (!value) {
    return fallback;
  }

  const compact = value.length > 14 ? `${value.slice(0, 14).trim()}...` : value;
  return `${prefix} ${compact}`;
}

function handleNestedPress(event: GestureResponderEvent, action?: () => void) {
  event.stopPropagation();
  action?.();
}

function resolveTrackDestination(track: {
  id: string;
  albumId?: string;
  artistId?: string;
}) {
  if (track.albumId) {
    return `/album/${track.albumId}`;
  }

  if (track.artistId) {
    return `/artist/${track.artistId}`;
  }

  return '/search';
}

function FilterChip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active ? styles.filterChipActive : styles.filterChipIdle,
        pressed ? styles.pressedControl : null,
      ]}
    >
      <Text style={[styles.filterChipLabel, active ? styles.filterChipLabelActive : styles.filterChipLabelIdle]}>
        {label}
      </Text>
    </Pressable>
  );
}

function QuickAccessTile({
  title,
  subtitle,
  artworkUrl,
  palette,
  onPress,
}: {
  title: string;
  subtitle?: string;
  artworkUrl?: string | null;
  palette: [string, string];
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.quickTile, pressed ? styles.pressedCard : null]} onPress={onPress}>
      <ArtworkImage uri={artworkUrl} palette={palette} style={styles.quickTileArt} />
      <View style={styles.quickTileMeta}>
        <Text style={styles.quickTileTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.quickTileSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function EditorialCard({
  eyebrow,
  title,
  subtitle,
  palette,
  artworkUrl,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  palette: [string, string];
  artworkUrl?: string | null;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
}) {
  return (
    <LinearGradient colors={palette} style={styles.editorialCard}>
      <View style={styles.editorialMeta}>
        <Text style={styles.editorialEyebrow}>{eyebrow}</Text>
        <Text style={styles.editorialTitle}>{title}</Text>
        <Text style={styles.editorialSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.editorialBottomRow}>
        <View style={styles.editorialArtWrap}>
          <ArtworkImage uri={artworkUrl} palette={palette} style={styles.editorialArt} />
        </View>
        <View style={styles.editorialActions}>
          {secondaryLabel ? (
            <TouchableOpacity style={styles.editorialGhostButton} activeOpacity={0.88} onPress={onSecondaryPress}>
              <Text style={styles.editorialGhostButtonLabel}>{secondaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.editorialPrimaryButton} activeOpacity={0.88} onPress={onPrimaryPress}>
            <Ionicons name="play" size={16} color="#0b0b0b" />
            <Text style={styles.editorialPrimaryButtonLabel}>{primaryLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

function CollectionCard({
  title,
  subtitle,
  artworkUrl,
  palette,
  tone,
  ctaLabel,
  onPress,
  onPlayPress,
  onAddPress,
}: {
  title: string;
  subtitle: string;
  artworkUrl?: string | null;
  palette: [string, string];
  tone: string;
  ctaLabel: string;
  onPress: () => void;
  onPlayPress?: () => void;
  onAddPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.collectionCard, { backgroundColor: tone }]} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.collectionTopRow}>
        <ArtworkImage uri={artworkUrl} palette={palette} style={styles.collectionArt} />
        <TouchableOpacity hitSlop={10} style={styles.collectionKebab}>
          <Ionicons name="ellipsis-vertical" size={16} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
      <View style={styles.collectionMeta}>
        <Text style={styles.collectionTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.collectionSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.collectionActions}>
        <TouchableOpacity style={styles.collectionOutlineButton} activeOpacity={0.88}>
          <Ionicons name="sparkles-outline" size={14} color="rgba(255,255,255,0.88)" />
          <Text style={styles.collectionOutlineButtonLabel}>{ctaLabel}</Text>
        </TouchableOpacity>
        <View style={styles.collectionActionIcons}>
          <TouchableOpacity hitSlop={10} onPress={(event) => handleNestedPress(event, onAddPress)}>
            <Ionicons name="add-circle-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={10} onPress={(event) => handleNestedPress(event, onPlayPress)}>
            <Ionicons name="play-circle" size={34} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HomeRailCard({
  badge,
  title,
  subtitle,
  artworkUrl,
  palette,
  variant = 'standard',
  onPress,
  onPlayPress,
  onAddPress,
}: {
  badge?: string;
  title: string;
  subtitle: string;
  artworkUrl?: string | null;
  palette: [string, string];
  variant?: 'standard' | 'tall' | 'wide';
  onPress: () => void;
  onPlayPress?: () => void;
  onAddPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.homeRailCardBase,
        styles.homeRailCard,
        variant === 'tall' ? styles.homeRailCardTall : null,
        variant === 'wide' ? styles.homeRailCardWide : null,
        pressed ? styles.pressedCard : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.homeRailArtWrap}>
        <ArtworkImage
          uri={artworkUrl}
          palette={palette}
          style={[
            styles.homeRailArt,
            variant === 'tall' ? styles.homeRailArtTall : null,
            variant === 'wide' ? styles.homeRailArtWide : null,
          ]}
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.32)']} style={styles.homeRailArtShade} />
        {badge ? (
          <View style={styles.homeRailBadge}>
            <Text style={styles.homeRailBadgeLabel}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.homeRailTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.homeRailSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
      {(onPlayPress || onAddPress) ? (
        <View style={styles.homeRailActions}>
          <Pressable
            style={({ pressed }) => [styles.homeRailIconButton, pressed ? styles.pressedControl : null]}
            onPress={(event) => handleNestedPress(event, onAddPress)}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.homeRailPlayButton, pressed ? styles.pressedPrimaryControl : null]}
            onPress={(event) => handleNestedPress(event, onPlayPress)}
          >
            <Ionicons name="play" size={14} color="#0b0b0b" />
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

function FeatureRailCard({
  eyebrow,
  title,
  subtitle,
  accentLabel,
  artworkUrl,
  palette,
  onPress,
  onPlayPress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  accentLabel?: string;
  artworkUrl?: string | null;
  palette: [string, string];
  onPress: () => void;
  onPlayPress?: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.featureRailCard, pressed ? styles.pressedCard : null]} onPress={onPress}>
      <LinearGradient colors={palette} style={styles.featureRailGradient}>
        <View style={styles.featureRailMeta}>
          <View style={styles.featureRailHeaderRow}>
            <Text style={styles.featureRailEyebrow}>{eyebrow}</Text>
            {accentLabel ? (
              <View style={styles.featureRailAccentPill}>
                <Text style={styles.featureRailAccentPillLabel}>{accentLabel}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.featureRailTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.featureRailSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.featureRailArtWrap}>
          <ArtworkImage uri={artworkUrl} palette={palette} style={styles.featureRailArt} />
          {onPlayPress ? (
            <Pressable
              style={({ pressed }) => [styles.featureRailPlayButton, pressed ? styles.pressedPrimaryControl : null]}
              onPress={(event) => handleNestedPress(event, onPlayPress)}
            >
              <Ionicons name="play" size={18} color="#0b0b0b" />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function HomeScreen() {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = authStatus === 'authenticated';
  const { data, isLoading } = useMobileHome();
  const { data: libraryData, isLoading: isLibraryLoading } = useUserLibrary();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setPlaybackError = usePlayerStore((state) => state.setPlaybackError);
  const addToQueue = useAddToQueue();

  const albums = data?.albums ?? [];
  const artists = data?.artists ?? [];
  const tracks = data?.tracks ?? [];
  const charts = data?.charts ?? [];
  const recentPlays = libraryData?.recentPlays ?? [];
  const likedSongs = libraryData?.likedSongs ?? [];
  const playlists = libraryData?.playlists ?? [];
  const counts = libraryData?.counts;

  const firstName = user?.name?.trim()?.split(' ')[0] ?? 'there';
  const heroChart = charts[0];
  const heroPlaylist = playlists[0];
  const heroAlbum = albums[0];
  const heroTrack = tracks[0];
  const preferenceSeedTracks = (recentPlays.length > 0 ? recentPlays : likedSongs).slice(0, 12);
  const madeForYou = preferenceSeedTracks.slice(0, 8);
  const biggestHitsTracks = tracks.slice(0, 6);
  const freshTracks = tracks.slice(2, 8);
  const recentMixTracks = recentPlays.slice(0, 6);
  const albumsWorthSpinning = albums.slice(0, 8);
  const risingArtists = artists.slice(0, 8);
  const topCharts = charts.slice(0, 8);
  const heroHitTrack = biggestHitsTracks[0];
  const supportingHitTracks = biggestHitsTracks.slice(1);
  const heroFreshTrack = freshTracks[0];
  const supportingFreshTracks = freshTracks.slice(1);
  const preferenceArtist = recentPlays[0]?.artist ?? likedSongs[0]?.artist ?? artists[0]?.name;
  const preferenceArtistKey = normalizeName(preferenceArtist);
  const relatedPlaylist =
    playlists.find((playlist) => normalizeName(playlist.name).includes(preferenceArtistKey)) ?? playlists[0];
  const relatedAlbum =
    albums.find((album) => normalizeName(album.artist) === preferenceArtistKey) ??
    albums.find((album) => madeForYou.some((track) => track.albumId === album.id)) ??
    albums[0];
  const relatedArtist =
    artists.find((artist) => normalizeName(artist.name) === preferenceArtistKey) ?? artists[0];
  const madeForYouHeadline = preferenceArtist ?? artists[0]?.name ?? 'your listening';
  const madeForYouDescription = recentPlays.length
    ? `Based on your recent listening around ${madeForYouHeadline}.`
    : likedSongs.length
      ? `Shaped by what you already like, starting with ${madeForYouHeadline}.`
      : 'Your mixes will sharpen as your listening activity grows.';
  const freshLaneTitle = heroAlbum?.year ? `New from ${heroAlbum.year}` : 'Fresh new music';
  const freshLaneSubtitle = heroAlbum
    ? `${heroAlbum.title} and more current releases`
    : 'New releases and current momentum across the catalog';
  const artistLedAlbums = albums.filter((album) => album.artist === (artists[0]?.name ?? album.artist)).slice(0, 6);
  const personalizedAlbumRail = artistLedAlbums.length > 0 ? artistLedAlbums : albums.slice(0, 6);
  const personalizedAlbumTitle = buildArtistLedTitle(artists, 'Albums for your rotation');
  const personalizedAlbumSubtitle = buildArtistLedSubtitle(artists, 'Artist-led picks from the live catalog');
  const recentLaneBadge = recentPlays.length > 0 ? 'CONTINUE' : 'START HERE';
  const biggestHitsBadge = heroChart?.momentumLabel ?? 'TRENDING';
  const freshBadge = heroAlbum?.year ? heroAlbum.year : 'NEW';

  const quickTiles = [
    heroPlaylist
      ? {
          key: `playlist-${heroPlaylist.id}`,
          title: heroPlaylist.name,
          subtitle: `${heroPlaylist.songCount} songs`,
          artworkUrl: heroPlaylist.artworkUrl,
          palette: heroPlaylist.palette,
          path: `/playlists/${heroPlaylist.id}`,
        }
      : null,
    heroChart
      ? {
          key: `chart-${heroChart.id}`,
          title: heroChart.title,
          subtitle: heroChart.genre,
          artworkUrl: heroChart.artworkUrl,
          palette: heroChart.palette,
          path: `/charts/${heroChart.sourceId ?? heroChart.id}`,
        }
      : null,
    heroAlbum
      ? {
          key: `album-${heroAlbum.id}`,
          title: heroAlbum.title,
          subtitle: heroAlbum.artist,
          artworkUrl: heroAlbum.artworkUrl,
          palette: heroAlbum.palette,
          path: `/album/${heroAlbum.sourceId ?? heroAlbum.id}`,
        }
      : null,
    artists[0]
      ? {
          key: `artist-${artists[0].id}`,
          title: artists[0].name,
          subtitle: 'Artist',
          artworkUrl: artists[0].artworkUrl,
          palette: artists[0].palette,
          path: `/artist/${artists[0].sourceId ?? artists[0].id}`,
        }
      : null,
    {
      key: 'quick-search',
      title: 'Search the catalog',
      subtitle: 'Songs, artists, albums',
      artworkUrl: null,
      palette: ['#26334d', '#1b1d26'] as [string, string],
      path: '/search',
    },
    {
      key: 'quick-downloads',
      title: isAuthenticated ? 'Offline songs' : 'Downloads',
      subtitle: isAuthenticated ? `${counts?.downloads ?? 0} ready or queued` : 'Save songs for offline listening',
      artworkUrl: null,
      palette: ['#314433', '#17201a'] as [string, string],
      path: isAuthenticated ? '/library/downloaded' : '/sign-in',
    },
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    subtitle: string;
    artworkUrl?: string | null;
    palette: [string, string];
    path: string;
  }>;

  const discoveryCards = [
    heroChart
      ? {
          key: `discovery-chart-${heroChart.id}`,
          title: heroChart.title,
          subtitle: `${heroChart.genre} chart`,
          artworkUrl: heroChart.artworkUrl,
          palette: heroChart.palette,
          path: `/charts/${heroChart.sourceId ?? heroChart.id}`,
        }
      : null,
    albums[1]
      ? {
          key: `discovery-album-${albums[1].id}`,
          title: albums[1].title,
          subtitle: albums[1].artist,
          artworkUrl: albums[1].artworkUrl,
          palette: albums[1].palette,
          path: `/album/${albums[1].sourceId ?? albums[1].id}`,
        }
      : null,
    artists[1]
      ? {
          key: `discovery-artist-${artists[1].id}`,
          title: artists[1].name,
          subtitle: artists[1].monthlyListeners,
          artworkUrl: artists[1].artworkUrl,
          palette: artists[1].palette,
          path: `/artist/${artists[1].sourceId ?? artists[1].id}`,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    subtitle: string;
    artworkUrl?: string | null;
    palette: [string, string];
    path: string;
  }>;

  const richCollectionCards = [
    relatedPlaylist
      ? {
          key: `collection-playlist-${relatedPlaylist.id}`,
          title: relatedPlaylist.name,
          subtitle: preferenceArtist
            ? `Because you keep coming back to ${preferenceArtist}`
            : `${relatedPlaylist.songCount} songs${relatedPlaylist.ownerName ? ` • ${relatedPlaylist.ownerName}` : ''}`,
          artworkUrl: relatedPlaylist.artworkUrl,
          palette: relatedPlaylist.palette,
          tone: '#415b17',
          ctaLabel: 'Preview playlist',
          path: `/playlists/${relatedPlaylist.id}`,
        }
      : null,
    relatedAlbum
      ? {
          key: `collection-album-${relatedAlbum.id}`,
          title: relatedAlbum.title,
          subtitle: preferenceArtist
            ? `${relatedAlbum.artist} feels closest to your current lane`
            : `${relatedAlbum.artist}${relatedAlbum.year ? ` • ${relatedAlbum.year}` : ''}`,
          artworkUrl: relatedAlbum.artworkUrl,
          palette: relatedAlbum.palette,
          tone: '#30455f',
          ctaLabel: 'Preview album',
          path: `/album/${relatedAlbum.sourceId ?? relatedAlbum.id}`,
        }
      : null,
    relatedArtist
      ? {
          key: `collection-artist-${relatedArtist.id}`,
          title: relatedArtist.name,
          subtitle: recentPlays.length
            ? 'An artist you are already leaning into'
            : relatedArtist.monthlyListeners,
          artworkUrl: relatedArtist.artworkUrl,
          palette: relatedArtist.palette,
          tone: '#6a2338',
          ctaLabel: 'Open artist',
          path: `/artist/${relatedArtist.sourceId ?? relatedArtist.id}`,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    subtitle: string;
    artworkUrl?: string | null;
    palette: [string, string];
    tone: string;
    ctaLabel: string;
    path: string;
  }>;

  const discoveryActionPath = discoveryCards[0]?.path ?? '/search';
  const discoveryActionLabel = buildContextActionLabel('Open', discoveryCards[0]?.title, 'Explore');
  const freshActionPath = heroFreshTrack ? resolveTrackDestination(heroFreshTrack) : '/albums';
  const freshActionLabel = heroFreshTrack?.albumId
    ? 'Open release'
    : buildContextActionLabel('Open', heroFreshTrack?.artist, 'See albums');
  const personalizedActionPath = relatedArtist
    ? `/artist/${relatedArtist.sourceId ?? relatedArtist.id}`
    : '/artists';
  const personalizedActionLabel = buildContextActionLabel('Open', relatedArtist?.name, 'Browse artists');
  const jumpBackActionPath = tracks[0] ? resolveTrackDestination(tracks[0]) : '/search';
  const jumpBackActionLabel = tracks[0]?.albumId ? 'Open album' : tracks[0]?.artistId ? 'Open artist' : 'See all';
  const recentActionPath = recentMixTracks[0] ? resolveTrackDestination(recentMixTracks[0]) : '/library/recently-played';
  const recentActionLabel = recentMixTracks[0]?.albumId ? 'Open release' : 'Open history';

  async function handleTrackPlay(track: (typeof tracks)[number], queue: typeof tracks = tracks) {
    try {
      const resolved = await ensureRemotePlaybackTrack(track, token ?? undefined);
      const resolvedQueue = await Promise.all(
        queue.map(async (queueTrack) =>
          queueTrack.id === track.id ? resolved : queueTrack.playbackUri || !queueTrack.sourceId
            ? queueTrack
            : queueTrack
        )
      );
      playTrack(resolved, resolvedQueue);
      router.push('/player' as never);
    } catch {
      setPlaybackError('This track does not have a playable audio source yet.');
    }
  }

  function handleTrackQueue(track: (typeof tracks)[number]) {
    if (!track.sourceId) {
      return;
    }

    addToQueue.mutate(track.sourceId);
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarBubbleLabel}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.topBarMeta}>
            <Text style={styles.topBarGreeting}>{isAuthenticated ? `Good evening, ${firstName}` : 'Discover TesoTunes'}</Text>
            <Text style={styles.topBarSubtitle}>
              {heroChart
                ? `${heroChart.genre} is moving fastest right now.`
                : 'Fresh music, charts, playlists, and offline listening.'}
            </Text>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.88} onPress={() => router.push('/search' as never)}>
              <Ionicons name="search" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.88} onPress={() => router.push('/more' as never)}>
              <Ionicons name="person-circle-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label="All" active />
          <FilterChip label="Music" onPress={() => router.push('/search' as never)} />
          <FilterChip label="Charts" onPress={() => router.push('/charts' as never)} />
          <FilterChip label="Library" onPress={() => router.push(isAuthenticated ? ('/library' as never) : ('/sign-in' as never))} />
        </ScrollView>

        <View style={styles.quickGrid}>
          {quickTiles.map((tile) => (
            <QuickAccessTile
              key={tile.key}
              title={tile.title}
              subtitle={tile.subtitle}
              artworkUrl={tile.artworkUrl}
              palette={tile.palette}
              onPress={() => router.push(tile.path as never)}
            />
          ))}
        </View>

        <EditorialCard
          eyebrow={heroChart ? `${heroChart.genre} now` : 'For your session'}
          title={heroChart?.title ?? 'Stay close to the music'}
          subtitle={
            heroChart
              ? `${heroChart.songCount} tracks climbing across the live chart feed.`
              : 'Pick up your playlists, trending songs, and offline catalog in one place.'
          }
          palette={heroChart?.palette ?? ['#6a1e1e', '#111827']}
          artworkUrl={heroChart?.artworkUrl}
          primaryLabel="Play"
          secondaryLabel={heroChart ? 'Open chart' : 'Browse'}
          onPrimaryPress={() =>
            heroTrack
              ? void router.push('/player' as never)
              : router.push((heroChart ? `/charts/${heroChart.sourceId ?? heroChart.id}` : '/search') as never)
          }
          onSecondaryPress={() =>
            router.push((heroChart ? `/charts/${heroChart.sourceId ?? heroChart.id}` : '/search') as never)
          }
        />

        <View style={styles.section}>
          <SectionHeader
            title="Made for you"
            action={isAuthenticated ? buildContextActionLabel('Open', relatedArtist?.name, 'Library') : 'Sign in'}
            onActionPress={() =>
              router.push(
                isAuthenticated
                  ? ((relatedArtist ? `/artist/${relatedArtist.sourceId ?? relatedArtist.id}` : '/library/recently-played') as never)
                  : ('/sign-in' as never)
              )
            }
          />
          <Text style={styles.sectionContextLabel}>{madeForYouDescription}</Text>
          {richCollectionCards.length > 0 ? (
            <View style={styles.collectionStack}>
              {richCollectionCards.map((card) => (
                <CollectionCard
                  key={card.key}
                  title={card.title}
                  subtitle={card.subtitle}
                  artworkUrl={card.artworkUrl}
                  palette={card.palette}
                  tone={card.tone}
                  ctaLabel={card.ctaLabel}
                  onPress={() => router.push(card.path as never)}
                  onAddPress={heroTrack?.sourceId ? () => handleTrackQueue(heroTrack) : undefined}
                  onPlayPress={heroTrack ? () => void handleTrackPlay(heroTrack, tracks) : undefined}
                />
              ))}
            </View>
          ) : (
            <StateMessage
              compact
              title={isAuthenticated ? 'Personal mixes are still warming up' : 'Sign in for personal recommendations'}
              body={
                isAuthenticated
                  ? 'Once your listening history grows, this area will turn into richer recommendation shelves.'
                  : 'Your mixes, recently played, and personal rails will show here after sign in.'
              }
              actionLabel={isAuthenticated ? 'Browse music' : 'Sign in'}
              onActionPress={() => router.push(isAuthenticated ? ('/search' as never) : ('/sign-in' as never))}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's biggest hits" action="Browse charts" onActionPress={() => router.push('/charts' as never)} />
          {heroHitTrack ? (
            <FeatureRailCard
              eyebrow={heroChart ? `${heroChart.genre} momentum` : 'Trending now'}
              title={heroHitTrack.title}
              subtitle={`${heroHitTrack.artist} is leading your current hit lane.`}
              accentLabel={biggestHitsBadge}
              artworkUrl={heroHitTrack.artworkUrl}
              palette={heroHitTrack.palette}
              onPress={() => router.push(resolveTrackDestination(heroHitTrack) as never)}
              onPlayPress={() => void handleTrackPlay(heroHitTrack, biggestHitsTracks)}
            />
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryRail}>
            {supportingHitTracks.map((track) => (
              <HomeRailCard
                key={`biggest-hit-${track.id}`}
                badge="HOT"
                title={track.title}
                subtitle={track.artist}
                artworkUrl={track.artworkUrl}
                palette={track.palette}
                variant="tall"
                onPress={() => router.push(resolveTrackDestination(track) as never)}
                onPlayPress={() => void handleTrackPlay(track, biggestHitsTracks)}
                onAddPress={track.sourceId ? () => handleTrackQueue(track) : undefined}
              />
            ))}
          </ScrollView>
          {!biggestHitsTracks.length && !isLoading ? (
            <StateMessage
              compact
              title="No hit songs yet"
              body="As trending songs arrive from the live API, this lane will surface the biggest movers first."
              actionLabel="Search catalog"
              onActionPress={() => router.push('/search' as never)}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Discover something new"
            action={discoveryActionLabel}
            onActionPress={() => router.push(discoveryActionPath as never)}
          />
          {discoveryCards.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryRail}>
              {discoveryCards.map((card) => (
                <HomeRailCard
                  key={card.key}
                  badge="DISCOVER"
                  title={card.title}
                  subtitle={card.subtitle}
                  artworkUrl={card.artworkUrl}
                  palette={card.palette}
                  variant="wide"
                  onPress={() => router.push(card.path as never)}
                />
              ))}
            </ScrollView>
          ) : (
            <StateMessage
              compact
              title="No discovery cards yet"
              body="Live discovery rails will show here as soon as albums, artists, and charts are returned together."
              actionLabel="Open search"
              onActionPress={() => router.push('/search' as never)}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title={freshLaneTitle} action={freshActionLabel} onActionPress={() => router.push(freshActionPath as never)} />
          <Text style={styles.sectionContextLabel}>{freshLaneSubtitle}</Text>
          {heroFreshTrack ? (
            <FeatureRailCard
              eyebrow="Fresh pick"
              title={heroFreshTrack.title}
              subtitle={`${heroFreshTrack.artist} is shaping this release lane.`}
              accentLabel={freshBadge}
              artworkUrl={heroFreshTrack.artworkUrl}
              palette={heroFreshTrack.palette}
              onPress={() => router.push(resolveTrackDestination(heroFreshTrack) as never)}
              onPlayPress={() => void handleTrackPlay(heroFreshTrack, freshTracks)}
            />
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryRail}>
            {supportingFreshTracks.map((track) => (
              <HomeRailCard
                key={`fresh-track-${track.id}`}
                badge="FRESH"
                title={track.title}
                subtitle={track.artist}
                artworkUrl={track.artworkUrl}
                palette={track.palette}
                onPress={() => router.push(resolveTrackDestination(track) as never)}
                onPlayPress={() => void handleTrackPlay(track, freshTracks)}
                onAddPress={track.sourceId ? () => handleTrackQueue(track) : undefined}
              />
            ))}
          </ScrollView>
          {!freshTracks.length && !isLoading ? (
            <StateMessage
              compact
              title="No fresh picks yet"
              body="This rail will fill with newer releases and active songs as live catalog depth expands."
              actionLabel="Browse albums"
              onActionPress={() => router.push('/albums' as never)}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Popular artists" action="Browse" onActionPress={() => router.push('/artists' as never)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {risingArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </ScrollView>
          {!artists.length && !isLoading ? (
            <StateMessage
              compact
              title="No artists yet"
              body="Popular artists will show up here once the live catalog expands."
              actionLabel="Open search"
              onActionPress={() => router.push('/search' as never)}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Featured charts" action="See all" onActionPress={() => router.push('/charts' as never)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {topCharts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} onPress={() => router.push(`/charts/${chart.sourceId ?? chart.id}` as never)} />
            ))}
          </ScrollView>
          {!charts.length && !isLoading ? (
            <StateMessage
              compact
              title="No charts yet"
              body="Charts will appear here once enough genre activity lands in production."
              actionLabel="Browse genres"
              onActionPress={() => router.push('/genres' as never)}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={isLoading ? 'Loading music' : 'Jump back in'}
            action={tracks.length > 0 ? jumpBackActionLabel : undefined}
            onActionPress={tracks.length > 0 ? () => router.push(jumpBackActionPath as never) : undefined}
          />
          <View style={styles.trackList}>
            {tracks.slice(0, 6).map((track) => (
              <TrackRow key={track.id} track={track} queue={tracks} />
            ))}
          </View>
          {!tracks.length && !isLoading ? (
            <StateMessage
              compact
              title="No songs yet"
              body="Trending songs will appear here when the API returns live catalog data."
              actionLabel="Search catalog"
              onActionPress={() => router.push('/search' as never)}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={personalizedAlbumTitle}
            action={personalizedActionLabel}
            onActionPress={() => router.push(personalizedActionPath as never)}
          />
          <Text style={styles.sectionContextLabel}>{personalizedAlbumSubtitle}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {personalizedAlbumRail.map((album) => (
              <AlbumCard key={`artist-led-${album.id}`} album={album} />
            ))}
          </ScrollView>
          {!personalizedAlbumRail.length && !isLoading ? (
            <StateMessage
              compact
              title="No artist-led albums yet"
              body="As artists and albums grow in the live catalog, this rail will cluster around the artists people keep returning to."
              actionLabel="Browse albums"
              onActionPress={() => router.push('/albums' as never)}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Recently played"
            action={recentPlays.length > 0 ? 'View all' : undefined}
            onActionPress={recentPlays.length > 0 ? () => router.push('/library/recently-played' as never) : undefined}
          />
          <View style={styles.trackList}>
            {recentPlays.slice(0, 6).map((track) => (
              <TrackRow key={`recent-play-${track.id}`} track={track} queue={recentPlays} />
            ))}
          </View>
          {!recentPlays.length && !isLibraryLoading ? (
            <StateMessage
              compact
              title={isAuthenticated ? 'No recent plays yet' : 'Sign in for recent plays'}
              body={
                isAuthenticated
                  ? 'Your recent listening will appear here once you start playing songs in the app.'
                  : 'Your recent listening history is available once you sign in.'
              }
              actionLabel={isAuthenticated ? 'Start listening' : 'Sign in'}
              onActionPress={() => router.push(isAuthenticated ? ('/search' as never) : ('/sign-in' as never))}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={recentPlays.length > 0 ? 'Based on your recent listening' : 'Start your recent lane'}
            action={recentMixTracks.length > 0 ? recentActionLabel : undefined}
            onActionPress={recentMixTracks.length > 0 ? () => router.push(recentActionPath as never) : undefined}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryRail}>
            {recentMixTracks.map((track) => (
              <HomeRailCard
                key={`recent-lane-${track.id}`}
                badge={recentLaneBadge}
                title={track.title}
                subtitle={track.artist}
                artworkUrl={track.artworkUrl}
                palette={track.palette}
                variant="wide"
                onPress={() => router.push(resolveTrackDestination(track) as never)}
                onPlayPress={() => void handleTrackPlay(track, recentMixTracks)}
                onAddPress={track.sourceId ? () => handleTrackQueue(track) : undefined}
              />
            ))}
          </ScrollView>
          {!recentMixTracks.length && !isLibraryLoading ? (
            <StateMessage
              compact
              title={isAuthenticated ? 'No recent lane yet' : 'Sign in to unlock recent lanes'}
              body={
                isAuthenticated
                  ? 'Once you play a few songs, this becomes a stronger continuation rail.'
                  : 'Recent listening-driven rails appear after sign in and playback activity.'
              }
              actionLabel={isAuthenticated ? 'Start listening' : 'Sign in'}
              onActionPress={() => router.push(isAuthenticated ? ('/search' as never) : ('/sign-in' as never))}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Albums worth a spin"
            action="Browse"
            onActionPress={() => router.push('/albums' as never)}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {albumsWorthSpinning.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </ScrollView>
          {!albums.length && !isLoading ? (
            <StateMessage
              compact
              title="No albums yet"
              body="Album highlights will appear here once live album catalog data is available."
              actionLabel="Open search"
              onActionPress={() => router.push('/search' as never)}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  page: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBubbleLabel: {
    color: '#07110d',
    fontSize: 15,
    fontWeight: '900',
  },
  topBarMeta: {
    flex: 1,
    gap: 2,
  },
  topBarGreeting: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  topBarSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    gap: 10,
    paddingRight: 16,
  },
  filterChip: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.accent,
  },
  filterChipIdle: {
    backgroundColor: '#2a2a2a',
  },
  filterChipLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  filterChipLabelActive: {
    color: '#09110d',
  },
  filterChipLabelIdle: {
    color: colors.text,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickTile: {
    width: '48%',
    minHeight: 70,
    borderRadius: 8,
    backgroundColor: '#242424',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickTileArt: {
    width: 70,
    height: 70,
    borderRadius: 0,
  },
  quickTileMeta: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  quickTileTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  quickTileSubtitle: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '600',
  },
  editorialCard: {
    borderRadius: 22,
    padding: 18,
    gap: 18,
  },
  editorialMeta: {
    gap: 6,
  },
  editorialEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  editorialTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  editorialSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '92%',
  },
  editorialBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  editorialArtWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  editorialArt: {
    width: 92,
    height: 92,
    borderRadius: 18,
  },
  editorialActions: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 10,
  },
  editorialGhostButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  editorialGhostButtonLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  editorialPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  editorialPrimaryButtonLabel: {
    color: '#0b0b0b',
    fontSize: 13,
    fontWeight: '900',
  },
  section: {
    gap: 16,
  },
  sectionContextLabel: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -6,
  },
  collectionStack: {
    gap: 14,
  },
  collectionCard: {
    borderRadius: 18,
    padding: 14,
    gap: 14,
  },
  collectionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  collectionArt: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  collectionKebab: {
    padding: 2,
  },
  collectionMeta: {
    gap: 6,
  },
  collectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  collectionSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 18,
  },
  collectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  collectionOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  collectionOutlineButtonLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  collectionActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discoveryRail: {
    gap: 14,
    paddingRight: 16,
  },
  featureRailCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  featureRailGradient: {
    minHeight: 180,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureRailMeta: {
    flex: 1,
    gap: 6,
    paddingTop: 12,
  },
  featureRailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureRailEyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featureRailAccentPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featureRailAccentPillLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featureRailTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  featureRailSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 18,
  },
  featureRailArt: {
    width: 108,
    height: 108,
    borderRadius: 16,
  },
  featureRailArtWrap: {
    position: 'relative',
    paddingBottom: 6,
    paddingRight: 4,
  },
  featureRailPlayButton: {
    position: 'absolute',
    right: 4,
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRailCard: {
    width: 142,
    gap: 10,
  },
  homeRailCardBase: {
    paddingBottom: 2,
  },
  homeRailCardTall: {
    width: 152,
  },
  homeRailCardWide: {
    width: 176,
  },
  homeRailArtWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  homeRailArt: {
    width: 142,
    height: 142,
    borderRadius: 10,
  },
  homeRailArtTall: {
    width: 152,
    height: 182,
    borderRadius: 12,
  },
  homeRailArtWide: {
    width: 176,
    height: 128,
    borderRadius: 12,
  },
  homeRailArtShade: {
    ...StyleSheet.absoluteFillObject,
  },
  homeRailBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(9,9,9,0.74)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  homeRailBadgeLabel: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  homeRailTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  homeRailSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  homeRailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeRailIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRailPlayButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedCard: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  pressedControl: {
    opacity: 0.84,
    transform: [{ scale: 0.94 }],
  },
  pressedPrimaryControl: {
    opacity: 0.92,
    transform: [{ scale: 0.92 }],
  },
  rail: {
    gap: 16,
    paddingRight: 16,
  },
  trackList: {
    gap: 14,
  },
});
