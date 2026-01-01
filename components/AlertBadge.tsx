import clsx from 'clsx';

type AlertSeverity = 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';

interface AlertBadgeProps {
  severity: AlertSeverity | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulsing?: boolean;
  className?: string;
}

const severityStyles: Record<AlertSeverity, string> = {
  extreme: 'bg-red-600 text-white',
  severe: 'bg-orange-500 text-white',
  moderate: 'bg-yellow-500 text-gray-900',
  minor: 'bg-blue-500 text-white',
  unknown: 'bg-gray-500 text-white',
};

const severityLabels: Record<AlertSeverity, string> = {
  extreme: 'Extreme',
  severe: 'Severe',
  moderate: 'Moderate',
  minor: 'Minor',
  unknown: 'Unknown',
};

export default function AlertBadge({
  severity,
  label,
  size = 'md',
  pulsing = false,
  className,
}: AlertBadgeProps) {
  const normalizedSeverity = (
    severity?.toLowerCase() as AlertSeverity
  ) in severityStyles
    ? (severity.toLowerCase() as AlertSeverity)
    : 'unknown';

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        severityStyles[normalizedSeverity],
        sizeStyles[size],
        pulsing && 'animate-pulse',
        className
      )}
    >
      {normalizedSeverity === 'extreme' && (
        <svg
          className="w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {label || severityLabels[normalizedSeverity]}
    </span>
  );
}

// Category badges for different alert types
export function WeatherCategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const categoryStyles: Record<string, string> = {
    wind: 'bg-purple-100 text-purple-800',
    flood: 'bg-blue-100 text-blue-800',
    fire: 'bg-red-100 text-red-800',
    heat: 'bg-orange-100 text-orange-800',
    winter: 'bg-cyan-100 text-cyan-800',
    tropical: 'bg-teal-100 text-teal-800',
    severe: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const categoryIcons: Record<string, string> = {
    wind: '💨',
    flood: '🌊',
    fire: '🔥',
    heat: '🌡️',
    winter: '❄️',
    tropical: '🌀',
    severe: '⛈️',
    other: '⚠️',
  };

  const normalizedCategory = category.toLowerCase();
  const style = categoryStyles[normalizedCategory] || categoryStyles.other;
  const icon = categoryIcons[normalizedCategory] || categoryIcons.other;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
        style,
        className
      )}
    >
      <span>{icon}</span>
      <span className="capitalize">{category}</span>
    </span>
  );
}
