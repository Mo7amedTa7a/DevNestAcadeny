import styles from './Badge.module.css';

/**
 * DevNest Academy — Badge primitive.
 * Semantic status indicators for grades, enrollment status, etc.
 *
 * @param {'success'|'warning'|'danger'|'info'|'neutral'} variant
 * @param {'sm'|'md'} size
 */
export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  ...rest
}) {
  const classNames = [
    styles.badge,
    styles[`badge--${variant}`],
    styles[`badge--${size}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...rest}>
      {children}
    </span>
  );
}
