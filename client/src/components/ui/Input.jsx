import { useId } from 'react';
import styles from './Input.module.css';

/**
 * DevNest Academy — Input primitive.
 * RTL by default; pass dir="ltr" for email/URL/code fields.
 *
 * @param {string} label
 * @param {string} error - Inline validation error message
 * @param {'text'|'email'|'password'|'url'|'tel'|'number'} type
 * @param {'rtl'|'ltr'} dir
 */
export default function Input({
  label,
  error,
  type = 'text',
  dir,
  id: externalId,
  className = '',
  ...rest
}) {
  const generatedId = useId();
  const inputId = externalId || generatedId;

  // Auto-detect LTR for email, URL, and tel fields
  const resolvedDir = dir || (['email', 'url', 'tel'].includes(type) ? 'ltr' : undefined);

  return (
    <div className={`${styles.field} ${error ? styles['field--error'] : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        dir={resolvedDir}
        className={styles.input}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
