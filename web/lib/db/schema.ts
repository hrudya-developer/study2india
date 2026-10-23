import {
  mysqlTable,
  mysqlEnum,
  int,
  varchar,
  text,
  boolean,
  decimal,
  date,
  timestamp,
  json,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

/*
 * Data rule for the whole schema: a value we have not verified is stored as NULL
 * and shown as "Not recorded". Facts point at a row in `sources` so every figure
 * on the site can name where it came from and when it was checked.
 */

const STATUS = ["draft", "needs_review", "verified", "published"] as const;
const OWNERSHIP = ["government", "private", "deemed", "central", "state_university", "autonomous", "public_private", "aided"] as const;
const LEVEL = ["ug", "pg", "diploma", "doctorate", "certificate", "integrated"] as const;
const FEE_BASIS = ["per_year", "whole_course", "per_semester", "one_time"] as const;
const DATE_STATUS = ["announced", "tentative", "not_announced"] as const;

const id = () => int("id").autoincrement().primaryKey();

export const sources = mysqlTable("sources", {
  id: id(),
  publisher: varchar("publisher", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  url: text("url"),
  retrievedOn: date("retrieved_on", { mode: "string" }).notNull(),
  checkedBy: varchar("checked_by", { length: 120 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const states = mysqlTable("states", {
  code: varchar("code", { length: 4 }).primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  isUnionTerritory: boolean("is_union_territory").notNull().default(false),
});

export const streams = mysqlTable("streams", {
  id: id(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  summary: varchar("summary", { length: 255 }),
  sortOrder: int("sort_order").notNull().default(100),
});

export const courses = mysqlTable(
  "courses",
  {
    id: id(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    shortName: varchar("short_name", { length: 60 }).notNull(),
    streamId: int("stream_id")
      .notNull()
      .references(() => streams.id),
    level: mysqlEnum("level", LEVEL).notNull(),
    durationText: varchar("duration_text", { length: 120 }),
    eligibilityText: text("eligibility_text"),
    sortOrder: int("sort_order").notNull().default(100),
  },
  (t) => [index("courses_stream_idx").on(t.streamId)],
);

export const institutions = mysqlTable(
  "institutions",
  {
    id: id(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    aliases: json("aliases").$type<string[]>(),
    ownership: mysqlEnum("ownership", OWNERSHIP),
    establishedYear: int("established_year"),
    affiliatingUniversity: varchar("affiliating_university", { length: 255 }),
    address: text("address"),
    city: varchar("city", { length: 120 }),
    district: varchar("district", { length: 120 }),
    stateCode: varchar("state_code", { length: 4 }).references(() => states.code),
    pin: varchar("pin", { length: 6 }),
    website: varchar("website", { length: 255 }),
    phone: varchar("phone", { length: 60 }),
    email: varchar("email", { length: 160 }),
    approvals: json("approvals").$type<string[]>(),
    naacGrade: varchar("naac_grade", { length: 8 }),
    isPartner: boolean("is_partner").notNull().default(false),
    status: mysqlEnum("status", STATUS).notNull().default("draft"),
    sourceId: int("source_id").references(() => sources.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("institutions_state_idx").on(t.stateCode), index("institutions_status_idx").on(t.status), index("institutions_name_idx").on(t.name)],
);

/** Codes other bodies use for the same institution (NIRF IR code, AISHE code, NMC id). */
export const institutionIdentifiers = mysqlTable(
  "institution_identifiers",
  {
    institutionId: int("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    scheme: varchar("scheme", { length: 20 }).notNull(),
    value: varchar("value", { length: 60 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.scheme, t.value] }), index("identifiers_institution_idx").on(t.institutionId)],
);

export const institutionStreams = mysqlTable(
  "institution_streams",
  {
    institutionId: int("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    streamId: int("stream_id")
      .notNull()
      .references(() => streams.id),
  },
  (t) => [primaryKey({ columns: [t.institutionId, t.streamId] }), index("institution_streams_stream_idx").on(t.streamId)],
);

/** A course as offered at one institution: seats and fees, each with its basis exactly as published. */
export const offerings = mysqlTable(
  "offerings",
  {
    id: id(),
    institutionId: int("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    courseId: int("course_id")
      .notNull()
      .references(() => courses.id),
    academicYear: varchar("academic_year", { length: 9 }),
    seats: int("seats"),
    seatsSourceId: int("seats_source_id").references(() => sources.id),
  },
  (t) => [uniqueIndex("offerings_unique").on(t.institutionId, t.courseId, t.academicYear)],
);

/**
 * Branches of one offering, as the regulator lists them (MD General Medicine, MS Orthopaedics...),
 * each with its own intake. The offering itself keeps seats empty when only branch intakes are published.
 */
export const offeringBranches = mysqlTable(
  "offering_branches",
  {
    id: id(),
    offeringId: int("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    seats: int("seats"),
    sourceId: int("source_id").references(() => sources.id),
  },
  (t) => [uniqueIndex("offering_branches_unique").on(t.offeringId, t.name)],
);

export const offeringFees = mysqlTable("offering_fees", {
  id: id(),
  offeringId: int("offering_id")
    .notNull()
    .references(() => offerings.id, { onDelete: "cascade" }),
  quota: varchar("quota", { length: 60 }),
  component: varchar("component", { length: 40 }).notNull().default("tuition"),
  amountInr: decimal("amount_inr", { precision: 12, scale: 0 }),
  basis: mysqlEnum("basis", FEE_BASIS),
  sourceId: int("source_id").references(() => sources.id),
});

export const exams = mysqlTable("exams", {
  id: id(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  shortName: varchar("short_name", { length: 40 }).notNull(),
  conductingBody: varchar("conducting_body", { length: 200 }).notNull(),
  level: varchar("level", { length: 20 }).notNull(),
  officialUrl: varchar("official_url", { length: 255 }),
  sortOrder: int("sort_order").notNull().default(100),
});

export const examStreams = mysqlTable(
  "exam_streams",
  {
    examId: int("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    streamId: int("stream_id")
      .notNull()
      .references(() => streams.id),
  },
  (t) => [primaryKey({ columns: [t.examId, t.streamId] })],
);

export const examDates = mysqlTable("exam_dates", {
  id: id(),
  examId: int("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  cycle: varchar("cycle", { length: 20 }).notNull(),
  event: varchar("event", { length: 160 }).notNull(),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" }),
  status: mysqlEnum("status", DATE_STATUS).notNull().default("not_announced"),
  sourceId: int("source_id").references(() => sources.id),
});

export const rankings = mysqlTable(
  "rankings",
  {
    id: id(),
    institutionId: int("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    agency: varchar("agency", { length: 20 }).notNull(),
    year: int("year").notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    rank: int("rank"),
    rankBand: varchar("rank_band", { length: 20 }),
    score: decimal("score", { precision: 6, scale: 2 }),
    sourceId: int("source_id")
      .notNull()
      .references(() => sources.id),
  },
  (t) => [
    uniqueIndex("rankings_unique").on(t.institutionId, t.agency, t.year, t.category),
    index("rankings_lookup_idx").on(t.agency, t.year, t.category, t.rank),
  ],
);

export const cutoffs = mysqlTable(
  "cutoffs",
  {
    id: id(),
    offeringId: int("offering_id")
      .notNull()
      .references(() => offerings.id, { onDelete: "cascade" }),
    examId: int("exam_id")
      .notNull()
      .references(() => exams.id),
    year: int("year").notNull(),
    round: varchar("round", { length: 40 }),
    quota: varchar("quota", { length: 60 }),
    category: varchar("category", { length: 40 }),
    openingRank: int("opening_rank"),
    closingRank: int("closing_rank"),
    sourceId: int("source_id")
      .notNull()
      .references(() => sources.id),
  },
  (t) => [index("cutoffs_offering_idx").on(t.offeringId)],
);

export const scholarships = mysqlTable("scholarships", {
  id: id(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerType: varchar("provider_type", { length: 40 }),
  eligibilityText: text("eligibility_text"),
  amountText: varchar("amount_text", { length: 255 }),
  deadline: date("deadline", { mode: "string" }),
  officialUrl: varchar("official_url", { length: 255 }),
  sourceId: int("source_id").references(() => sources.id),
  status: mysqlEnum("status", STATUS).notNull().default("draft"),
});

/** Enquiries from the site. Kept in this app until a CRM is chosen. */
export const leads = mysqlTable("leads", {
  id: id(),
  name: varchar("name", { length: 80 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  courseInterest: varchar("course_interest", { length: 80 }),
  homeState: varchar("home_state", { length: 60 }),
  examRank: varchar("exam_rank", { length: 40 }),
  sourcePath: varchar("source_path", { length: 255 }),
  consentText: text("consent_text").notNull(),
  stage: varchar("stage", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
