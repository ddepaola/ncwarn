CREATE TABLE "crime_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"raw_record_id" uuid,
	"agency_code" text,
	"agency_classification" text NOT NULL,
	"category" text NOT NULL,
	"non_criminal" boolean DEFAULT false NOT NULL,
	"reported_at" timestamp with time zone NOT NULL,
	"incident_began_at" timestamp with time zone,
	"location_text" text,
	"city" text,
	"zip" text,
	"point" geography(Point,4326),
	"precision" "location_precision" DEFAULT 'block' NOT NULL,
	"clearance_status" text,
	"location_type" text,
	"patrol_division" text,
	"content_hash" text NOT NULL,
	"source_url" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"parser_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crime_incidents" ADD CONSTRAINT "crime_incidents_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crime_incidents" ADD CONSTRAINT "crime_incidents_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crime_incidents_source_external" ON "crime_incidents" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "crime_incidents_point_gix" ON "crime_incidents" USING gist ("point");--> statement-breakpoint
CREATE INDEX "crime_incidents_reported" ON "crime_incidents" USING btree ("source_id","reported_at");
