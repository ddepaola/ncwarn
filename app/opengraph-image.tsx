import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'NCWARN - North Carolina Warnings & Alerts';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
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
        {/* Top section with logo and tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              borderRadius: '16px',
            }}
          >
            <svg width="50" height="50" viewBox="0 0 50 50">
              <path
                d="M25 5 L45 42 L5 42 Z"
                fill="#fbbf24"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <rect x="22" y="15" width="6" height="15" rx="2" fill="#1e3a5f" />
              <circle cx="25" cy="35" r="3" fill="#1e3a5f" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '-1px',
              }}
            >
              NCWARN
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#94a3b8',
              }}
            >
              North Carolina Warnings & Alerts
            </div>
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
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '24px',
            }}
          >
            Stay Informed.
            <br />
            Stay Safe.
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#cbd5e1',
              maxWidth: '800px',
            }}
          >
            Track layoffs, weather alerts, power outages, recalls, and emergency
            notifications across North Carolina.
          </div>
        </div>

        {/* Bottom badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { icon: '⚠️', label: 'WARN Notices' },
            { icon: '🌪️', label: 'Weather Alerts' },
            { icon: '⚡', label: 'Power Outages' },
            { icon: '🚨', label: 'Recalls' },
            { icon: '💼', label: 'Jobs' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '12px 20px',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{ color: '#ffffff', fontSize: '16px' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
