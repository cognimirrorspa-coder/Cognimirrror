'use client';

import React from 'react';
import './GradientText.css';

export default function GradientText({
  children,
  className = '',
  colors = ['#00f2fe', '#38bdf8', '#818cf8', '#c084fc', '#ec4899', '#00f2fe'],
  animationSpeed = 3.5,
  showBorder = false,
  continuous = false,
  style = {}
}) {
  const gradientString = `linear-gradient(90deg, ${colors.join(', ')})`;

  return (
    <span
      className={`gradient-text-wrapper ${className}`}
      style={{
        '--animation-duration': `${animationSpeed}s`,
        ...style
      }}
    >
      {showBorder && (
        <span
          className="gradient-text-border"
          style={{ background: gradientString }}
          aria-hidden="true"
        />
      )}
      <span
        className={`gradient-text-content ${continuous ? 'continuous' : ''}`}
        style={{
          backgroundImage: gradientString,
          WebkitBackgroundImage: gradientString,
        }}
      >
        {children}
      </span>
    </span>
  );
}
