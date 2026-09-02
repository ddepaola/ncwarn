# DATA_SOURCES.md — source profiles and reuse decisions

Rule (handoff §18): a source's terms/reuse decision is recorded here **before** its adapter is written. Seed data lives in `src/modules/sources/catalog.ts`.

| Key | Authority | Access | Terms status | Decision / notes |
|---|---|---|---|---|
| `ncsbi_registry_links` | NC SBI | official links only | link_only | Stage A per §7.1: search `https://sexoffender.ncsbi.gov/search.aspx`, email alerts `https://signup.ncsbi.gov/`, phone alerts, FAQ. No mirror, no prefill claims, no CAPTCHA interaction. ✅ |
| `cmpd_incidents` | CMPD / City of Charlotte open data | open_data_api | review_required | Next: locate documented endpoint on data.charlottenc.gov, record license (expected: City of Charlotte open data terms), field list, masking rules (block-level), update cadence. Coverage: CMPD jurisdiction only. |
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
