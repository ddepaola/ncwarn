import clsx from 'clsx';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  className?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  className,
}: KpiCardProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
  };

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border shadow-sm',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className={clsx('mt-2 flex items-center gap-1 text-sm', trendColors[trend.direction])}>
              {trendIcons[trend.direction]}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
