import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata = genMeta({
  title: 'Privacy Policy',
  description: 'NCWARN Privacy Policy - How we collect, use, and protect your information.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-lg max-w-none">
        <h2>Information We Collect</h2>
        <h3>Automatically Collected Information</h3>
        <p>
          When you visit NCWARN, we automatically collect certain information about your device
          and usage patterns, including:
        </p>
        <ul>
          <li>IP address (anonymized)</li>
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>Pages visited and time spent</li>
          <li>Referring website</li>
        </ul>

        <h3>Information You Provide</h3>
        <p>
          We collect information you voluntarily provide, such as:
        </p>
        <ul>
          <li>Email address (if you subscribe to alerts)</li>
          <li>Job posting information (company, contact details)</li>
          <li>Payment information (processed securely through PayPal)</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Provide and improve our services</li>
          <li>Send requested alerts and notifications</li>
          <li>Process job posting payments</li>
          <li>Analyze usage patterns to improve the site</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>Information Sharing</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personal information to third parties,
          except:
        </p>
        <ul>
          <li>With your consent</li>
          <li>To comply with legal requirements</li>
          <li>To protect our rights or safety</li>
          <li>With service providers who assist our operations (under strict confidentiality)</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use cookies and similar technologies for essential site functionality and to analyze
          site usage. You can control cookies through your browser settings.
        </p>

        <h2>Data Security</h2>
        <p>
          We implement appropriate security measures to protect your information. However, no
          internet transmission is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>Third-Party Links</h2>
        <p>
          Our site contains links to third-party websites (government agencies, news sources).
          We are not responsible for their privacy practices. Please review their policies when
          visiting.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          NCWARN is not directed at children under 13. We do not knowingly collect information
          from children under 13.
        </p>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Opt out of marketing communications</li>
        </ul>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this policy periodically. Changes will be posted on this page with an
          updated revision date.
        </p>

        <h2>Contact Us</h2>
        <p>
          For privacy-related questions or requests, contact us at{' '}
          <a href="mailto:privacy@ncwarn.com">privacy@ncwarn.com</a>.
        </p>
      </div>
    </div>
  );
}
