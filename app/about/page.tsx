import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata = genMeta({
  title: 'About NCWARN',
  description: 'About NCWARN - North Carolina Warnings, Alerts & WARN Notices. Our mission is to keep NC residents informed.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About NCWARN</h1>

      <div className="prose prose-lg max-w-none">
        <p>
          NCWARN is a free public service that aggregates warnings, alerts, and safety information
          for North Carolina residents. Our goal is to provide a single, easy-to-use resource for
          staying informed about potential hazards and important notices affecting our state.
        </p>

        <h2>What We Track</h2>
        <ul>
          <li>
            <strong>WARN Act Notices</strong> - Worker Adjustment and Retraining Notification Act
            layoff and plant closing notices filed with NC Commerce
          </li>
          <li>
            <strong>Weather Alerts</strong> - Real-time warnings and advisories from the National
            Weather Service
          </li>
          <li>
            <strong>Power Outages</strong> - Current outage information from major NC utilities
          </li>
          <li>
            <strong>AMBER Alerts</strong> - Child abduction emergency alerts
          </li>
          <li>
            <strong>Scam Alerts</strong> - Consumer protection warnings from the NC Department of
            Justice
          </li>
          <li>
            <strong>Recalls</strong> - Vehicle, product, and food recalls from federal agencies
            (NHTSA, CPSC, FDA)
          </li>
        </ul>

        <h2>Data Sources</h2>
        <p>
          All data on NCWARN is sourced from official government agencies and utility providers.
          We aggregate publicly available information and present it in a user-friendly format.
          For the most authoritative and up-to-date information, we encourage users to verify
          with the original source.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe that access to safety information should be easy and free. By centralizing
          alerts and warnings from multiple sources, we help North Carolinians stay informed and
          prepared.
        </p>

        <h2>Accessibility</h2>
        <p>
          NCWARN is committed to digital accessibility. We strive to meet WCAG 2.1 AA standards
          to ensure our content is available to all users, including those using assistive
          technologies.
        </p>

        <h2>Contact</h2>
        <p>
          For questions, suggestions, or to report an issue, please contact us at{' '}
          <a href="mailto:contact@ncwarn.com">contact@ncwarn.com</a>.
        </p>
      </div>
    </div>
  );
}
