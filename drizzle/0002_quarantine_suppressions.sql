CREATE TABLE "quarantined_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"run_id" uuid,
	"external_id" text,
	"reasons" text[] NOT NULL,
	"payload" jsonb NOT NULL,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"reason" text NOT NULL,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lifted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "quarantined_records" ADD CONSTRAINT "quarantined_records_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarantined_records" ADD CONSTRAINT "quarantined_records_run_id_source_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."source_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppressions" ADD CONSTRAINT "suppressions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quarantined_source_created" ON "quarantined_records" USING btree ("source_id","created_at");--> statement-breakpoint
CREATE INDEX "suppressions_source_external" ON "suppressions" USING btree ("source_id","external_id");
