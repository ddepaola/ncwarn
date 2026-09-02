import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'NCWarn - NC WARN Act Layoff Notices';
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
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '60px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '16px' }}>⚠️</div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '16px',
          }}
        >
          NCWarn.com
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            maxWidth: '600px',
          }}
        >
          Track NC WARN Act Layoff Notices & Plant Closings
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
