// Converts the Pharmacy Council of India approved-institution lists into the council file read by
// lib/bootstrap.ts (data/councils/pci.json).
//
// Usage: node scripts/councils/pci-convert.mjs <pci-dump.json>
//
// The dump is the JSON that pci.gov.in's own list pages load (each page under
// https://pci.gov.in/en/approved-institute/ fetches its full table as JSON from its own URL with
// an XHR GET). It was taken in a browser on pci.gov.in with:
//
//   const base = "https://pci.gov.in/en/approved-institute/";
//   const pages = { dip12: "approved-diploma-institutions-u-s-12/", dipc: "diploma-institutions-only-for-conduct/",
//     deg12: "approved-degree-institutions-us-12/", degc: "degree-institutions-only-for-conduct/",
//     pharmd: "approved-institutions-for-pharm-d/", pharmdpb: "approved-institutions-for-pharmd-post-baccalaureate/",
//     mpharm: "approved-institutions-for-m-pharm-courses/", bridge: "approved-institutions-for-bridge-course/" };
//   lists[k] = await jQuery.ajax({ url: base + pages[k], type: "GET", dataType: "json" });
//
// and saved as { retrieved, pages, lists }. Each row has state_name, institution_name,
// naming_series (the PCI code, "PCI-35"), pci_decision (free text), examiningauthority_name,
// permanent_approved_institutions_by_pci and, for Pharm.D, hospital_name.
//
// PCI gives no separate address or management type (its name column often carries the address,
// which is split off below), and gives intake only inside the decision text.
// Seats are taken from the decision text only where it states an intake for an approval that covers
// the target academic year; everything else stays null.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const TARGET_YEAR = 2026; // academic year 2026-27
const ACADEMIC_YEAR = "2026-27";
const RETRIEVED = "2026-10-23";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "..", "..");

