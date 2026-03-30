/**
 * 音乐播放器类型定义
 */

// 歌曲类型定义
export interface Song {
  id: number;
  title: string;
  artist?: string;
  artist_id?: number;
  album?: string;
  album_id?: number;
  duration: number; // 秒
  file_path: string;
  file_name: string;
  bitrate?: number;
  sample_rate?: number;
  track_number?: number;
  genre?: string;
  year?: number;
  lyrics?: string;
  composer?: string;
}

// 播放状态
export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

// 播放模式
export type PlayMode = "sequence" | "repeat" | "shuffle";

// 专辑类型
export interface Album {
  id: number;
  title: string;
  artist_id?: number;
  artist?: Artist;
  year?: number;
  genre?: string;
  album_art_path?: string;
  description?: string;
  total_tracks?: number;
  created_at?: string;
  updated_at?: string;
}

// 艺术家类型
export interface Artist {
  id: number;
  name: string;
  biography?: string;
  country?: string;
  image_path?: string;
  created_at?: string;
  updated_at?: string;
}

// 播放列表类型
export interface Playlist {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  is_smart: boolean;
  rules?: string;
  total_songs: number;
  total_duration: number;
  created_at?: string;
  updated_at?: string;
  songs?: Song[];
}

// 音乐库统计类型
export interface LibraryStats {
  total_songs: number;
  total_artists: number;
  total_albums: number;
  total_playlists: number;
  total_duration_hours: number;
  total_size_gb: number;
  last_scan?: string;
}

// 扫描状态类型
export interface ScanStatus {
  scanning: boolean;
  progress: number;
  current: number;
  total: number;
  last_scan?: string;
}

// 播放列表歌曲项
export interface PlaylistSongItem {
  song_id: number;
  position?: number;
}

// 播放列表添加歌曲请求
export interface PlaylistAddSongs {
  songs: PlaylistSongItem[];
}