import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          borderRadius: '4px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 32 32">
          <path
            d="M16 4 L28 26 L4 26 Z"
            fill="#fbbf24"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <rect x="14" y="10" width="4" height="9" rx="1" fill="#1e3a5f" />
          <circle cx="16" cy="22" r="2" fill="#1e3a5f" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
