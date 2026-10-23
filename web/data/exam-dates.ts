/**
 * Official schedules for the exams in data/reference.ts, taken only from the conducting body's own
 * notices, information bulletins and websites. A date appears here only when that document prints
 * it; `tentative` is set only when the body itself labels the date tentative. Loaded into
 * exam_dates by lib/seed/reference-extras.ts.
 */

export type ExamSource = {
  publisher: string;
  /** Unique title: the loader keys the sources table on it. */
  title: string;
  url: string;
  /** Date we read the document (YYYY-MM-DD). */
  retrieved: string;
};

export type ExamDateRow = {
  /** Exam slug from data/reference.ts. */
  exam: string;
  /** Admission cycle the exam belongs to, as the body names it ("2026", "2027"). */
  cycle: string;
  /** Short label; with exam and cycle it identifies the row. */
  event: string;
  startsOn: string;
  endsOn?: string;
  /** Only when the official document itself says the date is tentative. */
  tentative?: boolean;
  source: ExamSource;
};

export type ExamCounselling = {
  exam: string;
  cycle: string;
  /** Who runs seat allocation after the exam. */
  body: string;
  url: string | null;
};

const RETRIEVED = "2026-10-24";

const src = (publisher: string, title: string, url: string): ExamSource => ({ publisher, title, url, retrieved: RETRIEVED });

const NTA = "National Testing Agency";
const NBEMS = "National Board of Examinations in Medical Sciences";

