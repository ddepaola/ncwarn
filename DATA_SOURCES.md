# DATA_SOURCES.md — source profiles and reuse decisions

Rule (handoff §18): a source's terms/reuse decision is recorded here **before** its adapter is written. Seed data lives in `src/modules/sources/catalog.ts`.

| Key | Authority | Access | Terms status | Decision / notes |
|---|---|---|---|---|
| `ncsbi_registry_links` | NC SBI | official links only | link_only | Stage A per §7.1: search `https://sexoffender.ncsbi.gov/search.aspx`, email alerts `https://signup.ncsbi.gov/`, phone alerts, FAQ. No mirror, no prefill claims, no CAPTCHA interaction. ✅ |
| `cmpd_incidents` | CMPD / City of Charlotte open data | open_data_api (ArcGIS REST) | **permitted** (2026-09-02 review) | Item `d22200cd879248fcb2258e6840bd6726` on data.charlottenc.gov; service `https://gis.charlottenc.gov/arcgis/rest/services/CMPD/CMPDIncidents/MapServer/0` (Query capability, pagination, max 2500/req). Access information / attribution: "Charlotte-Mecklenburg Police". License text is a use-at-own-risk disclaimer ("Users of this data must be aware of data conditions and bear responsibility for the appropriate use…"); no reuse prohibition, public open-data portal. Dataset: all CMPD incident reports since 2017 (~866k), NIBRS highest-offense classification, includes non-criminal 800-series and Unfounded clearances → we exclude non-criminal codes from counts and show clearance status. **Location precision: block** (`LOCATION` is a hundred-block, `LATITUDE_PUBLIC/LONGITUDE_PUBLIC` are the public/masked coordinates) — we store precision=`block` and never refine. Dates are epoch ms (`DATE_REPORTED`, `DATE_INCIDENT_BEGAN`). Observed lag ≈ 2–3 days; expected interval 1 day. Coverage: CMPD jurisdiction only (Charlotte + areas CMPD serves) — addresses in Huntersville, Cornelius, Davidson, Matthews, Mint Hill, Pineville get "coverage not available". Counsel to confirm commercial reuse before paid reports. |
| `union_sheriff_crime_map` | Union County Sheriff | link | link_only | Vendor crime map; no feed. Link + coverage disclosure. |
| `waxhaw_pd_crime_map` | Waxhaw PD | link | link_only | Same as above. |
| `ncsbi_crime_stats` | NC SBI | bulk | review_required | Annual county/agency context only. |
| `ncdot_projects` | NCDOT | ArcGIS services | review_required | Check NCDOT GIS data terms; import project geometry if permitted. |
| `nc_fiman` | NC Emergency Management | map/services | review_required | Link first; evaluate service reuse. |
| `ncdeq_records` | NC DEQ | HTML/public records | review_required | Permits, sites, hearings. Respect robots. |
| `ncga_legislation` | NCGA | HTML | review_required | Bills/actions; check robots and rate. |
| `ncsbe_campaign_finance` | NCSBE | bulk downloads | review_required | Public data; provenance per transaction. |
| `nc_jsc_orders` | Judicial Standards Commission | HTML | review_required | Public orders only. |
| `nc_commerce_warn` | NC Commerce | HTML/PDF | review_required | WARN notices; a "layoffs" category, not the site identity. |
| `union_planning` / `meck_planning` | County/municipal | agendas/HTML | review_required | Highest-priority development adapters. |

Prohibited everywhere: CAPTCHA/anti-automation bypass, authenticated scraping, bulk registry mirroring, SEO offender pages.
