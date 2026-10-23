# MCC NEET UG 2026: institute names with no record of ours

These names appear in the MCC final allotment lists (Round 1, 2, 3 and Stray Vacancy Round) but match no institution in our database by name, city and state. Their rows are left out of `data/cutoffs/mcc-neet-ug-2026.json`. To include one, add the institution (or its council code) and set `institution` for it in `mcc-institutes-2026.json`, then rerun `node scripts/cutoffs/mcc-convert.mjs <extract folder>`.

Every list we load was searched by hand for each name (name, city, state): the NMC MBBS and PG lists (`data/nmc/`), the NIRF 2025 files (`data/nirf/2025/`) and every council file (`data/councils/`). No college has been made up for any of them.

| MCC name | Course | Allotments | Cutoff rows | Why | Add it from |
|---|---|---|---|---|---|
| AIIMS Bilaspur Changar Palasiyan, Himachal Pradesh | MBBS | 166 | 22 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS Guwahati | MBBS | 172 | 26 | only its College of Nursing is on the INC list (inc zklp6l); a nursing college record is not joined to the institute | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS Jammu | MBBS | 177 | 20 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS Mangalagiri | MBBS | 149 | 16 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS Rajkot | MBBS | 123 | 18 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS, Bibi Nagar, Hyderabad | MBBS | 126 | 18 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS, Gorakhpur | MBBS | 161 | 22 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS, Kalyani | MBBS | 156 | 19 | only its College of Nursing is on the INC list (inc 1l9qtq1); not joined to the institute | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS, Madurai | MBBS | 111 | 22 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS, Nagpur | MBBS | 134 | 16 | only its College of Nursing is on the INC list (inc 16xu6mj); not joined to the institute | AIIMS list (MoHFW PMSSY) and the institute's own site |
| AIIMS, Rai Bareli | MBBS | 218 | 22 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| All India Institute of Medical Sciences, Rewari | MBBS | 80 | 18 | in no list we load | AIIMS list (MoHFW PMSSY) and the institute's own site |
| Central Armed Police Forces Institute of Medical Sciences Maidangarhi (AIIMS CAPFIMS) Asola Delhi | MBBS | 134 | 19 | in no list we load | MCC UG seat matrix and the institute's own site |
| JIPMER KARAIKAL | MBBS | 117 | 30 | a separate campus of JIPMER with its own seats and ranks; JIPMER Puducherry is joined through its NIRF record, and folding Karaikal's ranks into it would misstate both | JIPMER's own site (jipmer.edu.in), as its own institution |
| BAGALKOTE MEDICAL COLLEGE AND RESEARCH INSTITUTE OFFICE, BAGALKOTE | MBBS | 29 | 13 | not on the NMC MBBS list we load (retrieved 2026-10-23); a government college | NMC list of colleges teaching MBBS, once it carries the college |
| GOVERNMENT MEDICAL COLLEGE CHAPRA (SARAN) | MBBS | 11 | 6 | not on the NMC MBBS list we load; a government college | NMC list of colleges teaching MBBS |
| Late Jagjivan Ram Goverment medical College (Pithoragarh) | MBBS | 11 | 9 | not on the NMC MBBS list we load; a government college | NMC list of colleges teaching MBBS |
| Punyashlok Ahilyadevi Holkar Government Medical College (Ahilyanagar) | MBBS | 16 | 6 | not on the NMC MBBS list we load; a government college | NMC list of colleges teaching MBBS |
| Shri Ram Janki Medical College and Hospital Samastipur | MBBS | 12 | 10 | not on the NMC MBBS list we load; a government college | NMC list of colleges teaching MBBS |
| College of Nursing LHMC, New Delhi | B.Sc Nursing | 81 | 17 | not on the INC list we load (2025-26 or 2026-27); not joined to LHMC, a medical college record | INC list of recognised institutions |

Total: 20 names, 2184 allotments, 349 cutoff rows.

Sources:

- AIIMS list: Pradhan Mantri Swasthya Suraksha Yojana, MoHFW, https://pmssy.mohfw.gov.in/ (the AIIMS are set up under the AIIMS Act, so the NMC college list does not carry them).
- MCC UG seat matrix and allotment results: https://mcc.nic.in/ug-medical-counselling/
- NMC list of colleges teaching MBBS: https://nmc.org.in/page/information-desk-for-students-to-study-in-india-list-of-college-teaching-mbbs
- INC list of recognised institutions: https://online.indiannursingcouncil.org/Reports/YearlyReportByState.aspx

## Joined on 2026-10-24 (no longer skipped)

| MCC name | Course | Cutoff rows | Joined to |
|---|---|---|---|
| AIIMS Bathinda | MBBS | 22 | inc xt9qw0, "Aiims Bathinda" (Bathinda, Punjab): the INC lists the institute under its own name |
| AIIMS, Deogarh | MBBS | 20 | inc ukykas, "All India Institute Of Medical Sciences" (Deoghar, Jharkhand): the institute itself |
| College of Nursing BHU, VARANASI | B.Sc Nursing | 18 | inc l8b2mh, "College Of Nursing, Sir Sunder Lal Hospital" (Varanasi): BHU's teaching hospital |
| ESIC College of Nursing, Gulbarga, Karnataka | B.Sc Nursing | 17 | inc 1qrj5oa, "E S I C College Of Nursing-Gulbarga" (Kalaburagi 585106, Sedam Road as MCC prints it) |
| ESIC College of Nursing, Indiranagar, Bangalore | B.Sc Nursing | 19 | inc 1848yhw, "Employees State Insurance Corporation College Of Nursing" (Bangalore): ESIC's only nursing college in Bengaluru (ESIC list of Karnataka institutions, dmd.esic.gov.in) |

An AIIMS is joined only to a record of the institute itself. Where the INC list has only "College of Nursing, AIIMS ..." (Guwahati, Kalyani, Nagpur, and also Bhopal, Bhubaneswar, Jodhpur, Patna, Raipur, Rishikesh), the MBBS rows are not put on the nursing college.

## Links to check

- RUHS College of Dental Science, Jaipur is joined to the DCI record "Govt. Dental College & Hospital, Jaipur" (dci pbrqm7u4h), taken to be its former name. Confirm before relying on it.
- AIIMS New Delhi, Bhopal, Bhubaneswar, Jodhpur, Patna, Raipur, Rishikesh and JIPMER Puducherry are not on the NMC college list we load; they are joined to their NIRF records. The cutoff loader creates their MBBS offering when it is missing.
- AIIMS Bathinda and AIIMS Deoghar are joined to their INC records, which carry the B.Sc and M.Sc Nursing intake; the cutoff loader adds their MBBS offering. The Deoghar record's name has no city ("All India Institute Of Medical Sciences"); the city shows beside it. If either AIIMS is later added from another list, give that record the INC code (`same_as`) so they stay one institution.
- College of Nursing BHU is joined to the INC record named after Sir Sunder Lal Hospital, taken to be the same college (BHU's College of Nursing sits at its teaching hospital). Confirm before relying on it.