// State names as written in data/reference.ts, read from the file so they cannot drift.
const refText = readFileSync(path.join(root, "data", "reference.ts"), "utf8");
const STATES = [...refText.matchAll(/\{ code: "([A-Z]{2})", name: "([^"]+)"/g)].map((m) => ({ code: m[1], name: m[2] }));
const ALIASES = Object.fromEntries([...refText.matchAll(/^\s+"([^"]+)": "([A-Z]{2})",$/gm)].map((m) => [m[1], m[2]]));
function stateName(raw) {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const direct = STATES.find((s) => s.name.toLowerCase() === key);
  if (direct) return direct.name;
  const code = ALIASES[key];
  const viaAlias = code && STATES.find((s) => s.code === code);
  if (viaAlias) return viaAlias.name;
  throw new Error(`Unknown state: ${raw}`);
}

export function clean(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&[a-z]+;/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const SMALL = new Set(["of", "and", "for", "in", "the", "at", "by", "on", "to"]);
/** PCI prints some names in capitals; those are title-cased, mixed-case names are kept as printed. */
function tidyName(raw) {
  const s = clean(raw).replace(/\s+,/g, ",");
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|[(.\-/&'])([a-z])/g, (_, p, c) => p + c.toUpperCase())))
    .join(" ");
}

// ---------------------------------------------------------------------------------------------
// Examining authority -> university or board.
//
// PCI's examining-authority column is free text ("The Registrar ... University <street address>",
// phone numbers, e-mails, several bodies in one cell). Each value is matched against this table in
// order and the first hit gives the official name; a cell naming both a university (degree
// courses) and a board (D.Pharm) therefore resolves to the university, as the university entries
// come first. Anything the table does not cover goes through cleanUniversityTail(), which keeps a
// value only when it reduces to a plain "<Name> University" style name; otherwise the field is null.
const UNIVERSITY_TABLE = [
  // Placeholders and values that name no body at all.
  [/^(n\.?\s*a\.?|nil+|no|-+|as per pci (and|&) ugc norms|controller of exam\w*|the controller of exam\w*)$/i, null],
  [/Sri Venkateswaraa uniersity/i, null],
  // Autonomous colleges that examine their own students: not a university.
  [/College of Pharmacy,? \(Autonomous\)|Sanjivani College of Pharmaceutical|Raghavendra Institute of Pharmaceutical|Seven Hills College of Pharmacy/i, null],
  // Uttar Pradesh
  [/A\.?\s*P\.?\s*J\.?\s*Abdul\s*Kalam\s*Tec|APJAKTU|\bAKTU\b|Uttar Pradesh Technical University/i, "Dr. A.P.J. Abdul Kalam Technical University, Lucknow"],
  [/A\s*P\s*J\s*Abdul\s*Kalam\s*University\s*Indore/i, "Dr. A.P.J. Abdul Kalam University, Indore"],
  [/Chaudhary Charan Singh University/i, "Chaudhary Charan Singh University, Meerut"],
  [/Chhatrapati Shahu Ji Maharaj University/i, "Chhatrapati Shahu Ji Maharaj University, Kanpur"],
  [/Maharishi University of Information Technology/i, "Maharishi University of Information Technology, Lucknow"],
  [/SKS International University/i, "SKS International University, Mathura"],
  [/Saroj Int\w*national University/i, "Saroj International University, Lucknow"],
  [/Rohilkhand University/i, "Mahatma Jyotiba Phule Rohilkhand University, Bareilly"],
  [/Bundelkhand University/i, "Bundelkhand University, Jhansi"],
  [/Babasaheb Bhimrao Ambedkar University/i, "Babasaheb Bhimrao Ambedkar University, Lucknow"],
  [/Bhim ?Rao Ambedkar University,? Agra/i, "Dr. Bhimrao Ambedkar University, Agra"],
  [/Shakuntala Misra/i, "Dr. Shakuntala Misra National Rehabilitation University, Lucknow"],
  [/Khwaja Moinuddin Chishti/i, "Khwaja Moinuddin Chishti Language University, Lucknow"],
  [/Rammanohar Lohia Avadh University/i, "Dr. Rammanohar Lohia Avadh University, Ayodhya"],
  [/Deen Dayal Upadha[a-z]* Gorakhpur/i, "Deen Dayal Upadhyaya Gorakhpur University, Gorakhpur"],
  [/Veer Bahadur Singh Purvanchal/i, "Veer Bahadur Singh Purvanchal University, Jaunpur"],
  [/Madan Mohan Malaviya University/i, "Madan Mohan Malaviya University of Technology, Gorakhpur"],
  [/Uttar Pradesh University of Medical Sciences/i, "Uttar Pradesh University of Medical Sciences, Saifai"],
  [/HBTU/i, "Harcourt Butler Technical University, Kanpur"],
  [/IIT\s*\(?BHU\)?/i, "Indian Institute of Technology (BHU), Varanasi"],
  [/^UNIVERSITY OF LUCKNOW$/i, "University of Lucknow"],
  [/Sharda University,? Agra/i, "Sharda University, Agra"],
  [/Sharda University/i, "Sharda University, Greater Noida"],
  [/Chandigarh University,? Unnao/i, "Chandigarh University, Unnao"],
  [/Amity University Uttar Pradesh|Amity University Noida/i, "Amity University Uttar Pradesh, Noida"],
  [/Integral University/i, "Integral University, Lucknow"],
  [/IFTM University/i, "IFTM University, Moradabad"],
  [/Glocal University/i, "Glocal University, Saharanpur"],
  [/Shri Venkateshwara University/i, "Shri Venkateshwara University, Gajraula"],
  [/SVSU|Swami Vivekanand Subharti/i, "Swami Vivekanand Subharti University, Meerut"],
  [/Galgo+tias University/i, "Galgotias University, Greater Noida"],
  [/Teerth?anker Mahaveer University/i, "Teerthanker Mahaveer University, Moradabad"],
  [/Monad University/i, "Monad University, Hapur"],
  [/Rama University/i, "Rama University, Kanpur"],
  [/IIMT University/i, "IIMT University, Meerut"],
  [/Mangalayatan University Jabalpur/i, "Mangalayatan University, Jabalpur"],
  [/Mangalayatan University/i, "Mangalayatan University, Aligarh"],
  [/Shobhit University/i, "Shobhit University, Gangoh"],
  [/Invertis University/i, "Invertis University, Bareilly"],
  [/Bareilly International University/i, "Bareilly International University, Bareilly"],
  [/Future University/i, "Future University, Bareilly"],
  [/Era University/i, "Era University, Lucknow"],
  [/Babu Banarsi Das University/i, "Babu Banarasi Das University, Lucknow"],
  [/Shri Ramswaroop Memorial University/i, "Shri Ramswaroop Memorial University, Lucknow"],
  [/GLA University/i, "GLA University, Mathura"],
  [/Sanskriti University/i, "Sanskriti University, Mathura"],
  [/J\s*S University/i, "J.S. University, Shikohabad"],
  [/FS University/i, "F.S. University, Shikohabad"],
  [/Major S\.?\s*D\.? Singh University/i, "Major S.D. Singh University, Farrukhabad"],
  [/K\.?\s*M\.? \(Krishna Mohan\) University/i, "K.M. University, Mathura"],
  [/Mohammad Ali Jauhar University/i, "Mohammad Ali Jauhar University, Rampur"],
  [/Sam Higginbottom|SHUATS/i, "Sam Higginbottom University of Agriculture, Technology and Sciences, Prayagraj"],
  [/Rajju Bhaiya/i, "Prof. Rajendra Singh (Rajju Bhaiya) University, Prayagraj"],
  [/HRIT University/i, "HRIT University, Ghaziabad"],
  [/Noida International University/i, "Noida International University, Greater Noida"],
  [/Dr\.? K\.? N\.? Modi University,? Modinagar/i, "Dr. K.N. Modi University, Modinagar"],
  [/Dr K N Modi University INS/i, "Dr. K.N. Modi University, Newai"],
  [/Board of Technical Education,? (Uttar Pradesh|Lucknow)|BTE LUCKNOW|Uttar Pradesh Board of Technical/i, "Board of Technical Education, Uttar Pradesh"],
  // Maharashtra
  [/Babasaheb\s*Ambe?dkar\s*Techn|DBATU|Lon[ae]re/i, "Dr. Babasaheb Ambedkar Technological University, Lonere"],
  [/Baba\s*Saheb\s*Ambedkar\s*Marathwada|Babasaheb\s*Ambedkar\s*Marathwada/i, "Dr. Babasaheb Ambedkar Marathwada University, Chhatrapati Sambhajinagar"],
  [/Sav[a-z]*\s*Phule|University of Pune/i, "Savitribai Phule Pune University, Pune"],
  [/Ramanand Teerth|SRTMUN/i, "Swami Ramanand Teerth Marathwada University, Nanded"],
  [/Tukadoji/i, "Rashtrasant Tukadoji Maharaj Nagpur University, Nagpur"],
  [/Gadge/i, "Sant Gadge Baba Amravati University, Amravati"],
  [/North Maharashtra/i, "Kavayitri Bahinabai Chaudhari North Maharashtra University, Jalgaon"],
  [/Shivaji University/i, "Shivaji University, Kolhapur"],
  [/Solapur University/i, "Punyashlok Ahilyadevi Holkar Solapur University, Solapur"],
  [/Godwana|Gondwana/i, "Gondwana University, Gadchiroli"],
  [/University of Mumbai|Mumbai University/i, "University of Mumbai"],
  [/SNDT/i, "SNDT Women's University, Mumbai"],
  [/NMIMS/i, "SVKM's Narsee Monjee Institute of Management Studies, Mumbai"],
  [/Institute of Chemical Technology/i, "Institute of Chemical Technology, Mumbai"],
  [/Bharati Vidyapeeth/i, "Bharati Vidyapeeth, Pune"],
  [/D\.? ?Y\.? ?Patil Deemed to be University,? Nerul/i, "D.Y. Patil University, Navi Mumbai"],
  [/D\.? ?Y\.? ?Patil Education Society/i, "D.Y. Patil Education Society, Kolhapur"],
  [/D\.? ?Y\.? ?Patil Dnyan Prasad/i, "Dr. D.Y. Patil Dnyan Prasad University, Pune"],
  [/D Y Patil University\s*,?\s*School of Pharmacy\s*,?\s*Ambi/i, "D.Y. Patil University, Ambi, Pune"],
  [/Datta Meghe/i, "Datta Meghe Institute of Higher Education and Research, Wardha"],
  [/Krishna Institute of Medical Sciences/i, "Krishna Vishwa Vidyapeeth, Karad"],
  [/Pravara Institute of Medical Sciences/i, "Pravara Institute of Medical Sciences, Loni"],
  [/MGM Institute of health sciences/i, "MGM Institute of Health Sciences, Navi Mumbai"],
  [/MGM University/i, "MGM University, Chhatrapati Sambhajinagar"],
  [/MIT World Peace University/i, "Dr. Vishwanath Karad MIT World Peace University, Pune"],
  [/Amity University Maharashtra/i, "Amity University Maharashtra, Mumbai"],
  [/Chhatrapati Shivaji Mahara[jh] University/i, "Chhatrapati Shivaji Maharaj University, Panvel"],
  [/Sanjay Ghodawat University/i, "Sanjay Ghodawat University, Kolhapur"],
  [/Sandip University.*Nashik/i, "Sandip University, Nashik"],
  [/Sandip University,? Madhubani/i, "Sandip University, Madhubani"],
  [/G\.? ?H\.? Raisoni University.*Amravati/i, "G H Raisoni University, Amravati"],
  [/G\.? ?H\.? Raisoni University.*Chhindwara/i, "G H Raisoni University, Saikheda"],
  [/Maharashtra State Board|MSBTE/i, "Maharashtra State Board of Technical Education, Mumbai"],
  // Bihar and Jharkhand
  [/Bihar\s*(University\s*of\s*)?Health|Bihar Universityof Health|Bihar Health Science University/i, "Bihar University of Health Sciences, Patna"],
  [/Aryabhatt?a Knowledge University/i, "Aryabhatta Knowledge University, Patna"],
  [/Central University of South Bihar|CUSB/i, "Central University of South Bihar, Gaya"],
  [/K\.?\s*K\.? University/i, "K.K. University, Bihar Sharif"],
  [/Magadh University/i, "Magadh University, Bodh Gaya"],
  [/Jharkhand (Technical )?University( of Technology)?|Jharkhand Technical University/i, "Jharkhand University of Technology, Ranchi"],
  [/Diploma-in-Pharmacy Examination Committee/i, "Diploma in Pharmacy Examination Committee, Jharkhand"],
  [/Vinoba Bhave University/i, "Vinoba Bhave University, Hazaribag"],
  [/Nilamber Pitamber/i, "Nilamber-Pitamber University, Medininagar"],
  [/Binod Bihari Mahto/i, "Binod Bihari Mahto Koyalanchal University, Dhanbad"],
  [/Sido Kanhu Murmu/i, "Sido Kanhu Murmu University, Dumka"],
  [/Kolhan University/i, "Kolhan University, Chaibasa"],
  [/Birla Institute of Technology.*Mesra/i, "Birla Institute of Technology, Mesra"],
  [/Sarala Birla University/i, "Sarala Birla University, Ranchi"],
  [/Usha Martin University/i, "Usha Martin University, Ranchi"],
  [/YBN University/i, "YBN University, Ranchi"],
  [/RKDF University,? Ranchi/i, "RKDF University, Ranchi"],
  [/Jharkhand Rai University/i, "Jharkhand Rai University, Ranchi"],
  // Chhattisgarh and Madhya Pradesh
  [/Chhattisgarh\s*Swami\s*Vivekan/i, "Chhattisgarh Swami Vivekanand Technical University, Bhilai"],
  [/Rajeev|Rajiv\s*Gandhi\s*Pro[a-z]*|RGPV|Rajiv Gandhi Technical University/i, "Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal"],
  [/Guru Ghasidas/i, "Guru Ghasidas Vishwavidyalaya, Bilaspur"],
  [/Pt\.? Ravishankar Shukla/i, "Pt. Ravishankar Shukla University, Raipur"],
  [/Amity University.*Raipur/i, "Amity University Chhattisgarh, Raipur"],
  [/Dr\.? C\.?\s*V\.? Raman (University,? Institute of Pharmacy|Institute of Pharmacy),?.*Khandwa/i, "Dr. C.V. Raman University, Khandwa"],
  [/Dr\.? C\.?\s*V\.? Raman Institute of Pharmacy,? Kargi Road/i, "Dr. C.V. Raman University, Bilaspur"],
  [/Shri Shankaracharya Professional University/i, "Shri Shankaracharya Professional University, Bhilai"],
  [/IES University/i, "IES University, Bhopal"],
  [/Sri Satya Sai University of Technology/i, "Sri Satya Sai University of Technology and Medical Sciences, Sehore"],
  [/JNCT Professional University/i, "JNCT Professional University, Bhopal"],
  [/Swami Vivekanand University/i, "Swami Vivekanand University, Sagar"],
  [/MATS University/i, "MATS University, Raipur"],
  [/Barkatullah/i, "Barkatullah University, Bhopal"],
  [/Devi Ahilya/i, "Devi Ahilya Vishwavidyalaya, Indore"],
  [/Jiwaji/i, "Jiwaji University, Gwalior"],
  [/Vikram University/i, "Vikram University, Ujjain"],
  [/Rani Durgavati/i, "Rani Durgavati Vishwavidyalaya, Jabalpur"],
  [/Harisingh Gour/i, "Dr. Harisingh Gour Vishwavidyalaya, Sagar"],
  [/Awadhesh Pratap Singh/i, "Awadhesh Pratap Singh University, Rewa"],
  [/Indira Gandhi National Tribal/i, "Indira Gandhi National Tribal University, Amarkantak"],
  [/Amity University Gwalior/i, "Amity University Madhya Pradesh, Gwalior"],
  [/RKDF University/i, "RKDF University, Bhopal"],
  [/Sarvepalli Radhakrish/i, "Sarvepalli Radhakrishnan University, Bhopal"],
  [/Shri Vaishnav Vidyapeeth/i, "Shri Vaishnav Vidyapeeth Vishwavidyalaya, Indore"],
  // Gujarat
  [/Gujarat\s*Techn|GUJ\. TECHNOLOGICAL/i, "Gujarat Technological University, Ahmedabad"],
  [/Maharaja Sayajirao/i, "The Maharaja Sayajirao University of Baroda, Vadodara"],
  [/Sardar Patel University Balaghat/i, "Sardar Patel University, Balaghat"],
  [/Sardar Patel University of Pharmaceutical/i, "Sardar Patel University, Vallabh Vidyanagar"],
  [/Saurashtra University/i, "Saurashtra University, Rajkot"],
  [/Nirma University/i, "Nirma University, Ahmedabad"],
  [/Parul University.*Goa/i, "Parul University, Goa"],
  [/Parul University/i, "Parul University, Vadodara"],
  [/Ganpat University/i, "Ganpat University, Mehsana"],
  [/Charotar University|CHARUSAT/i, "Charotar University of Science and Technology, Changa"],
  [/Uka ?Tarsadia/i, "Uka Tarsadia University, Bardoli"],
  [/Sumandeep/i, "Sumandeep Vidyapeeth, Vadodara"],
  [/Kadi Sarva/i, "Kadi Sarva Vishwavidyalaya, Gandhinagar"],
  [/Dharmsinh Desai/i, "Dharmsinh Desai University, Nadiad"],
  [/C\s*U\s*Shah\s*University/i, "C.U. Shah University, Wadhwan"],
  [/Rai University/i, "Rai University, Ahmedabad"],
  [/National Forensic Sciences University/i, "National Forensic Sciences University, Gandhinagar"],
  [/ITM \(?SLS\)? Baroda University/i, "ITM (SLS) Baroda University, Vadodara"],
  [/Charutar Vidya Mandal/i, "The Charutar Vidya Mandal (CVM) University, Vallabh Vidyanagar"],
  [/Shri Govind Guru University/i, "Shri Govind Guru University, Godhra"],
  // Punjab, Haryana, Himachal Pradesh, Delhi, Jammu and Kashmir
  [/Central University of Haryana/i, "Central University of Haryana, Mahendragarh"],
  [/Desh Bhagat University/i, "Desh Bhagat University, Mandi Gobindgarh"],
  [/Rayat Bahra University/i, "Rayat Bahra University, Mohali"],
  [/PDM ?University/i, "PDM University, Bahadurgarh"],
  [/Baddi University/i, "Baddi University of Emerging Sciences and Technology, Baddi"],
  [/Gurugram University/i, "Gurugram University, Gurugram"],
  [/Ranjit\s*Singh|MRSPTU/i, "Maharaja Ranjit Singh Punjab Technical University, Bathinda"],
  [/Gujral|IKG|Punjab Technical University REC/i, "I.K. Gujral Punjab Technical University, Jalandhar"],
  [/Punjabi University/i, "Punjabi University, Patiala"],
  [/Guru Nanak Dev University/i, "Guru Nanak Dev University, Amritsar"],
  [/Panjab University/i, "Panjab University, Chandigarh"],
  [/Baba Farid/i, "Baba Farid University of Health Sciences, Faridkot"],
  [/Central University of Punjab/i, "Central University of Punjab, Bathinda"],
  [/Chitkara University,? Himachal/i, "Chitkara University, Himachal Pradesh"],
  [/Chitkara University/i, "Chitkara University, Rajpura"],
  [/Chandigarh University/i, "Chandigarh University, Mohali"],
  [/Lovely Professional/i, "Lovely Professional University, Phagwara"],
  [/Amity University MOhali/i, "Amity University Punjab, Mohali"],
  [/B\.?\s*D\.?\s*S(harma)?\s*Univ|Bhagwat\s*Dayal/i, "Pt. B.D. Sharma University of Health Sciences, Rohtak"],
  [/M\.? ?D\.? University Rohtak|Maharshi Dayanand University/i, "Maharshi Dayanand University, Rohtak"],
  [/NIILM University/i, "NIILM University, Kaithal"],
  [/Kurukshetra University/i, "Kurukshetra University, Kurukshetra"],
  [/Guru Jambheshwar/i, "Guru Jambheshwar University of Science and Technology, Hisar"],
  [/Chaudhary Devi Lal/i, "Chaudhary Devi Lal University, Sirsa"],
  [/Ch\.? Bansi Lal/i, "Chaudhary Bansi Lal University, Bhiwani"],
  [/Indra Gandhi University/i, "Indira Gandhi University, Meerpur"],
  [/BPS Mahila/i, "Bhagat Phool Singh Mahila Vishwavidyalaya, Sonipat"],
  [/Maharishi Markandeshwar University Mullana/i, "Maharishi Markandeshwar University, Mullana"],
  [/Amity University Haryana/i, "Amity University Haryana, Gurugram"],
  [/G\.? ?D\.? Goenka/i, "G D Goenka University, Gurugram"],
  [/Shree Guru Gobind Singh Tricentenary/i, "SGT University, Gurugram"],
  [/Haryana State Board/i, "Haryana State Board of Technical Education, Panchkula"],
  [/Himachal\s*Pradesh\s*Technical/i, "Himachal Pradesh Technical University, Hamirpur"],
  [/Shoolini/i, "Shoolini University, Solan"],
  [/ICFAI University,? Himachal/i, "The ICFAI University, Himachal Pradesh"],
  [/ICFAI University Dehradun/i, "The ICFAI University, Dehradun"],
  [/ICFAI University\s*,?\s*Jaipur/i, "The ICFAI University, Jaipur"],
  [/Delhi Pharmaceutical Science/i, "Delhi Pharmaceutical Sciences and Research University, New Delhi"],
  [/Guru Gobind Singh Inder?aprastha/i, "Guru Gobind Singh Indraprastha University, New Delhi"],
  [/Jamia Hamdard/i, "Jamia Hamdard, New Delhi"],
  [/Netaji Subhas University/i, "Netaji Subhas University, Jamshedpur"],
  [/Jammu University|University of Jammu/i, "University of Jammu"],
  [/University of Kashmir/i, "University of Kashmir, Srinagar"],
  // Rajasthan
  [/Geetanjali University/i, "Geetanjali University, Udaipur"],
  [/Mody University/i, "Mody University of Science and Technology, Lakshmangarh"],
  [/Madhav University/i, "Madhav University, Sirohi"],
  [/Rajasthan\s*University\s*of\s*Health|\bRUHS\b/i, "Rajasthan University of Health Sciences, Jaipur"],
  [/Banasthali/i, "Banasthali Vidyapith, Tonk"],
  [/Birla Institute of Technology (and|&) Science/i, "Birla Institute of Technology and Science, Pilani"],
  [/Mohanlal Sukhadia/i, "Mohanlal Sukhadia University, Udaipur"],
  [/Central University of Rajasthan/i, "Central University of Rajasthan, Kishangarh"],
  [/Jai Nara[iy]a?n Vyas/i, "Jai Narain Vyas University, Jodhpur"],
  [/Maharshi Dayanand Saraswati/i, "Maharshi Dayanand Saraswati University, Ajmer"],
  [/University Of Kota/i, "University of Kota"],
  [/Mewar University/i, "Mewar University, Chittorgarh"],
  [/NIMS University/i, "NIMS University, Jaipur"],
  [/Suresh Gyan Vihar/i, "Suresh Gyan Vihar University, Jaipur"],
  [/Jagan Nath University Jaipur/i, "Jagannath University, Jaipur"],
  [/Jagan Nath University Jhajjar/i, "Jagannath University, Jhajjar"],
  [/Amity University Rajasthan/i, "Amity University Rajasthan, Jaipur"],
  [/Manipal University,? Jaipur/i, "Manipal University Jaipur"],
  [/Singhania/i, "Singhania University, Pacheri Bari"],
  [/Tibrewala/i, "Shri Jagdishprasad Jhabarmal Tibrewala University, Jhunjhunu"],
  [/Jayoti Vidyapeeth/i, "Jayoti Vidyapeeth Women's University, Jaipur"],
  [/Janardan Rai Nagar/i, "Janardan Rai Nagar Rajasthan Vidyapeeth, Udaipur"],
  [/Maharaj Vinayak Global/i, "Maharaj Vinayak Global University, Jaipur"],
  [/Vivekananda Global University/i, "Vivekananda Global University, Jaipur"],
  [/Pacific Academy of Higher Education/i, "Pacific Academy of Higher Education and Research University, Udaipur"],
  [/Sunrise University/i, "Sunrise University, Alwar"],
  [/University of Technology Fathepura/i, "University of Technology, Jaipur"],
  // South India
  [/Rajiv\s*G\w*\s*Univ|RGUHS/i, "Rajiv Gandhi University of Health Sciences, Bengaluru"],
  [/Board of Examining Authority/i, "Board of Examining Authority, Karnataka"],
  [/Adichunchanagiri University/i, "Adichunchanagiri University, B.G. Nagara"],
  [/JSS Academy of Higher Education/i, "JSS Academy of Higher Education and Research, Mysuru"],
  [/KLE ?(Academy of Higher Education|University)/i, "KLE Academy of Higher Education and Research, Belagavi"],
  [/Nitte/i, "Nitte (Deemed to be University), Mangaluru"],
  [/Yenepoya/i, "Yenepoya University, Mangaluru"],
  [/BLDE/i, "BLDE (Deemed to be University), Vijayapura"],
  [/M\s*S\s*Ramaiah University/i, "M.S. Ramaiah University of Applied Sciences, Bengaluru"],
  [/Dayananda Sagar University/i, "Dayananda Sagar University, Bengaluru"],
  [/Shri Dharmasthala Manjunatheshwara University/i, "Shri Dharmasthala Manjunatheshwara University, Dharwad"],
  [/Sharnbasva/i, "Sharnbasva University, Kalaburagi"],
  [/Manipal University Deemed|Manipal Academy/i, "Manipal Academy of Higher Education, Manipal"],
  [/Amity University, Bengaluru/i, "Amity University, Bengaluru"],
  [/PES University/i, "PES University, Bengaluru"],
  [/Kerala\s*Univer\w*\s*of\s*Health/i, "Kerala University of Health Sciences, Thrissur"],
  [/M\.?\s*G\.?\s*R\.?\s*Medical|T\.?\s*N\.? DR\.? MGR/i, "The Tamil Nadu Dr. M.G.R. Medical University, Chennai"],
  [/M\s*G\s*R\s*Educational/i, "Dr. M.G.R. Educational and Research Institute, Chennai"],
  [/Annamalai University/i, "Annamalai University, Annamalainagar"],
  [/S\s*R\s*M (Instt|University)/i, "SRM Institute of Science and Technology, Kattankulathur"],
  [/Sri Ramachandra/i, "Sri Ramachandra Institute of Higher Education and Research, Chennai"],
  [/Vels Institute/i, "Vels Institute of Science, Technology and Advanced Studies, Chennai"],
  [/Bharath Institute of Higher Education/i, "Bharath Institute of Higher Education and Research, Chennai"],
  [/Chettinad Academy/i, "Chettinad Academy of Research and Education, Kelambakkam"],
  [/Karpagam Academy/i, "Karpagam Academy of Higher Education, Coimbatore"],
  [/Saveetha/i, "Saveetha Institute of Medical and Technical Sciences, Chennai"],
  [/Sathyabama/i, "Sathyabama Institute of Science and Technology, Chennai"],
  [/Hindustan Institute of Technology/i, "Hindustan Institute of Technology and Science, Chennai"],
  [/Abdur Rahman/i, "B.S. Abdur Rahman Crescent Institute of Science and Technology, Chennai"],
  [/Meenakshi Academy/i, "Meenakshi Academy of Higher Education and Research, Chennai"],
  [/Vinayaka Mission/i, "Vinayaka Mission's Research Foundation, Salem"],
  [/PRIST/i, "Ponnaiyah Ramajayam Institute of Science and Technology, Thanjavur"],
  [/Amrita Vishwa/i, "Amrita Vishwa Vidyapeetham, Coimbatore"],
  [/Dhanalakshmi Srinivasan University/i, "Dhanalakshmi Srinivasan University, Tiruchirappalli"],
  [/Takshs?hila University/i, "Takshashila University, Tindivanam"],
  [/Joy University/i, "Joy University, Tirunelveli"],
  [/Karpaga Vinayaga/i, null],
  [/Sri Balaji Vidyapeeth/i, "Sri Balaji Vidyapeeth, Puducherry"],
  [/Pondicherry University/i, "Pondicherry University, Puducherry"],
  [/Jawahar\s*lal\s*Nehru\s*Techn?onoligical\s*University\s*-?GV|JNTU Gurajada|Gurajada/i, "Jawaharlal Nehru Technological University Gurajada, Vizianagaram"],
  [/J\s*N\s*T\s*U\s*A\b|JNTUA|(JNTU|Jawaharlal Nehru Technological University).*Anant?h?apur/i, "Jawaharlal Nehru Technological University Anantapur"],
  [/Kakinada|\bjntuk\b/i, "Jawaharlal Nehru Technological University Kakinada"],
  [/JNTUH|JNTU HYDERABAD|Jawahar\s*lal\s*Nehru\s*Technological\s*University/i, "Jawaharlal Nehru Technological University Hyderabad"],
  [/Osmania/i, "Osmania University, Hyderabad"],
  [/Kakatiya/i, "Kakatiya University, Warangal"],
  [/Palamuru/i, "Palamuru University, Mahabubnagar"],
  [/Satavahana/i, "Satavahana University, Karimnagar"],
  [/Mahatma Gandhi University,? Anneparthy/i, "Mahatma Gandhi University, Nalgonda"],
  [/Andhra University/i, "Andhra University, Visakhapatnam"],
  [/Nagarjuna University/i, "Acharya Nagarjuna University, Guntur"],
  [/Andhra Kesari/i, "Andhra Kesari University, Ongole"],
  [/Adikavi Nannaya/i, "Adikavi Nannaya University, Rajamahendravaram"],
  [/Krishna University/i, "Krishna University, Machilipatnam"],
  [/Vikrama Simhapuri/i, "Vikrama Simhapuri University, Nellore"],
  [/Sri Krishnadevaraya/i, "Sri Krishnadevaraya University, Anantapur"],
  [/S\s*V\s*University Tirupati/i, "Sri Venkateswara University, Tirupati"],
  [/Sri Padmavathi Mahila/i, "Sri Padmavathi Mahila Visvavidyalayam, Tirupati"],
  [/GITAM/i, "GITAM (Deemed to be University), Visakhapatnam"],
  [/K\s*L University|Koneru Lakshmaiah/i, "Koneru Lakshmaiah Education Foundation, Vaddeswaram"],
  [/Vignan/i, "Vignan's Foundation for Science, Technology and Research, Guntur"],
  [/Centurion University.*Vizianagaram/i, "Centurion University of Technology and Management, Andhra Pradesh"],
  [/Siddhartha Academy/i, "Siddhartha Academy of Higher Education, Vijayawada"],
  [/Aurora Higher Education/i, "Aurora Higher Education and Research Academy, Hyderabad"],
  [/Chaitanya Deemed/i, "Chaitanya (Deemed to be University), Hanamkonda"],
  [/Malla Reddy Vishwavidyapeeth/i, "Malla Reddy Vishwavidyapeeth, Hyderabad"],
  [/Apollo University/i, "The Apollo University, Chittoor"],
  [/Mohan Babu University/i, "Mohan Babu University, Tirupati"],
  [/Annamacharya University/i, "Annamacharya University, Rajampet"],
  [/Aditya University/i, "Aditya University, Surampalem"],
  [/Godavari Global University/i, "Godavari Global University, Rajamahendravaram"],
  [/Guru Nanak University/i, "Guru Nanak University, Hyderabad"],
  // East and North East
  [/Odisha\s*University\s*of\s*Health|OUHS/i, "Odisha University of Health Sciences, Bhubaneswar"],
  [/Odisha State Board of Pharmacy/i, "Odisha State Board of Pharmacy"],
  [/Biju Patnaik/i, "Biju Patnaik University of Technology, Rourkela"],
  [/Utkal University/i, "Utkal University, Bhubaneswar"],
  [/Siksha\s*'?O'?\s*Anusandhan/i, "Siksha 'O' Anusandhan, Bhubaneswar"],
  [/KIIT/i, "Kalinga Institute of Industrial Technology, Bhubaneswar"],
  [/Centurion University/i, "Centurion University of Technology and Management, Odisha"],
  [/CV Raman Global University/i, "C.V. Raman Global University, Bhubaneswar"],
  [/GIET University/i, "GIET University, Gunupur"],
  [/West\s*Bengal\s*University\s*of\s*Health|W\.?B\.?U\.?H\.?S/i, "The West Bengal University of Health Sciences, Kolkata"],
  [/Maulana Abul Kalam Azad University/i, "Maulana Abul Kalam Azad University of Technology, West Bengal"],
  [/Jadavpur/i, "Jadavpur University, Kolkata"],
  [/Techno India University/i, "Techno India University, Kolkata"],
  [/University of North Bengal/i, "University of North Bengal, Darjeeling"],
  [/Amity University West Bengal/i, "Amity University, Kolkata"],
  [/West Bengal State Council of Technical/i, "West Bengal State Council of Technical and Vocational Education and Skill Development"],
  [/Sankaradeva/i, "Srimanta Sankaradeva University of Health Sciences, Guwahati"],
  [/Assam Down Town/i, "Assam down town University, Guwahati"],
  [/Assam Don Bosco/i, "Assam Don Bosco University, Guwahati"],
  [/Assam Royal Global/i, "The Assam Royal Global University, Guwahati"],
  [/Assam Kaziranga/i, "The Assam Kaziranga University, Jorhat"],
  [/Assam Science and Technology/i, "Assam Science and Technology University, Guwahati"],
  [/Assam University/i, "Assam University, Silchar"],
  [/Dibrugarh University/i, "Dibrugarh University, Dibrugarh"],
  [/Girijananda Chowdhury University/i, "Girijananda Chowdhury University, Guwahati"],
  [/Tripura University/i, "Tripura University, Agartala"],
  [/Manipur University/i, "Manipur University, Imphal"],
  [/Arunachal University of Studies/i, "Arunachal University of Studies, Namsai"],
  [/Mizoram University/i, "Mizoram University, Aizawl"],
  [/Sikkim University/i, "Sikkim University, Gangtok"],
  [/Mahatma Gandhi University,? Meghalaya/i, "Mahatma Gandhi University, Meghalaya"],
  [/Mahatma Gandhi University.*Sikkim/i, "Mahatma Gandhi University, Sikkim"],
  [/University of Science and Technology Meghalaya/i, "University of Science and Technology, Meghalaya"],
  // Uttarakhand
  [/Uttarakhand\s*Technical|UttarakhandTechnical/i, "Veer Madho Singh Bhandari Uttarakhand Technical University, Dehradun"],
  [/Kumaun University/i, "Kumaun University, Nainital"],
  [/HNB Garhwal/i, "Hemvati Nandan Bahuguna Garhwal University, Srinagar"],
  [/Gurukul Kangri/i, "Gurukula Kangri (Deemed to be University), Haridwar"],
  [/Uttaranchal University/i, "Uttaranchal University, Dehradun"],
  [/DIT University/i, "DIT University, Dehradun"],
  [/Graphic Era Hill/i, "Graphic Era Hill University, Dehradun"],
  [/Shri Guru Ram Rai/i, "Shri Guru Ram Rai University, Dehradun"],
  [/Swami Rama Himalayan/i, "Swami Rama Himalayan University, Dehradun"],
  [/University of Petroleum and Energy/i, "University of Petroleum and Energy Studies, Dehradun"],
  [/University of Engineering and Technology Roorkee/i, "University of Engineering and Technology, Roorkee"],
  [/Quantum University/i, "Quantum University, Roorkee"],
  [/Motherhood University/i, "Motherhood University, Roorkee"],
  [/Dev Bhoomi Uttarkhand/i, "Dev Bhoomi Uttarakhand University, Dehradun"],
  [/Amrapali University/i, "Amrapali University, Haldwani"],
  [/Maya Devi University/i, "Maya Devi University, Dehradun"],
];

// Words that begin a role or office in front of the body's name.
const ROLE_PREFIX = /^(?:prof\.?\s*\(dr\)\s*[a-z. ]+?\s+(?=controller)|dr\.?\s*[a-z.]+,\s*)?(?:the\s*)?(?:(?:ragistrar|registrar|registar|registerar|register|rigistrar|secretary|secretory|vice\s*chancellor(?:-cum-member\s*secretary)?|deputy\s*registrar|assistant\s*registrar|director|dean\s*examination|exam(?:ination)?\s*controller|examination\s*branch|controller\s*(?:of\s*)?exam\w*|controller\s*examination)\s*(?:\(\s*eval\.?\s*\))?\s*[,:]?\s*(?:of\s+)?)+/i;
const BODY_NOUN = /^(.*?\b(?:University|Vishwavidyalaya|Visvavidyalaya|Visvavidyalayam|Vidyapeeth|Vidyapith))\b/i;

/** For a value the table does not cover: "<Name> University" with the role and address removed, or null. */
function cleanUniversityTail(raw) {
  let s = raw.replace(ROLE_PREFIX, "").replace(/^the\s+registrar\s*/i, "").trim();
  if (/^(department|deptt?|school|faculty|institute)\s+of\b/i.test(s)) return null;
  const m = s.match(BODY_NOUN);
  if (!m) return null;
  // "Central University of ..." needs its "of" part, which this rule cannot read reliably.
  if (/^\s+of\b/i.test(s.slice(m[1].length))) return null;
  let name = m[1].replace(/[,\s]+$/, "").replace(/^the\s+/i, "");
  // "Registrar, Anjaneya University" leaves "Anjaneya University"; anything still longer than a name is not trusted.
  const words = name.split(/\s+/);
  if (words.length < 2 || words.length > 7 || name.length > 80) return null;
  if (/\d|@|\b(road|marg|village|vill|nagar|near|opp|po|distt?|tehsil)\b/i.test(name)) return null;
  if (/^university$/i.test(words[0])) return null;
  if (!/[a-z]/.test(name)) name = name.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bOf\b/g, "of");
  return name.replace(/\b(university|global|international)\b/g, (w) => w[0].toUpperCase() + w.slice(1));
}

export function normaliseUniversity(raw) {
  // Words run together in PCI's text: "The RegistrarMadhav UniversityPindwara", "GeetanjaliUniversity".
  const s = clean(raw)
    .replace(/(Registrar|Chancellor|Secretary)(?=[A-Z])/g, "$1 ")
    .replace(/([a-z])(University)/g, "$1 $2")
    .replace(/(University)(?=[A-Z])/g, "$1 ");
  if (!s) return null;
  for (const [re, official] of UNIVERSITY_TABLE) if (re.test(s)) return official;
  return cleanUniversityTail(s);
}

// ---------------------------------------------------------------------------------------------
// Institution name -> name, address, PIN, district, city.
//
// PCI's institution column often runs the address on after the name ("JSS College Of Pharmacy
// Rocklands Ootacamund"). The name is kept up to the end of its institution phrase: from the first
// institution noun (College, Institute, School, University ...) through the words that continue it
// ("of Pharmacy", "for Women", "and Research") and through a parent body named straight after it
// ("Institute of Pharmacy, Amity University"). Everything after that is the address. A PIN is
// six digits; the district is read only where the text says so ("Dist Nagpur", "Nagpur Distt");
// the city only where a town is written right before the PIN.
const HEAD = /^(col+[ae]ge?s?|(?:inst|insit|instit|instut)\w*|school|faculty|department|deptt|dept|centre|center|university|univeristy|universiy|mahavid\w*|vidyalaya|vidyapeeth|vidyapith|peeth|sansthan|polytechnic|academy|vishwavidyalaya|visvavidyalaya|visvavidyalayam|viswavidyalaya|hamdard)$/i;
const CONTINUE = /^(phar\w*|phram\w*|paramedical\w*|sci\w*|campus|group|hospital|care|ii|iii|iv|research|technology|technical|technological|education|educational|studies|management|engineering|medical|medicine|paramedical|health|healthcare|allied|nursing|women|womens|women's|girls|boys|diploma|degree|higher|advanced|applied|life|bio|biomedical|biotech|biotechnology|professional|training|autonomous|deemed|of|for|and|&|in|the|d|b|m|pharm|dpharm|bpharm|mpharm)$/i;
const CONNECTOR = /^(of|for|and|&|in|the)$/i;
const TRIGGER = /^(near|nr|opp|opposite|behind|beside|village|vill|vil|vpo|po|p\.o|post|mouza|tal|taluka|tq|tah|tahsil|tehsil|teh|dist|distt|district|plot|sector|survey|sy|no|km|nh|ward|mandal|via|hobli|pin|formerly|formally|at|in front)$/i;
const STATE_WORDS = /^(andhra|pradesh|arunachal|assam|bihar|chhattisgarh|goa|gujarat|haryana|himachal|jharkhand|karnataka|kerala|madhya|maharashtra|manipur|meghalaya|mizoram|nagaland|odisha|orissa|punjab|rajasthan|sikkim|tamil|nadu|tamilnadu|telangana|tripura|uttar|uttarakhand|uttaranchal|west|bengal|india|delhi|jammu|kashmir|puducherry|pondicherry|u\.?p\.?|m\.?p\.?|a\.?p\.?|c\.?g\.?|h\.?p\.?)$/i;
const PIN = /(?<!\d)([1-8]\d{2})\s?(\d{3})(?!\d)/;

const word = (t) => t.replace(/^[("'“‘]+|[)"'”’.,:;]+$/g, "");

export function splitName(raw) {
  // Undo words run together with the institution noun: "Patelcollege", "Nirmauniversity".
  let s = raw.replace(/\s*\/\s*PCI-\d+\s*$/i, "").replace(/\b(Women)([a-z]{3,})/g, (m, a, b) => `${a} ${b[0].toUpperCase()}${b.slice(1)}`).replace(/\s+\./g, ".").replace(/([a-z]{3,})(college|university|institute)\b/gi, (m, a, b) => (/^(inter|uni)$/i.test(a) ? m : `${a} ${b[0].toUpperCase()}${b.slice(1)}`));
  s = s.replace(/\s*,\s*/g, " , ").replace(/\s+/g, " ").trim();
  const tokens = s.split(" ");
  const isTrigger = (i) => {
    const w = word(tokens[i]);
    if (/^post$/i.test(w) && /^graduate$/i.test(word(tokens[i + 1] ?? ""))) return false;
    if (TRIGGER.test(w)) return !(/^(at|no)$/i.test(w) && i + 1 < tokens.length && /^(and|&)$/i.test(word(tokens[i + 1])));
    if (/^\d/.test(w) || /^p$/i.test(w) && /^o$/i.test(word(tokens[i + 1] ?? ""))) return true;
    return /^in$/i.test(w) && /^front$/i.test(word(tokens[i + 1] ?? ""));
  };
  const head = tokens.findIndex((t) => HEAD.test(word(t)));
  let end = -1;
  if (head >= 0) {
    end = head;
    let i = head + 1;
    while (i < tokens.length) {
      const w = word(tokens[i]);
      if (isTrigger(i)) break;
      // A lone "D", "B" or "M" continues the name only as "D Pharm(acy)".
      const courseLetter = /^[dbm]$/i.test(w) && !/^ph(ar|ra)m/i.test(word(tokens[i + 1] ?? ""));
      if (w && !courseLetter && (CONTINUE.test(w) || HEAD.test(w))) {
        if (!CONNECTOR.test(w)) end = i;
        i++;
        continue;
      }
      // Bare punctuation between parts of the name ("Institute of Science & Technology - Pharmacy").
      if (!w && tokens[i] !== ",") {
        i++;
        continue;
      }
      // Inside an "of ..." phrase a proper word may lead to the next name word: "University Of Emerging Sciences".
      const after = word(tokens[i + 1] ?? "");
      if (CONNECTOR.test(word(tokens[i - 1])) && after && CONTINUE.test(after) && !CONNECTOR.test(after) && !isTrigger(i + 1)) {
        end = i + 1;
        i += 2;
        continue;
      }
      // A parent body named right after ("Amity University", ", Vishwakarma University").
      let j = i;
      let found = -1;
      for (let k = 0; j < tokens.length && k < 8; j++, k++) {
        if (isTrigger(j)) break;
        if (HEAD.test(word(tokens[j]))) {
          found = j;
          break;
        }
      }
      if (found < 0) break;
      end = found;
      i = found + 1;
    }
    // A bracketed qualifier closes on the same word: "(School of Pharmacy)".
    while (end + 1 < tokens.length && /\)$/.test(tokens[end + 1]) && !tokens.slice(0, end + 1).join(" ").includes(")") && tokens.slice(0, end + 1).join(" ").includes("(")) end++;
  } else {
    // No institution noun: cut at the first address word, or else at the first comma.
    let t = tokens.findIndex((_, i) => i >= 2 && isTrigger(i));
    if (t < 0) t = tokens.findIndex((tok, i) => i >= 2 && tok === ",");
    end = t > 0 ? t - 1 : tokens.length - 1;
  }
  // A name that is only "University" or "Institute" keeps its "of ..." words up to the address:
  // "University Of Petroleum And Energy Studies", "Institute Of International Excellence".
  if (end === head && head >= 0 && /^of$/i.test(word(tokens[end + 1] ?? ""))) {
    let k = end + 2;
    while (k < tokens.length && k <= end + 6 && !isTrigger(k) && tokens[k] !== ",") k++;
    if (k > end + 2) end = k - 1;
  }
  let nameTokens = tokens.slice(0, end + 1);
  while (nameTokens.length > 1 && (CONNECTOR.test(word(nameTokens.at(-1))) || nameTokens.at(-1) === ",")) nameTokens.pop();
  let rest = tokens.slice(end + 1);
  // "Formerly known as ..." names an old title, not a place: dropped.
  const formerly = rest.findIndex((t) => /^form(er|al)ly$/i.test(word(t)));
  if (formerly >= 0) rest = rest.slice(0, formerly);
  const name = nameTokens.join(" ").replace(/ ,/g, ",").replace(/[\s,.-]+$/, "").replace(/^[\s,]+/, "");
  let address = rest.join(" ").replace(/ ,/g, ",").replace(/^[\s,.:;-]+|[\s,;:.-]+$/g, "").replace(/\s+/g, " ") || null;
  // A deemed-university qualifier left over belongs to the name.
  let finalName = name;
  if (address && /^\(?deemed[\s-]*to[\s-]*be[\s-]*university\)?$/i.test(address)) {
    finalName = `${name} (Deemed to be University)`;
    address = null;
  }
  // "and Anr" (and another) is a case-law tail, not a place.
  if (address && /^(and|&)\s+anr$/i.test(address)) address = null;
  return { name: finalName, address };
}

function titleWord(w) {
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

const DISTRICT_FIRST = /^(north|south|east|west|paschim|purba|purbo|rae|sant|sri|udham|sawai|charkhi|pauri|tehri|baloda|ranga|gautam|dakshina|uttara|chhatrapati|chhtrapati|lakhimpur|kamrup|east)$/i;
const NOT_DISTRICT = /^(and|road|nagar|hq|headquarter|gram|rural|rict|haveli|city|chemists|education|near|through|office|campus|board|level)$/i;
const okDistrict = (w) => !STATE_WORDS.test(w) && !TRIGGER.test(w) && !NOT_DISTRICT.test(w);

/**
 * PIN, district and city from the address text, only where the text states them. `truncated`
 * marks a name PCI cut off mid-word, whose last word is not trusted.
 */
export function placeParts(address, truncated = false) {
  const out = { pin: null, district: null, city: null };
  if (!address) return out;
  const pin = address.match(PIN);
  if (pin) {
    out.pin = pin[1] + pin[2];
    // The town written right before the PIN ("Kalaburagi 585 102", "Bilaspur495 117", "Moga-142001").
    const before = address.slice(0, pin.index).replace(/[\s,:.-]*(pin(\s*code)?|pincode)?[\s,:.-]*$/i, "");
    const m = before.match(/([A-Za-z][A-Za-z]+)$/);
    if (m && !/^(city|dehat|garh|raj|nagar)$/i.test(m[1])) {
      let town = m[1].replace(/^distt?(?=[a-z]{3,})/i, "");
      const prev = before.slice(0, before.length - town.length).trim().split(/[\s,]+/).at(-1) ?? "";
      if (!STATE_WORDS.test(town) && !TRIGGER.test(town) && town.length >= 3 && !/^(road|marg|highway|bypass|nagar|colony|campus|layout|area|street|chowk)$/i.test(town)) {
        if (/^(navi|new|greater|gr)$/i.test(prev)) town = `${/^gr$/i.test(prev) ? "Greater" : titleWord(prev)} ${titleWord(town)}`;
        else town = titleWord(town);
        out.city = town;
      }
    }
  }
  // "Dist Nagpur", "Distt. Belgaum", "District-Hazaribag", "Tal & Dist Ahmednagar", "Hatkanangledist Kolhapur".
  let district = null;
  const d1 = address.match(/(?:\b|[a-z])(?:dist(?:t|rict)?)\.?\s*[:\-.]?\s*([A-Za-z]{3,})((?:\s+[A-Za-z0-9]+){0,3})/i);
  if (d1 && okDistrict(d1[1])) {
    district = d1[1];
    const more = d1[2].trim().split(/\s+/).filter(Boolean);
    // Districts written in more than one word: "North 24 Parganas", "Udham Singh Nagar", "Rae Bareli".
    if (DISTRICT_FIRST.test(district)) {
      for (const w of more) {
        district += ` ${w}`;
        if (!/^(singh|kabir|buddh|budh|24)$/i.test(w)) break;
      }
    } else if (more[0] && /^(dehat|garhwal|nagar)$/i.test(more[0]) && /^(kanpur|pauri|tehri|ambedkar|yamuna|siddharth|siddarth|ahmed|mahaboob|sant|gautam)$/i.test(district)) {
      district += ` ${more[0]}`;
    }
    // A district cut short at the end of a truncated name ("Dist Ton") is not trusted.
    if (address.length > 0 && address.endsWith(d1[0].trimEnd()) && !more.length && truncated) district = null;
  }
  if (!district) {
    // "Puttur Chittoor Dist", "Nagpur Distt" (the word before the label, when nothing follows it but a state or PIN).
    const d2 = address.match(/(?:(east|west|north|south|ranga|rae|pauri)\s+)?([A-Za-z]{3,})\s+dist(?:t|rict)?\.?(?=\s*(?:$|[,\d(]|(?:andhra|uttar|madhya|tamil|west|himachal|arunachal)?\s*[A-Za-z]*\s*\)?\s*$))/i);
    if (d2 && okDistrict(d2[2])) district = d2[1] ? `${d2[1]} ${d2[2]}` : d2[2];
  }
  if (district) {
    // A state glued on the end ("Fazilkapunjab").
    district = district.replace(/(punjab|kerala|haryana|gujarat|karnataka|maharashtra|rajasthan|bihar|odisha)$/i, (m, st, off) => (off > 3 ? "" : m));
    out.district = district.split(" ").map(titleWord).join(" ");
  }
  return out;
}

const MANAGING_BODY = /^(society'?s?|societys|trust'?s?|trusts|sanstha'?s?|sansthas|sansthan|mandal'?s?|mandals|association'?s?|associations|foundation'?s?|foundations|samiti|sanchalit|sangh)$/i;

/** Names still longer than 120 characters lose the managing society in front, then trailing words. */
function shortenName(name) {
  if (name.length <= 120) return name;
  const words = name.split(" ");
  const cut = words.findLastIndex((w, i) => MANAGING_BODY.test(word(w)) && words.slice(i + 1).some((x) => HEAD.test(word(x))));
  let out = cut >= 0 ? words.slice(cut + 1).join(" ") : name;
  while (out.length > 120) {
    const ws = out.split(" ");
    const lastHead = ws.findLastIndex((w, i) => i < ws.length - 1 && HEAD.test(word(w)));
    out = (lastHead > 0 ? ws.slice(0, lastHead + 1) : ws.slice(0, -1)).join(" ");
  }
  return out.replace(/[\s,]+$/, "");
}

/** The last place word of an address, for telling same-named institutions apart. */
function lastPlace(address) {
  if (!address) return null;
  const ws = address.replace(/[()]/g, " ").split(/[\s,]+/).filter(Boolean).reverse();
  for (const [k, w] of ws.entries()) {
    const x = word(w);
    if (/^delhi$/i.test(x) && /^new$/i.test(word(ws[k + 1] ?? ""))) return "New Delhi";
    if (!/^[A-Za-z]{3,}$/.test(x) || STATE_WORDS.test(x) || TRIGGER.test(x) || HEAD.test(x) || CONTINUE.test(x) || /^(road|marg|highway|bypass|colony|campus|layout|area|street|chowk|gram|poly|vanita|womens|city|nagar|dehat)$/i.test(x)) continue;
    return titleWord(x);
  }
  return null;
}

// Which course each list covers, and how its course is named in decision text.
const LISTS = {
  dip12: { course: "d-pharm", label: "Approved Diploma institutions u/s 12" },
  dipc: { course: "d-pharm", label: "Diploma institutions only for conduct" },
  deg12: { course: "b-pharm", label: "Approved Degree institutions u/s 12" },
  degc: { course: "b-pharm", label: "Degree institutions only for conduct" },
  pharmd: { course: "pharm-d", label: "Approved institutions for Pharm.D" },
  mpharm: { course: "m-pharm", label: "Approved institutions for M.Pharm courses" },
};
// Pharm.D (Post Baccalaureate) and the B.Pharm (Practice) bridge course have no course slug yet.
const SKIPPED_LISTS = ["pharmdpb", "bridge"];

/** The course a stretch of decision text names, if any. */
function courseNamed(text) {
  if (/Pharm\.?\s?D\s*\(?\s*P\.?\s?B|Post\s*Baccalaureate/i.test(text)) return "pharm-d-pb";
  if (/B\.?\s?Pharm\s*\(\s*Practice/i.test(text)) return "bridge";
  if (/\bM\.?\s?Pharm/i.test(text)) return "m-pharm";
  if (/\bB\.?\s?Pharm/i.test(text)) return "b-pharm";
  if (/\bD\.?\s?Pharm/i.test(text)) return "d-pharm";
  if (/\bPharm\.?\s?D\b/i.test(text)) return "pharm-d";
  return null;
}

const Y = String.raw`(20\d\d)\s*-\s*(?:20)?(\d\d)`;
const N = String.raw`0*(\d{1,3})`;
// Each pattern yields {from, to, seats}: the academic years (by starting year) the stated intake covers.
const PATTERNS = [
  // "Extend approval upto 2026-2027 academic session for 60 admissions", "already approved upto ..."
  { re: new RegExp(String.raw`(?:approval|approved)\s*up\s*to\s*${Y}\s*(?:academic)?\s*(?:session)?\s*for\s*${N}\s*(?:admissions?|intakes?|seats?)`, "gi"), get: (m) => ({ from: null, to: +m[1], seats: +m[3] }) },
  // "Extension upto 2026-2027 academic session for 60 admissions"
  { re: new RegExp(String.raw`Extension\s*up\s*to\s*${Y}\s*(?:academic)?\s*(?:session)?\s*for\s*${N}\s*admissions?`, "gi"), get: (m) => ({ from: null, to: +m[1], seats: +m[3] }) },
  // "Grant approval from 2024-2025 to 2026-2027 academic session for 60 admissions u/s 12"
  { re: new RegExp(String.raw`(?:approval\s*)?(?:from|for)\s*${Y}\s*to\s*${Y}\s*(?:academic)?\s*(?:session)?\s*(?:u/s\s*12\s*)?for\s*${N}\s*admissions?`, "gi"), get: (m) => ({ from: +m[1], to: +m[3], seats: +m[5] }) },
  // "Grant approval for 2026-2027 academic session for the conduct of 1st year for 60 admissions"
  { re: new RegExp(String.raw`approval\s*(?:for|upto)\s*(?:the\s*)?${Y}\s*academic\s*session\s*for\s*(?:the\s*)?conduct\s*of\s*(?:course\s*for\s*)?(\d)\s*(?:st|nd|rd|th)\s*year\s*for\s*${N}\s*(?:admissions?|intakes?|seats?)`, "gi"), get: (m) => (+m[3] === 1 ? { from: +m[1], to: +m[1], seats: +m[4] } : null) },
  // "Grant approval for 2026-2027 academic session for 60 admissions for the conduct of 1st year"
  { re: new RegExp(String.raw`approval\s*for\s*(?:the\s*)?${Y}\s*academic\s*session\s*for\s*${N}\s*admissions?\s*for\s*(?:the\s*)?cond[a-z]*\s*of\s*(\d)\s*(?:st|nd|rd|th)\s*year`, "gi"), get: (m) => (+m[4] === 1 ? { from: +m[1], to: +m[1], seats: +m[3] } : null) },
  // "Grant approval for 2026-2027 academic session for 15 admissions for M.Pharm (Pharmaceutics) course"
  { re: new RegExp(String.raw`approval\s*for\s*(?:the\s*)?${Y}\s*academic\s*session\s*for\s*${N}\s*admissions?\s*(?:(?:for|in)\b(?!\s*(?:the\s*)?cond)|u/s)`, "gi"), get: (m) => ({ from: +m[1], to: +m[1], seats: +m[3] }) },
  // "Grant approval from 2026-2027 academic session for 100 admissions u/s 12" (open ended)
  { re: new RegExp(String.raw`approval\s*from\s*${Y}\s*academic\s*session\s*for\s*${N}\s*admissions?`, "gi"), get: (m) => ({ from: +m[1], to: null, seats: +m[3] }) },
  // "approved admission for 60 from 2026-2027"
  { re: new RegExp(String.raw`approved\s*admissions?\s*for\s*${N}\s*from\s*${Y}`, "gi"), get: (m) => ({ from: +m[2], to: null, seats: +m[1] }) },
  // "Allow 60 admissions in 2026-2027 academic session in 1st year"
  { re: new RegExp(String.raw`Allow\s*${N}\s*admissions?\s*in\s*${Y}\s*academic\s*session(?:\s*in\s*(\d)\s*(?:st|nd|rd|th)\s*year)?`, "gi"), get: (m) => (!m[4] || +m[4] === 1 ? { from: +m[2], to: +m[2], seats: +m[1] } : null) },
  // "Grant approval for the 2026-2027 academic session for 1st year admission of 60 seat intake"
  { re: new RegExp(String.raw`approval\s*for\s*(?:the\s*)?${Y}\s*academic\s*session\s*for\s*(?:the\s*)?(?:1\s*st|first)\s*year\s*admission\s*of\s*${N}\s*(?:seat\s*)?intake`, "gi"), get: (m) => ({ from: +m[1], to: +m[1], seats: +m[3] }) },
  // "GRANT APPROVAL FOR 60 SEATS D.PHARM SESSION 2026-27", "Approved for 60 seats in D.Pharm course for session 2026-27"
  { re: new RegExp(String.raw`(?:approval|approved)\s*(?:for|of)\s*${N}\s*seats\b[^.]{0,40}?session\s*${Y}`, "gi"), get: (m) => ({ from: +m[2], to: +m[2], seats: +m[1] }) },
  // Course of study: "2026-2027 - 1st Year cos 2027-2028 - 2nd Year cos For 60 admission",
  // "Course of Study (COS) 2027 - 2028 - 1st year cos 2028 - 2029 - 2nd year cos No. of Admission Approved - 15"
  { re: new RegExp(String.raw`${Y}\s*-?\s*1\s*st\s*year\s*cos.{0,200}?(?:For\s*${N}\s*admissions?|No\.?\s*of\s*Admission\s*Approved\s*-\s*${N})`, "gi"), get: (m) => ({ from: +m[1], to: null, seats: +(m[3] ?? m[4]) }) },
];
// Changes in intake: "Permit raise in admissions from 60 to 100 from 2026-27 a.s.", "reduce the intake from 100 to 60".
const RAISE = new RegExp(String.raw`(?:Permit|permitted|approve[d]?\s*for|already\s*approved)[^.]{0,30}?raise\s*in\s*admissions?\s*from\s*${N}\s*(?:to|-)\s*${N}\s*(?:intakes?\s*)?from\s*${Y}`, "gi");
const RAISE_DONE = new RegExp(String.raw`Raise\s*in\s*admissions?\s*from\s*${N}\s*to\s*${N}\s*from\s*${Y}\s*(?:academic\s*session\s*)?is\s*already\s*approved`, "gi");
const REDUCE = new RegExp(String.raw`reduce\s*(?:the\s*)?(?:intake|admissions?)\s*(?:from|form)\s*${N}\s*to\s*${N}`, "gi");

const covers = (s, y) => (s.from === null || s.from <= y) && (s.to === null || s.to >= y);

/**
 * Reads one decision for one course. Returns the intake for the target year (or null), and whether
 * every dated statement for the course starts after the target year (a course PCI approved only
 * from a later session).
 */
export function readDecision(text, course) {
  const statements = [];
  for (const p of PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      const s = p.get(m);
      if (!s) continue;
      // The course is named just before or after the statement; skip statements about another course.
      const around = text.slice(Math.max(0, m.index - 25), m.index + m[0].length + 60);
      const named = courseNamed(text.slice(m.index, m.index + m[0].length + 60)) ?? courseNamed(around);
      if (named && named !== course) continue;
      statements.push({ ...s, at: m.index });
    }
  }
  const dated = statements.filter((s) => s.from !== null || s.to !== null);
  const laterOnly = dated.length > 0 && dated.every((s) => (s.from ?? s.to) > TARGET_YEAR);
  const current = statements.filter((s) => covers(s, TARGET_YEAR));
  const values = new Set(current.map((s) => s.seats));

  // A raise or reduction in intake that applies by the target year: from A to B.
  const changes = [];
  for (const re of [RAISE, RAISE_DONE]) {
    for (const m of text.matchAll(re)) {
      const named = courseNamed(text.slice(Math.max(0, m.index - 60), m.index + m[0].length));
      if (named && named !== course) continue;
      if (+m[3] <= TARGET_YEAR) changes.push([+m[1], +m[2]]);
    }
  }
  for (const m of text.matchAll(REDUCE)) {
    const named = courseNamed(text.slice(Math.max(0, m.index - 60), m.index + m[0].length));
    if (named && named !== course) continue;
    changes.push([+m[1], +m[2]]);
  }

  let seats = null;
  if (changes.length === 1) {
    // The changed intake holds when every stated intake for the year is the old or the new figure.
    // A raise is only read alongside an approval for the year ("Extend approval up to 2026-2027
    // academic session for B.Pharm course. (Permit raise in admissions from 60 to 100 ...)").
    const [from, to] = changes[0];
    const upTo = text.match(new RegExp(String.raw`approval\s*up\s*to\s*${Y}`, "i"));
    const approvedForYear = current.length > 0 || (upTo !== null && Number(upTo[1]) >= TARGET_YEAR);
    if (approvedForYear && [...values].every((v) => v === from || v === to)) seats = to;
  } else if (changes.length === 0 && values.size === 1) {
    seats = current[0].seats;
  }
  // Two different intakes for the same year without one stated change: leave it unknown.
  return { seats, laterOnly };
}

function pickTop(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

/** "M.Pharm (Pharmaceutics)" from the decision's opening words, when it names the specialisation. */
export function mpharmBranch(text) {
  let m = text.match(/^M\.?\s?Pharm\.?\s*\(([^)]+)\)/i);
  if (!m) m = text.match(/^M\.?\s?Pharm\.?\s+([A-Za-z][A-Za-z &]+?)\s+Status:/i);
  if (!m) return null;
  const name = m[1].trim().replace(/\s+/g, " ");
  return `M.Pharm (${name.replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bAnd\b/g, "and")})`;
}

function main() {
  const [dumpPath] = process.argv.slice(2);
  if (!dumpPath) throw new Error("Usage: node scripts/councils/pci-convert.mjs <pci-dump.json>");
  const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
  const sameAs = JSON.parse(readFileSync(path.join(here, "pci-same-as.json"), "utf8"));
  const institutions = new Map();
  const stats = { listed: {}, skippedLater: 0, mpharmUnnamed: 0, namesSplit: 0, placeAdded: 0 };
  for (const [key, list] of Object.entries(LISTS)) {
    const rows = dump.lists[key];
    stats.listed[key] = rows.length;
    for (const r of rows) {
      const code = clean(r.naming_series).replace(/\s+/g, "");
      if (!/^PCI-\d+$/.test(code)) throw new Error(`Unexpected PCI code ${r.naming_series}`);
      const inst = institutions.get(code) ?? { code, names: new Map(), states: new Set(), universities: new Map(), offerings: new Map(), lists: new Set() };
      institutions.set(code, inst);
      const name = tidyName(r.institution_name);
      inst.names.set(name, (inst.names.get(name) ?? 0) + (key.endsWith("12") ? 2 : 1));
      inst.states.add(stateName(clean(r.state_name)));
      inst.lists.add(key);
      const university = list.course === "d-pharm" ? null : normaliseUniversity(r.examiningauthority_name);
      if (university) inst.universities.set(university, (inst.universities.get(university) ?? 0) + 1);

      const text = clean(r.pci_decision);
      const { seats, laterOnly } = readDecision(text, list.course);
      if (laterOnly) {
        stats.skippedLater++;
        continue;
      }
      const off = inst.offerings.get(list.course) ?? { course: list.course, seats: null, seen: [], branches: new Map(), unnamed: 0 };
      inst.offerings.set(list.course, off);
      if (list.course === "m-pharm") {
        const branch = mpharmBranch(text);
        if (!branch) {
          off.unnamed++;
          stats.mpharmUnnamed++;
        } else {
          const prev = off.branches.get(branch);
          off.branches.set(branch, prev === undefined || prev === null ? seats : prev === seats || seats === null ? prev : null);
        }
      } else {
        off.seen.push(seats);
      }
    }
  }


  const rows = [];
  for (const inst of [...institutions.values()].sort((a, b) => Number(a.code.slice(4)) - Number(b.code.slice(4)))) {
    if (inst.states.size !== 1) throw new Error(`${inst.code} is listed under more than one state`);
    const offerings = [];
    for (const course of ["d-pharm", "b-pharm", "pharm-d", "m-pharm"]) {
      const off = inst.offerings.get(course);
      if (!off) continue;
      if (course === "m-pharm") {
        const branches = [...off.branches.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, seats]) => ({ name, seats }));
        const complete = off.unnamed === 0 && branches.length > 0 && branches.every((b) => b.seats !== null);
        const o = { course, seats: complete ? branches.reduce((t, b) => t + b.seats, 0) : null };
        if (branches.length) o.branches = branches;
        offerings.push(o);
      } else {
        // Listed in both the u/s 12 and the conduct list: keep a stated intake only if they agree.
        const known = [...new Set(off.seen.filter((s) => s !== null))];
        offerings.push({ course, seats: known.length === 1 ? known[0] : null });
      }
    }
    if (!offerings.length) continue;
    const rawName = pickTop(inst.names);
    const split = splitName(rawName);
    // PCI cuts some long names off mid-word; the last word of those is not read as a place.
    const truncated = rawName.length >= 125 && !/[.)]$/.test(rawName);
    const place = placeParts(split.address, truncated);
    const row = {
      code: inst.code,
      name: shortenName(split.name),
      address: split.address,
      district: place.district,
      city: place.city,
      pin: place.pin,
      state: [...inst.states][0],
      management: null,
      ownership: null,
      offerings,
    };
    if (split.address) stats.namesSplit++;
    const university = pickTop(inst.universities);
    if (university) row.university = university;
    if (sameAs[inst.code]) row.same_as = { scheme: "nirf", value: sameAs[inst.code] };
    rows.push(row);
  }

  // Names shared by more than one institution get their place added: "Govt Polytechnic For Women, Cuddapah".
  const byName = new Map();
  for (const r of rows) byName.set(r.name.toLowerCase(), [...(byName.get(r.name.toLowerCase()) ?? []), r]);
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    for (const r of group) {
      const where = r.district ?? r.city ?? lastPlace(r.address);
      if (where && !r.name.toLowerCase().endsWith(where.toLowerCase())) {
        r.name = `${r.name}, ${where}`;
        stats.placeAdded++;
      }
    }
  }

  const sources = [
    {
      publisher: "Pharmacy Council of India",
      title: `Pharmacy Council of India approved institutions: D.Pharm, B.Pharm, Pharm.D and M.Pharm lists, ${ACADEMIC_YEAR} decisions`,
      url: "https://pci.gov.in/en/approved-institute/",
      retrieved: RETRIEVED,
      prefix: "PCI-",
    },
  ];

  const out = {
    council: "PCI",
    scheme: "pci",
    stream: "pharmacy",
    academic_year: ACADEMIC_YEAR,
    sources,
    note:
      "Institutions on the Pharmacy Council of India's approved lists at pci.gov.in (Approved Institutes menu: D.Pharm and B.Pharm u/s 12 and only-for-conduct lists, Pharm.D and M.Pharm lists), keyed by PCI's own institution code. " +
      "PCI publishes no separate address or management type: its name column often runs on into the address, so the name is kept up to the end of its institution phrase and the rest is the address, with the PIN, the district (only where written as 'Dist X') and the city (the town written before the PIN) read from it; names shared by several institutions carry their place. Intake appears only inside PCI's free-text decision, so seats are filled only where that decision states an intake for an approval covering 2026-27 (for example 'Extend approval upto 2026-2027 academic session for 60 admissions', a first-year grant for 2026-27, or a raise in intake from 2026-27); decisions that give no intake, or whose stated approval ends before 2026-27, leave seats null. " +
      "Courses PCI approved only from 2027-28 are left out. M.Pharm specialisations are listed as branches where PCI names them; the M.Pharm total is filled only when every specialisation has a stated intake. " +
      "Pharm.D (Post Baccalaureate) and the B.Pharm (Practice) bridge course are not included. The university is the examining authority PCI lists for the degree courses, reduced to the body's official name; values that name no identifiable university or board are left empty.",
    rows,
  };
  const outPath = path.join(root, "data", "councils", "pci.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  stats.pins = rows.filter((r) => r.pin).length;
  stats.districts = rows.filter((r) => r.district).length;
  stats.cities = rows.filter((r) => r.city).length;
  stats.universities = new Set(rows.map((r) => r.university).filter(Boolean)).size;
  console.error(JSON.stringify({ rows: rows.length, ...stats, skipped_lists: SKIPPED_LISTS.map((k) => `${k}:${dump.lists[k]?.length ?? 0}`) }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) main();
