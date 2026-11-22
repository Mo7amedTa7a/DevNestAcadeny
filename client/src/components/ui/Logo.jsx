import React from 'react';
import academyLogo from '@/assets/logoo.png';

/**
 * DevNest Academy Official Brand Logo Component.
 * Uses official academy logo from assets/logoo.png.
 * Supports horizontal lockup (with text) or icon-only mode.
 */
export default function Logo({ size = 'md', showText = true, className = '', alt = 'DevNest Academy' }) {
  const heights = {
    sm: 32,
    md: 42,
    lg: 54,
  };

  const height = heights[size] || 42;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        userSelect: 'none',
      }}
    >
      <img
        src={academyLogo}
        alt={alt}
        style={{
          height: `${height}px`,
          width: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
        }}
      />

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', direction: 'ltr' }}>
          <span
            style={{
              fontFamily: 'var(--font-english)',
              fontWeight: 800,
              fontSize: size === 'lg' ? '1.4rem' : size === 'sm' ? '1.05rem' : '1.25rem',
              letterSpacing: '-0.02em',
              background: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}
          >
            DevNest
          </span>
          <span
            style={{
              fontFamily: 'var(--font-english)',
              fontWeight: 700,
              fontSize: size === 'lg' ? '0.75rem' : size === 'sm' ? '0.62rem' : '0.68rem',
              letterSpacing: '0.18em',
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            ACADEMY
          </span>
        </div>
      )}
    </div>
  );
}
