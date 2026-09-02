CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TYPE "public"."source_access_type" AS ENUM('official_link', 'open_data_api', 'bulk_download', 'html_public', 'licensed_feed');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'quarantined', 'published', 'suppressed', 'corrected');--> statement-breakpoint
CREATE TYPE "public"."freshness_state" AS ENUM('current', 'delayed', 'stale', 'temporarily_unavailable', 'coverage_not_available', 'integration_pending');--> statement-breakpoint
CREATE TYPE "public"."location_precision" AS ENUM('exact', 'block', 'intersection', 'centroid', 'jurisdiction_only');--> statement-breakpoint
CREATE TYPE "public"."run_outcome" AS ENUM('success', 'partial', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."source_terms_status" AS ENUM('link_only', 'permitted', 'review_required', 'prohibited');--> statement-breakpoint
CREATE TYPE "public"."topic" AS ENUM('crime', 'registry', 'development', 'roads', 'environment', 'flood', 'property', 'government', 'layoffs');--> statement-breakpoint
CREATE TABLE "address_lookups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"input_address" text NOT NULL,
	"normalized_address" text,
	"county_fips" text,
	"municipality" text,
	"point" geography(Point,4326),
	"geocoder" text,
	"geocoder_confidence" double precision,
	"success" boolean NOT NULL,
	"failure_reason" text,
	"ip_class" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "address_lookups_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"request_id" text,
	"before_hash" text,
	"after_hash" text,
	"ip_class" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_traps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form" text NOT NULL,
	"reason" text NOT NULL,
	"ip_class" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"kind" text DEFAULT 'general' NOT NULL,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coverage_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"jurisdiction_id" uuid,
	"state" "freshness_state" DEFAULT 'integration_pending' NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"lookup_public_id" text,
	"address_snapshot" text,
	"county_fips" text,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"consent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consent_source" text DEFAULT 'preview_form' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"location_id" uuid,
	"jurisdiction_id" uuid,
	"point" geography(Point,4326),
	"precision" "location_precision" DEFAULT 'centroid' NOT NULL,
	"distance_rule" text DEFAULT 'radius' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sources" (
	"event_id" uuid NOT NULL,
	"raw_record_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"topic" "topic" NOT NULL,
	"type" text NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"why_it_matters" text,
	"responsible_party" text,
	"event_date" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"source_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"source_external_id" text,
	"fetched_at" timestamp with time zone NOT NULL,
	"source_updated_at" timestamp with time zone,
	"parser_version" text NOT NULL,
	"content_hash" text NOT NULL,
	"coverage_status_id" uuid,
	"human_review_status" text DEFAULT 'none' NOT NULL,
	"published_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "jurisdictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"state_code" text DEFAULT 'NC' NOT NULL,
	"county_fips" text,
	"parent_id" uuid,
	"mvp_coverage" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_address" text,
	"parcel_id" text,
	"county_fips" text,
	"municipality" text,
	"point" geography(Point,4326),
	"precision" "location_precision" DEFAULT 'exact' NOT NULL,
	"geocoder" text,
	"geocoder_result_id" text,
	"geocoder_confidence" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text,
	"source_url" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"content_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"retention_class" text DEFAULT 'standard' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"outcome" "run_outcome",
	"fetched" integer DEFAULT 0 NOT NULL,
	"parsed" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"created" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"error" text,
	"parser_version" text,
	"job_id" text
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"authority" text NOT NULL,
	"url" text NOT NULL,
	"topic" "topic" NOT NULL,
	"access_type" "source_access_type" NOT NULL,
	"terms_status" "source_terms_status" DEFAULT 'review_required' NOT NULL,
	"terms_notes" text,
	"coverage_description" text,
	"schedule_cron" text,
	"expected_interval_minutes" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "coverage_status" ADD CONSTRAINT "coverage_status_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_status" ADD CONSTRAINT "coverage_status_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_coverage_status_id_coverage_status_id_fk" FOREIGN KEY ("coverage_status_id") REFERENCES "public"."coverage_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_records" ADD CONSTRAINT "raw_records_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_runs" ADD CONSTRAINT "source_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_lookups_created" ON "address_lookups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bot_traps_created" ON "bot_traps" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coverage_source_jurisdiction" ON "coverage_status" USING btree ("source_id","jurisdiction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_signups_email_lookup" ON "email_signups" USING btree ("email","lookup_public_id");--> statement-breakpoint
CREATE INDEX "event_locations_point_gix" ON "event_locations" USING gist ("point");--> statement-breakpoint
CREATE INDEX "event_locations_event" ON "event_locations" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_sources_pk" ON "event_sources" USING btree ("event_id","raw_record_id");--> statement-breakpoint
CREATE INDEX "events_topic_status_date" ON "events" USING btree ("topic","status","event_date");--> statement-breakpoint
CREATE UNIQUE INDEX "events_source_external" ON "events" USING btree ("source_id","source_external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "jurisdictions_kind_slug" ON "jurisdictions" USING btree ("kind","slug");--> statement-breakpoint
CREATE INDEX "locations_point_gix" ON "locations" USING gist ("point");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_records_source_external" ON "raw_records" USING btree ("source_id","external_id","content_hash");--> statement-breakpoint
CREATE INDEX "source_runs_source_started" ON "source_runs" USING btree ("source_id","started_at");