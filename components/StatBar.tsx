import clsx from 'clsx';

interface Stat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  href?: string;
}

interface StatBarProps {
  stats: Stat[];
  className?: string;
}

export default function StatBar({ stats, className }: StatBarProps) {
  return (
    <div
      className={clsx(
        'bg-gray-900 text-white rounded-lg p-4',
        'grid gap-4',
        stats.length === 2 && 'grid-cols-2',
        stats.length === 3 && 'grid-cols-3',
        stats.length === 4 && 'grid-cols-2 md:grid-cols-4',
        stats.length > 4 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
        className
      )}
    >
      {stats.map((stat, index) => {
        const content = (
          <div className="text-center">
            {stat.icon && (
              <div className="flex justify-center mb-1 text-gray-400">
                {stat.icon}
              </div>
            )}
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        );

        if (stat.href) {
          return (
            <a
              key={index}
              href={stat.href}
              className="hover:bg-gray-800 rounded-lg p-2 transition-colors"
            >
              {content}
            </a>
          );
        }

        return (
          <div key={index} className="p-2">
            {content}
          </div>
        );
      })}
    </div>
  );
}
