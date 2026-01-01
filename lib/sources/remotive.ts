import { createLogger } from '../logger';

const logger = createLogger('source:remotive');

const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';
const AFFILIATE_TAG = '?via=uwork';

export interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

export interface RemoteJobRecord {
  remoteId: number;
  url: string;
  title: string;
  company: string;
  companyLogo: string | null;
  category: string;
  tags: string[];
  jobType: string;
  location: string;
  salary: string | null;
  description: string;
  publishedAt: Date;
}

interface RemotiveResponse {
  'job-count': number;
  'total-job-count': number;
  jobs: RemotiveJob[];
}

// Job categories available on Remotive
export const REMOTIVE_CATEGORIES = [
  { slug: 'software-dev', label: 'Software Development' },
  { slug: 'customer-service', label: 'Customer Service' },
  { slug: 'design', label: 'Design' },
  { slug: 'marketing', label: 'Marketing' },
  { slug: 'sales', label: 'Sales' },
  { slug: 'product', label: 'Product' },
  { slug: 'business', label: 'Business' },
  { slug: 'data', label: 'Data' },
  { slug: 'devops', label: 'DevOps / Sysadmin' },
  { slug: 'finance', label: 'Finance / Legal' },
  { slug: 'hr', label: 'Human Resources' },
  { slug: 'qa', label: 'QA' },
  { slug: 'writing', label: 'Writing' },
  { slug: 'all-others', label: 'All Others' },
];

/**
 * Add affiliate tag to Remotive URLs
 */
export function addAffiliateTag(url: string): string {
  if (url.includes('remotive.com')) {
    // Remove existing query params and add affiliate tag
    const baseUrl = url.split('?')[0];
    return `${baseUrl}${AFFILIATE_TAG}`;
  }
  return url;
}

/**
 * Fetch remote jobs from Remotive API
 * Note: API recommends max 4 requests per day, jobs have 24hr delay
 */
export async function fetchRemoteJobs(options?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<RemoteJobRecord[]> {
  logger.info({ options }, 'Fetching remote jobs from Remotive');

  try {
    const params = new URLSearchParams();

    if (options?.category) {
      params.set('category', options.category);
    }
    if (options?.search) {
      params.set('search', options.search);
    }
    if (options?.limit) {
      params.set('limit', String(options.limit));
    }

    const url = params.toString()
      ? `${REMOTIVE_API}?${params}`
      : REMOTIVE_API;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NCWARN/1.0 (ncwarn.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Remotive API returned ${response.status}`);
    }

    const data: RemotiveResponse = await response.json();

    const jobs: RemoteJobRecord[] = data.jobs.map(job => ({
      remoteId: job.id,
      url: addAffiliateTag(job.url),
      title: job.title,
      company: job.company_name,
      companyLogo: job.company_logo || null,
      category: job.category,
      tags: job.tags || [],
      jobType: job.job_type,
      location: job.candidate_required_location || 'Worldwide',
      salary: job.salary || null,
      description: job.description,
      publishedAt: new Date(job.publication_date),
    }));

    logger.info({ count: jobs.length }, 'Fetched remote jobs from Remotive');
    return jobs;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch remote jobs');
    return [];
  }
}

/**
 * Get jobs filtered for US-based or worldwide positions
 * (More relevant for NC users)
 */
export async function fetchUSRemoteJobs(limit = 100): Promise<RemoteJobRecord[]> {
  const jobs = await fetchRemoteJobs({ limit: 500 });

  // Filter for US-friendly positions
  const usJobs = jobs.filter(job => {
    const loc = job.location.toLowerCase();
    return (
      loc.includes('usa') ||
      loc.includes('united states') ||
      loc.includes('us ') ||
      loc.includes('north america') ||
      loc.includes('worldwide') ||
      loc.includes('anywhere') ||
      loc === 'usa only' ||
      loc === 'us'
    );
  });

  return usJobs.slice(0, limit);
}

/**
 * Search remote jobs
 */
export async function searchRemoteJobs(query: string): Promise<RemoteJobRecord[]> {
  return fetchRemoteJobs({ search: query, limit: 50 });
}

/**
 * Get jobs by category
 */
export async function fetchRemoteJobsByCategory(categorySlug: string): Promise<RemoteJobRecord[]> {
  return fetchRemoteJobs({ category: categorySlug, limit: 100 });
}

/**
 * Get the Remotive homepage URL with affiliate tag
 */
export function getRemotiveAffiliateUrl(path = ''): string {
  return `https://remotive.com${path}${AFFILIATE_TAG}`;
}
