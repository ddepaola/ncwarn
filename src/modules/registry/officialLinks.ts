/**
 * Registered-offender module — MVP Stage A only (handoff §7.1).
 * Official links, no caching/republishing of registry content, no prefill claims.
 */
export const REGISTRY_CARD = {
  title: "Registered-Offender Records Near This Address",
  authority: "North Carolina State Bureau of Investigation (NCSBI)",
  searchUrl: "https://sexoffender.ncsbi.gov/search.aspx",
  emailAlertsUrl: "https://signup.ncsbi.gov/",
  phoneAlertsUrl: "https://sexoffender.ncsbi.gov/telephone.aspx",
  faqUrl: "https://sexoffender.ncsbi.gov/faq.aspx",
  explanation:
    "North Carolina's official registry is maintained by the NCSBI. Registered addresses can change quickly and identity is only confirmed by fingerprints, so we link you to the current official records rather than copying them. You are leaving NCWarn.com to verify official information.",
  alertsNote:
    "The NCSBI offers free email notifications when a registrant reports an address within 1, 3, or 5 miles of an address you choose.",
  misuseWarning:
    "Registry information may not be used to threaten, intimidate, stalk, or harass anyone. Misuse can be prosecuted.",
} as const;
