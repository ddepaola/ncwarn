import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata = genMeta({
  title: 'Terms of Service',
  description: 'NCWARN Terms of Service - Terms and conditions for using our service.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-lg max-w-none">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using NCWARN ("the Service"), you agree to be bound by these Terms of
          Service. If you do not agree to these terms, please do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          NCWARN provides aggregated public safety information including WARN Act notices, weather
          alerts, power outage data, recalls, and other warnings relevant to North Carolina
          residents. We also operate a job board for NC employers.
        </p>

        <h2>3. Information Accuracy</h2>
        <p>
          While we strive to provide accurate and timely information, NCWARN:
        </p>
        <ul>
          <li>Does not guarantee the accuracy, completeness, or timeliness of any information</li>
          <li>Is not the original source of data and cannot verify all details</li>
          <li>Recommends users verify critical information with official sources</li>
          <li>Is not responsible for decisions made based on information provided</li>
        </ul>

        <h2>4. User Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with or disrupt the Service</li>
          <li>Scrape or harvest data without permission</li>
          <li>Submit false or misleading information</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>

        <h2>5. Job Board Terms</h2>
        <p>For users posting jobs:</p>
        <ul>
          <li>You must provide accurate company and job information</li>
          <li>Job posts must not discriminate based on protected characteristics</li>
          <li>We reserve the right to reject or remove any listing</li>
          <li>Payments are non-refundable once a listing is published</li>
          <li>Listings expire after 30 days unless renewed</li>
        </ul>

        <h2>6. Payment Terms</h2>
        <p>
          Job posting payments are processed securely through PayPal. By making a payment, you
          agree to PayPal's terms of service. All prices are in USD. Refunds are provided only
          if we reject your listing before publication.
        </p>

        <h2>7. Intellectual Property</h2>
        <p>
          The Service's design, code, and original content are protected by copyright and other
          intellectual property laws. You may not copy, modify, or distribute our materials
          without permission.
        </p>
        <p>
          Data sourced from government agencies is generally in the public domain. Attribution
          to original sources is provided where applicable.
        </p>

        <h2>8. Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
          WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, NCWARN SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE
          SERVICE.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless NCWARN from any claims, damages, or expenses
          arising from your use of the Service or violation of these terms.
        </p>

        <h2>11. Modifications</h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the Service
          after changes constitutes acceptance of the new terms.
        </p>

        <h2>12. Termination</h2>
        <p>
          We may terminate or suspend access to the Service at any time, without notice, for
          conduct that we believe violates these terms or is harmful to other users or our
          interests.
        </p>

        <h2>13. Governing Law</h2>
        <p>
          These terms shall be governed by the laws of the State of North Carolina, without
          regard to conflict of law principles.
        </p>

        <h2>14. Contact</h2>
        <p>
          For questions about these terms, contact us at{' '}
          <a href="mailto:legal@ncwarn.com">legal@ncwarn.com</a>.
        </p>
      </div>
    </div>
  );
}
