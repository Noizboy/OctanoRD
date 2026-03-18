CREATE TABLE IF NOT EXISTS "fraud_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signal_type" text NOT NULL,
	"payload_hash" text,
	"station_id" uuid,
	"action_taken" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gas_stations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"lat" numeric(10, 8) NOT NULL,
	"lng" numeric(11, 8) NOT NULL,
	"address" text,
	"municipality" text,
	"province" text,
	"phone" text,
	"hours" jsonb,
	"services" text[],
	"fuel_types" text[],
	"avg_rating" numeric(2, 1) DEFAULT '0',
	"review_count" integer DEFAULT 0,
	"verified" boolean DEFAULT false,
	"claimed" boolean DEFAULT false,
	"osm_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "gas_stations_osm_id_unique" UNIQUE("osm_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_votes" (
	"review_id" uuid NOT NULL,
	"device_hash" text NOT NULL,
	"vote" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "review_votes_review_id_device_hash_pk" PRIMARY KEY("review_id","device_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"device_fingerprint_hash" text NOT NULL,
	"phone_hash" text NOT NULL,
	"stars" smallint NOT NULL,
	"comment" text,
	"fuel_type" text NOT NULL,
	"receipt_storage_path" text,
	"receipt_verified" boolean DEFAULT false,
	"ocr_extracted" jsonb,
	"ocr_confidence" numeric(3, 2),
	"status" text DEFAULT 'pending',
	"helpful_count" integer DEFAULT 0,
	"spam_count" integer DEFAULT 0,
	"moderation_note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "station_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"rnc" text,
	"status" text DEFAULT 'pending',
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fraud_signals" ADD CONSTRAINT "fraud_signals_station_id_gas_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."gas_stations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_station_id_gas_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."gas_stations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "station_claims" ADD CONSTRAINT "station_claims_station_id_gas_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."gas_stations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stations_province" ON "gas_stations" ("province");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stations_brand" ON "gas_stations" ("brand");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_station" ON "reviews" ("station_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_status" ON "reviews" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_phone_hash" ON "reviews" ("phone_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_device_hash" ON "reviews" ("device_fingerprint_hash");