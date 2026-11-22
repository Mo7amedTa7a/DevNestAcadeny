import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import DynamicWatermark from './DynamicWatermark';
import { resolveVideoToken } from '../api/student.api';
import styles from './ProtectedVideoPlayer.module.css';

/**
 * YouTube Unlisted Protected Video Player.
 * Strictly adheres to `security-anticheat` guidelines:
 * - Zero raw URL exposure (in-memory token resolution).
 * - Custom controls overlay over YouTube IFrame API.
 * - Protective click shields over title, share, and YouTube branding.
 * - Dynamic moving watermark with student name & code.
 * - Tab blur auto-pause lockdown & hotkey blocking.
 */
export default function ProtectedVideoPlayer({
  videoToken,
  studentName,
  studentCode,
  initialPosition = 0,
  onProgress,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const [videoId, setVideoId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [isTabBlurred, setIsTabBlurred] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Resolve encrypted token in memory
  useEffect(() => {
    if (!videoToken) return;
    setIsLoading(true);

    resolveVideoToken(videoToken)
      .then((res) => {
        setVideoId(res.videoId);
      })
      .catch((err) => {
        console.error('Failed to resolve video token', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [videoToken]);

  // 2. Initialize YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    // Load YouTube IFrame API script if not loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('devnest-yt-iframe', {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
            if (initialPosition > 0) {
              event.target.seekTo(initialPosition, true);
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState.PLAYING === 1, PAUSED === 2, ENDED === 0
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2 || event.data === 0) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, initialPosition]);

  // 3. Periodic Progress Tracker (Every 1 second update UI, every 10s notify parent)
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && isPlaying) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);

        // Every 10 seconds report progress
        if (Math.floor(time) % 10 === 0 && onProgress) {
          onProgress({ lastPositionSeconds: Math.floor(time), watchTimeSeconds: Math.floor(time) });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, onProgress]);

  // 4. Focus Lockdown & Tab Blur Security
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (playerRef.current && playerRef.current.pauseVideo) {
          playerRef.current.pauseVideo();
        }
        setIsTabBlurred(true);
      }
    };

    const handleWindowBlur = () => {
      if (playerRef.current && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      setIsTabBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsTabBlurred(false);
    };

    // Hotkey blocking (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Controls auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
    setControlsTimeout(timeout);
  };

  // Playback handlers
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const handleSkip = (seconds) => {
    if (!playerRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    playerRef.current.seekTo(newTime, true);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      playerRef.current.setVolume(volume || 50);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen error', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div
      ref={containerRef}
      className={styles.playerContainer}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dynamic Moving Watermark */}
      <DynamicWatermark studentName={studentName} studentCode={studentCode} />

      {/* Tab Blurred Overlay Notice */}
      {isTabBlurred && (
        <div className={styles.blurNotice}>
          <span>⏸ تم إيقاف المحاضرة مؤقتاً لتغيير النافذة</span>
        </div>
      )}

      {/* Protective Invisible Click Shields */}
      {/* 1. Shield Top: blocks title and share button */}
      <div className={styles.shieldTop} aria-hidden="true" />
      {/* 2. Shield Bottom Right: blocks YouTube logo and 'Watch on YouTube' */}
      <div className={styles.shieldBottomRight} aria-hidden="true" />

      {/* YouTube IFrame Placeholder */}
      <div className={styles.iframeWrapper}>
        <div id="devnest-yt-iframe" className={styles.iframe} />
      </div>

      {/* Clickable Area for Play/Pause toggle */}
      <div className={styles.clickOverlay} onClick={togglePlay} />

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && (
        <button
          type="button"
          className={styles.centerPlayBtn}
          onClick={togglePlay}
          aria-label="تشغيل"
        >
          ▶
        </button>
      )}

      {/* Custom Video Controls Overlay */}
      <div
        className={`${styles.controlsOverlay} ${
          showControls || !isPlaying ? styles['controlsOverlay--visible'] : ''
        }`}
      >
        {/* Custom Seekbar */}
        <div className={styles.seekbarContainer}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={styles.seekbar}
            aria-label="شريط التقدم"
          />
        </div>

        {/* Bottom Control Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.controlsLeft}>
            {/* Play/Pause */}
            <button
              type="button"
              className={styles.controlBtn}
              onClick={togglePlay}
              aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Skip 10s */}
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => handleSkip(-10)}
              title="تراجع 10 ثوانٍ"
            >
              ↺ 10
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => handleSkip(10)}
              title="تقديم 10 ثوانٍ"
            >
              ↻ 10
            </button>

            {/* Time display */}
            <div className={styles.timeDisplay} dir="ltr">
              <span>{formatTime(currentTime)}</span>
              <span className={styles.timeDivider}>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className={styles.controlsRight}>
            {/* Volume */}
            <div className={styles.volumeBox}>
              <button
                type="button"
                className={styles.controlBtn}
                onClick={toggleMute}
                aria-label={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 50 ? <Volume1 size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
              />
            </div>

            {/* Speed Selector */}
            <div className={styles.speedBox}>
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={`${styles.speedBtn} ${playbackRate === rate ? styles['speedBtn--active'] : ''}`}
                  onClick={() => handleSpeedChange(rate)}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              className={styles.controlBtn}
              onClick={toggleFullscreen}
              aria-label="ملء الشاشة"
              title="ملء الشاشة"
            >
              {isFullscreen ? '⤦' : '⤢'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
