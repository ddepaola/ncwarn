/**
 * NoticeCard Component
 * Displays a single WARN notice in list views
 */

import Link from 'next/link';
import { formatDate } from '@/lib/normalize';

export interface NoticeCardData {
  id: number;
  employer: string;
  city?: string | null;
  impacted?: number | null;
  noticeDate: Date | string;
  effectiveOn?: Date | string | null;
  industry?: string | null;
  county?: {
    name: string;
    slug: string;
  } | null;
  company?: {
    name: string;
    slug: string;
  } | null;
}

interface NoticeCardProps {
  notice: NoticeCardData;
  showCounty?: boolean;
  showLink?: boolean;
}

export function NoticeCard({ notice, showCounty = true, showLink = true }: NoticeCardProps) {
  const noticeDate = typeof notice.noticeDate === 'string'
    ? new Date(notice.noticeDate)
    : notice.noticeDate;

  const effectiveDate = notice.effectiveOn
    ? typeof notice.effectiveOn === 'string'
      ? new Date(notice.effectiveOn)
      : notice.effectiveOn
    : null;

  const content = (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {notice.employer}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-600">
            {showCounty && notice.county && (
              <span>{notice.county.name} County</span>
            )}
            {notice.city && <span>{notice.city}</span>}
            {notice.industry && (
              <span className="text-slate-500">{notice.industry}</span>
            )}
          </div>
        </div>

        {notice.impacted && (
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold text-red-600">
              {notice.impacted.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">affected</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
        <div>
          <span className="text-slate-500">Notice Filed: </span>
          <span className="text-slate-700">{formatDate(noticeDate)}</span>
        </div>
        {effectiveDate && (
          <div>
            <span className="text-slate-500">Effective: </span>
            <span className="text-slate-700">{formatDate(effectiveDate)}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (showLink) {
    return (
      <Link
        href={`/states/north-carolina/warn/notices/${notice.id}`}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Compact version for sidebars and related notices
 */
export function NoticeCardCompact({ notice }: { notice: NoticeCardData }) {
  const noticeDate = typeof notice.noticeDate === 'string'
    ? new Date(notice.noticeDate)
    : notice.noticeDate;

  return (
    <Link
      href={`/states/north-carolina/warn/notices/${notice.id}`}
      className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
    >
      <div className="font-medium text-slate-900 text-sm truncate">
        {notice.employer}
      </div>
      <div className="flex justify-between items-center mt-1 text-xs text-slate-500">
        <span>{formatDate(noticeDate)}</span>
        {notice.impacted && (
          <span className="text-red-600 font-medium">
            {notice.impacted.toLocaleString()} affected
          </span>
        )}
      </div>
    </Link>
  );
}

export default NoticeCard;
