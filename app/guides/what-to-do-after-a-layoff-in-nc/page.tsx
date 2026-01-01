/**
 * Educational Guide: What to Do After a Layoff in NC
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { NextSteps } from '@/components/NextSteps';
import { Disclaimer } from '@/components/Disclaimer';

export const metadata: Metadata = {
  title: 'What to Do After a Layoff in North Carolina | NCWarn.com',
  description:
    'Step-by-step guide for NC workers affected by a layoff or plant closing. Learn about unemployment benefits, job search resources, and your rights.',
  openGraph: {
    title: 'What to Do After a Layoff in NC',
    description: 'A step-by-step guide for North Carolina workers affected by layoffs.',
    url: 'https://ncwarn.com/guides/what-to-do-after-a-layoff-in-nc',
  },
};

export default function AfterLayoffGuide() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides' },
          { label: 'What to Do After a Layoff' },
        ]}
      />

      <article className="prose prose-slate max-w-none">
        <h1>What to Do After a Layoff in North Carolina</h1>

        <p className="lead text-lg text-slate-600">
          Being laid off can be stressful, but taking the right steps can help you navigate this
          transition. Here&apos;s a step-by-step guide for workers in North Carolina.
        </p>

        <h2>Immediate Steps (First Week)</h2>

        <h3>1. Get Documentation from Your Employer</h3>
        <p>Before you leave, make sure you have:</p>
        <ul>
          <li>Written confirmation of your layoff date and reason</li>
          <li>Information about your final paycheck and any severance</li>
          <li>Details about continuing health insurance (COBRA)</li>
          <li>401(k) and retirement account information</li>
          <li>References or recommendation letters</li>
        </ul>

        <h3>2. File for Unemployment Benefits</h3>
        <p>
          File for North Carolina unemployment benefits as soon as possible. You can apply online
          at the NC Division of Employment Security (DES) website.
        </p>
        <div className="not-prose my-4">
          <a
            href="https://des.nc.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg transition-colors"
          >
            NC DES Website →
          </a>
        </div>
        <p>To file, you&apos;ll need:</p>
        <ul>
          <li>Social Security number</li>
          <li>Driver&apos;s license or state ID</li>
          <li>Employer name, address, and phone number</li>
          <li>Work history for the past 18 months</li>
          <li>Direct deposit information (optional but faster)</li>
        </ul>

        <h3>3. Review Your Health Insurance Options</h3>
        <p>You typically have several options:</p>
        <ul>
          <li>
            <strong>COBRA:</strong> Continue your employer&apos;s plan for up to 18 months (you pay
            the full premium)
          </li>
          <li>
            <strong>Healthcare.gov:</strong> Losing job-based coverage qualifies you for a Special
            Enrollment Period
          </li>
          <li>
            <strong>Medicaid:</strong> If your income drops significantly, you may qualify
          </li>
          <li>
            <strong>Spouse&apos;s plan:</strong> If married, you can join your spouse&apos;s
            employer plan
          </li>
        </ul>

        <h2>Short-Term Steps (First Month)</h2>

        <h3>4. Assess Your Finances</h3>
        <ul>
          <li>Calculate how long your savings will last</li>
          <li>Create a reduced budget and cut non-essential expenses</li>
          <li>Contact creditors if you anticipate difficulty making payments</li>
          <li>Understand your severance package terms and timing</li>
        </ul>

        <h3>5. Update Your Resume and LinkedIn</h3>
        <ul>
          <li>Update your resume with your most recent experience</li>
          <li>Refresh your LinkedIn profile and set it to &quot;Open to Work&quot;</li>
          <li>Gather work samples and update your portfolio</li>
          <li>Request recommendations from former colleagues</li>
        </ul>

        <h3>6. Start Your Job Search</h3>
        <p>Effective job search strategies include:</p>
        <ul>
          <li>
            <strong>NCWorks:</strong> North Carolina&apos;s official job search site with local
            postings
          </li>
          <li>
            <strong>Industry job boards:</strong> Sites specific to your field</li>
          <li>
            <strong>Networking:</strong> Let your professional network know you&apos;re looking
          </li>
          <li>
            <strong>Staffing agencies:</strong> Can provide temporary or temp-to-hire positions
          </li>
        </ul>

        <h2>Longer-Term Considerations</h2>

        <h3>7. Consider Training and Education</h3>
        <p>
          North Carolina offers several programs for displaced workers:
        </p>
        <ul>
          <li>
            <strong>NCWorks Career Centers:</strong> Free career counseling and job search
            assistance
          </li>
          <li>
            <strong>Trade Adjustment Assistance (TAA):</strong> If your layoff was due to foreign
            trade, you may qualify for additional benefits and training
          </li>
          <li>
            <strong>Community colleges:</strong> NC&apos;s community college system offers
            affordable retraining programs
          </li>
        </ul>

        <h3>8. Know Your Rights</h3>
        <p>As a laid-off worker, you have certain rights:</p>
        <ul>
          <li>
            <strong>Final paycheck:</strong> NC law requires payment on the next regular payday
          </li>
          <li>
            <strong>WARN Act:</strong> If you didn&apos;t receive 60 days notice and your employer
            was required to give it, you may be entitled to back pay
          </li>
          <li>
            <strong>Non-compete agreements:</strong> May be unenforceable under certain conditions
          </li>
          <li>
            <strong>Discrimination:</strong> Layoffs cannot be based on protected characteristics
          </li>
        </ul>

        <h2>Resources for NC Workers</h2>

        <div className="not-prose my-6 grid gap-4 sm:grid-cols-2">
          <a
            href="https://des.nc.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="font-semibold text-slate-900">NC DES</div>
            <div className="text-sm text-slate-600">Unemployment benefits</div>
          </a>
          <a
            href="https://www.ncworks.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="font-semibold text-slate-900">NCWorks</div>
            <div className="text-sm text-slate-600">Job search and career centers</div>
          </a>
          <a
            href="https://www.healthcare.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="font-semibold text-slate-900">Healthcare.gov</div>
            <div className="text-sm text-slate-600">Health insurance marketplace</div>
          </a>
          <a
            href="https://www.nccommunitycolleges.edu/"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="font-semibold text-slate-900">NC Community Colleges</div>
            <div className="text-sm text-slate-600">Training and education</div>
          </a>
        </div>
      </article>

      <NextSteps title="Next Steps" />

      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
