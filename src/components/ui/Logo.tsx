import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: '#120424',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 0 16px rgba(168, 85, 247, 0.6), inset 0 0 12px rgba(168, 85, 247, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Outer Glow Ring */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: size * 0.25,
          boxShadow: 'inset 0 0 4px rgba(216, 180, 254, 0.8)',
          pointerEvents: 'none'
        }}
      />
      
      {/* The Letter N */}
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 20V4H8L16 15V4H19V20H16L8 9V20H5Z"
          fill="url(#neonPurple)"
          style={{
            filter: 'drop-shadow(0px 0px 4px rgba(216, 180, 254, 0.9))'
          }}
        />
        <defs>
          <linearGradient id="neonPurple" x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E9D5FF" />
            <stop offset="0.5" stopColor="#C084FC" />
            <stop offset="1" stopColor="#9333EA" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
