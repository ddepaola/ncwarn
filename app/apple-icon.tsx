import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
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
          borderRadius: '40px',
        }}
      >
        {/* Warning triangle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{ marginTop: '-10px' }}
          >
            <path
              d="M60 10 L110 100 L10 100 Z"
              fill="#fbbf24"
              stroke="#ffffff"
              strokeWidth="3"
            />
            <rect x="54" y="35" width="12" height="35" rx="3" fill="#1e3a5f" />
            <circle cx="60" cy="82" r="7" fill="#1e3a5f" />
          </svg>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginTop: '-5px',
              letterSpacing: '2px',
            }}
          >
            NC
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
