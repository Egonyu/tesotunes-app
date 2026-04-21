import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists, mapCharts, mapGenres, mapSongs } from '../services/api/mappers';
import { Album, Artist, Chart, Genre, Track } from '../types/music';
import { ApiListResponse, MobileAlbum, MobileArtist, MobileChart, MobileGenre, MobileSong } from '../types/api';

type GenreResourceResponse = MobileGenre | { data?: MobileGenre };

function deriveArtistsFromSongs(songs: Track[]): Artist[] {
  const seen = new Set<string>();

  return songs
    .filter((track) => track.artistId || track.artist)
    .map((track, index) => ({
      id: track.artistId ?? `derived-artist-${index}-${track.artist}`,
      sourceId: track.artistId ? Number(track.artistId) || undefined : undefined,
      name: track.artist,
      monthlyListeners: track.plays,
      palette: track.palette,
      artworkUrl: track.artworkUrl ?? null,
    }))
    .filter((artist) => {
      if (seen.has(artist.id)) {
        return false;
      }

      seen.add(artist.id);
      return true;
    })
    .slice(0, 8);
}

function deriveAlbumsFromSongs(songs: Track[], genre: Genre | null): Album[] {
  const seen = new Set<string>();

  return songs
    .filter((track) => track.albumTitle)
    .map((track, index) => ({
      id: track.albumId ?? `derived-album-${index}-${track.albumTitle}`,
      sourceId: track.albumId ? Number(track.albumId) || undefined : undefined,
      title: track.albumTitle ?? 'Untitled release',
      artist: track.artist,
      year: 'Now',
      palette: track.palette,
      description: genre ? `Tracks currently contributing to the ${genre.name} chart.` : 'Tracks currently contributing to this chart.',
      tracks: songs.filter((item) => item.albumId && item.albumId === track.albumId),
      artworkUrl: track.artworkUrl ?? null,
      artistId: track.artistId,
      genre: genre?.name,
      trackCount: songs.filter((item) => item.albumId && item.albumId === track.albumId).length,
      playCountLabel: track.plays,
    }))
    .filter((album) => {
      if (seen.has(album.id)) {
        return false;
      }

      seen.add(album.id);
      return true;
    })
    .slice(0, 8);
}

export function useChartDetail(id?: string) {
  return useQuery({
    queryKey: ['chart-detail', id],
    queryFn: async (): Promise<{ chart: Chart | null; genre: Genre | null; songs: Track[]; artists: Artist[]; albums: Album[] }> => {
      const [chartsResponse, genreResponse, songsResponse, artistsResponse, albumsResponse] = await Promise.allSettled([
        apiGet<ApiListResponse<MobileChart>>('/mobile/featured/charts'),
        apiGet<GenreResourceResponse>(`/genres/${id}`),
        apiGet<ApiListResponse<MobileSong>>(`/genres/${id}/songs`),
        apiGet<ApiListResponse<MobileArtist>>(`/genres/${id}/artists`),
        apiGet<ApiListResponse<MobileAlbum>>(`/genres/${id}/albums`),
      ]);

      const genre =
        genreResponse.status === 'fulfilled'
          ? mapGenres({ data: [((genreResponse.value as { data?: MobileGenre }).data ?? (genreResponse.value as MobileGenre))] })[0] ?? null
          : null;
      const charts = chartsResponse.status === 'fulfilled' ? mapCharts(chartsResponse.value) : [];
      const chart =
        charts.find((item) => item.id === id || String(item.sourceId ?? '') === id) ??
        (genre
          ? {
              id: String(genre.id),
              sourceId: genre.sourceId,
              title: `${genre.name} Chart`,
              genre: genre.name,
              description: genre.description || `Top ${genre.name} tracks on TesoTunes right now.`,
              songCount: genre.songCount,
              totalPlays: 'Live now',
              momentumLabel: genre.songCount > 10 ? 'Growing fast' : 'Emerging lane',
              palette: genre.palette,
              slug: genre.slug,
            }
          : null);

      const songs = songsResponse.status === 'fulfilled' ? mapSongs(songsResponse.value) : [];
      const artists = artistsResponse.status === 'fulfilled' ? mapArtists(artistsResponse.value) : [];
      const albums = albumsResponse.status === 'fulfilled' ? mapAlbums(albumsResponse.value) : [];

      return {
        chart,
        genre,
        songs,
        artists: artists.length > 0 ? artists : deriveArtistsFromSongs(songs),
        albums: albums.length > 0 ? albums : deriveAlbumsFromSongs(songs, genre),
      };
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
