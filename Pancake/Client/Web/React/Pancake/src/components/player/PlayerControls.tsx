import React from "react";
import { usePlayerStore } from "@/stores/player.store";
import { audioPlayer } from "@/services/music.api";
import type { PlayMode } from "@/types/music";

// 图标组件
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const NextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

const PreviousIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

const VolumeUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const SequenceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 3H2v2h8V3zm0 5H2v2h8V8zm0 5H2v2h8v-2zM19 3h-7v2h7V3zm0 5h-7v2h7V8zm0 5h-7v2h7v-2z" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M7 7H3v3h4V7zm10 3h-4V7h4v3zm-10 4H3v3h4v-3zm10 0h-4v3h4v-3z" />
    <path d="M5 2h10v2H5V2zm0 16h10v2H5v-2z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
  </svg>
);

const PlayerControls: React.FC = () => {
  const {
    playbackState,
    currentSong,
    playMode,
    volume,
    muted,
    currentTime,
    play,
    pause,
    playNext,
    playPrevious,
    setVolume,
    toggleMute,
    setPlayMode,
    seek,
  } = usePlayerStore();

  const duration = currentSong?.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = () => {
    if (playbackState === "playing") {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    const newTime = (newProgress / 100) * duration;
    seek(newTime);
  };

  const handlePlayModeClick = () => {
    const modes: PlayMode[] = ["sequence", "repeat", "shuffle"];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  const getPlayModeIcon = () => {
    switch (playMode) {
      case "sequence":
        return <SequenceIcon />;
      case "repeat":
        return <RepeatIcon />;
      case "shuffle":
        return <ShuffleIcon />;
      default:
        return <SequenceIcon />;
    }
  };

  return (
    <div className="player-controls">
      {/* 左侧：歌曲信息 */}
      <div className="player-controls__info">
        {currentSong ? (
          <>
            <div className="song-info">
              <div className="song-title">{currentSong.title}</div>
              <div className="song-artist">
                {currentSong.artist || "Unknown Artist"}
                {currentSong.album && ` • ${currentSong.album}`}
              </div>
            </div>
          </>
        ) : (
          <div className="song-info">
            <div className="song-title">No song playing</div>
            <div className="song-artist">Select a song to play</div>
          </div>
        )}
      </div>

      {/* 中间：播放控制 */}
      <div className="player-controls__center">
        <div className="playback-controls">
          <button
            className="control-btn"
            onClick={handlePlayModeClick}
            title={`Play mode: ${playMode}`}
            aria-label={`Change play mode (current: ${playMode})`}
          >
            {getPlayModeIcon()}
          </button>

          <button
            className="control-btn"
            onClick={playPrevious}
            disabled={!currentSong}
            title="Previous"
            aria-label="Previous song"
          >
            <PreviousIcon />
          </button>

          <button
            className="control-btn control-btn--play"
            onClick={handlePlayPause}
            disabled={!currentSong}
            title={playbackState === "playing" ? "Pause" : "Play"}
            aria-label={playbackState === "playing" ? "Pause" : "Play"}
          >
            {playbackState === "playing" ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            className="control-btn"
            onClick={playNext}
            disabled={!currentSong}
            title="Next"
            aria-label="Next song"
          >
            <NextIcon />
          </button>
        </div>

        {/* 进度条 */}
        <div className="progress-container">
          <div className="progress-time">
            {audioPlayer.formatTime(currentTime)}
          </div>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            disabled={!currentSong}
            aria-label="Playback progress"
          />
          <div className="progress-time">
            {audioPlayer.formatTime(duration)}
          </div>
        </div>
      </div>

      {/* 右侧：音量控制 */}
      <div className="player-controls__right">
        <button
          className="control-btn"
          onClick={toggleMute}
          title={muted ? "Unmute" : "Mute"}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </button>

        <input
          type="range"
          className="volume-slider"
          min="0"
          max="100"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          title="Volume"
          aria-label="Volume control"
        />

        <div className="volume-text">{muted ? "Muted" : `${volume}%`}</div>
      </div>
    </div>
  );
};

export default PlayerControls;