const S = {
  neetUgApply: src(NTA, "NEET (UG) 2026: extension of last date for online application (08 Mar 2026)", "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/03/20260308653856316.pdf"),
  neetUgCorrection: src(NTA, "NEET (UG) 2026: correction in particulars (Mar 2026)", "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/03/20260311404208011.pdf"),
  neetUgAdmit: src(NTA, "NEET (UG) 2026: release of admit cards (26 Apr 2026)", "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/04/202604262116105512.pdf"),
  neetUgCancel: src(NTA, "NEET (UG) 2026: press release on the examination of 3 May 2026 (12 May 2026)", "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/05/202605122066418251.pdf"),
  neetUgReexam: src(NTA, "NEET (UG) 2026: conduct of re-examination (15 May 2026)", "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/05/20260515960654684.pdf"),
  neetUgReAdmit: src(NTA, "NEET (UG) 2026: admit cards for the 21 June 2026 re-examination (14 Jun 2026)", "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/06/202606142028683090.pdf"),
  neetUgResult: src(NTA, "NEET (UG) 2026: press release on results (16 Jul 2026)", "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/07/20260716477215762.pdf"),

  neetPg: src(NBEMS, "NEET-PG 2026 Information Bulletin (01 Jul 2026)", "https://drive.google.com/file/d/1WmFcaFZhEAaRFrBBgTGUENX81cQwQkVT/view"),
  neetMds: src(NBEMS, "NEET-MDS 2026 Information Bulletin (11 Mar 2026)", "https://nbe.edu.in/IB/NEET-MDS%202026%20Information%20Bulletin_v1_VG%2011.03.2026.pdf"),
  gpat: src(NBEMS, "GPAT 2026 Information Bulletin", "https://nbe.edu.in/IB/Information%20bulletin%20GPAT%202026.pdf"),

  jeeMainS1: src(NTA, "JEE (Main) 2026 Session 1: invitation of online application (31 Oct 2025)", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2025/10/202510311966017361.pdf"),
  jeeMainS1Correction: src(NTA, "JEE (Main) 2026 Session 1: correction in particulars (20 Nov 2025)", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2025/11/20251120574269616.pdf"),
  jeeMainS1Result: src(NTA, "JEE (Main) 2026 Session 1 Paper 1 NTA scores (16 Feb 2026)", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/02/20260216589069639.pdf"),
  jeeMainS2: src(NTA, "JEE (Main) 2026 Session 2: invitation of online application (01 Feb 2026)", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/02/20260201612425163.pdf"),
  jeeMainResult: src(NTA, "JEE (Main) 2026 Paper 1 result and NTA scores (20 Apr 2026)", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260420809492136.pdf"),

  jeeAdv: src("IIT Roorkee (JEE Advanced 2026 organising institute)", "JEE (Advanced) 2026 announcements, jeeadv.ac.in", "https://jeeadv.ac.in/"),

  gate2026: src("IIT Guwahati (GATE 2026 organising institute)", "GATE 2026 important dates", "https://gate2026.iitg.ac.in/important-dates.html"),
  gate2027: src("IIT Madras (GATE 2027 organising institute)", "GATE 2027 important dates", "https://gate2027.iitm.ac.in/important_dates"),

  keamNotification: src("Commissioner for Entrance Examinations, Kerala", "KEAM 2026: notification, applications invited (05 Jan 2026)", "https://cee.kerala.gov.in/keam2026/noti_view/3/Upload1"),
  keamApply: src("Commissioner for Entrance Examinations, Kerala", "KEAM 2026: applications invited, date extended (31 Jan 2026)", "https://cee.kerala.gov.in/keam2026/noti_view/9/Upload1"),
  keamExam: src("Commissioner for Entrance Examinations, Kerala", "KEAM 2026: engineering and pharmacy exam dates published (08 Apr 2026)", "https://cee.kerala.gov.in/keam2026/noti_view/26/Upload1"),
  keamList: src("Commissioner for Entrance Examinations, Kerala", "KEAM 2026 notifications and press releases", "https://cee.kerala.gov.in/keam2026/notification"),
  keamScores: src("Commissioner for Entrance Examinations, Kerala", "KEAM 2026: CBT scores published (12 May 2026)", "https://cee.kerala.gov.in/keam2026/noti_view/40/Upload1"),
  keamRank: src("Commissioner for Entrance Examinations, Kerala", "KEAM 2026: engineering and pharmacy rank list published (27 Jun 2026)", "https://cee.kerala.gov.in/keam2026/noti_view/75/Upload1"),

  kcetSchedule: src("Karnataka Examinations Authority", "CET 2026 examination schedule (16 Jan 2026)", "https://cetonline.karnataka.gov.in/keawebentry456/ugcet2026/KEA_EXAM_SCHEDUL_16012026english.pdf"),
  kcetExtension: src("Karnataka Examinations Authority", "CET 2026: date extended for registration and online application (13 Feb 2026)", "https://cetonline.karnataka.gov.in/keawebentry456/ugcet2026/ugcet_APL_EXT_13022026english.pdf"),
  kcetPage: src("Karnataka Examinations Authority", "UGCET 2026 notices, cetonline.karnataka.gov.in", "https://cetonline.karnataka.gov.in/kea/ugcet2026"),

  cuetBulletin: src(NTA, "CUET (UG) 2026 Information Bulletin", "https://cdnbbsr.s3waas.gov.in/s3d1a21da7bca4abff8b0b61b87597de73/uploads/2026/01/202601031633478370.pdf"),
  cuetConduct: src(NTA, "CUET (UG) 2026: successful conduct, press release (07 Jun 2026)", "https://cdnbbsr.s3waas.gov.in/s3d1a21da7bca4abff8b0b61b87597de73/uploads/2026/06/20260608323708178.pdf"),
  cuetResult: src(NTA, "CUET (UG) 2026: result and NTA scores, press release (23 Jun 2026)", "https://cdnbbsr.s3waas.gov.in/s3d1a21da7bca4abff8b0b61b87597de73/uploads/2026/06/20260623716111016.pdf"),

  catHome: src("Indian Institutes of Management (CAT 2026)", "CAT 2026 important dates, iimcat.ac.in", "https://iimcat.ac.in/"),
  catFee: src("Indian Institutes of Management (CAT 2026)", "CAT 2026 media release (22 Sep 2026)", "https://cdn.digialm.com/per/g06/pub/32842/EForms/image/CAT2026/CAT_2026_Media_Release_22-09-2026.pdf"),
  catEdit: src("Indian Institutes of Management (CAT 2026)", "CAT 2026 media release on the edit window (29 Sep 2026)", "https://g03.tcsion.com//per/g03/pub/726/EForms/image/ImageDocUpload/71161/7/3001928417.pdf"),

  clat2027: src("Consortium of National Law Universities", "CLAT 2027 important events, consortiumofnlus.ac.in", "https://consortiumofnlus.ac.in/clat-2027/"),

  uceed2026: src("IIT Bombay (UCEED)", "UCEED 2026 important dates", "https://www.uceed.iitb.ac.in/2026/important-dates.html"),
  uceed2027: src("IIT Bombay (UCEED)", "UCEED 2027 important dates", "https://www.uceed.iitb.ac.in/2027/important-dates.html"),

  nchmBulletin: src(NTA, "NCHM JEE 2026 Information Bulletin", "https://cdnbbsr.s3waas.gov.in/s388a839f2f6f1427879fc33ee4acf4f66/uploads/2025/12/20260102470139941.pdf"),
  nchmExtension: src(NTA, "NCHM JEE 2026: extension of online registration (25 Mar 2026)", "https://cdnbbsr.s3waas.gov.in/s388a839f2f6f1427879fc33ee4acf4f66/uploads/2026/03/202603301739028065.pdf"),
  nchmCorrection: src(NTA, "NCHM JEE 2026: correction in particulars (02 Apr 2026)", "https://cdnbbsr.s3waas.gov.in/s388a839f2f6f1427879fc33ee4acf4f66/uploads/2026/04/202604031634323776.pdf"),
  nchmResult: src(NTA, "NCHM JEE 2026: declaration of result (22 May 2026)", "https://cdnbbsr.s3waas.gov.in/s388a839f2f6f1427879fc33ee4acf4f66/uploads/2026/05/20260523125892522.pdf"),
};

export const EXAM_DATES: ExamDateRow[] = [
  // NEET UG 2026. NTA cancelled the 3 May sitting and held the exam again on 21 June.
  { exam: "neet-ug", cycle: "2026", event: "Online application (extended)", startsOn: "2026-02-08", endsOn: "2026-03-11", source: S.neetUgApply },
  { exam: "neet-ug", cycle: "2026", event: "Correction window", startsOn: "2026-03-12", endsOn: "2026-03-14", source: S.neetUgCorrection },
  { exam: "neet-ug", cycle: "2026", event: "Admit card", startsOn: "2026-04-26", source: S.neetUgAdmit },
  { exam: "neet-ug", cycle: "2026", event: "Exam on 3 May (cancelled by NTA on 12 May)", startsOn: "2026-05-03", source: S.neetUgCancel },
  { exam: "neet-ug", cycle: "2026", event: "Re-examination admit card", startsOn: "2026-06-14", source: S.neetUgReAdmit },
  { exam: "neet-ug", cycle: "2026", event: "Re-examination", startsOn: "2026-06-21", source: S.neetUgReexam },
  { exam: "neet-ug", cycle: "2026", event: "Result", startsOn: "2026-07-16", source: S.neetUgResult },

  // NEET PG 2026
  { exam: "neet-pg", cycle: "2026", event: "Online application", startsOn: "2026-07-01", endsOn: "2026-07-21", source: S.neetPg },
  { exam: "neet-pg", cycle: "2026", event: "Edit window", startsOn: "2026-07-25", endsOn: "2026-07-28", source: S.neetPg },
  { exam: "neet-pg", cycle: "2026", event: "Selective edit window (images)", startsOn: "2026-07-31", endsOn: "2026-08-10", source: S.neetPg },
  { exam: "neet-pg", cycle: "2026", event: "Test city intimation", startsOn: "2026-08-11", source: S.neetPg },
  { exam: "neet-pg", cycle: "2026", event: "Admit card", startsOn: "2026-08-27", source: S.neetPg },
  { exam: "neet-pg", cycle: "2026", event: "Exam", startsOn: "2026-08-30", source: S.neetPg },
  { exam: "neet-pg", cycle: "2026", event: "Result due by", startsOn: "2026-09-30", source: S.neetPg },

  // NEET MDS 2026
  { exam: "neet-mds", cycle: "2026", event: "Online application", startsOn: "2026-03-14", endsOn: "2026-03-30", source: S.neetMds },
  { exam: "neet-mds", cycle: "2026", event: "Edit window", startsOn: "2026-04-04", endsOn: "2026-04-06", source: S.neetMds },
  { exam: "neet-mds", cycle: "2026", event: "Final selective edit window (images)", startsOn: "2026-04-21", endsOn: "2026-04-22", source: S.neetMds },
  { exam: "neet-mds", cycle: "2026", event: "Test city intimation", startsOn: "2026-04-22", source: S.neetMds },
  { exam: "neet-mds", cycle: "2026", event: "Admit card", startsOn: "2026-04-29", source: S.neetMds },
  { exam: "neet-mds", cycle: "2026", event: "Exam", startsOn: "2026-05-02", source: S.neetMds },
  { exam: "neet-mds", cycle: "2026", event: "Result due by", startsOn: "2026-06-02", source: S.neetMds },

  // JEE Main 2026
  { exam: "jee-main", cycle: "2026", event: "Session 1 online application", startsOn: "2025-10-31", endsOn: "2025-11-27", source: S.jeeMainS1 },
  { exam: "jee-main", cycle: "2026", event: "Session 1 correction window", startsOn: "2025-12-01", endsOn: "2025-12-02", source: S.jeeMainS1Correction },
  { exam: "jee-main", cycle: "2026", event: "Session 1 exam, Paper 1 (21, 22, 23, 24 and 28 Jan)", startsOn: "2026-01-21", endsOn: "2026-01-28", source: S.jeeMainS1Result },
  { exam: "jee-main", cycle: "2026", event: "Session 1 Paper 1 scores", startsOn: "2026-02-16", source: S.jeeMainS1Result },
  { exam: "jee-main", cycle: "2026", event: "Session 2 online application", startsOn: "2026-02-01", endsOn: "2026-02-25", source: S.jeeMainS2 },
  { exam: "jee-main", cycle: "2026", event: "Session 2 exam, Paper 1 (2, 4, 5, 6 and 8 Apr)", startsOn: "2026-04-02", endsOn: "2026-04-08", source: S.jeeMainResult },
  { exam: "jee-main", cycle: "2026", event: "Final Paper 1 result", startsOn: "2026-04-20", source: S.jeeMainResult },

  // JEE Advanced 2026 (IIT Roorkee)
  { exam: "jee-advanced", cycle: "2026", event: "Registration (extended)", startsOn: "2026-04-23", endsOn: "2026-05-05", source: S.jeeAdv },
  { exam: "jee-advanced", cycle: "2026", event: "Admit card", startsOn: "2026-05-11", source: S.jeeAdv },
  { exam: "jee-advanced", cycle: "2026", event: "Exam", startsOn: "2026-05-17", source: S.jeeAdv },
  { exam: "jee-advanced", cycle: "2026", event: "Candidate responses", startsOn: "2026-05-21", source: S.jeeAdv },
  { exam: "jee-advanced", cycle: "2026", event: "Provisional answer keys", startsOn: "2026-05-25", source: S.jeeAdv },
  { exam: "jee-advanced", cycle: "2026", event: "Result", startsOn: "2026-06-01", source: S.jeeAdv },
  { exam: "jee-advanced", cycle: "2026", event: "JoSAA registration opens", startsOn: "2026-06-03", source: S.jeeAdv },
  { exam: "jee-advanced", cycle: "2026", event: "Architecture Aptitude Test (AAT)", startsOn: "2026-06-04", source: S.jeeAdv },
  { exam: "jee-advanced", cycle: "2026", event: "AAT result", startsOn: "2026-06-07", source: S.jeeAdv },

  // GATE 2026 (IIT Guwahati)
  { exam: "gate", cycle: "2026", event: "Online application (regular fee)", startsOn: "2025-08-28", endsOn: "2025-10-07", source: S.gate2026 },
  { exam: "gate", cycle: "2026", event: "Last date with late fee", startsOn: "2025-10-13", source: S.gate2026 },
  { exam: "gate", cycle: "2026", event: "Application rectification", startsOn: "2025-10-28", endsOn: "2025-11-10", source: S.gate2026 },
  { exam: "gate", cycle: "2026", event: "Admit card", startsOn: "2026-01-13", source: S.gate2026 },
  { exam: "gate", cycle: "2026", event: "Exams (7, 8, 14 and 15 Feb)", startsOn: "2026-02-07", endsOn: "2026-02-15", source: S.gate2026 },
  { exam: "gate", cycle: "2026", event: "Result", startsOn: "2026-03-19", source: S.gate2026 },

  // GATE 2027 (IIT Madras)
  { exam: "gate", cycle: "2027", event: "Online application (regular fee)", startsOn: "2026-09-02", endsOn: "2026-10-05", source: S.gate2027 },
  { exam: "gate", cycle: "2027", event: "Last date with late fee", startsOn: "2026-10-12", source: S.gate2027 },
  { exam: "gate", cycle: "2027", event: "Application rectification (scrutiny defects)", startsOn: "2026-10-14", endsOn: "2026-10-31", source: S.gate2027 },
  { exam: "gate", cycle: "2027", event: "Special registration window (late fee)", startsOn: "2026-10-15", endsOn: "2026-10-16", source: S.gate2027 },
  { exam: "gate", cycle: "2027", event: "Exam city allotment", startsOn: "2027-01-04", source: S.gate2027 },
  { exam: "gate", cycle: "2027", event: "Exams (6, 7, 13, 14, 20 and 21 Feb)", startsOn: "2027-02-06", endsOn: "2027-02-21", source: S.gate2027 },
  { exam: "gate", cycle: "2027", event: "Result", startsOn: "2027-03-19", source: S.gate2027 },

  // KEAM 2026
  { exam: "keam", cycle: "2026", event: "Notification inviting applications", startsOn: "2026-01-05", source: S.keamNotification },
  { exam: "keam", cycle: "2026", event: "Last date for online application (extended)", startsOn: "2026-02-06", source: S.keamApply },
  { exam: "keam", cycle: "2026", event: "Admit card", startsOn: "2026-04-08", source: S.keamList },
  { exam: "keam", cycle: "2026", event: "Engineering exam (CBT)", startsOn: "2026-04-17", endsOn: "2026-04-22", source: S.keamExam },
  { exam: "keam", cycle: "2026", event: "Pharmacy exam (CBT)", startsOn: "2026-04-18", endsOn: "2026-04-20", source: S.keamExam },
  { exam: "keam", cycle: "2026", event: "Engineering and pharmacy scores", startsOn: "2026-05-12", source: S.keamScores },
  { exam: "keam", cycle: "2026", event: "Engineering and pharmacy rank list", startsOn: "2026-06-27", source: S.keamRank },
  { exam: "keam", cycle: "2026", event: "Architecture rank list", startsOn: "2026-07-11", source: S.keamList },

  // KCET (UGCET) 2026
  { exam: "kcet", cycle: "2026", event: "Online application opens", startsOn: "2026-01-17", source: S.kcetSchedule },
  { exam: "kcet", cycle: "2026", event: "Last date to apply (extended)", startsOn: "2026-02-22", source: S.kcetExtension },
  { exam: "kcet", cycle: "2026", event: "Last date for fee payment (extended)", startsOn: "2026-02-24", source: S.kcetExtension },
  { exam: "kcet", cycle: "2026", event: "Kannada language test", startsOn: "2026-04-22", source: S.kcetSchedule },
  { exam: "kcet", cycle: "2026", event: "Exam", startsOn: "2026-04-23", endsOn: "2026-04-24", source: S.kcetSchedule },
  { exam: "kcet", cycle: "2026", event: "Top 10 rank holders list published", startsOn: "2026-06-16", source: S.kcetPage },

  // CUET UG 2026
  { exam: "cuet-ug", cycle: "2026", event: "Online application", startsOn: "2026-01-03", endsOn: "2026-01-30", source: S.cuetBulletin },
  { exam: "cuet-ug", cycle: "2026", event: "Last date for fee payment", startsOn: "2026-01-31", source: S.cuetBulletin },
  { exam: "cuet-ug", cycle: "2026", event: "Correction window", startsOn: "2026-02-02", endsOn: "2026-02-04", source: S.cuetBulletin },
  { exam: "cuet-ug", cycle: "2026", event: "Exam (11 to 31 May, and 6 to 7 June)", startsOn: "2026-05-11", endsOn: "2026-06-07", source: S.cuetConduct },
  { exam: "cuet-ug", cycle: "2026", event: "Result", startsOn: "2026-06-23", source: S.cuetResult },

  // CAT 2026
  { exam: "cat", cycle: "2026", event: "Registration", startsOn: "2026-08-03", endsOn: "2026-09-22", source: S.catHome },
  { exam: "cat", cycle: "2026", event: "Fee payment (extended)", startsOn: "2026-09-24", source: S.catFee },
  { exam: "cat", cycle: "2026", event: "Limited edit window", startsOn: "2026-10-05", endsOn: "2026-10-06", source: S.catEdit },
  { exam: "cat", cycle: "2026", event: "Admit card", startsOn: "2026-11-04", source: S.catHome },
  { exam: "cat", cycle: "2026", event: "Exam", startsOn: "2026-11-29", source: S.catHome },

  // CLAT 2027 (admissions for 2027-28)
  { exam: "clat", cycle: "2027", event: "Online application", startsOn: "2026-08-03", endsOn: "2026-10-31", source: S.clat2027 },
  { exam: "clat", cycle: "2027", event: "Exam", startsOn: "2026-12-06", source: S.clat2027 },

  // UCEED 2026
  { exam: "uceed", cycle: "2026", event: "Online registration (regular fee)", startsOn: "2025-10-01", endsOn: "2025-11-05", source: S.uceed2026 },
  { exam: "uceed", cycle: "2026", event: "Last date with late fee", startsOn: "2025-11-10", source: S.uceed2026 },
  { exam: "uceed", cycle: "2026", event: "Admit card", startsOn: "2026-01-02", source: S.uceed2026 },
  { exam: "uceed", cycle: "2026", event: "Exam", startsOn: "2026-01-18", source: S.uceed2026 },
  { exam: "uceed", cycle: "2026", event: "Draft answer key (Part A)", startsOn: "2026-01-20", source: S.uceed2026 },
  { exam: "uceed", cycle: "2026", event: "Final answer key (Part A)", startsOn: "2026-01-28", source: S.uceed2026 },
  { exam: "uceed", cycle: "2026", event: "Result", startsOn: "2026-03-06", source: S.uceed2026 },

  // UCEED 2027
  { exam: "uceed", cycle: "2027", event: "Online registration (regular fee)", startsOn: "2026-10-01", endsOn: "2026-10-31", source: S.uceed2027 },
  { exam: "uceed", cycle: "2027", event: "Last date with late fee", startsOn: "2026-11-06", source: S.uceed2027 },
  { exam: "uceed", cycle: "2027", event: "Admit card", startsOn: "2027-01-01", source: S.uceed2027 },
  { exam: "uceed", cycle: "2027", event: "Exam", startsOn: "2027-01-17", source: S.uceed2027 },
  { exam: "uceed", cycle: "2027", event: "Draft answer key (Part A)", startsOn: "2027-01-19", source: S.uceed2027 },
  { exam: "uceed", cycle: "2027", event: "Final answer key (Part A)", startsOn: "2027-01-26", source: S.uceed2027 },
  { exam: "uceed", cycle: "2027", event: "Shortlisting based on Part A", startsOn: "2027-02-04", source: S.uceed2027 },
  { exam: "uceed", cycle: "2027", event: "Result", startsOn: "2027-03-06", source: S.uceed2027 },

  // NCHM JEE 2026
  { exam: "nchm-jee", cycle: "2026", event: "Online application (extended)", startsOn: "2025-12-26", endsOn: "2026-04-01", source: S.nchmExtension },
  { exam: "nchm-jee", cycle: "2026", event: "Correction window", startsOn: "2026-04-02", endsOn: "2026-04-04", source: S.nchmCorrection },
  { exam: "nchm-jee", cycle: "2026", event: "Exam", startsOn: "2026-04-25", source: S.nchmBulletin },
  { exam: "nchm-jee", cycle: "2026", event: "Result", startsOn: "2026-05-22", source: S.nchmResult },

  // GPAT 2026
  { exam: "gpat", cycle: "2026", event: "Online application", startsOn: "2025-12-23", endsOn: "2026-01-12", source: S.gpat },
  { exam: "gpat", cycle: "2026", event: "Edit window", startsOn: "2026-01-16", endsOn: "2026-01-19", source: S.gpat },
  { exam: "gpat", cycle: "2026", event: "Selective edit window (images)", startsOn: "2026-02-06", endsOn: "2026-02-09", source: S.gpat },
  { exam: "gpat", cycle: "2026", event: "Final selective edit window (images)", startsOn: "2026-02-17", endsOn: "2026-02-19", source: S.gpat },
  { exam: "gpat", cycle: "2026", event: "Test city intimation", startsOn: "2026-02-24", source: S.gpat },
  { exam: "gpat", cycle: "2026", event: "Admit card", startsOn: "2026-03-02", source: S.gpat },
  { exam: "gpat", cycle: "2026", event: "Exam", startsOn: "2026-03-07", source: S.gpat },
  { exam: "gpat", cycle: "2026", event: "Result due by", startsOn: "2026-04-07", source: S.gpat },
];

/** Who allots seats after each exam, as the exam's own notices or bulletin name it. */
export const EXAM_COUNSELLING: ExamCounselling[] = [
  { exam: "neet-ug", cycle: "2026", body: "Medical Counselling Committee (MCC) for All India Quota seats; state counselling authorities for state quota seats", url: "https://mcc.nic.in" },
  { exam: "neet-pg", cycle: "2026", body: "Medical Counselling Committee (MCC) for All India Quota seats; state counselling authorities for state quota seats", url: "https://mcc.nic.in" },
  { exam: "neet-mds", cycle: "2026", body: "Medical Counselling Committee (MCC) for All India Quota seats; state counselling authorities for state quota seats", url: "https://mcc.nic.in" },
  { exam: "jee-main", cycle: "2026", body: "Joint Seat Allocation Authority (JoSAA) for NITs, IIITs and other centrally funded institutes", url: "https://josaa.nic.in" },
  { exam: "jee-advanced", cycle: "2026", body: "Joint Seat Allocation Authority (JoSAA) for IITs and IISc Bengaluru", url: "https://josaa.nic.in" },
  { exam: "keam", cycle: "2026", body: "Commissioner for Entrance Examinations, Kerala (centralised allotment process)", url: "https://cee.kerala.gov.in" },
  { exam: "kcet", cycle: "2026", body: "Karnataka Examinations Authority (seat allotment)", url: "https://cetonline.karnataka.gov.in/kea/" },
  { exam: "clat", cycle: "2027", body: "Consortium of National Law Universities (centralised counselling)", url: "https://consortiumofnlus.ac.in" },
  { exam: "nchm-jee", cycle: "2026", body: "National Council for Hotel Management and Catering Technology (NCHMCT)", url: null },
];
