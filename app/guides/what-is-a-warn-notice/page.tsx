/**
 * Educational Guide: What is a WARN Notice?
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { NextSteps } from '@/components/NextSteps';
import { Disclaimer } from '@/components/Disclaimer';

export const metadata: Metadata = {
  title: 'What is a WARN Notice? | Worker Adjustment and Retraining Notification Act | NCWarn.com',
  description:
    'Learn about the WARN Act, which requires employers to provide 60-day advance notice of plant closings and mass layoffs. Understand your rights as an NC worker.',
  openGraph: {
    title: 'What is a WARN Notice?',
    description: 'Understanding the Worker Adjustment and Retraining Notification Act.',
    url: 'https://ncwarn.com/guides/what-is-a-warn-notice',
  },
};

export default function WarnGuide() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides' },
          { label: 'What is a WARN Notice?' },
        ]}
      />

      <article className="prose prose-slate max-w-none">
        <h1>What is a WARN Notice?</h1>

        <p className="lead text-lg text-slate-600">
          The Worker Adjustment and Retraining Notification (WARN) Act is a federal law that requires
          employers to provide advance notice of significant layoffs and plant closings.
        </p>

        <h2>Overview of the WARN Act</h2>

        <p>
          Enacted in 1988, the WARN Act protects workers, their families, and communities by
          requiring most employers with 100 or more employees to provide at least <strong>60 calendar
          days</strong> advance written notice of plant closings and mass layoffs.
        </p>

        <h2>When is a WARN Notice Required?</h2>

        <p>Employers must provide WARN notice when:</p>

        <ul>
          <li>
            <strong>Plant Closing:</strong> A facility or operating unit is permanently or
            temporarily shut down, resulting in employment loss for 50 or more employees during any
            30-day period.
          </li>
          <li>
            <strong>Mass Layoff:</strong> A reduction in force that results in employment loss at a
            single site for 500 or more employees, or 50-499 employees if they make up at least 33%
            of the workforce.
          </li>
        </ul>

        <h2>Who Must Be Notified?</h2>

        <p>Employers must provide written notice to:</p>

        <ul>
          <li>Affected workers or their union representatives</li>
          <li>The state dislocated worker unit</li>
          <li>The chief elected official of the local government</li>
        </ul>

        <h2>What Information is in a WARN Notice?</h2>

        <p>A WARN notice typically includes:</p>

        <ul>
          <li>Name and address of the employment site</li>
          <li>Name and phone number of a company official</li>
          <li>Whether the planned action is expected to be permanent or temporary</li>
          <li>Expected date of the first separation and schedule of separations</li>
          <li>Job titles and number of affected employees in each job classification</li>
        </ul>

        <h2>Exceptions to the WARN Act</h2>

        <p>
          There are limited exceptions when the 60-day notice requirement may be reduced:
        </p>

        <ul>
          <li>
            <strong>Faltering Company:</strong> A company actively seeking capital to avoid a
            shutdown may have reduced notice requirements if they reasonably believe giving notice
            would jeopardize obtaining that capital.
          </li>
          <li>
            <strong>Unforeseeable Business Circumstances:</strong> When the closing or layoff is
            caused by business circumstances that were not reasonably foreseeable at the time
            notice would have been required.
          </li>
          <li>
            <strong>Natural Disaster:</strong> When the closing or layoff is the direct result of
            a natural disaster.
          </li>
        </ul>

        <h2>Penalties for Non-Compliance</h2>

        <p>
          Employers who violate the WARN Act may be liable for back pay and benefits to each
          affected employee for each day of violation, up to 60 days. They may also be subject to
          civil penalties of up to $500 per day of violation.
        </p>

        <h2>North Carolina Specifics</h2>

        <p>
          While North Carolina does not have its own state-level WARN law, the federal WARN Act
          applies to all qualifying employers in the state. WARN notices in NC are filed with the
          North Carolina Department of Commerce, which makes them publicly available.
        </p>

        <div className="not-prose my-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Track NC WARN Notices</h3>
            <p className="text-blue-800 mb-4">
              NCWarn.com aggregates WARN notices from the NC Department of Commerce and makes them
              searchable by company, county, and date.
            </p>
            <Link
              href="/states/north-carolina/warn"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Browse NC WARN Notices →
            </Link>
          </div>
        </div>
      </article>

      <NextSteps title="Affected by a Layoff?" />

      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
