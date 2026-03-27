import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePlayerStore } from "@/stores/player.store";
import { songApi, audioPlayer } from "@/services/music.api";
import type { Song } from "@/services/music.api";

// 简单的防抖函数
function useDebounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: TArgs) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
}

const SongsView: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<
    "title" | "artist" | "album" | "duration"
  >("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { play, addToPlaylist, setPlaylist } = usePlayerStore();

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      const data = await songApi.getSongs({ limit: 500 });
      setSongs(data as unknown as Song[]);
    } catch (error) {
      console.error("Failed to load songs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortSongs = useCallback(() => {
    let result = [...songs];

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          (song.artist && song.artist.toLowerCase().includes(query)) ||
          (song.album && song.album.toLowerCase().includes(query)),
      );
    }

    // 排序
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // 处理undefined值
      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";

      // 特殊处理持续时间
      if (sortField === "duration") {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredSongs(result);
  }, [songs, searchQuery, sortField, sortDirection]);

  useEffect(() => {
    filterAndSortSongs();
  }, [filterAndSortSongs]);

  const debouncedSetSearchQuery = useDebounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (value: string) => {
    debouncedSetSearchQuery(value);
  };

  const handleSort = (field: "title" | "artist" | "album" | "duration") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectSong = (songId: number) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSongs.size === filteredSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredSongs.map((song) => song.id)));
    }
  };

  const handlePlaySong = (song: Song) => {
    play(song);
  };

  const handlePlaySelected = () => {
    const selectedSongList = filteredSongs.filter((song) =>
      selectedSongs.has(song.id),
    );
    if (selectedSongList.length > 0) {
      setPlaylist(selectedSongList, 0);
      play(selectedSongList[0]);
    }
  };

  const handleAddSelectedToPlaylist = () => {
    const selectedSongList = filteredSongs.filter((song) =>
      selectedSongs.has(song.id),
    );
    if (selectedSongList.length > 0) {
      addToPlaylist(selectedSongList);
      alert(`已将 ${selectedSongList.length} 首歌曲添加到播放列表`);
      setSelectedSongs(new Set());
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  if (isLoading) {
    return (
      <div className="songs-view loading">
        <div className="loading-spinner">加载歌曲中...</div>
      </div>
    );
  }

  return (
    <div className="songs-view">
      {/* 工具栏 */}
      <div className="songs-toolbar">
        <div className="search-container">
          <input
            type="text"
            placeholder="搜索歌曲..."
            className="search-input"
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search songs"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="toolbar-actions">
          <span className="songs-count">共 {filteredSongs.length} 首歌曲</span>

          <button
            className="toolbar-btn"
            onClick={handlePlaySelected}
            disabled={selectedSongs.size === 0}
          >
            播放选中 ({selectedSongs.size})
          </button>

          <button
            className="toolbar-btn"
            onClick={handleAddSelectedToPlaylist}
            disabled={selectedSongs.size === 0}
          >
            添加到播放列表
          </button>

          <button className="toolbar-btn" onClick={loadSongs}>
            刷新
          </button>
        </div>
      </div>

      {/* 歌曲列表 */}
      <div className="songs-table-container">
        <table className="songs-table">
          <thead>
            <tr>
              <th className="table-checkbox">
                <input
                  type="checkbox"
                  checked={
                    selectedSongs.size === filteredSongs.length &&
                    filteredSongs.length > 0
                  }
                  onChange={handleSelectAll}
                  aria-label="Select all songs"
                />
              </th>
              <th className="table-index">#</th>
              <th
                className="table-title sortable"
                onClick={() => handleSort("title")}
              >
                标题 {getSortIndicator("title")}
              </th>
              <th
                className="table-artist sortable"
                onClick={() => handleSort("artist")}
              >
                艺术家 {getSortIndicator("artist")}
              </th>
              <th
                className="table-album sortable"
                onClick={() => handleSort("album")}
              >
                专辑 {getSortIndicator("album")}
              </th>
              <th
                className="table-duration sortable"
                onClick={() => handleSort("duration")}
              >
                时长 {getSortIndicator("duration")}
              </th>
              <th className="table-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredSongs.map((song, index) => (
              <tr
                key={song.id}
                className={`song-row ${selectedSongs.has(song.id) ? "selected" : ""}`}
              >
                <td className="table-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSongs.has(song.id)}
                    onChange={() => handleSelectSong(song.id)}
                    aria-label={`Select ${song.title}`}
                  />
                </td>
                <td className="table-index">
                  {String(index + 1).padStart(2, "0")}
                </td>
                <td className="table-title">
                  <div className="song-title-cell">
                    <span className="song-title">{song.title}</span>
                    {song.track_number && (
                      <span className="song-track-number">
                        #{song.track_number}
                      </span>
                    )}
                  </div>
                </td>
                <td className="table-artist">
                  {song.artist || "Unknown Artist"}
                </td>
                <td className="table-album">{song.album || "Unknown Album"}</td>
                <td className="table-duration">
                  {audioPlayer.formatTime(song.duration || 0)}
                </td>
                <td className="table-actions">
                  <button
                    className="action-btn play-btn"
                    onClick={() => handlePlaySong(song)}
                    aria-label={`播放 ${song.title}`}
                    title="播放"
                  >
                    ▶
                  </button>
                  <button
                    className="action-btn add-btn"
                    onClick={() => addToPlaylist(song)}
                    aria-label={`添加 ${song.title} 到播放列表`}
                    title="添加到播放列表"
                  >
                    +
                  </button>
                  <button
                    className="action-btn more-btn"
                    aria-label={`更多选项 ${song.title}`}
                    title="更多选项"
                  >
                    ⋮
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSongs.length === 0 && (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <div className="empty-icon">🔍</div>
                <div className="empty-title">未找到匹配的歌曲</div>
                <div className="empty-desc">尝试不同的搜索词</div>
              </>
            ) : (
              <>
                <div className="empty-icon">🎵</div>
                <div className="empty-title">暂无歌曲</div>
                <div className="empty-desc">扫描音乐库以添加歌曲</div>
                <button className="empty-action" onClick={loadSongs}>
                  扫描音乐库
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {selectedSongs.size > 0 && (
        <div className="selection-bar">
          <div className="selection-count">
            已选择 {selectedSongs.size} 首歌曲
          </div>
          <div className="selection-actions">
            <button className="selection-btn" onClick={handlePlaySelected}>
              播放选中歌曲
            </button>
            <button
              className="selection-btn"
              onClick={handleAddSelectedToPlaylist}
            >
              添加到播放列表
            </button>
            <button
              className="selection-btn"
              onClick={() => setSelectedSongs(new Set())}
            >
              取消选择
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongsView;
