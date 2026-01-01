'use client';

import clsx from 'clsx';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  featured?: boolean;
  cta: string;
}

interface PricingTableProps {
  plans?: PricingPlan[];
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
  className?: string;
}

const defaultPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    features: [
      '30-day listing',
      'Basic job posting',
      'Email support',
      'Standard visibility',
    ],
    cta: 'Get Started',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 249,
    features: [
      '30-day listing',
      'Featured badge',
      'Priority placement',
      'Social media promotion',
      'Email & phone support',
    ],
    featured: true,
    cta: 'Most Popular',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 399,
    features: [
      '30-day listing',
      'Premium featured badge',
      'Top placement',
      'Social media & newsletter promotion',
      'Dedicated account support',
      'Analytics dashboard',
    ],
    cta: 'Go Pro',
  },
];

export default function PricingTable({
  plans = defaultPlans,
  onSelectPlan,
  loading,
  className,
}: PricingTableProps) {
  return (
    <div
      className={clsx(
        'grid gap-6 md:grid-cols-3',
        className
      )}
    >
      {plans.map(plan => (
        <div
          key={plan.id}
          className={clsx(
            'relative rounded-2xl border p-6',
            plan.featured
              ? 'border-blue-500 shadow-lg scale-105 bg-white'
              : 'border-gray-200 bg-white'
          )}
        >
          {plan.featured && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              Most Popular
            </span>
          )}

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
              <span className="text-gray-500">/listing</span>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onSelectPlan(plan.id)}
            disabled={loading}
            className={clsx(
              'mt-6 w-full py-3 px-4 rounded-lg font-medium transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              plan.featured
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            )}
          >
            {loading ? 'Processing...' : plan.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
