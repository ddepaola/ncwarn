import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'NCWarn - NC WARN Act Layoff Notices & Plant Closings';
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
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '60px',
        }}
      >
        {/* Top section with logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#2563eb',
              borderRadius: '12px',
              fontSize: '32px',
            }}
          >
            ⚠️
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '42px',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '-1px',
              }}
            >
              NCWarn.com
            </div>
            <div style={{ fontSize: '18px', color: '#94a3b8' }}>
              North Carolina WARN Act Database
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
              fontSize: '52px',
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '20px',
            }}
          >
            Track NC Layoffs &
            <br />
            Plant Closings
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#cbd5e1',
              maxWidth: '800px',
            }}
          >
            Free searchable database of WARN Act notices filed in North Carolina.
            Search by company, county, or date.
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
            { label: 'WARN Notices' },
            { label: 'By Company' },
            { label: 'By County' },
            { label: 'Updated 2026' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(37, 99, 235, 0.3)',
                border: '1px solid rgba(37, 99, 235, 0.5)',
                padding: '10px 20px',
                borderRadius: '8px',
              }}
            >
              <span style={{ color: '#93c5fd', fontSize: '15px', fontWeight: 600 }}>
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
