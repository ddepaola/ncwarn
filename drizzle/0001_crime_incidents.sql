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
CREATE INDEX "crime_incidents_reported" ON "crime_incidents" USING btree ("source_id","reported_at");__NCRR_EOF__
mkdir -p "drizzle/meta"
cat > 'drizzle/meta/0001_snapshot.json' <<'__NCRR_EOF__'
{
  "id": "054aef52-9a61-4201-88a2-77c77c8d45bb",
  "prevId": "130759d8-5d4c-4621-9499-9efc36050a97",
  "version": "7",
  "dialect": "postgresql",
  "tables": {
    "public.address_lookups": {
      "name": "address_lookups",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "public_id": {
          "name": "public_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "input_address": {
          "name": "input_address",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "normalized_address": {
          "name": "normalized_address",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "county_fips": {
          "name": "county_fips",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "municipality": {
          "name": "municipality",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "point": {
          "name": "point",
          "type": "geography(Point,4326)",
          "primaryKey": false,
          "notNull": false
        },
        "geocoder": {
          "name": "geocoder",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "geocoder_confidence": {
          "name": "geocoder_confidence",
          "type": "double precision",
          "primaryKey": false,
          "notNull": false
        },
        "success": {
          "name": "success",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true
        },
        "failure_reason": {
          "name": "failure_reason",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "ip_class": {
          "name": "ip_class",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "address_lookups_created": {
          "name": "address_lookups_created",
          "columns": [
            {
              "expression": "created_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "address_lookups_public_id_unique": {
          "name": "address_lookups_public_id_unique",
          "nullsNotDistinct": false,
          "columns": [
            "public_id"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.audit_log": {
      "name": "audit_log",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "actor": {
          "name": "actor",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "action": {
          "name": "action",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "target": {
          "name": "target",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "request_id": {
          "name": "request_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "before_hash": {
          "name": "before_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "after_hash": {
          "name": "after_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "ip_class": {
          "name": "ip_class",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.bot_traps": {
      "name": "bot_traps",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "form": {
          "name": "form",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "reason": {
          "name": "reason",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "ip_class": {
          "name": "ip_class",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "bot_traps_created": {
          "name": "bot_traps_created",
          "columns": [
            {
              "expression": "created_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.contact_messages": {
      "name": "contact_messages",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "subject": {
          "name": "subject",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "body": {
          "name": "body",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "kind": {
          "name": "kind",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'general'"
        },
        "delivered_at": {
          "name": "delivered_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.coverage_status": {
      "name": "coverage_status",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "source_id": {
          "name": "source_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "jurisdiction_id": {
          "name": "jurisdiction_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "state": {
          "name": "state",
          "type": "freshness_state",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'integration_pending'"
        },
        "last_success_at": {
          "name": "last_success_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "last_attempt_at": {
          "name": "last_attempt_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "source_updated_at": {
          "name": "source_updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "note": {
          "name": "note",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "coverage_source_jurisdiction": {
          "name": "coverage_source_jurisdiction",
          "columns": [
            {
              "expression": "source_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "jurisdiction_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "coverage_status_source_id_sources_id_fk": {
          "name": "coverage_status_source_id_sources_id_fk",
          "tableFrom": "coverage_status",
          "tableTo": "sources",
          "columnsFrom": [
            "source_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "coverage_status_jurisdiction_id_jurisdictions_id_fk": {
          "name": "coverage_status_jurisdiction_id_jurisdictions_id_fk",
          "tableFrom": "coverage_status",
          "tableTo": "jurisdictions",
          "columnsFrom": [
            "jurisdiction_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.crime_incidents": {
      "name": "crime_incidents",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "source_id": {
          "name": "source_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "external_id": {
          "name": "external_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "raw_record_id": {
          "name": "raw_record_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "agency_code": {
          "name": "agency_code",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "agency_classification": {
          "name": "agency_classification",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "category": {
          "name": "category",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "non_criminal": {
          "name": "non_criminal",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "reported_at": {
          "name": "reported_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "incident_began_at": {
          "name": "incident_began_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "location_text": {
          "name": "location_text",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "city": {
          "name": "city",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "zip": {
          "name": "zip",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "point": {
          "name": "point",
          "type": "geography(Point,4326)",
          "primaryKey": false,
          "notNull": false
        },
        "precision": {
          "name": "precision",
          "type": "location_precision",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'block'"
        },
        "clearance_status": {
          "name": "clearance_status",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "location_type": {
          "name": "location_type",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "patrol_division": {
          "name": "patrol_division",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "content_hash": {
          "name": "content_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "source_url": {
          "name": "source_url",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "fetched_at": {
          "name": "fetched_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "parser_version": {
          "name": "parser_version",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "crime_incidents_source_external": {
          "name": "crime_incidents_source_external",
          "columns": [
            {
              "expression": "source_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "external_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "crime_incidents_point_gix": {
          "name": "crime_incidents_point_gix",
          "columns": [
            {
              "expression": "point",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "gist",
          "with": {}
        },
        "crime_incidents_reported": {
          "name": "crime_incidents_reported",
          "columns": [
            {
              "expression": "source_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "reported_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "crime_incidents_source_id_sources_id_fk": {
          "name": "crime_incidents_source_id_sources_id_fk",
          "tableFrom": "crime_incidents",
          "tableTo": "sources",
          "columnsFrom": [
            "source_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "crime_incidents_raw_record_id_raw_records_id_fk": {
          "name": "crime_incidents_raw_record_id_raw_records_id_fk",
          "tableFrom": "crime_incidents",
          "tableTo": "raw_records",
          "columnsFrom": [
            "raw_record_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.email_signups": {
      "name": "email_signups",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "lookup_public_id": {
          "name": "lookup_public_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "address_snapshot": {
          "name": "address_snapshot",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "county_fips": {
          "name": "county_fips",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "topics": {
          "name": "topics",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true,
          "default": "'[]'::jsonb"
        },
        "consent_at": {
          "name": "consent_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "consent_source": {
          "name": "consent_source",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'preview_form'"
        },
        "confirmed_at": {
          "name": "confirmed_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "unsubscribed_at": {
          "name": "unsubscribed_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "email_signups_email_lookup": {
          "name": "email_signups_email_lookup",
          "columns": [
            {
              "expression": "email",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "lookup_public_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.event_locations": {
      "name": "event_locations",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "event_id": {
          "name": "event_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "location_id": {
          "name": "location_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "jurisdiction_id": {
          "name": "jurisdiction_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "point": {
          "name": "point",
          "type": "geography(Point,4326)",
          "primaryKey": false,
          "notNull": false
        },
        "precision": {
          "name": "precision",
          "type": "location_precision",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'centroid'"
        },
        "distance_rule": {
          "name": "distance_rule",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'radius'"
        }
      },
      "indexes": {
        "event_locations_point_gix": {
          "name": "event_locations_point_gix",
          "columns": [
            {
              "expression": "point",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "gist",
          "with": {}
        },
        "event_locations_event": {
          "name": "event_locations_event",
          "columns": [
            {
              "expression": "event_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "event_locations_event_id_events_id_fk": {
          "name": "event_locations_event_id_events_id_fk",
          "tableFrom": "event_locations",
          "tableTo": "events",
          "columnsFrom": [
            "event_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "event_locations_location_id_locations_id_fk": {
          "name": "event_locations_location_id_locations_id_fk",
          "tableFrom": "event_locations",
          "tableTo": "locations",
          "columnsFrom": [
            "location_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "event_locations_jurisdiction_id_jurisdictions_id_fk": {
          "name": "event_locations_jurisdiction_id_jurisdictions_id_fk",
          "tableFrom": "event_locations",
          "tableTo": "jurisdictions",
          "columnsFrom": [
            "jurisdiction_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.event_sources": {
      "name": "event_sources",
      "schema": "",
      "columns": {
        "event_id": {
          "name": "event_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "raw_record_id": {
          "name": "raw_record_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        }
      },
      "indexes": {
        "event_sources_pk": {
          "name": "event_sources_pk",
          "columns": [
            {
              "expression": "event_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "raw_record_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "event_sources_event_id_events_id_fk": {
          "name": "event_sources_event_id_events_id_fk",
          "tableFrom": "event_sources",
          "tableTo": "events",
          "columnsFrom": [
            "event_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "event_sources_raw_record_id_raw_records_id_fk": {
          "name": "event_sources_raw_record_id_raw_records_id_fk",
          "tableFrom": "event_sources",
          "tableTo": "raw_records",
          "columnsFrom": [
            "raw_record_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.events": {
      "name": "events",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "public_id": {
          "name": "public_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "topic": {
          "name": "topic",
          "type": "topic",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "event_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'draft'"
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "summary": {
          "name": "summary",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "why_it_matters": {
          "name": "why_it_matters",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "responsible_party": {
          "name": "responsible_party",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "event_date": {
          "name": "event_date",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "deadline_at": {
          "name": "deadline_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "source_id": {
          "name": "source_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "source_url": {
          "name": "source_url",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "source_external_id": {
          "name": "source_external_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "fetched_at": {
          "name": "fetched_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true
        },
        "source_updated_at": {
          "name": "source_updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "parser_version": {
          "name": "parser_version",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "content_hash": {
          "name": "content_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "coverage_status_id": {
          "name": "coverage_status_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "human_review_status": {
          "name": "human_review_status",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'none'"
        },
        "published_at": {
          "name": "published_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "version": {
          "name": "version",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 1
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "events_topic_status_date": {
          "name": "events_topic_status_date",
          "columns": [
            {
              "expression": "topic",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "event_date",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "events_source_external": {
          "name": "events_source_external",
          "columns": [
            {
              "expression": "source_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "source_external_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "events_source_id_sources_id_fk": {
          "name": "events_source_id_sources_id_fk",
          "tableFrom": "events",
          "tableTo": "sources",
          "columnsFrom": [
            "source_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "events_coverage_status_id_coverage_status_id_fk": {
          "name": "events_coverage_status_id_coverage_status_id_fk",
          "tableFrom": "events",
          "tableTo": "coverage_status",
          "columnsFrom": [
            "coverage_status_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "events_public_id_unique": {
          "name": "events_public_id_unique",
          "nullsNotDistinct": false,
          "columns": [
            "public_id"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.jurisdictions": {
      "name": "jurisdictions",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "kind": {
          "name": "kind",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "slug": {
          "name": "slug",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "state_code": {
          "name": "state_code",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'NC'"
        },
        "county_fips": {
          "name": "county_fips",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "parent_id": {
          "name": "parent_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "mvp_coverage": {
          "name": "mvp_coverage",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "jurisdictions_kind_slug": {
          "name": "jurisdictions_kind_slug",
          "columns": [
            {
              "expression": "kind",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "slug",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.locations": {
      "name": "locations",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "normalized_address": {
          "name": "normalized_address",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "parcel_id": {
          "name": "parcel_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "county_fips": {
          "name": "county_fips",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "municipality": {
          "name": "municipality",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "point": {
          "name": "point",
          "type": "geography(Point,4326)",
          "primaryKey": false,
          "notNull": false
        },
        "precision": {
          "name": "precision",
          "type": "location_precision",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'exact'"
        },
        "geocoder": {
          "name": "geocoder",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "geocoder_result_id": {
          "name": "geocoder_result_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "geocoder_confidence": {
          "name": "geocoder_confidence",
          "type": "double precision",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {
        "locations_point_gix": {
          "name": "locations_point_gix",
          "columns": [
            {
              "expression": "point",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "gist",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.raw_records": {
      "name": "raw_records",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "source_id": {
          "name": "source_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "external_id": {
          "name": "external_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "source_url": {
          "name": "source_url",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "fetched_at": {
          "name": "fetched_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "content_hash": {
          "name": "content_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "payload": {
          "name": "payload",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true
        },
        "retention_class": {
          "name": "retention_class",
          "type": "text",
          "primaryKey": false,
          "notNull": true,
          "default": "'standard'"
        }
      },
      "indexes": {
        "raw_records_source_external": {
          "name": "raw_records_source_external",
          "columns": [
            {
              "expression": "source_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "external_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "content_hash",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": true,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "raw_records_source_id_sources_id_fk": {
          "name": "raw_records_source_id_sources_id_fk",
          "tableFrom": "raw_records",
          "tableTo": "sources",
          "columnsFrom": [
            "source_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.source_runs": {
      "name": "source_runs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "source_id": {
          "name": "source_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "started_at": {
          "name": "started_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "ended_at": {
          "name": "ended_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        },
        "outcome": {
          "name": "outcome",
          "type": "run_outcome",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": false
        },
        "fetched": {
          "name": "fetched",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "parsed": {
          "name": "parsed",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "rejected": {
          "name": "rejected",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "created": {
          "name": "created",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "updated": {
          "name": "updated",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "error": {
          "name": "error",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "parser_version": {
          "name": "parser_version",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "job_id": {
          "name": "job_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {
        "source_runs_source_started": {
          "name": "source_runs_source_started",
          "columns": [
            {
              "expression": "source_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "started_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "source_runs_source_id_sources_id_fk": {
          "name": "source_runs_source_id_sources_id_fk",
          "tableFrom": "source_runs",
          "tableTo": "sources",
          "columnsFrom": [
            "source_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.sources": {
      "name": "sources",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "key": {
          "name": "key",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "authority": {
          "name": "authority",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "url": {
          "name": "url",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "topic": {
          "name": "topic",
          "type": "topic",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "access_type": {
          "name": "access_type",
          "type": "source_access_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "terms_status": {
          "name": "terms_status",
          "type": "source_terms_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'review_required'"
        },
        "terms_notes": {
          "name": "terms_notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "coverage_description": {
          "name": "coverage_description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "schedule_cron": {
          "name": "schedule_cron",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "expected_interval_minutes": {
          "name": "expected_interval_minutes",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "sources_key_unique": {
          "name": "sources_key_unique",
          "nullsNotDistinct": false,
          "columns": [
            "key"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    }
  },
  "enums": {
    "public.source_access_type": {
      "name": "source_access_type",
      "schema": "public",
      "values": [
        "official_link",
        "open_data_api",
        "bulk_download",
        "html_public",
        "licensed_feed"
      ]
    },
    "public.event_status": {
      "name": "event_status",
      "schema": "public",
      "values": [
        "draft",
        "quarantined",
        "published",
        "suppressed",
        "corrected"
      ]
    },
    "public.freshness_state": {
      "name": "freshness_state",
      "schema": "public",
      "values": [
        "current",
        "delayed",
        "stale",
        "temporarily_unavailable",
        "coverage_not_available",
        "integration_pending"
      ]
    },
    "public.location_precision": {
      "name": "location_precision",
      "schema": "public",
      "values": [
        "exact",
        "block",
        "intersection",
        "centroid",
        "jurisdiction_only"
      ]
    },
    "public.run_outcome": {
      "name": "run_outcome",
      "schema": "public",
      "values": [
        "success",
        "partial",
        "failed",
        "skipped"
      ]
    },
    "public.source_terms_status": {
      "name": "source_terms_status",
      "schema": "public",
      "values": [
        "link_only",
        "permitted",
        "review_required",
        "prohibited"
      ]
    },
    "public.topic": {
      "name": "topic",
      "schema": "public",
      "values": [
        "crime",
        "registry",
        "development",
        "roads",
        "environment",
        "flood",
        "property",
        "government",
        "layoffs"
      ]
    }
  },
  "schemas": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "views": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}__NCRR_EOF__
mkdir -p "drizzle/meta"
cat > 'drizzle/meta/_journal.json' <<'__NCRR_EOF__'
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1788368785367,
      "tag": "0000_init",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1788380433083,
      "tag": "0001_crime_incidents",
      "breakpoints": true
    }
  ]
}__NCRR_EOF__
mkdir -p "scripts"
cat > 'scripts/seed.ts' <<'__NCRR_EOF__'
import { db, schema, sqlClient } from "../src/lib/db";
import { SOURCE_CATALOG } from "../src/modules/sources/catalog";
import { MVP_COUNTIES } from "../src/modules/coverage/jurisdiction";
import { eq, and, isNull } from "drizzle-orm";

/** Idempotent seed: jurisdictions (state + MVP counties), source catalog, coverage rows. Safe to re-run. */
async function main() {
  const [nc] = await db.insert(schema.jurisdictions).values({ kind: "state", name: "North Carolina", slug: "north-carolina", stateCode: "NC", mvpCoverage: true })
    .onConflictDoUpdate({ target: [schema.jurisdictions.kind, schema.jurisdictions.slug], set: { name: "North Carolina" } }).returning();
  const countyIds: Record<string, string> = {};
  for (const [fips, c] of Object.entries(MVP_COUNTIES)) {
    const [row] = await db.insert(schema.jurisdictions).values({ kind: "county", name: `${c.name} County`, slug: c.slug, stateCode: "NC", countyFips: fips, parentId: nc.id, mvpCoverage: true })
      .onConflictDoUpdate({ target: [schema.jurisdictions.kind, schema.jurisdictions.slug], set: { countyFips: fips, mvpCoverage: true } }).returning();
    countyIds[fips] = row.id;
  }
  for (const s of SOURCE_CATALOG) {
    const [src] = await db.insert(schema.sources).values({
      key: s.key, name: s.name, authority: s.authority, url: s.url, topic: s.topic, accessType: s.accessType, termsStatus: s.termsStatus,
      coverageDescription: s.coverageDescription, expectedIntervalMinutes: s.expectedIntervalMinutes ?? null, active: true,
    }).onConflictDoUpdate({ target: schema.sources.key, set: { name: s.name, authority: s.authority, url: s.url, topic: s.topic, accessType: s.accessType, termsStatus: s.termsStatus, expectedIntervalMinutes: s.expectedIntervalMinutes ?? null, coverageDescription: s.coverageDescription, updatedAt: new Date() } }).returning();
    // statewide row (jurisdiction NULL) always exists so /sources can list it
    const existing = await db.select({ id: schema.coverageStatus.id }).from(schema.coverageStatus).where(and(eq(schema.coverageStatus.sourceId, src.id), isNull(schema.coverageStatus.jurisdictionId)));
    if (existing.length === 0) await db.insert(schema.coverageStatus).values({ sourceId: src.id, jurisdictionId: null, state: s.initialState, lastSuccessAt: s.initialState === "current" ? new Date() : null });
    for (const fips of s.countyFips ?? []) {
      const jid = countyIds[fips]; if (!jid) continue;
      await db.insert(schema.coverageStatus).values({ sourceId: src.id, jurisdictionId: jid, state: s.initialState }).onConflictDoNothing();
    }
  }
  console.log(JSON.stringify({ level: "info", msg: "seed complete", sources: SOURCE_CATALOG.length }));
  await sqlClient.end();
}
main().catch((err) => { console.error(err); process.exit(1); });
