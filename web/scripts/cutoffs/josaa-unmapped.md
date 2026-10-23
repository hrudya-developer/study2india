# JoSAA 2026 opening and closing ranks: items not mapped

Source: https://josaa.admissions.nic.in/Applicant/SeatAllotmentResult/currentorcr.aspx, Rounds 1 to 5, read 2026-10-24.
Built by `scripts/cutoffs/josaa-orcr-convert.mjs` and checked by `scripts/cutoffs/josaa-orcr-validate.mjs`.

The grid has 65232 rows over the five rounds (13292, 13047, 12989, 12968, 12936). 62200 are in
`data/cutoffs/josaa-2026.json`. The 3032 rows left out are listed below. Every institute code (all 138) is in
`data/councils/josaa.json`, every kept program matched a branch of its institute there, and every one of the
974 council branches has rows in all five rounds. Nothing was left unmapped for want of a match.

## Programs left out (no course for them, or taught outside India)

Rows are summed over the five rounds.

| Rows | Institute | Program, as JoSAA prints it |
|---:|---|---|
| 45 | 102 IIT Bombay | Applied Geophysics (4 Years, Bachelor of Science) |
| 45 | 102 IIT Bombay | BS in Mathematics (4 Years, Bachelor of Science) |
| 50 | 102 IIT Bombay | Chemistry (4 Years, Bachelor of Science) |
| 60 | 102 IIT Bombay | Economics (4 Years, Bachelor of Science) |
| 45 | 103 IIT Mandi | BS in Chemical Sciences (4 Years, Bachelor of Science) |
| 51 | 104 IIT Delhi | Chemistry (4 Years, Bachelor of Science) |
| 30 | 104 IIT Delhi | Abu Dhabi Campus - Chemical Engineering (4 Years, Bachelor of Technology) |
| 40 | 104 IIT Delhi | Abu Dhabi Campus - Computer Science and Engineering (4 Years, Bachelor of Technology) |
| 35 | 104 IIT Delhi | Abu Dhabi Campus - Electrical Engineering (4 Years, Bachelor of Technology) |
| 40 | 104 IIT Delhi | Abu Dhabi Campus - Energy Engineering (4 Years, Bachelor of Technology) |
| 40 | 105 IIT Indore | Applied and Industrial Chemistry (4 Years, Bachelor of Science) |
| 50 | 106 IIT Kharagpur | Applied Geology (4 Years, Bachelor of Science) |
| 50 | 106 IIT Kharagpur | Chemistry (4 Years, Bachelor of Science) |
| 50 | 106 IIT Kharagpur | Economics (4 Years, Bachelor of Science) |
| 50 | 106 IIT Kharagpur | Exploration Geophysics (4 Years, Bachelor of Science) |
| 60 | 106 IIT Kharagpur | Mathematics and Computing (4 Years, Bachelor of Science) |
| 51 | 106 IIT Kharagpur | Physics (4 Years, Bachelor of Science) |
| 35 | 108 IIT Jodhpur | Engineering Chemistry (4 Years, Bachelor of Science) |
| 35 | 108 IIT Jodhpur | Engineering Physics (4 Years, Bachelor of Science) |
| 40 | 108 IIT Jodhpur | Mathematics and Computing (4 Years, Bachelor of Science) |
| 50 | 109 IIT Kanpur | Chemistry (4 Years, Bachelor of Science) |
| 55 | 109 IIT Kanpur | Earth Sciences (4 Years, Bachelor of Science) |
| 55 | 109 IIT Kanpur | Economics (4 Years, Bachelor of Science) |
| 60 | 109 IIT Kanpur | Mathematics and Scientific Computing (4 Years, Bachelor of Science) |
| 50 | 109 IIT Kanpur | Physics (4 Years, Bachelor of Science) |
| 45 | 109 IIT Kanpur | Statistics and Data Science (4 Years, Bachelor of Science) |
| 50 | 110 IIT Madras | Biological Science (4 Years, Bachelor of Science) |
| 45 | 110 IIT Madras | BS in Mathematics (4 Years, Bachelor of Science) |
| 40 | 110 IIT Madras | Physics (4 Years, Bachelor of Science) |
| 50 | 112 IIT Patna | Economics (4 Years, Bachelor of Science) |
| 25 | 112 IIT Patna | BS in Economics with MBA (IIM Bodh Gaya) (5 Years, Bachelor of Science and MBA (Dual Degree)) |
| 45 | 113 IIT Roorkee | Chemical Sciences (5 Years, Bachelor of Science and Master of Science (Dual Degree)) |
| 45 | 113 IIT Roorkee | Economics (5 Years, Bachelor of Science and Master of Science (Dual Degree)) |
| 60 | 113 IIT Roorkee | Mathematics & Computing (5 Years, Bachelor of Science and Master of Science (Dual Degree)) |
| 45 | 113 IIT Roorkee | Physics (5 Years, Bachelor of Science and Master of Science (Dual Degree)) |
| 40 | 114 IIT (ISM) Dhanbad | Chemical Science (5 Years, Integrated Bachelor of Science-Master of Science) |
| 40 | 114 IIT (ISM) Dhanbad | Physical Science (5 Years, Integrated Bachelor of Science-Master of Science) |
| 35 | 123 IIT Dharwad | Major in Mathematics (4 Years, Bachelor of Science) |
| 35 | 123 IIT Dharwad | Major in Physics (4 Years, Bachelor of Science) |
| 45 | 205 NIT Agartala | Chemistry (5 Years, Bachelor of Science and Master of Science (Dual Degree)) |
| 55 | 205 NIT Agartala | Mathematics & Computing (5 Years, Bachelor of Science and Master of Science (Dual Degree)) |
| 45 | 205 NIT Agartala | Physics (5 Years, Bachelor of Science and Master of Science (Dual Degree)) |
| 60 | 208 NIT Durgapur | Chemistry (5 Years, Integrated Master of Science) |
| 70 | 223 NIT Rourkela | Chemistry (5 Years, Integrated Master of Science) |
| 70 | 223 NIT Rourkela | Life Science (5 Years, Integrated Master of Science) |
| 75 | 228 NIT Warangal | Chemistry (5 Years, Integrated Master of Science) |
| 70 | 228 NIT Warangal | Mathematics (5 Years, Integrated Master of Science) |
| 70 | 228 NIT Warangal | Physics (5 Years, Integrated Master of Science) |
| 55 | 229 SVNIT Surat | Chemistry (5 Years, Integrated Bachelor of Science-Master of Science) |
| 55 | 229 SVNIT Surat | Mathematics (5 Years, Integrated Bachelor of Science-Master of Science) |
| 51 | 229 SVNIT Surat | Physics (5 Years, Integrated Bachelor of Science-Master of Science) |
| 70 | 232 IIEST Shibpur | Applied Geology (5 Years, Integrated Master of Science) |
| 75 | 232 IIEST Shibpur | Chemistry (5 Years, Integrated Master of Science) |
| 65 | 232 IIEST Shibpur | Physics (5 Years, Integrated Master of Science) |
| 38 | 402 BIT Mesra | Mathematics and Computing (5 Years, Integrated Master of Science) |
| 35 | 402 BIT Mesra | Physics (5 Years, Integrated Master of Science) |
| 35 | 402 BIT Mesra | Quantitative Economics & Data Science (5 Years, Integrated Master of Science) |
| 25 | 410 SLIET Longowal | Chemistry (5 Years, Integrated Master of Science) |
| 25 | 410 SLIET Longowal | Mathematics (5 Years, Integrated Master of Science) |
| 25 | 410 SLIET Longowal | Physics (5 Years, Integrated Master of Science) |
| 56 | 440 BIT Deoghar Off-Campus | Mathematics and Computing (5 Years, Integrated Master of Science) |
| 55 | 441 BIT Patna Off-Campus | Mathematics and Computing (5 Years, Integrated Master of Science) |
| 10 | 412 Tezpur University School of Engineering | Bachelor of Design (4 Years, Bachelor of Design) |
| 25 | 416 SMVDU Katra | Bachelor of Design (4 Years, Bachelor of Design) |

