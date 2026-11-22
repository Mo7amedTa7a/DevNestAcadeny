import styles from './Skeleton.module.css';

/**
 * DevNest Academy — Skeleton loader primitive.
 * Animated placeholder blocks (NOT spinning spinners) for loading states.
 *
 * @param {'text'|'title'|'avatar'|'card'|'button'} variant
 * @param {string} width  - Custom CSS width
 * @param {string} height - Custom CSS height
 * @param {number} count  - Number of skeleton lines to render
 */
export default function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) {
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${styles.skeleton} ${styles[`skeleton--${variant}`]} ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="جاري التحميل..."
    />
  ));

  return count > 1 ? <div className={styles.stack}>{items}</div> : items[0];
}
