import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import PlayerControls from "./PlayerControls";
import { usePlayerStore } from "@/stores/player.store";
import { audioPlayer } from "@/services/music.api";

const MusicPlayerLayout: React.FC = () => {
  const navigate = useNavigate();
  const { currentSong, playbackState, currentTime, setCurrentTime, playNext } =
    usePlayerStore();

  // 处理音频播放
  useEffect(() => {
    if (!currentSong) return;

    let audio: HTMLAudioElement | null = null;
    let animationFrameId: number;

    const updateCurrentTime = () => {
      if (audio && playbackState === "playing") {
        setCurrentTime(audio.currentTime);
        animationFrameId = requestAnimationFrame(updateCurrentTime);
      }
    };

    const handleAudioEnded = () => {
      playNext();
    };

    const handleAudioError = (e: Event) => {
      console.error("Audio playback error:", e);
      // 尝试播放下一首
      setTimeout(() => playNext(), 1000);
    };

    if (playbackState === "playing") {
      // 创建音频元素
      audio = audioPlayer.createAudioElement(
        `/music${currentSong.file_path.split("music_library")[1] || ""}`,
      );

      // 设置当前时间
      if (currentTime > 0) {
        audio.currentTime = currentTime;
      }

      // 设置音量
      const { volume, muted } = usePlayerStore.getState();
      audio.volume = muted ? 0 : volume / 100;

      // 播放音频
      audio.play().catch((error) => {
        console.error("Failed to play audio:", error);
      });

      // 添加事件监听
      audio.addEventListener("ended", handleAudioEnded);
      audio.addEventListener("error", handleAudioError);

      // 开始更新时间
      updateCurrentTime();

      // 监听全局音量变化
      const unsubscribe = usePlayerStore.subscribe((state) => {
        if (audio) {
          audio.volume = state.muted ? 0 : state.volume / 100;
        }
      });

      return () => {
        if (audio) {
          audio.pause();
          audio.removeEventListener("ended", handleAudioEnded);
          audio.removeEventListener("error", handleAudioError);
          audio = null;
        }
        cancelAnimationFrame(animationFrameId);
        unsubscribe();
      };
    }
  }, [currentSong, currentTime, playNext, setCurrentTime, playbackState]);

  // 监听播放状态变化
  useEffect(() => {
    // 如果当前没有歌曲但播放状态是playing，重置状态
    if (!currentSong && playbackState === "playing") {
      usePlayerStore.getState().pause();
    }
  }, [currentSong, playbackState]);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 空格键：播放/暂停
      if (
        e.code === "Space" &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        const { playbackState, play, pause } = usePlayerStore.getState();
        if (playbackState === "playing") {
          pause();
        } else {
          play();
        }
      }

      // 右箭头：下一首
      if (e.code === "ArrowRight" && e.ctrlKey) {
        e.preventDefault();
        usePlayerStore.getState().playNext();
      }

      // 左箭头：上一首
      if (e.code === "ArrowLeft" && e.ctrlKey) {
        e.preventDefault();
        usePlayerStore.getState().playPrevious();
      }

      // M键：静音/取消静音
      if (e.code === "KeyM" && e.ctrlKey) {
        e.preventDefault();
        usePlayerStore.getState().toggleMute();
      }

      // L键：显示/隐藏歌词
      if (e.code === "KeyL" && e.ctrlKey) {
        e.preventDefault();
        usePlayerStore.getState().toggleLyrics();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="music-player-layout">
      {/* 侧边栏 */}
      <div className="music-player-sidebar">
        <Sidebar />
      </div>

      {/* 主内容区 */}
      <div className="music-player-main">
        {/* 顶部导航栏 */}
        <header className="music-player-header">
          <div className="header-left">
            <button
              className="header-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              ←
            </button>
            <button
              className="header-forward-btn"
              onClick={() => navigate(1)}
              aria-label="Go forward"
            >
              →
            </button>
          </div>

          <div className="header-center">
            <div className="search-bar">
              <input
                type="text"
                placeholder="搜索歌曲、专辑、歌手..."
                className="search-input"
                aria-label="Search music"
              />
              <button className="search-btn" aria-label="Search">
                🔍
              </button>
            </div>
          </div>

          <div className="header-right">
            <button className="header-btn" aria-label="Notifications">
              🔔
            </button>
            <button className="header-btn" aria-label="Settings">
              ⚙️
            </button>
            <div className="user-menu">
              <div className="user-avatar-small">👤</div>
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="music-player-content">
          <Outlet />
        </main>
      </div>

      {/* 底部播放控制栏 */}
      <div className="music-player-controls">
        <PlayerControls />
      </div>

      {/* 歌词面板（条件渲染） */}
      {/* 这里可以添加歌词显示组件 */}
    </div>
  );
};

export default MusicPlayerLayout;
