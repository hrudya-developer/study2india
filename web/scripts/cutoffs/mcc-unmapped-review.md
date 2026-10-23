# MCC NEET UG 2026: institute names with no record of ours

These names appear in the MCC final allotment lists (Round 1, 2, 3 and Stray Vacancy Round) but match no institution in our database by name, city and state. Their rows are left out of `data/cutoffs/mcc-neet-ug-2026.json`. To include one, add the institution (or its council code) and set `institution` for it in `mcc-institutes-2026.json`, then rerun `node scripts/cutoffs/mcc-convert.mjs <extract folder>`.

| MCC name | Course | Allotments | Cutoff rows | Why |
|---|---|---|---|---|
| AIIMS Bathinda | MBBS | 160 | 22 | no record |
| AIIMS Bilaspur Changar Palasiyan, Himachal Pradesh | MBBS | 166 | 22 | no record |
| AIIMS Guwahati | MBBS | 172 | 26 | no record |
| AIIMS Jammu | MBBS | 177 | 20 | no record |
| AIIMS Mangalagiri | MBBS | 149 | 16 | no record |
| AIIMS Rajkot | MBBS | 123 | 18 | no record |
| AIIMS, Bibi Nagar, Hyderabad | MBBS | 126 | 18 | no record |
| AIIMS, Deogarh | MBBS | 188 | 20 | no record |
| AIIMS, Gorakhpur | MBBS | 161 | 22 | no record |
| AIIMS, Kalyani | MBBS | 156 | 19 | no record |
| AIIMS, Madurai | MBBS | 111 | 22 | no record |
| AIIMS, Nagpur | MBBS | 134 | 16 | no record |
| AIIMS, Rai Bareli | MBBS | 218 | 22 | no record |
| All India Institute of Medical Sciences, Rewari | MBBS | 80 | 18 | no record |
| BAGALKOTE MEDICAL COLLEGE AND RESEARCH INSTITUTE OFFICE, BAGALKOTE | MBBS | 29 | 13 | not on our NMC list |
| Central Armed Police Forces Institute of Medical Sciences Maidangarhi (AIIMS CAPFIMS) Asola Delhi | MBBS | 134 | 19 | no record |
| College of Nursing BHU, VARANASI | B.Sc Nursing | 154 | 18 | no INC record of ours; not joined to IMS BHU |
| College of Nursing LHMC, New Delhi | B.Sc Nursing | 81 | 17 | no INC record of ours; not joined to LHMC |
| ESIC College of Nursing, Gulbarga, Karnataka | B.Sc Nursing | 57 | 17 | no INC record |
| ESIC College of Nursing, Indiranagar, Bangalore | B.Sc Nursing | 68 | 19 | no INC record |
| GOVERNMENT MEDICAL COLLEGE CHAPRA (SARAN) | MBBS | 11 | 6 | not on our NMC list |
| JIPMER KARAIKAL | MBBS | 117 | 30 | no record |
| Late Jagjivan Ram Goverment medical College | MBBS | 11 | 9 | not on our NMC list |
| Punyashlok Ahilyadevi Holkar Government Medical College | MBBS | 16 | 6 | not on our NMC list |
| Shri Ram Janki Medical College and Hospital Samastipur | MBBS | 12 | 10 | not on our NMC list |

Total: 25 names, 2811 allotments, 445 cutoff rows.

## Links to check

- RUHS College of Dental Science, Jaipur is joined to the DCI record "Govt. Dental College & Hospital, Jaipur" (dci pbrqm7u4h), taken to be its former name. Confirm before relying on it.
- AIIMS New Delhi, Bhopal, Bhubaneswar, Jodhpur, Patna, Raipur, Rishikesh and JIPMER Puducherry are not on the NMC college list we load; they are joined to their NIRF records. The cutoff loader creates their MBBS offering when it is missing.
