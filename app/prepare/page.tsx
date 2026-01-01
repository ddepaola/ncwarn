import { generateMetadata as genMeta } from '@/lib/seo';
import Notice from '@/components/Notice';

export const metadata = genMeta({
  title: 'Emergency Preparedness',
  description: 'Emergency preparedness guide for North Carolina residents. Build your kit, make a plan, and stay informed.',
  path: '/prepare',
});

const AFFILIATE_ENABLED = process.env.AFFILIATE_ENABLED === 'true';

export default function PreparePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Emergency Preparedness</h1>
        <p className="mt-2 text-gray-600">
          Be ready for hurricanes, severe weather, power outages, and other emergencies in North Carolina.
        </p>
      </div>

      {AFFILIATE_ENABLED && (
        <Notice type="info" className="mb-8">
          <strong>Affiliate Disclosure:</strong> Some links on this page may be affiliate links.
          We may earn a small commission if you make a purchase, at no additional cost to you.
          This helps support our free public safety services.
        </Notice>
      )}

      {/* Emergency Kit */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Build Your Emergency Kit</h2>
        <p className="text-gray-700 mb-6">
          Have supplies ready to sustain your family for at least 72 hours (3 days).
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Essential Supplies</h3>
            <ul className="space-y-2">
              {[
                'Water - 1 gallon per person per day (3-day supply)',
                'Non-perishable food (3-day supply)',
                'Manual can opener',
                'Flashlights and extra batteries',
                'First aid kit',
                'Prescription medications (7-day supply)',
                'Battery-powered or hand-crank radio',
                'Cell phone with chargers and backup battery',
                'Whistle to signal for help',
                'Dust masks and plastic sheeting',
                'Moist towelettes, garbage bags, and plastic ties',
                'Wrench or pliers to turn off utilities',
                'Local maps',
                'Cash in small bills',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Additional Items</h3>
            <ul className="space-y-2">
              {[
                'Important documents (copies in waterproof container)',
                'Sleeping bags or warm blankets',
                'Complete change of clothing',
                'Fire extinguisher',
                'Matches in waterproof container',
                'Feminine supplies and personal hygiene items',
                'Mess kits, paper cups, plates, utensils',
                'Paper and pencil',
                'Books, games, puzzles for children',
                'Pet food, water, and supplies',
                'Baby formula, diapers, bottles',
                'Infant medications',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Backup Power */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Backup Power Options</h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            <strong>Safety Warning:</strong> Never operate generators, grills, or camp stoves indoors
            or in enclosed spaces. Carbon monoxide is odorless and deadly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Portable Power Stations</h3>
            <p className="text-gray-600 text-sm mb-4">
              Safe for indoor use. Good for charging devices and running small electronics.
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>No fumes or noise</li>
              <li>Can be recharged via solar</li>
              <li>Limited power capacity</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Portable Generators</h3>
            <p className="text-gray-600 text-sm mb-4">
              Good for powering essential appliances during extended outages.
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Outdoor use only (20+ feet from house)</li>
              <li>Requires fuel storage</li>
              <li>Regular maintenance needed</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Standby Generators</h3>
            <p className="text-gray-600 text-sm mb-4">
              Permanent installation that automatically powers your home.
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Automatic operation</li>
              <li>Whole-home power</li>
              <li>Professional installation required</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Weather Radios */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Weather Radios</h2>
        <p className="text-gray-700 mb-4">
          A NOAA Weather Radio is the most reliable way to receive emergency alerts, especially during
          power outages or severe weather.
        </p>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Features to Look For</h3>
          <ul className="grid md:grid-cols-2 gap-2 text-gray-700">
            <li>• SAME (Specific Area Message Encoding) capability</li>
            <li>• Battery backup (and/or hand crank)</li>
            <li>• Alert tone with automatic wake-up</li>
            <li>• AM/FM radio receiver</li>
            <li>• USB charging port for devices</li>
            <li>• Built-in flashlight</li>
          </ul>
        </div>
      </section>

      {/* Make a Plan */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Make a Plan</h2>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Family Communication Plan</h3>
            <ul className="text-gray-700 space-y-1">
              <li>• Identify an out-of-state contact everyone can check in with</li>
              <li>• Know how to text (texts may work when calls don't)</li>
              <li>• Establish meeting places (one near home, one outside neighborhood)</li>
              <li>• Program emergency contacts in all phones</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Evacuation Routes</h3>
            <ul className="text-gray-700 space-y-1">
              <li>• Know your county's evacuation zones</li>
              <li>• Plan multiple routes out of your area</li>
              <li>• Identify pet-friendly shelters and hotels</li>
              <li>• Keep vehicle fuel tank at least half full during hurricane season</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Special Needs</h3>
            <ul className="text-gray-700 space-y-1">
              <li>• Register with your utility's medical priority program</li>
              <li>• Have backup power for medical equipment</li>
              <li>• Keep extra supplies of medications</li>
              <li>• Plan for mobility devices and accessibility needs</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Additional Resources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="https://www.ready.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Ready.gov</h3>
            <p className="text-sm text-gray-500">Federal emergency preparedness resources</p>
          </a>
          <a
            href="https://www.ncdps.gov/emergency-management"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">NC Emergency Management</h3>
            <p className="text-sm text-gray-500">State-specific emergency information</p>
          </a>
          <a
            href="https://www.redcross.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">American Red Cross</h3>
            <p className="text-sm text-gray-500">Disaster relief and preparedness</p>
          </a>
          <a
            href="https://www.weather.gov/safety"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">NWS Weather Safety</h3>
            <p className="text-sm text-gray-500">Weather-specific safety information</p>
          </a>
        </div>
      </section>
    </div>
  );
}
