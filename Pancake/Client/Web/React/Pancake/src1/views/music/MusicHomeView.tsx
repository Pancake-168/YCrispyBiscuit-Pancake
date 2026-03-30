import React, { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/player.store";
import {
  songApi,
  albumApi,
  artistApi,
  libraryApi,
  audioPlayer,
} from "@/services/music.api";
import type {
  Song,
  Album,
  Artist,
  LibraryStats,
} from "@/services/music.api";

const MusicHomeView: React.FC = () => {
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [libraryStats, setLibraryStats] = useState<LibraryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { play, setPlaylist } = usePlayerStore();

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setIsLoading(true);

      // 加载最近歌曲
      const songs = await songApi.getSongs({ limit: 10 });
      setRecentSongs(songs as unknown as Song[]);

      // 加载专辑
      const albums = await albumApi.getAlbums({ limit: 6 });
      setTopAlbums(albums);

      // 加载艺术家
      const artists = await artistApi.getArtists({ limit: 8 });
      setTopArtists(artists);

      // 加载库统计
      const stats = await libraryApi.getLibraryStats();
      setLibraryStats(stats);
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    play(song);
  };

  const handlePlayAll = () => {
    if (recentSongs.length > 0) {
      setPlaylist(recentSongs, 0);
      play(recentSongs[0]);
    }
  };

  const handlePlayAlbum = async (albumId: number) => {
    try {
      const songs = await albumApi.getAlbumSongs(albumId);
      setPlaylist(songs as unknown as Song[], 0);
      if (songs.length > 0) {
        play(songs[0] as unknown as Song);
      }
    } catch (error) {
      console.error("Failed to load album songs:", error);
    }
  };

  const handlePlayArtist = async (artistId: number) => {
    try {
      const songs = await artistApi.getArtistSongs(artistId);
      setPlaylist(songs as unknown as Song[], 0);
      if (songs.length > 0) {
        play(songs[0] as unknown as Song);
      }
    } catch (error) {
      console.error("Failed to load artist songs:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="music-home loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  return (
    <div className="music-home">
      {/* 欢迎横幅 */}
      <div className="welcome-banner">
        <div className="banner-content">
          <h1 className="banner-title">欢迎使用本地音乐播放器</h1>
          <p className="banner-subtitle">享受你的个人音乐库</p>
          {libraryStats && (
            <div className="banner-stats">
              <div className="stat-item">
                <span className="stat-value">
                  {libraryStats.total_songs || 0}
                </span>
                <span className="stat-label">首歌曲</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {libraryStats.total_albums || 0}
                </span>
                <span className="stat-label">张专辑</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {libraryStats.total_artists || 0}
                </span>
                <span className="stat-label">位艺术家</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 最近播放/添加的歌曲 */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">最近添加</h2>
          <button
            className="section-action"
            onClick={handlePlayAll}
            disabled={recentSongs.length === 0}
          >
            播放全部
          </button>
        </div>

        <div className="songs-grid">
          {recentSongs.map((song, index) => (
            <div key={song.id} className="song-card">
              <div className="song-card__index">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="song-card__info">
                <div className="song-card__title">{song.title}</div>
                <div className="song-card__details">
                  {song.artist || "Unknown Artist"}
                  {song.album && ` • ${song.album}`}
                </div>
              </div>
              <div className="song-card__duration">
                {audioPlayer.formatTime(song.duration || 0)}
              </div>
              <button
                className="song-card__play"
                onClick={() => handlePlaySong(song)}
                aria-label={`播放 ${song.title}`}
              >
                ▶
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 热门专辑 */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">专辑推荐</h2>
        </div>

        <div className="albums-grid">
          {topAlbums.map((album) => (
            <div key={album.id} className="album-card">
              <div className="album-card__cover">
                <div className="album-cover-placeholder">
                  {album.title?.charAt(0) || "A"}
                </div>
                <button
                  className="album-card__play-overlay"
                  onClick={() => handlePlayAlbum(album.id)}
                  aria-label={`播放专辑 ${album.title}`}
                >
                  ▶
                </button>
              </div>
              <div className="album-card__info">
                <div className="album-card__title">{album.title}</div>
                <div className="album-card__artist">
                  {album.artist?.name || "Unknown Artist"}
                </div>
                <div className="album-card__tracks">
                  {album.total_tracks || 0} 首歌曲
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 热门艺术家 */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">艺术家</h2>
        </div>

        <div className="artists-grid">
          {topArtists.map((artist) => (
            <div key={artist.id} className="artist-card">
              <div className="artist-card__avatar">
                <div className="artist-avatar-placeholder">
                  {artist.name?.charAt(0) || "A"}
                </div>
              </div>
              <div className="artist-card__info">
                <div className="artist-card__name">{artist.name}</div>
                <button
                  className="artist-card__play"
                  onClick={() => handlePlayArtist(artist.id)}
                  aria-label={`播放 ${artist.name} 的歌曲`}
                >
                  播放
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 快速操作 */}
      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">快速操作</h2>
        </div>

        <div className="quick-actions">
          <button
            className="quick-action"
            onClick={() => libraryApi.scanLibrary()}
          >
            <div className="quick-action__icon">🔍</div>
            <div className="quick-action__title">扫描音乐库</div>
            <div className="quick-action__desc">添加新歌曲到库中</div>
          </button>

          <button
            className="quick-action"
            onClick={() => {
              /* 创建播放列表 */
            }}
          >
            <div className="quick-action__icon">➕</div>
            <div className="quick-action__title">创建播放列表</div>
            <div className="quick-action__desc">创建自定义播放列表</div>
          </button>

          <button
            className="quick-action"
            onClick={() => {
              /* 随机播放 */
            }}
          >
            <div className="quick-action__icon">🔀</div>
            <div className="quick-action__title">随机播放</div>
            <div className="quick-action__desc">随机播放所有歌曲</div>
          </button>

          <button
            className="quick-action"
            onClick={() => {
              /* 下载管理 */
            }}
          >
            <div className="quick-action__icon">⬇️</div>
            <div className="quick-action__title">下载管理</div>
            <div className="quick-action__desc">管理下载的音乐</div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default MusicHomeView;
