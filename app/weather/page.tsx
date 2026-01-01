'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { NC_COUNTIES } from '@/lib/county';

interface WeatherAlert {
  id: string;
  event: string;
  severity: string | null;
  urgency: string | null;
  headline: string | null;
  description: string | null;
  instruction: string | null;
  startsAt: string;
  endsAt: string | null;
  sourceUrl: string;
  county: {
    name: string;
    slug: string;
  } | null;
}

interface AlertsResponse {
  data: WeatherAlert[];
  meta: {
    total: number;
    lastUpdated: string;
  };
}

function categorizeAlert(event: string): string {
  const eventLower = event.toLowerCase();
  if (eventLower.includes('tornado') || eventLower.includes('wind')) return 'wind';
  if (eventLower.includes('flood') || eventLower.includes('rain')) return 'flood';
  if (eventLower.includes('fire') || eventLower.includes('red flag')) return 'fire';
  if (eventLower.includes('heat') || eventLower.includes('excessive')) return 'heat';
  if (eventLower.includes('winter') || eventLower.includes('ice') || eventLower.includes('snow') || eventLower.includes('freeze')) return 'winter';
  if (eventLower.includes('thunder') || eventLower.includes('severe')) return 'severe';
  return 'other';
}

function getSeverityColor(severity: string | null): { bg: string; border: string; text: string } {
  switch (severity?.toLowerCase()) {
    case 'extreme':
      return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' };
    case 'severe':
      return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' };
    case 'moderate':
      return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' };
    case 'minor':
      return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800' };
  }
}

