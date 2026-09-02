/**
 * Initial source catalog (handoff §8). Seeded into `sources` + `coverage_status`.
 * terms_status must be reviewed and recorded in DATA_SOURCES.md before any
 * automated adapter is written for a source.
 */
export interface CatalogEntry {
  key: string;
  name: string;
  authority: string;
  url: string;
  topic: "crime" | "registry" | "development" | "roads" | "environment" | "flood" | "property" | "government" | "layoffs";
  accessType: "official_link" | "open_data_api" | "bulk_download" | "html_public" | "licensed_feed";
  termsStatus: "link_only" | "permitted" | "review_required" | "prohibited";
  coverageDescription: string;
  initialState: "integration_pending" | "coverage_not_available" | "current";
  countyFips?: string[]; // jurisdictions this source covers (empty = statewide)
  expectedIntervalMinutes?: number;
}

export const SOURCE_CATALOG: CatalogEntry[] = [
  {
    key: "ncsbi_registry_links", name: "NC Sex Offender Registry (official search & alerts)",
    authority: "NC State Bureau of Investigation", url: "https://sexoffender.ncsbi.gov/",
    topic: "registry", accessType: "official_link", termsStatus: "link_only",
    coverageDescription: "Statewide. Official search and 1/3/5-mile email notifications. No bulk mirror (handoff §7.1).",
    initialState: "current",
  },
  {
    key: "cmpd_incidents", name: "CMPD Incidents (Charlotte open data)",
    authority: "Charlotte-Mecklenburg Police Department", url: "https://data.charlottenc.gov/",
    topic: "crime", accessType: "open_data_api", termsStatus: "review_required",
    coverageDescription: "CMPD jurisdiction only (City of Charlotte + contract areas). Excludes other Mecklenburg agencies (e.g., Huntersville, Cornelius, Davidson, Matthews, Mint Hill, Pineville).",
    initialState: "integration_pending", countyFips: ["37119"], expectedIntervalMinutes: 1440,
  },
  {
    key: "union_sheriff_crime_map", name: "Union County Sheriff's Office crime mapping",
    authority: "Union County Sheriff's Office", url: "https://www.unioncountync.gov/government/departments-r-z/sheriff-s-office",
    topic: "crime", accessType: "official_link", termsStatus: "link_only",
    coverageDescription: "Unincorporated Union County and contract municipalities. Link only until an authorized feed is confirmed.",
    initialState: "coverage_not_available", countyFips: ["37179"],
  },
  {
    key: "waxhaw_pd_crime_map", name: "Waxhaw Police crime mapping",
    authority: "Town of Waxhaw Police Department", url: "https://www.waxhaw.com/",
    topic: "crime", accessType: "official_link", termsStatus: "link_only",
    coverageDescription: "Town of Waxhaw. Link and coverage disclosure only.",
    initialState: "coverage_not_available", countyFips: ["37179"],
  },
  {
    key: "ncsbi_crime_stats", name: "NC SBI crime statistics",
    authority: "NC State Bureau of Investigation", url: "https://www.ncsbi.gov/Services/Crime-Statistics",
    topic: "crime", accessType: "bulk_download", termsStatus: "review_required",
    coverageDescription: "County/agency annual context only; not address-level incidents.",
    initialState: "integration_pending",
  },
  {
    key: "ncdot_projects", name: "NCDOT Projects Near Me / STIP",
    authority: "NC Department of Transportation", url: "https://www.ncdot.gov/projects/",
    topic: "roads", accessType: "open_data_api", termsStatus: "review_required",
    coverageDescription: "Statewide planned and active transportation projects.",
    initialState: "integration_pending",
  },
  {
    key: "nc_fiman", name: "NC Flood Inundation Mapping and Alert Network (FIMAN)",
    authority: "NC Emergency Management", url: "https://fiman.nc.gov/",
    topic: "flood", accessType: "official_link", termsStatus: "review_required",
    coverageDescription: "Statewide gauges and inundation maps.",
    initialState: "integration_pending",
  },
  {
    key: "ncdeq_records", name: "NC DEQ public records, permits and notices",
    authority: "NC Department of Environmental Quality", url: "https://deq.nc.gov/",
    topic: "environment", accessType: "html_public", termsStatus: "review_required",
    coverageDescription: "Statewide permits, contaminated sites, hearings and comment deadlines.",
    initialState: "integration_pending",
  },
  {
    key: "ncga_legislation", name: "NC General Assembly bills and actions",
    authority: "North Carolina General Assembly", url: "https://www.ncleg.gov/",
    topic: "government", accessType: "html_public", termsStatus: "review_required",
    coverageDescription: "Statewide legislation; geographic relevance derived from bill text and sponsors.",
    initialState: "integration_pending",
  },
  {
    key: "ncsbe_campaign_finance", name: "NC State Board of Elections campaign finance",
    authority: "NC State Board of Elections", url: "https://www.ncsbe.gov/campaign-finance",
    topic: "government", accessType: "bulk_download", termsStatus: "review_required",
    coverageDescription: "Statewide committees and transactions with source provenance.",
    initialState: "integration_pending",
  },
  {
    key: "nc_jsc_orders", name: "NC Judicial Standards Commission public orders",
    authority: "NC Judicial Standards Commission", url: "https://www.nccourts.gov/commissions/judicial-standards-commission",
    topic: "government", accessType: "html_public", termsStatus: "review_required",
    coverageDescription: "Public orders only.",
    initialState: "integration_pending",
  },
  {
    key: "nc_commerce_warn", name: "NC Department of Commerce WARN notices",
    authority: "NC Department of Commerce", url: "https://www.commerce.nc.gov/data-tools-reports/labor-market-data-tools/warn-reports",
    topic: "layoffs", accessType: "html_public", termsStatus: "review_required",
    coverageDescription: "Statewide employer layoff/closure notices.",
    initialState: "integration_pending",
  },
  {
    key: "union_planning", name: "Union County planning cases, agendas and notices",
    authority: "Union County Government", url: "https://www.unioncountync.gov/",
    topic: "development", accessType: "html_public", termsStatus: "review_required",
    coverageDescription: "Union County and municipalities (Waxhaw, Monroe, Indian Trail, Weddington, Marvin, Wesley Chapel, Stallings).",
    initialState: "integration_pending", countyFips: ["37179"],
  },
  {
    key: "meck_planning", name: "Mecklenburg County / Charlotte planning cases and agendas",
    authority: "Mecklenburg County / City of Charlotte", url: "https://www.charlottenc.gov/Growth-and-Development/Planning-and-Development",
    topic: "development", accessType: "html_public", termsStatus: "review_required",
    coverageDescription: "Charlotte and Mecklenburg towns rezonings, hearings and notices.",
    initialState: "integration_pending", countyFips: ["37119"],
  },
];