Totals: 4-year BS 1327 rows (28 programs), 5-year BS-MS dual 340 (7), integrated BS-MS 241 (5),
integrated M.Sc 919 (17), BS + MBA 25 (1), B.Des 35 (2), IIT Delhi Abu Dhabi 145 (4).

## Kept, with notes

- **Preparatory ranks.** A rank printed with "P" is on JoSAA's preparatory rank list. The number is kept and the
  row gets `"preparatory": true` (879 rows). In 64 rows only one of the two ranks is a preparatory rank; there
  the row also gets `"preparatory_rank": "opening"` or `"closing"`, naming the one that is. All 64 are AI quota
  PwD rows at IITs where the closing rank is the preparatory one, so the closing number is often below the
  opening number (for example IIT Hyderabad Mechanical Engineering, OPEN (PwD), 293 to 73P). The validator
  checks opening <= closing only where both ranks are on the same list; it lists these 64 rows instead.
- **Ranks printed as decimals.** 20 ranks at NIT Mizoram (222), HS quota, OPEN, are printed with ".0"
  (for example 1032951.0). They are kept as integers (1032951).
- **Opening above closing on the same list.** None.

## Gaps

- Five rounds only. The JoSAA 2026 schedule has rounds 1 to 5, and round 5 is the last; CSAB special rounds
  for NITs, IIITs and GFTIs are run by CSAB, not JoSAA, and are not in this file.
- Seat types that JoSAA does not run at an institute or program simply have no row. In this file HS appears
  at 39 institutes (the NITs and IIEST except NIT Srinagar, plus GFTIs 401, 422, 426, 427, 435, 440, 441,
  450), OS at 34 (all NITs and IIEST, plus 422 and 427), GO only at NIT Goa (209), and JK and LA only at
  NIT Srinagar (225). IITs, IIITs and the other GFTIs have AI rows only.
- Ranks are kept as JoSAA prints them (JEE (Advanced) ranks for IITs and IISc, JEE (Main) ranks for the rest);
  they are not converted to one scale.
