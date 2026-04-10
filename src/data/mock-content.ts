import { Album, Artist, EventItem, Playlist, Track } from '../types/music';

export const quickMixes = [
  'Aroma of Teso',
  'Late Night Kampala',
  'Fresh East Vibes',
  'Acoustic Gold',
  'Roadtrip Amapiano',
  'Festival Energy',
];

export const artists: Artist[] = [
  {
    id: 'artist-1',
    sourceId: 1,
    name: 'Joshua Baraka',
    monthlyListeners: '458K monthly listeners',
    palette: ['#5b2415', '#d49c4d'],
    followerCount: 458000,
  },
  {
    id: 'artist-2',
    sourceId: 2,
    name: 'Azawi',
    monthlyListeners: '690K monthly listeners',
    palette: ['#2a144f', '#e26d5c'],
    followerCount: 690000,
  },
  {
    id: 'artist-3',
    sourceId: 3,
    name: 'A Pass',
    monthlyListeners: '312K monthly listeners',
    palette: ['#093637', '#44a08d'],
    followerCount: 312000,
  },
];

export const featuredTracks: Track[] = [
  {
    id: 'track-1',
    sourceId: 1,
    title: 'Sanyu',
    artist: 'Joshua Baraka',
    duration: '3:18',
    plays: '1.2M plays',
    palette: ['#5b2415', '#d49c4d'],
    albumId: 'album-1',
    artistId: 'artist-1',
    artworkUrl: null,
  },
  {
    id: 'track-2',
    sourceId: 2,
    title: 'Majje',
    artist: 'Azawi',
    duration: '2:58',
    plays: '980K plays',
    palette: ['#2a144f', '#e26d5c'],
    albumId: 'album-2',
    artistId: 'artist-2',
    artworkUrl: null,
  },
  {
    id: 'track-3',
    sourceId: 3,
    title: 'Wuuyo',
    artist: 'A Pass',
    duration: '3:44',
    plays: '804K plays',
    palette: ['#093637', '#44a08d'],
    albumId: 'album-3',
    artistId: 'artist-3',
    artworkUrl: null,
  },
  {
    id: 'track-4',
    sourceId: 4,
    title: 'Tebimala',
    artist: 'Teso Collective',
    duration: '4:02',
    plays: '220K plays',
    palette: ['#311847', '#915eff'],
    artworkUrl: null,
  },
];

export const albums: Album[] = [
  {
    id: 'album-1',
    title: 'Sunset On The Nile',
    artist: 'Joshua Baraka',
    year: '2026',
    palette: ['#5b2415', '#d49c4d'],
    description: 'A warm blend of modern soul, Afropop hooks, and late-night city textures.',
    tracks: featuredTracks.filter((track) => track.albumId === 'album-1'),
  },
  {
    id: 'album-2',
    title: 'Queen Energy',
    artist: 'Azawi',
    year: '2025',
    palette: ['#2a144f', '#e26d5c'],
    description: 'Bold vocals, polished pop production, and a confident festival-ready pulse.',
    tracks: featuredTracks.filter((track) => track.albumId === 'album-2'),
  },
  {
    id: 'album-3',
    title: 'Moonlight Stories',
    artist: 'A Pass',
    year: '2024',
    palette: ['#093637', '#44a08d'],
    description: 'A softer, groove-heavy project with intimate writing and polished drums.',
    tracks: featuredTracks.filter((track) => track.albumId === 'album-3'),
  },
];

export const events: EventItem[] = [
  {
    id: 'event-1',
    title: 'TesoTunes Live Sessions',
    venue: 'Lugogo Grounds',
    dateLabel: 'Fri, Apr 18',
    city: 'Kampala',
    palette: ['#7c2d12', '#f97316'],
  },
  {
    id: 'event-2',
    title: 'Soroti Night Jam',
    venue: 'Sky Lounge',
    dateLabel: 'Sat, Apr 26',
    city: 'Soroti',
    palette: ['#1e3a8a', '#38bdf8'],
  },
  {
    id: 'event-3',
    title: 'Voices of the East',
    venue: 'Mbale City Hall',
    dateLabel: 'Sun, May 4',
    city: 'Mbale',
    palette: ['#14532d', '#86efac'],
  },
];

export const searchGenres = [
  { title: 'Afropop', palette: ['#b91c1c', '#ef4444'] as [string, string] },
  { title: 'Dancehall', palette: ['#1d4ed8', '#60a5fa'] as [string, string] },
  { title: 'Gospel', palette: ['#0f766e', '#5eead4'] as [string, string] },
  { title: 'Amapiano', palette: ['#6d28d9', '#c084fc'] as [string, string] },
  { title: 'Acoustic', palette: ['#92400e', '#fbbf24'] as [string, string] },
  { title: 'Podcasts', palette: ['#be185d', '#f9a8d4'] as [string, string] },
];

export const libraryHighlights = [
  'Liked Songs',
  'Downloaded',
  'Recently Played',
  'Made for You',
  'Following',
];

export const playlists: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Teso Nights',
    description: 'Late-night rotation for the drive home.',
    ownerName: 'TesoTunes',
    songCount: 12,
    followerCount: 128,
    isPublic: true,
    palette: ['#2a144f', '#e26d5c'],
    tracks: featuredTracks.slice(0, 3),
  },
  {
    id: 'playlist-2',
    name: 'Fresh Kampala',
    description: 'Current favorites and new finds.',
    ownerName: 'TesoTunes',
    songCount: 9,
    followerCount: 82,
    isPublic: true,
    palette: ['#093637', '#44a08d'],
    tracks: featuredTracks.slice(1, 4),
  },
];

export function findAlbumById(id?: string) {
  return albums.find((album) => album.id === id);
}

export function findArtistById(id?: string) {
  return artists.find((artist) => artist.id === id);
}

export function findPlaylistById(id?: string) {
  return playlists.find((playlist) => playlist.id === id);
}
