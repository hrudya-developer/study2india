# Home, navigation and search: competitor benchmark

Checked 23 October 2026 against the live home pages of Collegedunia, Shiksha, Careers360 and CollegeDekho (fetched page content and navigation markup; their sites block direct downloads from our build machine, so page weight was not measured byte for byte). The goal is to match their usefulness and beat them on clarity, speed, trust and phone use, not to copy their clutter.

## What students reach first

| Site | First thing on the page | Search box | Top navigation |
| --- | --- | --- | --- |
| Collegedunia | Goal and city pickers, search, a rotating sponsored banner | "Search for Colleges, Exams, Courses and More" | "Explore" menu of about 18 mixed links (study abroad, loans, coupons) |
| Shiksha | Search, then stream tabs | Colleges, courses, exams, Q&A and articles | Stream tabs (MBA, Engineering, Medical, Design, More) with very large mega menus |
| Careers360 | Search and a login link | "Search Colleges, Exams, Schools & more" | Nine stream menus, each with exams, prep material, colleges, predictors, careers |
| CollegeDekho | Marketing hero ("Right Guidance, Bright Future"), online degree promotion | No search input in the fetched page text; a "Find Your College" button instead | Not in the page text; category lists further down |

## What they do well

- **One box for everything.** Collegedunia, Shiksha and Careers360 put a single search for colleges, courses and exams at the top. Students expect it.
- **Entry by stream.** All four let a student start from a field (Engineering, Medical, Management) and show college counts per field.
- **Entry by state and city.** Location lists ("Colleges in Karnataka", "Top study places") are prominent, and they are also strong search landing pages.
- **Course plus place links.** Footers and home sections link "MBBS colleges in Karnataka" style pages, which match how students search on Google.
- **Rankings up front.** Collegedunia and Shiksha surface NIRF and other rankings on the home page.
- **Tools.** Predictors, compare and exam calendars are one click from the home page.

## What they do badly

- **Clutter.** Collegedunia's home page carries roughly 400 links in about 20 sections, including CBSE notes, coupons and study abroad, before a student finds their own course. Shiksha and Careers360 mega menus repeat the same links in several columns.
- **Adverts mixed into navigation.** Sponsored college banners sit above the content (Collegedunia rotates three, and repeats them); promoted "Featured colleges" appear inside menus (Shiksha); partner colleges repeat across every category (CollegeDekho).
- **Data you cannot trust.** Mixed rating scales on the same page (4.3/5 next to 9.5/10 and 0/10), a 2019 ranking shown as current, a headline missing its number ("Find Over in India"), "Admissions 2023" in a 2026 meta description, deadlines that look wrong. None of the four names the official source next to a figure.
- **Dark patterns around leads.** Students publicly complain that searching or registering on Careers360 led to calls and emails from colleges they never chose, and that a "free" predictor turned out to be paid after sign-up. Lead forms and "Apply now" buttons follow students around these sites.
- **Login walls.** Predictors, comparisons and brochures are commonly gated behind registration.
- **Heavy pages on phones.** Carousels, video, review widgets and third-party ad and tracking scripts make the pages slow on mid-range Android phones and mobile data.
- **Search suggestions that guess.** Abbreviations (IIT, AIIMS, GMC) and "course plus place" queries ("MBBS Kerala") are handled inconsistently, and results mix articles and news with colleges.

## What we do instead

1. **One search box with grouped suggestions.** Colleges, courses, exams and states in one list, with keyboard support (arrow keys, Enter, Escape, "/" to focus from anywhere), a "Best match" answer for course plus state queries with a real count, and common short forms (IIT, NIT, AIIMS, GMC, JIPMER) understood. Without JavaScript the box still submits to /search.
2. **Clear entry points.** Fields with college counts, popular states with counts, all 36 states and union territories, and course plus state links counted from recorded offerings.
3. **Trust signals we can prove.** A "Built from official lists" band shows how many institutions we hold from each regulator (AICTE, NMC, INC, NCISM, NCH) and from NIRF, with a link to each official list and the date it was last checked. Numbers are counted from the database on each request, never typed in.
4. **No adverts, no login walls.** Partner colleges carry a label; NIRF ranks are shown exactly as published. Unknown values say "Not recorded".
5. **Phone first.** A slim sticky header with a search button that opens a full-screen search, and a slide-in menu built on the native dialog element (focus stays inside, Escape closes it). Long card rows scroll sideways on phones instead of stacking into a very long page.
6. **Fast by default.** Server-rendered pages; the only client code is the search box, the menus and the existing form widgets. The phone menu's links render only when it is opened, so they do not add to every page's HTML.
7. **Footer built for search engines and people.** Colleges by field, by state, popular courses, all exams, course plus state searches, our data sources and office numbers.

## Still to do (outside this pass)

- College predictor and compare tools (shown as "Coming soon" on the home page).
- Exam dates on the home page once conducting bodies announce them.
- Fees and cutoffs: the database holds none yet, so the home page makes no claim about them.
