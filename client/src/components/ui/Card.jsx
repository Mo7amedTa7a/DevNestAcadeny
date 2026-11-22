import styles from './Card.module.css';

/**
 * DevNest Academy — Card primitive.
 *
 * @param {'flat'|'elevated'} variant
 * @param {'sm'|'md'|'lg'} padding
 */
export default function Card({
  variant = 'flat',
  padding = 'md',
  children,
  className = '',
  ...rest
}) {
  const classNames = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--pad-${padding}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}
