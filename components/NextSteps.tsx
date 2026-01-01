/**
 * Next Steps Component
 * Displays actionable resources for workers affected by layoffs
 * Includes affiliate links (configurable via environment variables)
 */

import { AffiliateDisclosure } from './Disclaimer';

interface Resource {
  title: string;
  description: string;
  url: string;
  icon: string;
  isAffiliate?: boolean;
}

const defaultResources: Resource[] = [
  {
    title: 'File for Unemployment',
    description: 'Apply for NC unemployment benefits through the Division of Employment Security.',
    url: 'https://des.nc.gov/',
    icon: '📋',
    isAffiliate: false,
  },
  {
    title: 'Update Your Resume',
    description: 'Create a professional resume to start your job search.',
    url: process.env.NEXT_PUBLIC_AFFILIATE_RESUME_URL || 'https://resume.io',
    icon: '📝',
    isAffiliate: true,
  },
  {
    title: 'Search Job Listings',
    description: 'Browse thousands of job openings in North Carolina and beyond.',
    url: process.env.NEXT_PUBLIC_AFFILIATE_INDEED_URL || 'https://www.indeed.com/jobs?l=North+Carolina',
    icon: '🔍',
    isAffiliate: true,
  },
  {
    title: 'Explore Training Programs',
    description: 'Learn new skills with online courses and certifications.',
    url: process.env.NEXT_PUBLIC_AFFILIATE_TRAINING_URL || 'https://www.coursera.org',
    icon: '🎓',
    isAffiliate: true,
  },
  {
    title: 'Network on LinkedIn',
    description: 'Connect with professionals and discover job opportunities.',
    url: process.env.NEXT_PUBLIC_AFFILIATE_LINKEDIN_URL || 'https://www.linkedin.com/jobs',
    icon: '🤝',
    isAffiliate: true,
  },
];

interface NextStepsProps {
  title?: string;
  resources?: Resource[];
  showDisclosure?: boolean;
}

export function NextSteps({
  title = 'Next Steps After a Layoff',
  resources = defaultResources,
  showDisclosure = true,
}: NextStepsProps) {
  const hasAffiliateLinks = resources.some((r) => r.isAffiliate);

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 my-8">
      <h2 className="text-xl font-semibold text-blue-900 mb-4">{title}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource, index) => (
          <a
            key={index}
            href={resource.url}
            target="_blank"
            rel={resource.isAffiliate ? 'noopener sponsored' : 'noopener noreferrer'}
            className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-blue-100"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl" role="img" aria-hidden="true">
                {resource.icon}
              </span>
              <div>
                <h3 className="font-medium text-slate-900">{resource.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{resource.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {showDisclosure && hasAffiliateLinks && <AffiliateDisclosure />}
    </div>
  );
}

export default NextSteps;
