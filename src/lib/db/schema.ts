import {
  pgTable, text, timestamp, integer, boolean, jsonb, pgEnum, uuid, index, uniqueIndex, doublePrecision,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { geographyPoint } from "./types";

/*
 * Core entities from handoff §9.2. Raw evidence (raw_records) is kept separate
 * from normalized product events; every public fact carries provenance (§9.3).
 * Tables not needed by the first vertical slice (watches, notifications, reports,
 * subscriptions, organizations) are added in later milestones.
 */

export const freshnessEnum = pgEnum("freshness_state", [
  "current", "delayed", "stale", "temporarily_unavailable", "coverage_not_available", "integration_pending",
]);

export const accessTypeEnum = pgEnum("source_access_type", [
  "official_link", "open_data_api", "bulk_download", "html_public", "licensed_feed",
]);

export const termsStatusEnum = pgEnum("source_terms_status", [
  "link_only", "permitted", "review_required", "prohibited",
]);

export const topicEnum = pgEnum("topic", [
  "crime", "registry", "development", "roads", "environment", "flood", "property", "government", "layoffs",
]);

export const precisionEnum = pgEnum("location_precision", [
  "exact", "block", "intersection", "centroid", "jurisdiction_only",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft", "quarantined", "published", "suppressed", "corrected",
]);

export const runOutcomeEnum = pgEnum("run_outcome", ["success", "partial", "failed", "skipped"]);

export const jurisdictions = pgTable("jurisdictions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  kind: text("kind").notNull(), // state | county | municipality | agency
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  stateCode: text("state_code").notNull().default("NC"),
  countyFips: text("county_fips"), // 5-digit, e.g. 37179 Union, 37119 Mecklenburg
  parentId: uuid("parent_id"),
  mvpCoverage: boolean("mvp_coverage").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("jurisdictions_kind_slug").on(t.kind, t.slug)]);

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // adapter key, e.g. "ncsbi_registry_links"
  name: text("name").notNull(),
  authority: text("authority").notNull(),
  url: text("url").notNull(),
  topic: topicEnum("topic").notNull(),
  accessType: accessTypeEnum("access_type").notNull(),
  termsStatus: termsStatusEnum("terms_status").notNull().default("review_required"),
  termsNotes: text("terms_notes"),
  coverageDescription: text("coverage_description"),
  scheduleCron: text("schedule_cron"),
  expectedIntervalMinutes: integer("expected_interval_minutes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sourceRuns = pgTable("source_runs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  outcome: runOutcomeEnum("outcome"),
  fetched: integer("fetched").notNull().default(0),
  parsed: integer("parsed").notNull().default(0),
  rejected: integer("rejected").notNull().default(0),
  created: integer("created").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  error: text("error"),
  parserVersion: text("parser_version"),
  jobId: text("job_id"),
}, (t) => [index("source_runs_source_started").on(t.sourceId, t.startedAt)]);

export const coverageStatus = pgTable("coverage_status", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
  state: freshnessEnum("state").notNull().default("integration_pending"),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
  note: text("note"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("coverage_source_jurisdiction").on(t.sourceId, t.jurisdictionId)]);

export const rawRecords = pgTable("raw_records", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  externalId: text("external_id"),
  sourceUrl: text("source_url"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  contentHash: text("content_hash").notNull(),
  payload: jsonb("payload").notNull(),
  retentionClass: text("retention_class").notNull().default("standard"),
}, (t) => [uniqueIndex("raw_records_source_external").on(t.sourceId, t.externalId, t.contentHash)]);

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  normalizedAddress: text("normalized_address"),
  parcelId: text("parcel_id"),
  countyFips: text("county_fips"),
  municipality: text("municipality"),
  point: geographyPoint("point"),
  precision: precisionEnum("precision").notNull().default("exact"),
  geocoder: text("geocoder"),
  geocoderResultId: text("geocoder_result_id"),
  geocoderConfidence: doublePrecision("geocoder_confidence"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("locations_point_gix").using("gist", t.point)]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  publicId: text("public_id").notNull().unique(),
  topic: topicEnum("topic").notNull(),
  type: text("type").notNull(),
  status: eventStatusEnum("status").notNull().default("draft"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  whyItMatters: text("why_it_matters"),
  responsibleParty: text("responsible_party"),
  eventDate: timestamp("event_date", { withTimezone: true }),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }),
  // provenance (§9.3)
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  sourceUrl: text("source_url").notNull(),
  sourceExternalId: text("source_external_id"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
  parserVersion: text("parser_version").notNull(),
  contentHash: text("content_hash").notNull(),
  coverageStatusId: uuid("coverage_status_id").references(() => coverageStatus.id),
  humanReviewStatus: text("human_review_status").notNull().default("none"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("events_topic_status_date").on(t.topic, t.status, t.eventDate),
  uniqueIndex("events_source_external").on(t.sourceId, t.sourceExternalId),
]);

export const eventSources = pgTable("event_sources", {
  eventId: uuid("event_id").notNull().references(() => events.id),
  rawRecordId: uuid("raw_record_id").notNull().references(() => rawRecords.id),
}, (t) => [uniqueIndex("event_sources_pk").on(t.eventId, t.rawRecordId)]);

export const eventLocations = pgTable("event_locations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull().references(() => events.id),
  locationId: uuid("location_id").references(() => locations.id),
  jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
  point: geographyPoint("point"),
  precision: precisionEnum("precision").notNull().default("centroid"),
  distanceRule: text("distance_rule").notNull().default("radius"),
}, (t) => [index("event_locations_point_gix").using("gist", t.point), index("event_locations_event").on(t.eventId)]);

/** Address lookups — operational metrics + abuse detection. No PII beyond the address itself. */
export const addressLookups = pgTable("address_lookups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  publicId: text("public_id").notNull().unique(),
  inputAddress: text("input_address").notNull(),
  normalizedAddress: text("normalized_address"),
  countyFips: text("county_fips"),
  municipality: text("municipality"),
  point: geographyPoint("point"),
  geocoder: text("geocoder"),
  geocoderConfidence: doublePrecision("geocoder_confidence"),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  ipClass: text("ip_class"), // hashed/bucketed, never the raw IP
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("address_lookups_created").on(t.createdAt)]);

/** Email capture (preview → alerts interest). Consent timestamps kept (§14.2). */
export const emailSignups = pgTable("email_signups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  lookupPublicId: text("lookup_public_id"),
  addressSnapshot: text("address_snapshot"),
  countyFips: text("county_fips"),
  topics: jsonb("topics").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
  consentSource: text("consent_source").notNull().default("preview_form"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("email_signups_email_lookup").on(t.email, t.lookupPublicId)]);

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull().default("general"), // general | correction | press | partnership
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Bot/abuse telemetry — counts only, so we can tune the honeypot without storing spam bodies. */
export const botTraps = pgTable("bot_traps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  form: text("form").notNull(),
  reason: text("reason").notNull(), // honeypot_filled | too_fast | invalid_token | rate_limited
  ipClass: text("ip_class"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("bot_traps_created").on(t.createdAt)]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  requestId: text("request_id"),
  beforeHash: text("before_hash"),
  afterHash: text("after_hash"),
  ipClass: text("ip_class"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
