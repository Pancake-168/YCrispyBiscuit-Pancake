/**
 * 音乐API服务
 * 与后端FastAPI服务通信
 */

import type {
  Song,
  Album,
  Artist,
  Playlist,
  LibraryStats,
  ScanStatus,
  PlaylistSongItem,
  PlaylistAddSongs,
} from "@/types/music";

// 重新导出类型以保持向后兼容
export type {
  Song,
  Album,
  Artist,
  Playlist,
  LibraryStats,
  ScanStatus,
  PlaylistSongItem,
  PlaylistAddSongs,
};

const API_BASE_URL = "http://localhost:8000/api/v1";

// 请求配置
const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // 处理空响应
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return {} as T;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

// 歌曲相关API
export const songApi = {
  // 获取歌曲列表
  getSongs: (params?: {
    skip?: number;
    limit?: number;
    title?: string;
    artist_id?: number;
    album_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = `/songs${queryString ? `?${queryString}` : ""}`;
    return request<Song[]>(url);
  },

  // 获取单个歌曲
  getSong: (id: number) => {
    return request<Song>(`/songs/${id}`);
  },

  // 搜索歌曲
  searchSongs: (query: string, skip: number = 0, limit: number = 50) => {
    const params = new URLSearchParams({
      title: query,
      skip: String(skip),
      limit: String(limit),
    });
    return request<Song[]>(`/songs?${params}`);
  },

  // 流式播放歌曲
  streamSong: (id: number) => {
    // 直接返回音频文件的URL
    return `${API_BASE_URL}/songs/${id}/stream`;
  },

  // 获取歌词
  getLyrics: (id: number) => {
    return request<{ lyrics: string }>(`/songs/${id}/lyrics`);
  },
};

// 专辑相关API
export const albumApi = {
  // 获取专辑列表
  getAlbums: (params?: {
    skip?: number;
    limit?: number;
    title?: string;
    artist_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = `/albums${queryString ? `?${queryString}` : ""}`;
    return request<Album[]>(url);
  },

  // 获取单个专辑
  getAlbum: (id: number) => {
    return request<Album>(`/albums/${id}`);
  },

  // 获取专辑歌曲
  getAlbumSongs: (id: number) => {
    return request<Song[]>(`/albums/${id}/songs`);
  },
};

// 艺术家相关API
export const artistApi = {
  // 获取艺术家列表
  getArtists: (params?: { skip?: number; limit?: number; name?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = `/artists${queryString ? `?${queryString}` : ""}`;
    return request<Artist[]>(url);
  },

  // 获取单个艺术家
  getArtist: (id: number) => {
    return request<Artist>(`/artists/${id}`);
  },

  // 获取艺术家歌曲
  getArtistSongs: (id: number) => {
    return request<Song[]>(`/artists/${id}/songs`);
  },

  // 获取艺术家专辑
  getArtistAlbums: (id: number) => {
    return request<Album[]>(`/artists/${id}/albums`);
  },
};

// 播放列表相关API
export const playlistApi = {
  // 获取播放列表
  getPlaylists: (params?: { skip?: number; limit?: number; name?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = `/playlists${queryString ? `?${queryString}` : ""}`;
    return request<Playlist[]>(url);
  },

  // 获取单个播放列表（含歌曲）
  getPlaylist: (id: number) => {
    return request<Playlist>(`/playlists/${id}`);
  },

  // 创建播放列表
  createPlaylist: (data: {
    name: string;
    description?: string;
    is_public?: boolean;
    is_smart?: boolean;
    rules?: string;
  }) => {
    return request<Playlist>("/playlists", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // 更新播放列表
  updatePlaylist: (
    id: number,
    data: {
      name?: string;
      description?: string;
      is_public?: boolean;
      is_smart?: boolean;
      rules?: string;
    },
  ) => {
    return request<Playlist>(`/playlists/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // 删除播放列表
  deletePlaylist: (id: number) => {
    return request(`/playlists/${id}`, {
      method: "DELETE",
    });
  },

  // 添加歌曲到播放列表
  addSongsToPlaylist: (
    playlistId: number,
    songs: Array<{ song_id: number; position?: number }>,
  ) => {
    return request(`/playlists/${playlistId}/songs`, {
      method: "POST",
      body: JSON.stringify({ songs }),
    });
  },

  // 从播放列表移除歌曲
  removeSongFromPlaylist: (playlistId: number, songId: number) => {
    return request(`/playlists/${playlistId}/songs/${songId}`, {
      method: "DELETE",
    });
  },
};

// 音乐库管理API
export const libraryApi = {
  // 扫描音乐库
  scanLibrary: () => {
    return request("/library/scan", {
      method: "POST",
    });
  },

  // 重新扫描音乐库
  rescanLibrary: () => {
    return request("/library/rescan", {
      method: "POST",
    });
  },

  // 获取扫描状态
  getScanStatus: () => {
    return request<ScanStatus>("/library/scan/status");
  },

  // 获取库统计信息
  getLibraryStats: () => {
    return request<LibraryStats>("/library/stats");
  },
};

// 音频播放器工具
export const audioPlayer = {
  // 创建音频元素
  createAudioElement: (url: string) => {
    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";
    return audio;
  },

  // 格式化时间 (秒 -> MM:SS)
  formatTime: (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },

  // 格式化文件大小
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // 格式化比特率
  formatBitrate: (bitrate: number): string => {
    if (!bitrate) return "Unknown";
    return `${Math.round(bitrate / 1000)} kbps`;
  },
};

export default {
  songApi,
  albumApi,
  artistApi,
  playlistApi,
  libraryApi,
  audioPlayer,
};
