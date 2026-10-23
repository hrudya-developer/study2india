# College listing and college page: competitor benchmark

Reviewed on 23 Oct 2026: Collegedunia, Shiksha, Careers360 and CollegeDekho, on their engineering listing pages and their Jadavpur University (or nearest equivalent) college pages. Pages were read as server HTML, the way a search engine or a slow phone first sees them.

## What students need most

Ranked by how often the same need shows up across all four sites (and in what they put above the fold):

1. **Find colleges by place and course.** State, then city, then course or branch. Every competitor leads with these.
2. **Know if the college is legitimate.** Ownership (government or private), the regulator approval (AICTE, NMC, INC, NCISM, NCH), affiliating university, NIRF rank.
3. **Know the intake.** Courses offered and the seats in each, by branch where it exists (B.Tech branches, MD and MS specialities).
4. **Know how to get in.** The entrance exam, the counselling route, the cutoff.
5. **Know the cost.** Fees by quota, and whether the figure is per year or for the whole course.
6. **Contact and location.** Address, district, website, how to get there.
7. **Shortlist and compare** two to four colleges side by side.

## What each competitor does

| | Collegedunia | Shiksha | Careers360 | CollegeDekho |
|---|---|---|---|---|
| Listing filters | Stream, sub stream, state, city, degree, specialisation, programme type, ownership, exam, fee band, approval, affiliation, duration, gender. Counts on every option. Removable chips. | Listing body not present in server HTML in our fetch (rendered by script), so filters were not visible to a crawler or before scripts load. | Sort, state, city, ownership, exam, degree, fee band, branch, top institution groups, study mode, gender. Counts on options. Apply button and clear link. | Degree, state, city, study mode, specialisation, institute type, exam, hostel, nearby, fee range, facilities. Reset link. |
| Sort | Popularity, rating, fees high and low, own rank | Not visible | Own rank (listed twice), A to Z, popularity, NIRF, fees | Not visible |
| Card | Name, place, approvals, own score out of 1000, one course with total fee, average and highest package, star rating and review count, award labels, Apply, Brochure, Compare | Not visible | Logo, ownership, place, star rating, review count, NIRF rank, own letter grade, one course with fee, an 11 link row, Brochure, Enquire, Compare, "5000+ brochures downloaded" | Logo, star rating, review count, approvals, fee range, NIRF, exams, a long list of generic "specialities", "shortlisted by N students", Shortlist, Brochure or counselling |
| Pagination | Previous and next | Not visible | Not visible in HTML (about 10 of 9,322 shown) | Not visible in HTML (6,713 results reported) |
| College page tabs | 18 tabs (Info, Courses and Fees, Admission, Reviews, Cutoff with sub menu, Placement, Ranking, Gallery, Scholarship, Faculty, News, Hostel, Community, Compare, Q and A...) | College body not present in server HTML | 12 tabs plus a 16 item table of contents | 12 tab sticky bar plus a 19 item table of contents |
| Attribution | "Updated on" date and a content team byline; no source per figure | Copyright tag only | Some sections say "Data Source: NIRF 2026" | "Updated on" date; most figures unsourced |

## What they do badly (and what we will not copy)

- **Figures that contradict each other on one page.** Collegedunia shows one B.Tech fee in the article and a different range on the course card; cutoffs in the prose differ from the cutoff table. Careers360 shows 162 courses in highlights and 150 in the course list, and mixes NIRF 2025 and 2026 labels. CollegeDekho gives three different placement counts, two NAAC grades and two campus sizes for the same university, and a Gujarat address on a Kolkata university page.
- **Stale years in fresh headings.** "Admission 2027" in the title with 2025 dates in the table (all four).
- **Ratings that look precise but are not.** 4.5 stars from 2 reviews is shown with the same weight as 4.3 from 420. Paid review incentives ("earn up to Rs 10 per review"). The same reviewer posting twice on one date.
- **Own scores that read like official ranks.** "CD Score 912/1000", "AAAAA" letter grades, "#157th/500 in India" next to the real NIRF rank.
- **Lead capture everywhere.** Apply, Brochure, Enquire and Get Contact Details on every card; the phone number gated behind a form; a login modal on first visit; sponsored "applications open" carousels that are not labelled as ads; promoted colleges inside the results.
- **Clutter.** 11 link rows on each card, boilerplate "USP" bullets repeated across cards, the same featured college three times in one list, two copies of the top 10 table, Q and A answers that promote another university.
- **Broken bits that kill trust.** "undefined", template placeholders in alt text, "null / year" in fee tables, "No Data Found" labels, an empty "What's Nearby" section.
- **Slow first paint.** Shiksha did not send its listing or college body in the server HTML at all; Careers360 and CollegeDekho rendered only the first handful of cards.

## What Study2India does instead

- **Only official data, each figure with its source and year.** Approvals and seats from AICTE, NMC, INC, NCISM and NCH lists; ranks from NIRF. Each block carries "Source: <publisher>, <year or list date>, checked <date>". Missing values say "Not recorded". We never show ratings, reviews, placement figures, photos or our own score.
- **Fees only when an official fee notice is loaded.** A whole course fee is never converted to a yearly figure. Until fee data exists we do not offer a fee filter or fee sort, because they would return nothing or mislead.
- **Filters that matter, in plain words.** Name or city, field, course, course level, state, then district within that state, ownership, approving body, NIRF ranked only. Sidebar on desktop, a bottom sheet on phones. Each applied filter is a removable chip, with "Clear all".
- **Sort by what is real.** Recommended, best NIRF rank, most seats, name.
- **Server rendered, shareable URLs.** Every filter, sort and page lives in the query string. Numbered pagination keeps result pages linkable and crawlable.
- **A scannable card.** Name, district and state, ownership, approval badges with the list year, NIRF rank when present, top courses with seats and the total intake, one primary action. No ads inside the results; one clearly labelled counselling prompt.
- **A college page that answers the seven questions in order.** Summary header with key facts, a sticky section nav (Overview, Courses and seats, Rankings, Admission and exams, Location and contact, Sources), a courses table with seats and branches, exams linked to the college's fields with a plain note on how admission works, and a Sources section listing every official document behind the page.
- **Shortlist and compare without an account.** Shortlist is kept in the viewer's browser; compare is a shareable URL of up to four colleges, built from the same official data.
- **No popups, no gated phone numbers.** The counselling form sits in the sidebar and is optional.

## Gaps we still have (honest list)

- No fees, cutoffs, phone, email or website loaded yet for most institutions (data work, not page work).
- District names come as the regulator spells them, so a few districts appear twice (for example Ernakulam and Eranakulam). Needs a clean-up in the data pipeline.
- No photos or logos; we show initials rather than an unofficial image.
