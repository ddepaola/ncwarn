import type { Metadata } from 'next';

const SITE_NAME = 'NCWARN';
const SITE_URL = 'https://ncwarn.com';
const DEFAULT_DESCRIPTION =
  'North Carolina Warnings, Alerts & WARN Notices. Check layoffs, weather alerts, power outages, recalls, AMBER and scam warnings by county.';

interface SeoParams {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

export function generateMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image,
  noIndex = false,
}: SeoParams = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - North Carolina Warnings & Alerts`;
  const url = `${SITE_URL}${path}`;

  // Base metadata - OG images are handled by opengraph-image.tsx in each route
  const metadata: Metadata = {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };

  // Only add image if explicitly provided (for pages without opengraph-image.tsx)
  if (image) {
    const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || SITE_NAME,
        },
      ],
    };
    metadata.twitter = {
      ...metadata.twitter,
      images: [imageUrl],
    };
  }

  return metadata;
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'NC',
      addressCountry: 'US',
    },
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function generateArticleSchema({
  title,
  description,
  publishedAt,
  updatedAt,
  path,
}: {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    url: `${SITE_URL}${path}`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function generateJobPostingSchema({
  title,
  company,
  location,
  description,
  postedAt,
  expiresAt,
}: {
  title: string;
  company: string;
  location: string;
  description: string;
  postedAt: string;
  expiresAt?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    datePosted: postedAt,
    validThrough: expiresAt,
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
        addressRegion: 'NC',
        addressCountry: 'US',
      },
    },
  };
}
