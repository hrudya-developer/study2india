CREATE TYPE "public"."course_level" AS ENUM('ug', 'pg', 'diploma', 'doctorate', 'certificate', 'integrated');--> statement-breakpoint
CREATE TYPE "public"."date_status" AS ENUM('announced', 'tentative', 'not_announced');--> statement-breakpoint
CREATE TYPE "public"."fee_basis" AS ENUM('per_year', 'whole_course', 'per_semester', 'one_time');--> statement-breakpoint
CREATE TYPE "public"."ownership_type" AS ENUM('government', 'private', 'deemed', 'central', 'state_university', 'autonomous', 'public_private');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('draft', 'needs_review', 'verified', 'published');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"stream_id" integer NOT NULL,
	"level" "course_level" NOT NULL,
	"duration_text" text,
	"eligibility_text" text,
	"sort_order" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cutoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"offering_id" integer NOT NULL,
	"exam_id" integer NOT NULL,
	"year" integer NOT NULL,
	"round" text,
	"quota" text,
	"category" text,
	"opening_rank" integer,
	"closing_rank" integer,
	"source_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"cycle" text NOT NULL,
	"event" text NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"status" date_status DEFAULT 'not_announced' NOT NULL,
	"source_id" integer
);
--> statement-breakpoint
CREATE TABLE "exam_streams" (
	"exam_id" integer NOT NULL,
	"stream_id" integer NOT NULL,
	CONSTRAINT "exam_streams_exam_id_stream_id_pk" PRIMARY KEY("exam_id","stream_id")
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"conducting_body" text NOT NULL,
	"level" text NOT NULL,
	"official_url" text,
	"sort_order" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "exams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "institution_identifiers" (
	"institution_id" integer NOT NULL,
	"scheme" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "institution_identifiers_scheme_value_pk" PRIMARY KEY("scheme","value")
);
--> statement-breakpoint
CREATE TABLE "institution_streams" (
	"institution_id" integer NOT NULL,
	"stream_id" integer NOT NULL,
	CONSTRAINT "institution_streams_institution_id_stream_id_pk" PRIMARY KEY("institution_id","stream_id")
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"aliases" text[],
	"ownership" "ownership_type",
	"established_year" integer,
	"affiliating_university" text,
	"address" text,
	"city" text,
	"district" text,
	"state_code" varchar(4),
	"pin" varchar(6),
	"website" text,
	"phone" text,
	"email" text,
	"approvals" text[],
	"naac_grade" text,
	"is_partner" boolean DEFAULT false NOT NULL,
	"status" "record_status" DEFAULT 'draft' NOT NULL,
	"source_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(15) NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"course_interest" text,
	"home_state" text,
	"exam_rank" text,
	"source_path" text,
	"consent_text" text NOT NULL,
	"stage" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offering_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"offering_id" integer NOT NULL,
	"quota" text,
	"component" text DEFAULT 'tuition' NOT NULL,
	"amount_inr" numeric(12, 0),
	"basis" "fee_basis",
	"source_id" integer
);
--> statement-breakpoint
CREATE TABLE "offerings" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"academic_year" text,
	"seats" integer,
	"seats_source_id" integer
);
--> statement-breakpoint
CREATE TABLE "rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_id" integer NOT NULL,
	"agency" text NOT NULL,
	"year" integer NOT NULL,
	"category" text NOT NULL,
	"rank" integer,
	"rank_band" text,
	"score" numeric(6, 2),
	"source_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarships" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"provider_type" text,
	"eligibility_text" text,
	"amount_text" text,
	"deadline" date,
	"official_url" text,
	"source_id" integer,
	"status" "record_status" DEFAULT 'draft' NOT NULL,
	CONSTRAINT "scholarships_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"publisher" text NOT NULL,
	"title" text,
	"url" text,
	"retrieved_on" date NOT NULL,
	"checked_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"code" varchar(4) PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_union_territory" boolean DEFAULT false NOT NULL,
	CONSTRAINT "states_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text,
	"sort_order" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "streams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cutoffs" ADD CONSTRAINT "cutoffs_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cutoffs" ADD CONSTRAINT "cutoffs_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cutoffs" ADD CONSTRAINT "cutoffs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_dates" ADD CONSTRAINT "exam_dates_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_dates" ADD CONSTRAINT "exam_dates_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_streams" ADD CONSTRAINT "exam_streams_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_streams" ADD CONSTRAINT "exam_streams_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_identifiers" ADD CONSTRAINT "institution_identifiers_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_streams" ADD CONSTRAINT "institution_streams_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_streams" ADD CONSTRAINT "institution_streams_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_state_code_states_code_fk" FOREIGN KEY ("state_code") REFERENCES "public"."states"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_fees" ADD CONSTRAINT "offering_fees_offering_id_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_fees" ADD CONSTRAINT "offering_fees_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_seats_source_id_sources_id_fk" FOREIGN KEY ("seats_source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "courses_stream_idx" ON "courses" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "cutoffs_offering_idx" ON "cutoffs" USING btree ("offering_id");--> statement-breakpoint
CREATE INDEX "identifiers_institution_idx" ON "institution_identifiers" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "institution_streams_stream_idx" ON "institution_streams" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "institutions_state_idx" ON "institutions" USING btree ("state_code");--> statement-breakpoint
CREATE INDEX "institutions_status_idx" ON "institutions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "offerings_unique" ON "offerings" USING btree ("institution_id","course_id","academic_year");--> statement-breakpoint
CREATE UNIQUE INDEX "rankings_unique" ON "rankings" USING btree ("institution_id","agency","year","category");--> statement-breakpoint
CREATE INDEX "rankings_lookup_idx" ON "rankings" USING btree ("agency","year","category","rank");