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

const CETCELL = "State Common Entrance Test Cell, Maharashtra";
const AIIMS = "All India Institute of Medical Sciences, New Delhi";

/** Sources for the exams added in the second round (state, institute, management, law, design and science exams). */
const T = {
  mhtRegistration: src(CETCELL, "MHT CET (PCM/PCB) 2026: final extension of registration (20 Feb 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2023/12/CET-Registration-Final-Extenstion-Notice_-MHT-CET-2026-.pdf"),
  mhtSecondRegistration: src(CETCELL, "MHT CET (PCM/PCB) 2026: registration for the second attempt (13 Apr 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2023/12/CET-Registration-Notice_-MHT-CET-2026-Second-attempt.pdf"),
  techCetDates: src(CETCELL, "Technical Education CETs 2026: final examination dates (16 Mar 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2023/12/Technical-Education-CET-final-dates_2026.pdf"),
  pcm1Result: src(CETCELL, "MHT CET 2026 PCM group first attempt: result press note (16 Jun 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2026/06/Press-Note-MHT-CET-PCM-Group-1st-Attempt_-2026.pdf"),
  pcm2Result: src(CETCELL, "MHT CET 2026 PCM group second attempt: result press note (19 Jun 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2026/06/Press-Note-MHT-CET-PCM-Group-2nd-Attempt_2026.pdf"),
  pcbResult: src(CETCELL, "MHT CET 2026 PCB group second attempt: result press note (18 Jun 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2026/06/Press-Note-MHT-CET-PCB-Group-2nd-Attempt-2026.pdf"),
  cetNotices: src(CETCELL, "State CET Cell notices, cetcell.mahacet.org", "https://cetcell.mahacet.org/notices/"),
  mbaRegistration: src(CETCELL, "MAH-MBA/MMS CET 2026: registration notice (09 Jan 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2023/12/CET-Registration-Notice_MBA-MHT-CET-CET-2026.pdf"),
  higherEdCetDates: src(CETCELL, "Higher Education CETs 2026: final examination dates (11 Mar 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2023/12/Public-Notice_CET-final-dates_2026.pdf"),
  llb5Registration: src(CETCELL, "B.Ed-M.Ed and LL.B 5 Yrs CET 2026: registration notice (08 Jan 2026)", "https://cetcell.mahacet.org/wp-content/uploads/2023/12/CET-Registration-Notice_-BEd-MEd-LLB-5-Yrs_-CET-2026_up.pdf"),
  llb3Brochure: src(CETCELL, "MAH-LL.B 3 Yrs CET 2026 information brochure", "https://cetcell.mahacet.org/wp-content/uploads/2023/12/CET-IB-3-Years-LLB-_2026.pdf"),

  apEapcet: src("Andhra Pradesh State Council of Higher Education", "AP EAPCET 2026 important dates", "https://cets.apsche.ap.gov.in/EAPCET/EapcetHomepages/ImportantDates"),
  tgEapcet: src("JNTU Hyderabad for the Telangana Council of Higher Education", "TG EAPCET 2026 home page, flash news on rank cards", "https://eapcet.tgche.ac.in/"),
  wbjee: src("West Bengal Joint Entrance Examinations Board", "WBJEE 2026 page, wbjeeb.nic.in", "https://wbjeeb.nic.in/wbjee/"),
  wbjeeResult: src("West Bengal Joint Entrance Examinations Board", "WBJEE 2026: notice on publication of result (17 Jun 2026)", "https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2026/06/20260617101679707.pdf"),
  comedk: src("Consortium of Medical, Engineering and Dental Colleges of Karnataka", "COMEDK UGET 2026 schedule, comedk.org", "https://comedk.org/about-uget-and-notification-2026"),
  bitsat: src("Birla Institute of Technology and Science, Pilani", "BITSAT-2026 important dates, bitsadmission.com", "https://www.bitsadmission.com/FD/FD.html"),
  viteee: src("Vellore Institute of Technology", "VITEEE 2026 application deadline extended to 12 April 2026", "https://vit.ac.in/viteee-2026-application-deadline-extended-to-12th-april-2026"),
  srm1: src("SRM Institute of Science and Technology", "Important dates for SRMJEEE (UG) 2026 Phase I", "https://webstor.srmist.edu.in/web_assets/downloads/2026/important-dates-for-srmjeee-2026-phase-i.pdf"),
  srm2: src("SRM Institute of Science and Technology", "Important dates for SRMJEEE (UG) 2026 Phase II", "https://webstor.srmist.edu.in/web_assets/downloads/2026/important-dates-for-srmjeeeug-phase-2-2026.pdf"),
  tnea: src("Directorate of Technical Education, Tamil Nadu", "TNEA 2026 schedule", "https://static.tneaonline.org/docs/TNEA_Tentative_Schedule_2026.pdf"),
  tneaBrochure: src("Directorate of Technical Education, Tamil Nadu", "TNEA 2026 information brochure", "https://static.tneaonline.org/docs/2_Information_Brochure_2026.pdf"),
  ojeeBrochure: src("Odisha Joint Entrance Examination Committee", "OJEE-2026 information brochure", "https://cdnbbsr.s3waas.gov.in/s36832a7b24bc06775d02b7406880b93fc/uploads/2026/01/202601281538483605.pdf"),
  ojeeSchedule: src("Odisha Joint Entrance Examination Committee", "OJEE 2026: CBT examination schedule (23 Apr 2026)", "https://cdnbbsr.s3waas.gov.in/s36832a7b24bc06775d02b7406880b93fc/uploads/2026/04/20260423667843586.pdf"),
  gujcet: src("Gujarat Secondary and Higher Secondary Education Board", "GUJCET-2026 information booklet", "https://gseb.org/GUJCETBooklet(English).pdf"),

  aiimsKeyDates: src(AIIMS, "AIIMS tentative schedule of entrance examinations 2026 (key dates)", "https://www.aiimsexams.ac.in/landingpage/key-dates"),

  xat: src("XLRI Jamshedpur", "XAT 2027 registration and important dates", "https://xatonline.in/registration"),
  mat: src("All India Management Association", "MAT test dates", "https://aima.in/mat/test-dates/"),
  cmatKey: src(NTA, "CMAT 2026 final answer keys (exam date 25.01.2026)", "https://cdnbbsr.s3waas.gov.in/s3a381c2c35c9157f6b67fd07d5a200ae1/uploads/2026/02/202602172047124153.pdf"),
  cmatScore: src(NTA, "Score card for CMAT 2026 is live (17 Feb 2026)", "https://cmat.nta.nic.in/score-card-for-cmat-2026-is-live/"),
  nmat: src("Graduate Management Admission Council", "NMAT by GMAC important dates and fees", "https://www.mba.com/exams/nmat/about/important-dates-fees"),
  snap: src("Symbiosis International (Deemed University)", "SNAP 2026 bulletin", "https://www.snaptest.org/documents/SNAP-2026-Bulletin.pdf"),
  ipmat: src("Indian Institute of Management Indore", "IPM 2026-31 batch admission procedure for domestic applicants", "https://iimidr.ac.in/wp-content/uploads/2026/01/AdmissionProcedure_IPM-2026-31_-Domestic-Applicants.pdf"),

  ailet: src("National Law University Delhi", "AILET 2027 notification (23 Jul 2026)", "https://nationallawuniversitydelhi.in/notification/AILET_2027.pdf"),
  ailetPattern: src("National Law University Delhi", "AILET 2027 B.A.LL.B.(Hons.) exam details", "https://nationallawuniversitydelhi.in/ballb/exam-details.html"),

  nid2026: src("National Institute of Design", "NID B.Des admissions handbook 2026-27", "https://admissions.nid.edu/NIDA2026/download/BDes_AdmissionsHandbook2026-27.pdf"),
  nid2027: src("National Institute of Design", "NID admissions handbook 2027-28 (B.Des and integrated pathway)", "https://admissions.nid.edu/NIDA2027/download/BDES_IntegratedPathway_AdmissionsHandbook2027_28.pdf"),
  nift2027: src("National Institute of Fashion Technology", "NIFT Entrance Examination 2027: public notice (16 Oct 2026)", "https://www.nift.ac.in/sites/default/files/2026-10/Public%20Notice-NIFTEE%202027_16.10.2026%20Latest.pdf"),

  nest: src("NISER Bhubaneswar and UM-DAE CEBS Mumbai", "NEST 2026 brochure and syllabus (updated 12 Jan 2026)", "https://www.nestexam.in/docs/26/NEST2026_Brochure_Syllabus_Updated_12Jan2026.pdf"),
  nestResult: src("NISER Bhubaneswar and UM-DAE CEBS Mumbai", "Result of NEST 2026", "https://nestexam.in/check-result/"),
  iat: src("Indian Institutes of Science Education and Research", "IISER Aptitude Test (IAT) page, iiseradmission.in", "https://www.iiseradmission.in/pages/admission/iat.html"),
  cuetPgBulletin: src(NTA, "CUET (PG) 2026 information bulletin", "https://cdnbbsr.s3waas.gov.in/s388a839f2f6f1427879fc33ee4acf4f66/uploads/2025/12/202512161583029269.pdf"),
  cuetPgCity: src(NTA, "CUET (PG) 2026: advance intimation of examination city (26 Feb 2026)", "https://exams.nta.nic.in/advance-city-intimation-for-cuetpg-2026/"),
  icarRegistration: src(NTA, "Registration for ICAR AIEEA (PG) 2026 (08 May 2026)", "https://exams.nta.nic.in/registration-for-icar-aieea-pg-2026/"),
  icarAdmit: src(NTA, "Admit card for ICAR PG 2026 (01 Jul 2026)", "https://exams.nta.nic.in/admit-card-for-icar-pg/"),
  icarScore: src(NTA, "ICAR 2026 score card, PG (29 Aug 2026)", "https://exams.nta.nic.in/icar-2026-score-card-pg/"),
  ncetAdmit: src(NTA, "Admit card for NCET 2026 (13 Apr 2026)", "https://exams.nta.nic.in/admit-card-for-ncet-2026/"),
  ncetScore: src(NTA, "Score card for NCET 2026 (04 Jun 2026)", "https://exams.nta.nic.in/score-card-for-ncet-2026/"),
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

  // MHT CET 2026 (two attempts)
  { exam: "mht-cet", cycle: "2026", event: "Online registration (extended)", startsOn: "2026-01-10", endsOn: "2026-02-24", source: T.mhtRegistration },
  { exam: "mht-cet", cycle: "2026", event: "Registration with late fee", startsOn: "2026-02-25", endsOn: "2026-02-27", source: T.mhtRegistration },
  { exam: "mht-cet", cycle: "2026", event: "First attempt exam, PCM group", startsOn: "2026-04-11", endsOn: "2026-04-20", source: T.techCetDates },
  { exam: "mht-cet", cycle: "2026", event: "Registration for the second attempt", startsOn: "2026-04-15", endsOn: "2026-04-16", source: T.mhtSecondRegistration },
  { exam: "mht-cet", cycle: "2026", event: "First attempt exam, PCB group", startsOn: "2026-04-21", endsOn: "2026-04-26", source: T.techCetDates },
  { exam: "mht-cet", cycle: "2026", event: "Second attempt exam, PCB group", startsOn: "2026-05-10", endsOn: "2026-05-11", source: T.pcbResult },
  { exam: "mht-cet", cycle: "2026", event: "Second attempt exam, PCM group", startsOn: "2026-05-12", endsOn: "2026-05-20", source: T.pcm2Result },
  { exam: "mht-cet", cycle: "2026", event: "PCB first attempt result", startsOn: "2026-06-09", source: T.pcbResult },
  { exam: "mht-cet", cycle: "2026", event: "PCM first attempt result", startsOn: "2026-06-15", source: T.pcm1Result },
  { exam: "mht-cet", cycle: "2026", event: "PCB second attempt result", startsOn: "2026-06-18", source: T.pcbResult },
  { exam: "mht-cet", cycle: "2026", event: "PCM second attempt result", startsOn: "2026-06-18", source: T.pcm2Result },

  // MAH MBA/MMS CET 2026
  { exam: "mah-mba-cet", cycle: "2026", event: "Online registration", startsOn: "2026-01-10", endsOn: "2026-02-12", source: T.mbaRegistration },
  { exam: "mah-mba-cet", cycle: "2026", event: "First attempt exam", startsOn: "2026-04-06", endsOn: "2026-04-08", source: T.techCetDates },
  { exam: "mah-mba-cet", cycle: "2026", event: "Second attempt exam", startsOn: "2026-05-09", source: T.techCetDates },
  { exam: "mah-mba-cet", cycle: "2026", event: "First attempt result", startsOn: "2026-05-30", source: T.cetNotices },
  { exam: "mah-mba-cet", cycle: "2026", event: "Second attempt result", startsOn: "2026-06-12", source: T.cetNotices },

  // MH CET Law 2026 (3-year and 5-year LL.B.)
  { exam: "mh-cet-law", cycle: "2026", event: "3-year LL.B. CET: online registration", startsOn: "2026-01-08", endsOn: "2026-01-23", source: T.llb3Brochure },
  { exam: "mh-cet-law", cycle: "2026", event: "5-year LL.B. CET: online registration", startsOn: "2026-01-09", endsOn: "2026-01-24", source: T.llb5Registration },
  { exam: "mh-cet-law", cycle: "2026", event: "3-year LL.B. CET exam", startsOn: "2026-04-01", endsOn: "2026-04-02", source: T.higherEdCetDates },
  { exam: "mh-cet-law", cycle: "2026", event: "5-year LL.B. CET exam", startsOn: "2026-05-08", source: T.higherEdCetDates },

  // AP EAPCET 2026
  { exam: "ap-eapcet", cycle: "2026", event: "Notification", startsOn: "2026-02-03", source: T.apEapcet },
  { exam: "ap-eapcet", cycle: "2026", event: "Online application without late fee", startsOn: "2026-02-04", endsOn: "2026-03-24", source: T.apEapcet },
  { exam: "ap-eapcet", cycle: "2026", event: "Last date with the highest late fee (Rs 10,000)", startsOn: "2026-04-10", source: T.apEapcet },
  { exam: "ap-eapcet", cycle: "2026", event: "Correction of application data", startsOn: "2026-04-11", endsOn: "2026-04-13", source: T.apEapcet },
  { exam: "ap-eapcet", cycle: "2026", event: "Hall tickets", startsOn: "2026-04-28", source: T.apEapcet },
  { exam: "ap-eapcet", cycle: "2026", event: "Engineering exam (12 to 15 and 18 May)", startsOn: "2026-05-12", endsOn: "2026-05-18", source: T.apEapcet },
  { exam: "ap-eapcet", cycle: "2026", event: "Agriculture and pharmacy exam", startsOn: "2026-05-19", endsOn: "2026-05-20", source: T.apEapcet },
  { exam: "ap-eapcet", cycle: "2026", event: "Preliminary answer keys", startsOn: "2026-05-25", source: T.apEapcet },
  { exam: "ap-eapcet", cycle: "2026", event: "Last date for objections to preliminary keys", startsOn: "2026-05-27", source: T.apEapcet },

  // TG EAPCET 2026
  { exam: "ts-eapcet", cycle: "2026", event: "Rank cards for engineering, agriculture and pharmacy", startsOn: "2026-05-17", source: T.tgEapcet },

  // WBJEE 2026
  { exam: "wbjee", cycle: "2026", event: "Online registration", startsOn: "2026-03-10", endsOn: "2026-04-08", source: T.wbjee },
  { exam: "wbjee", cycle: "2026", event: "Exam", startsOn: "2026-05-24", source: T.wbjee },
  { exam: "wbjee", cycle: "2026", event: "Result", startsOn: "2026-06-18", source: T.wbjeeResult },

  // COMEDK UGET 2026
  { exam: "comedk-uget", cycle: "2026", event: "Online application (extended)", startsOn: "2026-02-03", endsOn: "2026-03-23", source: T.comedk },
  { exam: "comedk-uget", cycle: "2026", event: "Edit window", startsOn: "2026-04-10", endsOn: "2026-04-13", source: T.comedk },
  { exam: "comedk-uget", cycle: "2026", event: "Test admission ticket", startsOn: "2026-04-30", endsOn: "2026-05-09", source: T.comedk },
  { exam: "comedk-uget", cycle: "2026", event: "Exam", startsOn: "2026-05-09", source: T.comedk },
  { exam: "comedk-uget", cycle: "2026", event: "Provisional answer keys", startsOn: "2026-05-16", source: T.comedk },
  { exam: "comedk-uget", cycle: "2026", event: "Final answer keys", startsOn: "2026-05-23", source: T.comedk },
  { exam: "comedk-uget", cycle: "2026", event: "Rank and score cards", startsOn: "2026-05-29", source: T.comedk },

  // BITSAT 2026: BITS labels its timeline tentative.
  { exam: "bitsat", cycle: "2026", event: "Online application (Session 1 or both sessions)", startsOn: "2025-12-15", endsOn: "2026-03-19", tentative: true, source: T.bitsat },
  { exam: "bitsat", cycle: "2026", event: "Session 1 exam", startsOn: "2026-04-15", endsOn: "2026-04-16", tentative: true, source: T.bitsat },
  { exam: "bitsat", cycle: "2026", event: "Session 2 application", startsOn: "2026-04-20", endsOn: "2026-05-05", tentative: true, source: T.bitsat },
  { exam: "bitsat", cycle: "2026", event: "Admission application (preference form)", startsOn: "2026-04-27", endsOn: "2026-06-03", tentative: true, source: T.bitsat },
  { exam: "bitsat", cycle: "2026", event: "Session 2 exam", startsOn: "2026-05-25", endsOn: "2026-05-27", tentative: true, source: T.bitsat },
  { exam: "bitsat", cycle: "2026", event: "Iteration I admit list", startsOn: "2026-06-20", tentative: true, source: T.bitsat },

  // VITEEE 2026
  { exam: "viteee", cycle: "2026", event: "Last date to apply (extended)", startsOn: "2026-04-12", source: T.viteee },
  { exam: "viteee", cycle: "2026", event: "Exam", startsOn: "2026-04-28", endsOn: "2026-05-03", source: T.viteee },

  // SRMJEEE (UG) 2026
  { exam: "srmjeee", cycle: "2026", event: "Phase I: last date to apply", startsOn: "2026-04-16", source: T.srm1 },
  { exam: "srmjeee", cycle: "2026", event: "Phase I exam (remote proctored)", startsOn: "2026-04-24", endsOn: "2026-04-29", source: T.srm1 },
  { exam: "srmjeee", cycle: "2026", event: "Phase II: last date to apply", startsOn: "2026-06-04", source: T.srm2 },
  { exam: "srmjeee", cycle: "2026", event: "Phase II exam (remote proctored)", startsOn: "2026-06-10", endsOn: "2026-06-15", source: T.srm2 },

  // TNEA 2026 (counselling only, no exam)
  { exam: "tnea", cycle: "2026", event: "Online registration", startsOn: "2026-05-03", endsOn: "2026-06-05", source: T.tnea },
  { exam: "tnea", cycle: "2026", event: "Certificate verification (online)", startsOn: "2026-06-08", endsOn: "2026-06-29", source: T.tnea },
  { exam: "tnea", cycle: "2026", event: "Random number assigned", startsOn: "2026-06-10", source: T.tnea },
  { exam: "tnea", cycle: "2026", event: "Rank list", startsOn: "2026-07-01", source: T.tnea },
  { exam: "tnea", cycle: "2026", event: "General counselling (online)", startsOn: "2026-07-20", endsOn: "2026-08-30", source: T.tnea },

  // OJEE 2026
  { exam: "ojee", cycle: "2026", event: "Online application", startsOn: "2026-01-28", endsOn: "2026-03-22", source: T.ojeeBrochure },
  { exam: "ojee", cycle: "2026", event: "Admit card", startsOn: "2026-04-25", source: T.ojeeBrochure },
  { exam: "ojee", cycle: "2026", event: "Computer based tests", startsOn: "2026-05-04", endsOn: "2026-05-10", source: T.ojeeSchedule },

  // GUJCET 2026
  { exam: "gujcet", cycle: "2026", event: "Exam", startsOn: "2026-03-29", source: T.gujcet },

  // AIIMS: the key dates page is headed "Tentative Schedule of Entrance Examinations".
  { exam: "aiims-nursing", cycle: "2026", event: "Post Basic B.Sc Nursing exam (Stage I)", startsOn: "2026-05-30", tentative: true, source: T.aiimsKeyDates },
  { exam: "aiims-nursing", cycle: "2026", event: "Post Basic B.Sc Nursing Stage I result", startsOn: "2026-06-05", tentative: true, source: T.aiimsKeyDates },
  { exam: "aiims-nursing", cycle: "2026", event: "M.Sc Nursing exam", startsOn: "2026-06-20", tentative: true, source: T.aiimsKeyDates },
  { exam: "aiims-nursing", cycle: "2026", event: "B.Sc (Hons) Nursing exam", startsOn: "2026-06-27", tentative: true, source: T.aiimsKeyDates },
  { exam: "aiims-nursing", cycle: "2026", event: "M.Sc Nursing result", startsOn: "2026-06-27", tentative: true, source: T.aiimsKeyDates },
  { exam: "aiims-nursing", cycle: "2026", event: "B.Sc (Hons) Nursing result", startsOn: "2026-07-04", tentative: true, source: T.aiimsKeyDates },
  { exam: "ini-cet", cycle: "July 2026", event: "Exam", startsOn: "2026-05-16", tentative: true, source: T.aiimsKeyDates },
  { exam: "ini-cet", cycle: "July 2026", event: "Result", startsOn: "2026-05-23", tentative: true, source: T.aiimsKeyDates },
  { exam: "ini-cet", cycle: "January 2027", event: "Exam", startsOn: "2026-11-01", tentative: true, source: T.aiimsKeyDates },
  { exam: "ini-cet", cycle: "January 2027", event: "Result", startsOn: "2026-11-07", tentative: true, source: T.aiimsKeyDates },

  // XAT 2027
  { exam: "xat", cycle: "2027", event: "Registration", startsOn: "2026-07-15", endsOn: "2026-12-06", source: T.xat },
  { exam: "xat", cycle: "2027", event: "Admit card", startsOn: "2026-12-20", tentative: true, source: T.xat },
  { exam: "xat", cycle: "2027", event: "Exam", startsOn: "2027-01-03", source: T.xat },

  // MAT December 2026
  { exam: "mat", cycle: "December 2026", event: "Paper based test: last date to register", startsOn: "2026-12-14", source: T.mat },
  { exam: "mat", cycle: "December 2026", event: "Paper based test: admit card", startsOn: "2026-12-17", source: T.mat },
  { exam: "mat", cycle: "December 2026", event: "Paper based test", startsOn: "2026-12-20", source: T.mat },
  { exam: "mat", cycle: "December 2026", event: "Computer based test: last date to register", startsOn: "2026-12-21", source: T.mat },
  { exam: "mat", cycle: "December 2026", event: "Computer based test: admit card", startsOn: "2026-12-24", source: T.mat },
  { exam: "mat", cycle: "December 2026", event: "Computer based test", startsOn: "2026-12-27", source: T.mat },

  // CMAT 2026
  { exam: "cmat", cycle: "2026", event: "Exam", startsOn: "2026-01-25", source: T.cmatKey },
  { exam: "cmat", cycle: "2026", event: "Result (score cards)", startsOn: "2026-02-17", source: T.cmatScore },

  // NMAT by GMAC, testing window November to December 2026
  { exam: "nmat", cycle: "2026", event: "Registration and scheduling", startsOn: "2026-08-20", endsOn: "2026-10-25", source: T.nmat },
  { exam: "nmat", cycle: "2026", event: "Testing window", startsOn: "2026-11-02", endsOn: "2026-12-20", source: T.nmat },
  { exam: "nmat", cycle: "2026", event: "Retake registration and scheduling", startsOn: "2026-11-03", endsOn: "2026-12-17", source: T.nmat },
  { exam: "nmat", cycle: "2026", event: "Last date to reschedule", startsOn: "2026-12-17", source: T.nmat },

  // SNAP 2026
  { exam: "snap", cycle: "2026", event: "Last date for registration and payment", startsOn: "2026-11-25", source: T.snap },
  { exam: "snap", cycle: "2026", event: "SNAP Test 1", startsOn: "2026-12-13", source: T.snap },
  { exam: "snap", cycle: "2026", event: "SNAP Test 2", startsOn: "2026-12-19", source: T.snap },
  { exam: "snap", cycle: "2026", event: "SNAP Test 3", startsOn: "2026-12-26", source: T.snap },
  { exam: "snap", cycle: "2026", event: "Result", startsOn: "2027-01-12", source: T.snap },

  // IPMAT Indore 2026
  { exam: "ipmat-indore", cycle: "2026", event: "Online application", startsOn: "2026-02-02", endsOn: "2026-03-14", source: T.ipmat },
  { exam: "ipmat-indore", cycle: "2026", event: "Aptitude test (IPM AT)", startsOn: "2026-05-04", source: T.ipmat },

  // AILET 2027 (admissions for 2027-28)
  { exam: "ailet", cycle: "2027", event: "Admission notice and online application forms available", startsOn: "2026-08-07", source: T.ailet },
  { exam: "ailet", cycle: "2027", event: "Exam", startsOn: "2026-12-13", source: T.ailet },

  // NID DAT, admissions 2026-27 and 2027-28
  { exam: "nid-dat", cycle: "2026-27", event: "Online application", startsOn: "2025-09-11", endsOn: "2025-12-01", source: T.nid2026 },
  { exam: "nid-dat", cycle: "2026-27", event: "DAT Prelims", startsOn: "2025-12-21", source: T.nid2026 },
  { exam: "nid-dat", cycle: "2026-27", event: "DAT Prelims result", startsOn: "2026-04-07", source: T.nid2026 },
  { exam: "nid-dat", cycle: "2027-28", event: "Online application", startsOn: "2026-09-10", endsOn: "2026-11-30", source: T.nid2027 },
  { exam: "nid-dat", cycle: "2027-28", event: "Edit window", startsOn: "2026-12-01", endsOn: "2026-12-03", source: T.nid2027 },
  { exam: "nid-dat", cycle: "2027-28", event: "DAT Prelims admit card", startsOn: "2026-12-10", source: T.nid2027 },
  { exam: "nid-dat", cycle: "2027-28", event: "DAT Prelims", startsOn: "2026-12-20", source: T.nid2027 },
  { exam: "nid-dat", cycle: "2027-28", event: "DAT Prelims result", startsOn: "2027-03-16", source: T.nid2027 },

  // NIFT Entrance 2027
  { exam: "nift", cycle: "2027", event: "Online application (regular fee)", startsOn: "2026-10-16", endsOn: "2026-11-16", source: T.nift2027 },
  { exam: "nift", cycle: "2027", event: "Last date with late fee", startsOn: "2026-11-21", source: T.nift2027 },
  { exam: "nift", cycle: "2027", event: "Correction window", startsOn: "2026-11-22", endsOn: "2026-11-25", source: T.nift2027 },
  { exam: "nift", cycle: "2027", event: "Advance city intimation slip", startsOn: "2026-12-21", source: T.nift2027 },
  { exam: "nift", cycle: "2027", event: "Admit card", startsOn: "2027-01-04", source: T.nift2027 },
  { exam: "nift", cycle: "2027", event: "Exam", startsOn: "2027-01-10", source: T.nift2027 },

  // NEST 2026
  { exam: "nest", cycle: "2026", event: "Online application", startsOn: "2026-01-05", endsOn: "2026-04-06", source: T.nest },
  { exam: "nest", cycle: "2026", event: "Payment portal closes", startsOn: "2026-04-12", source: T.nest },
  { exam: "nest", cycle: "2026", event: "Admit card", startsOn: "2026-05-15", source: T.nest },
  { exam: "nest", cycle: "2026", event: "Exam", startsOn: "2026-06-06", source: T.nest },
  { exam: "nest", cycle: "2026", event: "Marks and score cards", startsOn: "2026-06-30", source: T.nestResult },

  // IISER Aptitude Test 2026
  { exam: "iiser-iat", cycle: "2026", event: "Exam", startsOn: "2026-06-07", source: T.iat },

  // CUET PG 2026
  { exam: "cuet-pg", cycle: "2026", event: "Online application", startsOn: "2025-12-14", endsOn: "2026-01-14", source: T.cuetPgBulletin },
  { exam: "cuet-pg", cycle: "2026", event: "Correction window", startsOn: "2026-01-18", endsOn: "2026-01-20", source: T.cuetPgBulletin },
  { exam: "cuet-pg", cycle: "2026", event: "Exam (6 to 13, 16 to 19, 24, 25 and 27 March)", startsOn: "2026-03-06", endsOn: "2026-03-27", source: T.cuetPgCity },

  // ICAR AIEEA PG 2026
  { exam: "icar-aieea-pg", cycle: "2026", event: "Registration opened", startsOn: "2026-05-08", source: T.icarRegistration },
  { exam: "icar-aieea-pg", cycle: "2026", event: "Admit card", startsOn: "2026-07-01", source: T.icarAdmit },
  { exam: "icar-aieea-pg", cycle: "2026", event: "Result (score cards)", startsOn: "2026-08-29", source: T.icarScore },

  // NCET 2026
  { exam: "ncet", cycle: "2026", event: "Admit card", startsOn: "2026-04-13", source: T.ncetAdmit },
  { exam: "ncet", cycle: "2026", event: "Result (score cards)", startsOn: "2026-06-04", source: T.ncetScore },
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
  { exam: "mht-cet", cycle: "2026", body: "State Common Entrance Test Cell, Maharashtra (centralised admission process)", url: "https://cetcell.mahacet.org" },
  { exam: "mah-mba-cet", cycle: "2026", body: "State Common Entrance Test Cell, Maharashtra (centralised admission process)", url: "https://cetcell.mahacet.org" },
  { exam: "mh-cet-law", cycle: "2026", body: "State Common Entrance Test Cell, Maharashtra (centralised admission process)", url: "https://cetcell.mahacet.org" },
  { exam: "comedk-uget", cycle: "2026", body: "COMEDK (online counselling for its member colleges)", url: "https://www.comedk.org" },
  { exam: "wbjee", cycle: "2026", body: "West Bengal Joint Entrance Examinations Board (online counselling)", url: "https://wbjeeb.nic.in" },
  { exam: "tnea", cycle: "2026", body: "Directorate of Technical Education, Tamil Nadu (TNEA online counselling)", url: "https://www.tneaonline.org" },
  { exam: "ojee", cycle: "2026", body: "Odisha Joint Entrance Examination Committee (e-counselling)", url: "https://ojee.nic.in" },
  { exam: "bitsat", cycle: "2026", body: "BITS Pilani (admit lists announced in iterations)", url: "https://www.bitsadmission.com" },
];

