/**
 * Breadcrumbs Component
 * Provides hierarchical navigation and JSON-LD structured data
 */

import Link from 'next/link';
import Script from 'next/script';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Generates safe JSON-LD for breadcrumbs
 * Only uses internal data structures, no user-provided content
 */
function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && {
        item: `https://ncwarn.com${item.href}`,
      }),
    })),
  };
  return JSON.stringify(jsonLd);
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLdString = generateBreadcrumbJsonLd(items);

  return (
    <>
      {/* JSON-LD structured data - content is constructed from internal data only */}
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {jsonLdString}
      </Script>

      {/* Visual breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-slate-400" aria-hidden="true">
                  /
                </span>
              )}
              {item.href && index < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-blue-600 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={index === items.length - 1 ? 'text-slate-900 font-medium' : ''}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/**
 * Generate breadcrumb items for common page types
 */
export function generateWarnBreadcrumbs(
  options: {
    year?: string;
    month?: string;
    county?: { name: string; slug: string };
    company?: { name: string; slug: string };
    notice?: { id: number; employer: string };
  } = {}
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'North Carolina', href: '/states/north-carolina' },
    { label: 'WARN Notices', href: '/states/north-carolina/warn' },
  ];

  if (options.year) {
    items.push({
      label: options.year,
      href: `/states/north-carolina/warn/years/${options.year}`,
    });

    if (options.month) {
      const monthName = new Date(2000, parseInt(options.month) - 1).toLocaleString('en-US', {
        month: 'long',
      });
      items.push({ label: monthName });
    }
  }

  if (options.county) {
    items.push({ label: `${options.county.name} County` });
  }

  if (options.company) {
    items.push({ label: options.company.name });
  }

  if (options.notice) {
    // Truncate long employer names
    const truncated =
      options.notice.employer.length > 30
        ? options.notice.employer.slice(0, 30) + '...'
        : options.notice.employer;
    items.push({ label: truncated });
  }

  return items;
}

export default Breadcrumbs;