export default function WeatherPage() {
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('--:-- --');
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ active: 'true' });
      if (selectedCounty !== 'all') {
        params.set('county', selectedCounty);
      }

      const response = await fetch(`/api/alerts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data: AlertsResponse = await response.json();
      setAlerts(data.data);
      setLastUpdated(format(new Date(data.meta.lastUpdated), 'h:mm a'));
    } catch (err) {
      setError('Failed to load weather alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCounty]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Filter alerts by category on the client side
  const filteredAlerts = selectedCategory === 'all'
    ? alerts
    : alerts.filter(alert => categorizeAlert(alert.event) === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weather Alerts</h1>
            <p className="mt-2 text-gray-600">
              Active weather warnings and advisories for North Carolina from the National Weather Service.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </div>
        </div>
      </div>

      {/* Filter by County and Category */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="sm:col-span-2 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Counties</option>
            {NC_COUNTIES.map(county => (
              <option key={county.fips} value={county.slug}>
                {county.name} County
              </option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Categories</option>
            <option value="wind">Wind</option>
            <option value="flood">Flood</option>
            <option value="fire">Fire</option>
            <option value="heat">Heat</option>
            <option value="winter">Winter</option>
            <option value="severe">Severe</option>
          </select>
        </div>
      </div>

      {/* Active Alerts Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Alerts {filteredAlerts.length > 0 && `(${filteredAlerts.length})`}
        </h2>

        {loading ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading weather alerts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchAlerts}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-green-800 font-medium text-lg">No Active Weather Alerts</p>
            <p className="text-green-600 mt-2">
              {selectedCounty !== 'all'
                ? `No current weather warnings for ${NC_COUNTIES.find(c => c.slug === selectedCounty)?.name || selectedCounty} County.`
                : 'No current weather warnings for North Carolina.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map(alert => {
              const colors = getSeverityColor(alert.severity);
              return (
                <article
                  key={alert.id}
                  className={`${colors.bg} ${colors.border} border rounded-lg p-5 hover:shadow-md transition-shadow`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                          {alert.severity || 'Unknown'}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-300 text-gray-700">
                          {alert.event}
                        </span>
                        {alert.county && (
                          <span className="text-sm text-gray-600">
                            {alert.county.name} County
                          </span>
                        )}
                      </div>
                      <h3 className={`text-lg font-bold ${colors.text} mb-2`}>
                        {alert.headline || alert.event}
                      </h3>
                      {alert.description && (
                        <p className="text-gray-700 mb-3 line-clamp-3">
                          {alert.description.slice(0, 300)}
                          {alert.description.length > 300 && '...'}
                        </p>
                      )}
                      {alert.instruction && (
                        <div className="bg-white/50 rounded p-3 mb-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">Instructions:</p>
                          <p className="text-sm text-gray-700">{alert.instruction.slice(0, 200)}{alert.instruction.length > 200 && '...'}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>
                          Effective: {format(new Date(alert.startsAt), 'MMM d, h:mm a')}
                        </span>
                        {alert.endsAt && (
                          <span>
                            Expires: {format(new Date(alert.endsAt), 'MMM d, h:mm a')}
                          </span>
                        )}
                        <a
                          href={alert.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View full alert
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Weather Map */}
      <div className="mb-8 bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">North Carolina Weather Radar</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span> Rain
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-cyan-200"></span> Snow
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-400"></span> Wind
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> Severe
            </span>
          </div>
        </div>
        <div className="relative" style={{ paddingTop: '56.25%' }}>
          <iframe
            src="https://embed.windy.com/embed2.html?lat=35.5&lon=-79.5&detailLat=35.5&detailLon=-79.5&width=650&height=450&zoom=6&level=surface&overlay=radar&product=radar&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1"
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            title="Weather Radar Map"
            allowFullScreen
          />
        </div>
        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600">
          Interactive weather radar powered by Windy. Click the menu icon in the map to toggle between rain, wind, temperature, clouds, and more.
        </div>
      </div>

      {/* Severity Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">Extreme</div>
          <div className="text-sm text-red-700">Tornado, Hurricane</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">Severe</div>
          <div className="text-sm text-orange-700">Thunderstorm, Flood</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">Moderate</div>
          <div className="text-sm text-yellow-700">Watch, Advisory</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">Minor</div>
          <div className="text-sm text-blue-700">Wind Advisory</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">Unknown</div>
          <div className="text-sm text-gray-700">Special Statement</div>
        </div>
      </div>

      {/* NWS Quick Links */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="https://www.weather.gov/rah/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all text-center"
          >
            <div className="text-2xl mb-2">🌧️</div>
            <div className="font-medium text-gray-900">Raleigh NWS</div>
            <div className="text-sm text-gray-500">Central NC</div>
          </a>
          <a
            href="https://www.weather.gov/ilm/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all text-center"
          >
            <div className="text-2xl mb-2">🌊</div>
            <div className="font-medium text-gray-900">Wilmington NWS</div>
            <div className="text-sm text-gray-500">Coastal NC</div>
          </a>
          <a
            href="https://www.weather.gov/gsp/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all text-center"
          >
            <div className="text-2xl mb-2">⛰️</div>
            <div className="font-medium text-gray-900">Greenville-Spartanburg</div>
            <div className="text-sm text-gray-500">Western NC</div>
          </a>
          <a
            href="https://www.weather.gov/mhx/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow transition-all text-center"
          >
            <div className="text-2xl mb-2">🏖️</div>
            <div className="font-medium text-gray-900">Morehead City</div>
            <div className="text-sm text-gray-500">Eastern NC</div>
          </a>
        </div>
      </div>

      {/* Hurricane Tracker (if applicable) */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Hurricane Season</h2>
        <p className="text-blue-100 mb-4">
          Atlantic hurricane season runs June 1 - November 30. Stay prepared.
        </p>
        <a
          href="https://www.nhc.noaa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          National Hurricane Center
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Source Attribution */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Data sourced from the{' '}
        <a
          href="https://www.weather.gov"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          National Weather Service
        </a>
        {' '}and{' '}
        <a
          href="https://www.windy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Windy.com
        </a>
      </div>
    </div>
  );
}