export type ExamFacts = {
  exam: string;
  cycle: string;
  /** Who may sit the exam, summarised in our own words from the official bulletin. */
  eligibility?: string;
  /** Exam pattern as the official bulletin sets it out. */
  pattern?: string[];
  source: ExamSource;
};

/**
 * Eligibility and pattern, only where we have read the conducting body's own bulletin or page.
 * Exams missing here show neither section.
 */
export const EXAM_FACTS: ExamFacts[] = [
  {
    exam: "bitsat",
    cycle: "2026",
    eligibility:
      "Class 12 (10+2) passed in 2025 or appearing in 2026, from a recognised central or state board. For B.E. and most M.Sc programmes: Physics, Chemistry and Mathematics with at least 75% aggregate in the three and at least 60% in each. For B.Pharm and some other programmes, Biology can take the place of Mathematics on the same terms. At most two attempts.",
    pattern: [
      "Computer based test of 3 hours, 130 multiple choice questions",
      "Physics 30, Chemistry 30, English Proficiency 10, Logical Reasoning 20, Mathematics (or Biology for B.Pharm) 40",
      "3 marks for a correct answer, minus 1 for a wrong answer",
      "Up to 12 extra questions if all 130 are answered with time left",
    ],
    source: src("Birla Institute of Technology and Science, Pilani", "BITSAT-2026 brochure", "https://bitsadmission.com/FD/downloads/BITSAT-2026_brochure.pdf"),
  },
  {
    exam: "gujcet",
    cycle: "2026",
    eligibility: "Students who have passed or are appearing in Class 12 science from the Gujarat board, or from CBSE or CISCE through a school in Gujarat, and others the admission committee's rules allow.",
    pattern: [
      "Physics and Chemistry together: 80 questions, 80 marks, 120 minutes",
      "Biology: 40 questions, 40 marks, 60 minutes",
      "Mathematics: 40 questions, 40 marks, 60 minutes",
      "1 mark for a correct answer, minus 0.25 for a wrong answer",
    ],
    source: T.gujcet,
  },
  {
    exam: "tnea",
    cycle: "2026",
    eligibility:
      "A pass in Class 11 and 12 (or equivalent) with a minimum average in Mathematics, Physics and Chemistry: 45% for general candidates and 40% for BC, MBC, DNC, SC, SCA and ST candidates. There is no entrance test; the rank list is drawn from Class 12 marks in Mathematics (100), Physics (50) and Chemistry (50), out of 200.",
    source: T.tneaBrochure,
  },
  {
    exam: "mh-cet-law",
    cycle: "2026",
    eligibility:
      "For the 3-year LL.B. CET: Indian nationals with a graduate degree in any subject (final-year students may apply), with at least 45% aggregate for open category candidates, 42% for VJNT, SBC and OBC candidates from Maharashtra and 40% for SC and ST candidates from Maharashtra.",
    pattern: [
      "3-year LL.B. CET: 120 multiple choice questions in 2 hours, 1 mark each, no negative marking",
      "Legal aptitude and reasoning 24, general knowledge and current affairs 32, logical and analytical reasoning 24, English 40",
      "Questions in English and Marathi, online, at centres in Maharashtra",
    ],
    source: T.llb3Brochure,
  },
  {
    exam: "snap",
    cycle: "2026",
    eligibility:
      "A bachelor's degree from a recognised university with at least 50% marks (45% for SC and ST candidates). Some Symbiosis programmes ask for more, such as an engineering degree or work experience.",
    pattern: [
      "Computer based test of 60 minutes, 60 questions, 60 marks",
      "General English 10, Analytical and Logical Reasoning 20, Quantitative, Data Interpretation and Data Sufficiency 20, Ethics, Morality and Values 10",
      "1 mark for a correct answer, a quarter mark deducted for a wrong one",
    ],
    source: T.snap,
  },
  {
    exam: "ipmat-indore",
    cycle: "2026",
    eligibility:
      "Born on or after 1 August 2006 (1 August 2001 for SC, ST and PwD candidates), and Class 12 passed in 2024 or 2025 or appearing in 2026.",
    pattern: [
      "Three sections of 40 minutes each, 120 minutes in all",
      "Quantitative Ability (multiple choice), Quantitative Ability (short answer) and Verbal Ability (multiple choice)",
      "4 marks per question; 1 mark deducted for a wrong multiple choice answer, no negative marking for short answers",
    ],
    source: T.ipmat,
  },
  {
    exam: "ailet",
    cycle: "2027",
    pattern: [
      "B.A.LL.B. (Hons.): 150 multiple choice questions, 150 marks, 120 minutes",
      "English Language 50, Current Affairs and General Knowledge 30, Logical Reasoning 70",
      "0.25 marks deducted for each wrong answer",
    ],
    source: T.ailetPattern,
  },
  {
    exam: "nid-dat",
    cycle: "2027-28",
    eligibility:
      "For the B.Des: born on or after 1 July 2006 (1 July 2003 for OBC-NCL, SC and ST candidates, 1 July 2001 for PwD candidates), and Class 12 passed or appearing in any stream from a recognised board.",
    pattern: ["DAT Prelims is a pen and paper test in English, held at the same time at every centre", "Prelims marks are used only to shortlist candidates for DAT Mains"],
    source: T.nid2027,
  },
  {
    exam: "nest",
    cycle: "2026",
    eligibility:
      "Studied at least three of Biology, Chemistry, Mathematics and Physics in Classes 11 and 12; Class 12 passed in 2024 or 2025 or appearing in 2026, with at least 60% (55% for SC, ST and PwD candidates). No age limit.",
    pattern: [
      "Computer based test of 3 hours with four sections: Biology, Chemistry, Mathematics and Physics",
      "20 multiple choice questions per section, 60 marks per section",
      "3 marks for a correct answer, minus 1 for a wrong answer",
      "At least three sections must be attempted to be ranked",
    ],
    source: T.nest,
  },
  {
    exam: "iiser-iat",
    cycle: "2026",
    pattern: [
      "Computer based test of 180 minutes, 60 multiple choice questions",
      "15 questions each from Biology, Chemistry, Mathematics and Physics",
      "4 marks for a correct answer, minus 1 for a wrong answer; maximum 240",
    ],
    source: T.iat,
  },
];
