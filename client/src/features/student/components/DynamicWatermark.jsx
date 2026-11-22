import { useState, useEffect } from 'react';
import styles from './DynamicWatermark.module.css';

/**
 * Dynamic Moving Watermark Overlay for Protected Video Player.
 * Strictly adheres to `security-anticheat` guidelines:
 * - Shows: Student Name | Student Code | Timestamp
 * - Smoothly shifts positions every 15 seconds to a random quadrant
 * - Pointer-events none, user-select none, semi-transparent
 */
export default function DynamicWatermark({ studentName, studentCode }) {
  const [positionIndex, setPositionIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // 5 discrete positions across the player canvas
  const positions = [
    { top: '12%', right: '10%' },
    { top: '12%', left: '10%' },
    { bottom: '20%', right: '12%' },
    { bottom: '20%', left: '12%' },
    { top: '48%', left: '50%', transform: 'translate(-50%, -50%)' },
  ];

  useEffect(() => {
    // Update live timestamp
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Shift watermark position every 15 seconds
    const shiftInterval = setInterval(() => {
      setPositionIndex((prev) => (prev + 1) % positions.length);
    }, 15000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(shiftInterval);
    };
  }, [positions.length]);

  const currentPos = positions[positionIndex];

  return (
    <div
      className={styles.watermark}
      style={{
        top: currentPos.top,
        left: currentPos.left,
        right: currentPos.right,
        bottom: currentPos.bottom,
        transform: currentPos.transform || 'none',
      }}
      aria-hidden="true"
    >
      <span className={styles.name}>{studentName || 'DevNest Student'}</span>
      <span className={styles.divider}>•</span>
      <span className={styles.code} dir="ltr">{studentCode || 'DN-FE-26-001'}</span>
      <span className={styles.divider}>•</span>
      <span className={styles.time} dir="ltr">{currentTime}</span>
    </div>
  );
}
