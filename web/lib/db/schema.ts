import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  boolean,
  numeric,
  date,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/*
 * Data rule for the whole schema: a value we have not verified is stored as NULL
 * and shown as "Not recorded". Facts point at a row in `sources` so every figure
 * on the site can name where it came from and when it was checked.
 */

export const recordStatus = pgEnum("record_status", ["draft", "needs_review", "verified", "published"]);
export const ownershipType = pgEnum("ownership_type", [
  "government",
  "private",
  "deemed",
  "central",
  "state_university",
  "autonomous",
  "public_private",
]);
export const courseLevel = pgEnum("course_level", ["ug", "pg", "diploma", "doctorate", "certificate", "integrated"]);
export const feeBasis = pgEnum("fee_basis", ["per_year", "whole_course", "per_semester", "one_time"]);
export const dateStatus = pgEnum("date_status", ["announced", "tentative", "not_announced"]);

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  publisher: text("publisher").notNull(),
  title: text("title"),
  url: text("url"),
  retrievedOn: date("retrieved_on").notNull(),
  checkedBy: text("checked_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const states = pgTable("states", {
  code: varchar("code", { length: 4 }).primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  isUnionTerritory: boolean("is_union_territory").notNull().default(false),
});

export const streams = pgTable("streams", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary"),
  sortOrder: integer("sort_order").notNull().default(100),
});

export const courses = pgTable(
  "courses",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    streamId: integer("stream_id")
      .notNull()
      .references(() => streams.id),
    level: courseLevel("level").notNull(),
    durationText: text("duration_text"),
    eligibilityText: text("eligibility_text"),
    sortOrder: integer("sort_order").notNull().default(100),
  },
  (t) => [index("courses_stream_idx").on(t.streamId)],
);

export const institutions = pgTable(
  "institutions",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    aliases: text("aliases").array(),
    ownership: ownershipType("ownership"),
    establishedYear: integer("established_year"),
    affiliatingUniversity: text("affiliating_university"),
    address: text("address"),
    city: text("city"),
    district: text("district"),
    stateCode: varchar("state_code", { length: 4 }).references(() => states.code),
    pin: varchar("pin", { length: 6 }),
    website: text("website"),
    phone: text("phone"),
    email: text("email"),
    approvals: text("approvals").array(),
    naacGrade: text("naac_grade"),
    isPartner: boolean("is_partner").notNull().default(false),
    status: recordStatus("status").notNull().default("draft"),
    sourceId: integer("source_id").references(() => sources.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("institutions_state_idx").on(t.stateCode), index("institutions_status_idx").on(t.status)],
);

/** Codes other bodies use for the same institution (NIRF IR code, AISHE code, NMC id). */
export const institutionIdentifiers = pgTable(
  "institution_identifiers",
  {
    institutionId: integer("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    scheme: text("scheme").notNull(),
    value: text("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.scheme, t.value] }), index("identifiers_institution_idx").on(t.institutionId)],
);

export const institutionStreams = pgTable(
  "institution_streams",
  {
    institutionId: integer("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    streamId: integer("stream_id")
      .notNull()
      .references(() => streams.id),
  },
  (t) => [primaryKey({ columns: [t.institutionId, t.streamId] }), index("institution_streams_stream_idx").on(t.streamId)],
);

/** A course as offered at one institution: seats and fees, each with its basis exactly as published. */
export const offerings = pgTable(
  "offerings",
  {
    id: serial("id").primaryKey(),
    institutionId: integer("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id),
    academicYear: text("academic_year"),
    seats: integer("seats"),
    seatsSourceId: integer("seats_source_id").references(() => sources.id),
  },
  (t) => [uniqueIndex("offerings_unique").on(t.institutionId, t.courseId, t.academicYear)],
);

export const offeringFees = pgTable("offering_fees", {
  id: serial("id").primaryKey(),
  offeringId: integer("offering_id")
    .notNull()
    .references(() => offerings.id, { onDelete: "cascade" }),
  quota: text("quota"),
  component: text("component").notNull().default("tuition"),
  amountInr: numeric("amount_inr", { precision: 12, scale: 0 }),
  basis: feeBasis("basis"),
  sourceId: integer("source_id").references(() => sources.id),
});

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  conductingBody: text("conducting_body").notNull(),
  level: text("level").notNull(),
  officialUrl: text("official_url"),
  sortOrder: integer("sort_order").notNull().default(100),
});

export const examStreams = pgTable(
  "exam_streams",
  {
    examId: integer("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    streamId: integer("stream_id")
      .notNull()
      .references(() => streams.id),
  },
  (t) => [primaryKey({ columns: [t.examId, t.streamId] })],
);

export const examDates = pgTable("exam_dates", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  cycle: text("cycle").notNull(),
  event: text("event").notNull(),
  startsOn: date("starts_on"),
  endsOn: date("ends_on"),
  status: dateStatus("status").notNull().default("not_announced"),
  sourceId: integer("source_id").references(() => sources.id),
});

export const rankings = pgTable(
  "rankings",
  {
    id: serial("id").primaryKey(),
    institutionId: integer("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    agency: text("agency").notNull(),
    year: integer("year").notNull(),
    category: text("category").notNull(),
    rank: integer("rank"),
    rankBand: text("rank_band"),
    score: numeric("score", { precision: 6, scale: 2 }),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id),
  },
  (t) => [
    uniqueIndex("rankings_unique").on(t.institutionId, t.agency, t.year, t.category),
    index("rankings_lookup_idx").on(t.agency, t.year, t.category, t.rank),
  ],
);

export const cutoffs = pgTable(
  "cutoffs",
  {
    id: serial("id").primaryKey(),
    offeringId: integer("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    examId: integer("exam_id")
      .notNull()
      .references(() => exams.id),
    year: integer("year").notNull(),
    round: text("round"),
    quota: text("quota"),
    category: text("category"),
    openingRank: integer("opening_rank"),
    closingRank: integer("closing_rank"),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id),
  },
  (t) => [index("cutoffs_offering_idx").on(t.offeringId)],
);

export const scholarships = pgTable("scholarships", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  providerType: text("provider_type"),
  eligibilityText: text("eligibility_text"),
  amountText: text("amount_text"),
  deadline: date("deadline"),
  officialUrl: text("official_url"),
  sourceId: integer("source_id").references(() => sources.id),
  status: recordStatus("status").notNull().default("draft"),
});

/** Enquiries from the site. Kept in this app until a CRM is chosen. */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  courseInterest: text("course_interest"),
  homeState: text("home_state"),
  examRank: text("exam_rank"),
  sourcePath: text("source_path"),
  consentText: text("consent_text").notNull(),
  stage: text("stage").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
