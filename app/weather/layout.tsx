import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata = genMeta({
  title: 'Weather Alerts',
  description: 'Active weather warnings and advisories for North Carolina from the National Weather Service.',
  path: '/weather',
  noIndex: true,
});

export default function WeatherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
