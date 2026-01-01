import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const ogSize = {
  width: 1200,
  height: 630,
};

export const ogContentType = 'image/png';

interface OgImageProps {
  title: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
}

export function generateOgImage({
  title,
  subtitle,
  icon = '⚠️',
  accentColor = '#2563eb',
}: OgImageProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
          padding: '60px',
        }}
      >
        {/* Top section with logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '60px',
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              borderRadius: '12px',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path
                d="M20 4 L36 34 L4 34 Z"
                fill="#fbbf24"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <rect x="17.5" y="12" width="5" height="12" rx="1.5" fill="#1e3a5f" />
              <circle cx="20" cy="28" r="2.5" fill="#1e3a5f" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            NCWARN
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Page icon */}
          <div
            style={{
              fontSize: '72px',
              marginBottom: '24px',
            }}
          >
            {icon}
          </div>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '20px',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: '28px',
                color: '#94a3b8',
                maxWidth: '900px',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            height: '6px',
            background: accentColor,
            borderRadius: '3px',
            width: '200px',
          }}
        />
      </div>
    ),
    {
      ...ogSize,
    }
  );
}
