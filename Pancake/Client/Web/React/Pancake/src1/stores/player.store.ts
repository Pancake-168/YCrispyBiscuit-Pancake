import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Song,
  PlaybackState,
  PlayMode,
} from "@/types/music";

// 重新导出类型以保持向后兼容
export type { Song, PlaybackState, PlayMode };

interface PlayerState {
  // 当前播放状态
  playbackState: PlaybackState;

  // 当前播放的歌曲
  currentSong: Song | null;

  // 播放列表
  playlist: Song[];

  // 当前播放索引
  currentIndex: number;

  // 播放模式
  playMode: PlayMode;

  // 音量 (0-100)
  volume: number;

  // 是否静音
  muted: boolean;

  // 播放进度 (秒)
  currentTime: number;

  // 是否显示歌词
  showLyrics: boolean;

  // 播放历史
  history: Song[];

  // 操作函数
  play: (song?: Song) => void;
  pause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaylist: (songs: Song[], startIndex?: number) => void;
  addToPlaylist: (songs: Song | Song[]) => void;
  removeFromPlaylist: (songId: number) => void;
  clearPlaylist: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTime: (time: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  toggleLyrics: () => void;
  seek: (time: number) => void;
  shufflePlaylist: () => void;
}

// 默认音量
const DEFAULT_VOLUME = 70;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      playbackState: "idle",
      currentSong: null,
      playlist: [],
      currentIndex: -1,
      playMode: "sequence",
      volume: DEFAULT_VOLUME,
      muted: false,
      currentTime: 0,
      showLyrics: false,
      history: [],

      play: (song?: Song) => {
        const state = get();

        if (song) {
          // 播放指定歌曲
          set({
            currentSong: song,
            currentIndex: state.playlist.findIndex((s) => s.id === song.id),
            playbackState: "playing",
            currentTime: 0,
          });
        } else if (state.currentSong) {
          // 继续播放当前歌曲
          set({ playbackState: "playing" });
        } else if (state.playlist.length > 0) {
          // 播放第一首
          const firstSong = state.playlist[0];
          set({
            currentSong: firstSong,
            currentIndex: 0,
            playbackState: "playing",
            currentTime: 0,
          });
        }
      },

      pause: () => {
        set({ playbackState: "paused" });
      },

      playNext: () => {
        const state = get();
        const { playlist, currentIndex, playMode } = state;

        if (playlist.length === 0) return;

        let nextIndex = currentIndex;

        if (playMode === "shuffle") {
          // 随机播放
          nextIndex = Math.floor(Math.random() * playlist.length);
        } else {
          // 顺序播放或循环
          nextIndex = currentIndex + 1;
          if (nextIndex >= playlist.length) {
            if (playMode === "repeat") {
              nextIndex = 0; // 循环到第一首
            } else {
              return; // 顺序播放结束
            }
          }
        }

        const nextSong = playlist[nextIndex];
        set({
          currentSong: nextSong,
          currentIndex: nextIndex,
          playbackState: "playing",
          currentTime: 0,
          history: [...state.history, state.currentSong!].slice(-50), // 保留最近50首
        });
      },

      playPrevious: () => {
        const state = get();
        const { playlist, currentIndex, history } = state;

        if (history.length > 0) {
          // 播放历史中的上一首
          const previousSong = history[history.length - 1];
          const previousIndex = playlist.findIndex(
            (s) => s.id === previousSong.id,
          );

          set({
            currentSong: previousSong,
            currentIndex: previousIndex,
            playbackState: "playing",
            currentTime: 0,
            history: history.slice(0, -1),
          });
        } else if (currentIndex > 0) {
          // 播放列表中的上一首
          const previousIndex = currentIndex - 1;
          const previousSong = playlist[previousIndex];

          set({
            currentSong: previousSong,
            currentIndex: previousIndex,
            playbackState: "playing",
            currentTime: 0,
          });
        }
      },

      setPlaylist: (songs: Song[], startIndex: number = 0) => {
        set({
          playlist: songs,
          currentIndex: startIndex,
          currentSong: songs[startIndex] || null,
          currentTime: 0,
        });
      },

      addToPlaylist: (songs: Song | Song[]) => {
        const songsArray = Array.isArray(songs) ? songs : [songs];
        set((state) => ({
          playlist: [...state.playlist, ...songsArray],
        }));
      },

      removeFromPlaylist: (songId: number) => {
        set((state) => {
          const newPlaylist = state.playlist.filter(
            (song) => song.id !== songId,
          );
          const currentSong =
            state.currentSong?.id === songId ? null : state.currentSong;
          const currentIndex =
            state.currentSong?.id === songId ? -1 : state.currentIndex;

          return {
            playlist: newPlaylist,
            currentSong,
            currentIndex,
          };
        });
      },

      clearPlaylist: () => {
        set({
          playlist: [],
          currentSong: null,
          currentIndex: -1,
          currentTime: 0,
          playbackState: "idle",
        });
      },

      setVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(100, volume));
        set({ volume: clampedVolume, muted: clampedVolume === 0 });
      },

      toggleMute: () => {
        set((state) => ({
          muted: !state.muted,
        }));
      },

      setCurrentTime: (time: number) => {
        set({ currentTime: Math.max(0, time) });
      },

      setPlayMode: (mode: PlayMode) => {
        set({ playMode: mode });
      },

      toggleLyrics: () => {
        set((state) => ({ showLyrics: !state.showLyrics }));
      },

      seek: (time: number) => {
        const state = get();
        if (state.currentSong) {
          const clampedTime = Math.max(
            0,
            Math.min(state.currentSong.duration, time),
          );
          set({ currentTime: clampedTime });
        }
      },

      shufflePlaylist: () => {
        set((state) => {
          const shuffled = [...state.playlist];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          const currentIndex = state.currentSong
            ? shuffled.findIndex((s) => s.id === state.currentSong!.id)
            : state.currentIndex;

          return {
            playlist: shuffled,
            currentIndex,
          };
        });
      },
    }),
    {
      name: "music-player-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        playMode: state.playMode,
        showLyrics: state.showLyrics,
      }),
    },
  ),
);
