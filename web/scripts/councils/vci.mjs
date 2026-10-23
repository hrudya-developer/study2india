// Builds data/councils/vci.json from the Veterinary Council of India lists, transcribed below.
// Usage: node scripts/councils/vci.mjs
//
// VCI publishes no college codes, so each college is keyed by a hash of its state, name and town.
// Seats come only from VCI's own documents; where VCI prints none the seats stay null.
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const RETRIEVED = "2026-10-23";
const PUBLISHER = "Veterinary Council of India";

const sources = [
  {
    publisher: PUBLISHER,
    title: "VCI list of recognised veterinary colleges, First Schedule to the IVC Act, 1984 (as on 22.10.2026)",
    url: "https://vci.dahd.gov.in/sites/default/files/CollegeList/list%20of%20Recognzied%20vety.%20colleges%20(as%20on%2022.10.26).pdf",
    retrieved: RETRIEVED,
    prefix: "R",
  },
  {
    publisher: PUBLISHER,
    title: "VCI list of provisionally recognised veterinary colleges where LOP or renewal of LOP has been issued (as on 22.10.2026)",
    url: "https://vci.dahd.gov.in/sites/default/files/CollegeList/List%20of%20Provisionally%20recognized%20vety.%20colleges%20(as%20on%2022.10.26).pdf",
    retrieved: RETRIEVED,
    prefix: "P",
  },
  {
    publisher: PUBLISHER,
    title: "VCI list of recognised veterinary colleges with seats approved by the Central Government",
    url: "https://www.vci.dahd.gov.in/sites/default/files/News%20update/ListofRecognizedVeterinaryColleges.pdf",
    retrieved: RETRIEVED,
    prefix: "S",
  },
  {
    publisher: PUBLISHER,
    title: "Minutes of the Special Meeting of the Veterinary Council of India (12.03.2026)",
    url: "https://www.vci.dahd.gov.in/sites/default/files/MoM/Special%20VCI%20Meeting-12.3.26.pdf",
    retrieved: RETRIEVED,
    prefix: "M1",
  },
  {
    publisher: PUBLISHER,
    title: "Minutes of the Special Meeting of the Veterinary Council of India (25.03.2026)",
    url: "https://www.vci.dahd.gov.in/sites/default/files/MoM/Special%20VCI%20Minutes%20(25.3.26).pdf",
    retrieved: RETRIEVED,
    prefix: "M2",
  },
  {
    publisher: PUBLISHER,
    title: "Minutes of the 91st Meeting of the Veterinary Council of India (08.06.2026)",
    url: "https://www.vci.dahd.gov.in/sites/default/files/MoM/91%20VCI%20Minutes%20(08.6.26).pdf",
    retrieved: RETRIEVED,
    prefix: "M3",
  },
];

// Recognised list, in VCI's order (serial numbers 1 to 73).
// [serial, name, place, state, university, private, address, seats, vciQuotaSeats, recognisedFrom, listedAs?]
// seats: "Seats Approved by Central Govt." from the seats list (source S).
// vciQuotaSeats: the college's 15% VCI quota seats in Annexure 2 of the VCI counselling bulletin for 2026-27.
// recognisedFrom: footnote date from which the degree is recognised ("granted on or after").
const SVVU = "Sri Venkateswara Veterinary University, Tirupati";
const AAU = "Assam Agricultural University, Jorhat";
const KU = "Kamdhenu University, Gandhinagar, Gujarat";
const LUVAS = "Lala Lajpat Rai University of Veterinary and Animal Sciences, Hisar";
const KVAFSU = "Karnataka Veterinary, Animal & Fisheries Sciences University, Bidar";
const KVASU = "Kerala Veterinary and Animal Science University, Pookote";
const NDVSU = "Nanaji Deshmukh Veterinary Science University, Jabalpur";
const MAFSU = "Maharashtra Animal & Fishery Sciences University, Nagpur";
const CAU = "Central Agricultural University, Imphal";
const GADVASU = "Guru Angad Dev Veterinary and Animal Sciences University";
const RAJUVAS = "Rajasthan University of Veterinary & Animal Sciences, Bikaner";
const TANUVAS = "Tamil Nadu Veterinary & Animal Sciences University, Chennai";
const PVNRTVU = "P.V. Narsimha Rao Telangana Veterinary University, Hyderabad";

const recognised = [
  [1, "NTR College of Veterinary Science, Gannavaram", "Gannavaram", "Andhra Pradesh", SVVU, false, null, 100, 15, null],
  [2, "College of Veterinary Science, Proddatur", "Proddatur", "Andhra Pradesh", SVVU, false, null, 100, 15, null],
  [3, "College of Veterinary Science, Tirupati", "Tirupati", "Andhra Pradesh", SVVU, false, null, 100, 15, null],
  [4, "College of Veterinary Science, Guwahati", "Guwahati", "Assam", AAU, false, null, 100, 15, null],
  [5, "Lakhimpur College of Veterinary Science", "Lakhimpur", "Assam", AAU, false, null, 40, 6, null, "Lakhimpur College of Veterinary Science, Assam"],
  [6, "Bihar Veterinary College, Patna", "Patna", "Bihar", "Bihar Animal Science University, Patna, Bihar", false, null, 75, 11, null],
  [7, "College of Veterinary Science & Animal Husbandry, Durg", "Durg", "Chhattisgarh", "Dau Shri Vasudev Chandrakar Kamdhenu Vishwavidyalaya, Anjora, Durg", false, null, 100, 15, null],
  [8, "College of Veterinary Science and Animal Husbandry, Anand", "Anand", "Gujarat", KU, false, null, 75, 11, null],
  [9, "College of Veterinary Science and Animal Husbandry, Junagadh", "Junagadh", "Gujarat", KU, false, null, 100, 15, null],
  [10, "College of Veterinary Science and Animal Husbandry, Navsari", "Navsari", "Gujarat", KU, false, null, 100, 15, null],
  [11, "College of Veterinary Science and Animal Husbandry, Sardarkrushinagar", "Sardarkrushinagar", "Gujarat", KU, false, null, 100, 15, null],
  [12, "College of Veterinary Science, Hisar", "Hisar", "Haryana", LUVAS, false, null, 100, 15, null],
  [13, "International Institute of Veterinary Education and Research, Rohtak", "Rohtak", "Haryana", LUVAS, true, null, 100, 15, null],
  [14, "RPS College of Veterinary Sciences", "Mahendergarh", "Haryana", LUVAS, true, "Satnali Road, Balana, Dist. Mahendergah, Haryana", 80, null, "2027-06-30", "RPS College of Veterinary Sciences, Satnali Road, Balana, Dist. Mahendergah, Haryana"],
  [15, "M.R. College of Veterinary Science and Research Centre, Jhajjar", "Jhajjar", "Haryana", LUVAS, true, null, 80, null, "2027-06-30"],
  [16, "Sanskaram College of Veterinary & Animal Science, Jhajjar", "Jhajjar", "Haryana", "Sanskaram University, Jhajjar", true, null, 80, null, "2027-06-30", "Sanskaram College of Veterinary & Animal Science, Jhajjar, Haryana"],
  [17, "Dr. G.C. Negi College of Veterinary and Animal Sciences, Palampur", "Palampur", "Himachal Pradesh", "CSK Himachal Pradesh Krishi Vishwavidyalaya, Palampur", false, null, 75, 11, null],
  [18, "Faculty of Veterinary Sciences & Animal Husbandry, Jammu", "Jammu", "Jammu and Kashmir", "Sher-e Kashmir University of Agricultural Sciences & Technology, Jammu", false, null, 88, 13, null],
  [19, "Faculty of Veterinary Sciences & Animal Husbandry, Srinagar", "Srinagar", "Jammu and Kashmir", "Sher-e Kashmir University of Agricultural Sciences & Technology, Kashmir", false, null, 75, 11, null, "Faculty of Veterinary Sciences & Animal Husbandry, Srinagar, Kashmir"],
  [20, "Ranchi College of Veterinary Science and Animal Husbandry, Ranchi", "Ranchi", "Jharkhand", "Birsa Agricultural University, Ranchi", false, null, 75, 11, null],
  [21, "Veterinary College Hebbal, Bangalore", "Bangalore", "Karnataka", KVAFSU, false, null, 100, 15, null],
  [22, "Veterinary College Nandinagar, Bidar", "Bidar", "Karnataka", KVAFSU, false, null, 75, 11, null],
  [23, "Veterinary College, Hassan", "Hassan", "Karnataka", KVAFSU, false, null, 100, 15, null],
  [24, "Veterinary College, Shimoga", "Shimoga", "Karnataka", KVAFSU, false, null, 100, 15, null],
  [25, "Veterinary College, Gadag", "Gadag", "Karnataka", KVAFSU, false, null, 80, 12, null],
  [26, "College of Veterinary & Animal Sciences, Thrissur", "Thrissur", "Kerala", KVASU, false, null, 125, 19, null],
  [27, "College of Veterinary and Animal Sciences, Pookote", "Pookote", "Kerala", KVASU, false, null, 100, 15, null],
  [28, "College of Veterinary Science & Animal Husbandry, Jabalpur", "Jabalpur", "Madhya Pradesh", NDVSU, false, null, 100, 15, null],
  [29, "College of Veterinary Science & Animal Husbandry, Mhow", "Mhow", "Madhya Pradesh", NDVSU, false, null, 100, 15, null],
  [30, "College of Veterinary Science & Animal Husbandry, Rewa", "Rewa", "Madhya Pradesh", NDVSU, false, null, 100, 15, null],
  [31, "Mumbai Veterinary College, Mumbai", "Mumbai", "Maharashtra", MAFSU, false, null, 100, 15, null],
  [32, "Nagpur Veterinary College, Nagpur", "Nagpur", "Maharashtra", MAFSU, false, null, 100, 15, null],
  [33, "College of Veterinary & Animal Sciences, Parbhani", "Parbhani", "Maharashtra", MAFSU, false, null, 100, 15, null],
  [34, "K.N.P. College of Veterinary Sciences, Satara", "Satara", "Maharashtra", MAFSU, false, null, 75, 11, null],
  [35, "College of Veterinary & Animal Sciences, Udgir", "Udgir", "Maharashtra", MAFSU, false, null, 80, 12, null],
  [36, "College of Veterinary Science & Animal Husbandry, Aizawl", "Aizawl", "Mizoram", CAU, false, null, 100, 15, null, "College of Veterinary Science & Animal Husbandry, Aizawl, Mizoram"],
  // VCI prints this college under the Mizoram heading (its university's grouping); its address is in Nagaland.
  [37, "College of Veterinary Science and Animal Husbandry, Jalukie", "Peren", "Nagaland", CAU, false, "Jalukie, Peren, Nagaland", 37, 5, null, "College of Veterinary Science and Animal Husbandry, Jalukie, Peren, Nagaland"],
  [38, "College of Veterinary Science and Animal Husbandry, Bhubaneswar", "Bhubaneswar", "Odisha", "Orissa University of Agriculture & Technology, Bhubaneswar", false, null, 100, 15, null],
  [39, "Institute of Veterinary Science & Animal Husbandry, Campus-IV", null, "Odisha", "Siksha 'O' Anusandhan Deemed to be University", true, null, 80, null, "2028-04-30"],
  [40, "School of Veterinary and Animal Sciences, Gajapati", "Gajapati", "Odisha", "Centurion University of Technology and Management, Odisha", true, null, 80, null, "2029-01-31", "School of Veterinary and Animal Sciences, Gajapati, Odisha"],
  [41, "Rajiv Gandhi Institute of Veterinary Education and Research, Puducherry", "Puducherry", "Puducherry", "Pondicherry University, Puducherry", false, null, 100, 15, null],
  [42, "College of Veterinary Science, Ludhiana", "Ludhiana", "Punjab", GADVASU, false, null, 100, 15, null],
  [43, "Khalsa College of Veterinary and Animal Sciences, Amritsar", "Amritsar", "Punjab", GADVASU, true, null, 100, 15, null],
  [44, "College of Veterinary Science, Rampura Phul", "Bathinda", "Punjab", GADVASU, false, "Rampura Phul, Bathinda", 80, 12, "2025-11-20", "College of Veterinary Science, Rampura Phul, Bathinda"],
  [45, "College of Veterinary and Animal Science, Bikaner", "Bikaner", "Rajasthan", RAJUVAS, false, null, 100, 15, null],
  [46, "Mahatma Jyotiba Fule College of Veterinary & Animal Science, Chomu", "Jaipur", "Rajasthan", RAJUVAS, true, "Chomu, Jaipur", 100, 15, null, "Mahatma Jyotiba Fule College of Veterinary & Animal Science, Chomu, Jaipur"],
  [47, "Apollo College of Veterinary Medicine, Jaipur", "Jaipur", "Rajasthan", RAJUVAS, true, null, 100, 15, null],
  [48, "Post Graduate Institute of Veterinary Education and Research, Jaipur", "Jaipur", "Rajasthan", RAJUVAS, false, null, 100, 15, null],
  [49, "College of Veterinary and Animal Science, Navania", "Udaipur", "Rajasthan", RAJUVAS, false, "Navania, Udaipur", 100, 15, null, "College of Veterinary and Animal Science, Navania, Udaipur"],
  [50, "Arawali Veterinary College, Sikar", "Sikar", "Rajasthan", RAJUVAS, true, null, 100, 15, null],
  [51, "M.B. Veterinary College, Dungarpur", "Dungarpur", "Rajasthan", RAJUVAS, true, null, 80, 12, "2026-06-10", "M.B. Veterinary College, Dungarpur, Rajasthan"],
  [52, "Shourabh College of Veterinary Science, Hindaun City", "Karauli", "Rajasthan", RAJUVAS, true, "Hindaun City, Karauli, Rajasthan", 80, null, "2027-07-20", "Shourabh College of Veterinary Science, Hindaun City, Karauli, Rajasthan"],
  [53, "R.R. College of Veterinary and Animal Science, Deoli", "Tonk", "Rajasthan", RAJUVAS, true, "Deoli, Tonk Jaipur", 80, null, "2027-07-20", "R.R. College of Veterinary and Animal Science, Deoli, Tonk Jaipur"],
  [54, "Mahatma Gandhi Veterinary College, Bharatpur", "Bharatpur", "Rajasthan", RAJUVAS, true, null, 80, null, "2027-07-20"],
  [55, "Sri Ganganagar Veterinary College, Sri Ganganagar", "Sri Ganganagar", "Rajasthan", "Tantia University", true, null, 80, null, "2027-12-15", "Sri Ganganagar Veterinary College, Sri Ganganagar, Rajasthan"],
  [56, "Madras Veterinary College, Chennai", "Chennai", "Tamil Nadu", TANUVAS, false, null, 100, 15, null],
  [57, "College of Veterinary Science and Research Institute, Namakkal", "Namakkal", "Tamil Nadu", TANUVAS, false, null, 100, 15, null],
  [58, "Veterinary College and Research Institute, Orthanadu", "Orthanadu", "Tamil Nadu", TANUVAS, false, null, 100, 15, null],
  [59, "Veterinary College and Research Institute, Tirunelveli", "Tirunelveli", "Tamil Nadu", TANUVAS, false, null, 100, 15, null],
  [60, "Veterinary College and Research Institute, Udumalpet", "Udumalpet", "Tamil Nadu", TANUVAS, false, null, 80, 12, "2026-10-08"],
  [61, "Veterinary College and Research Institute, Theni", "Theni", "Tamil Nadu", TANUVAS, false, null, 80, 12, "2026-10-08"],
  [62, "Veterinary College and Research Institute, Salem", "Salem", "Tamil Nadu", TANUVAS, false, null, 80, 12, "2026-10-08"],
  [63, "College of Veterinary Science, Hyderabad", "Hyderabad", "Telangana", PVNRTVU, false, null, 100, 15, null],
  [64, "College of Veterinary Science, Korutla", "Korutla", "Telangana", PVNRTVU, false, null, 100, 15, null],
  [65, "College of Veterinary Science, Mamnoor", "Warangal", "Telangana", PVNRTVU, false, "Mamnoor, Warangal", 80, 12, "2026-02-12", "College of Veterinary Science, Mamnoor, Warangal"],
  [66, "College of Veterinary Science and Animal Husbandry, R.K. Nagar", "Agartala", "Tripura", "Tripura University, Agartala", false, "R.K. Nagar, Agartala, Tripura", 63, 9, null, "College of Veterinary Science and Animal Husbandry at R.K. Nagar, Agartala, Tripura"],
  [67, "College of Veterinary Science and Animal Husbandry, Ayodhya", "Ayodhya", "Uttar Pradesh", "Acharya Narendra Deva University of Agriculture & Technology, Kumarganj, Ayodhya", false, null, 100, 12, null],
  [68, "College of Veterinary Science and Animal Husbandry, Mathura", "Mathura", "Uttar Pradesh", "Uttar Pradesh Pandit Deen Dayal Upadhyay Pashu Chikitsa Vigyan Vishwavidyalay Evam Go Anusandhan Sansthan, Mathura", false, null, 100, 15, null],
  // VCI names IVRI's own deemed university as its university; left empty so the record is not affiliated to itself.
  [69, "ICAR-Indian Veterinary Research Institute", "Bareilly", "Uttar Pradesh", null, false, "Izatnagar, Bareilly", 30, 4, null],
  [70, "College of Veterinary and Animal Sciences, Meerut", "Meerut", "Uttar Pradesh", "Sardar Vallabh Bhai Patel University of Agriculture & Technology, Meerut", false, null, 100, 12, null],
  [71, "Faculty of Veterinary and Animal Sciences, Institute of Agricultural Sciences, Rajiv Gandhi South Campus, Barkachha", "Barkachha", "Uttar Pradesh", "Banaras Hindu University, Varanasi", false, null, 60, 9, null],
  [72, "College of Veterinary & Animal Sciences, Pantnagar", "Pantnagar", "Uttarakhand", "Govind Ballabh Pant University of Agriculture & Technology, Pantnagar", false, null, 76, 11, null],
  [73, "Faculty of Veterinary & Animal Sciences, Mohanpur", "Nadia", "West Bengal", "West Bengal University of Animal & Fishery Sciences, Kolkata", false, "Mohanpur, Nadia", 100, 15, null, "Faculty of Veterinary & Animal Sciences, Mohanpur, Nadia"],
];

// Provisional list (LOP or renewal of LOP issued), in VCI's order (serial numbers 1 to 24). VCI prints no
// seats here. Where a VCI meeting recommended the LOP for a stated number of annual admissions, that
// number and the minutes are recorded; otherwise seats stay null.
// [serial, name, place, state, university, private, address, seats, seatsSource, wefSession, listedAs?]
const provisional = [
  [1, "College of Veterinary Science, Garividi", "Garividi", "Andhra Pradesh", SVVU, false, null, null, null, null, "College of Veterinary Science at Garividi"],
  [2, "College of Veterinary and Animal Sciences, Kishanganj", "Kishanganj", "Bihar", "Bihar Animal Sciences University, Patna", false, null, null, null, null, "College of Veterinary and Animal Sciences, Kishanganj, Bihar"],
  [3, "College of Veterinary Science & Animal Husbandry, Bilaspur", "Bilaspur", "Chhattisgarh", "Dau Shri Vasudev Chandrakar Kamdhenu Vishwavidyalaya, Durg", false, null, 80, "M2", "2026-27"],
  [4, "Goa College of Veterinary & Animal Sciences", "Ponda", "Goa", "Goa University", false, "Curli-Ponda, Goa", 80, "M2", "2026-27", "Goa College of Veterinary & Animal Sciences at Curli-Ponda, Goa"],
  [5, "College of Veterinary Science & Animal Husbandry, Himmatnagar", "Himmatnagar", "Gujarat", "Kamdhenu University, Gujarat", false, null, null, null, null, "College of Veterinary Science & Animal Husbandry, Himmatnagar, Gujarat"],
  [6, "College of Veterinary Science and Animal Husbandry, Bhuj", "Kutch", "Gujarat", "Kamdhenu University, Gujarat", false, "Bhuj, Kutch, Gujarat", 80, "M1", "2026-27", "College of Veterinary Science and Animal Husbandry, Bhuj, Kutch, Gujarat"],
  [7, "Shri Bhaurao Deshpande Veterinary College, Athani", "Athani", "Karnataka", KVAFSU, false, null, null, null, null],
  [8, "College of Veterinary & Animal Sciences, Datia", "Datia", "Madhya Pradesh", "Rani Lakshmi Bai Central Agricultural University, Jhansi", false, null, 80, "M3", null, "College of Veterinary & Animal Sciences, Datia, Madhya Pradesh"],
  [9, "College of Veterinary & Animal Sciences, Akola", "Akola", "Maharashtra", MAFSU, false, null, null, null, null],
  [10, "College of Veterinary and Animal Sciences, Banda", "Banda", "Uttar Pradesh", "Banda University of Agriculture & Technology, Banda, Uttar Pradesh", false, null, 80, "M2", "2026-27"],
  [11, "Bhumika College of Veterinary Science and Research Centre, Mahendergarh", "Mahendergarh", "Haryana", LUVAS, true, null, null, null, null],
  [12, "B.D.M. College of Veterinary Sciences & Research Centre, Jhajjar", "Jhajjar", "Haryana", LUVAS, true, null, 80, "M2", "2026-27", "B.D.M. College of Veterinary Sciences & Research Centre, Jhajjar, Haryana"],
  [13, "School of Veterinary Sciences, Chailchowk", "Mandi", "Himachal Pradesh", "Abhilashi University, Mandi, Himachal Pradesh", true, "Chailchowk, Tehsil Chachyot, District Mandi, Himachal Pradesh", null, null, null, "School of Veterinary Sciences, Chailchowk, Tehsil Chachyot, District Mandi, Himachal Pradesh"],
  [14, "Parikarma Veterinary Science College, Ahilyanagar", "Ahilyanagar", "Maharashtra", MAFSU, true, null, null, null, "2026-27", "Parikarma Veterinary Science College, Ahilyanagar, Maharashtra"],
  [15, "Yashodeep Veterinary College, Murbad", "Thane", "Maharashtra", MAFSU, true, "Murbad, Thane", 80, "M2", "2026-27", "Yashodeep Veterinary College, Murbad, Thane"],
  [16, "Tatyasaheb Kore Institute of Veterinary & Animal Science, Warananagar", "Warananagar", "Maharashtra", MAFSU, true, null, 80, "M2", "2026-27"],
  [17, "Dr. Rajendra Suryawanshi College of Veterinary & Animal Sciences, Gandheli", "Chhatrapati Sambhajinagar", "Maharashtra", MAFSU, true, "Gandheli, Chh. Sambhajinagar, Maharashtra", 80, "M2", "2026-27", "Dr. Rajendra Suryawanshi College of Veterinary & Animal Sciences, Gandheli, Chh. Sambhajinagar, Maharashtra"],
  [18, "Shekawati Veterinary College, Sikar", "Sikar", "Rajasthan", RAJUVAS, true, null, null, null, null, "Shekawati Veterinary College, Sikar, Rajasthan"],
  [19, "Ramkumari College of Veterinary Science", null, "Rajasthan", RAJUVAS, true, null, null, null, null, "Ramkumari College of Veterinary Science, Rajasthan"],
  [20, "Mahala Veterinary College, Sikar", "Sikar", "Rajasthan", RAJUVAS, true, null, null, null, null, "Mahala Veterinary College, Sikar, Rajasthan"],
  [21, "School of Veterinary Science & Animal Husbandry, Bijnor", "Bijnor", "Uttar Pradesh", "Vivek University, Bijnor, Uttar Pradesh", true, "Moradabad, Bijnor, U.P.", 80, "M2", "2026-27", "School of Veterinary Science & Animal Husbandry, Moradabad, Bijnor, U.P."],
  [22, "SM College of Veterinary and Animal Research, Pali Dungra", "Mathura", "Uttar Pradesh", "K.M. University, Pali Dungra, Mathura, Uttar Pradesh", true, "Pali Dungra, Mathura, Uttar Pradesh", 80, "M2", "2026-27", "SM College of Veterinary and Animal Research, Pali Dungra, Mathura, Uttar Pradesh"],
  [23, "Faculty of Veterinary Science and Cow Research Centre, Pohalli", "Meerut", "Uttar Pradesh", "Mahaveer University, Meerut", true, "Pohalli, Meerut", 80, "M2", "2026-27", "Faculty of Veterinary Science and Cow Research Centre, Pohalli, Meerut"],
  [24, "JIS College of Veterinary and Animal Sciences, Mogra", "Hooghly", "West Bengal", "West Bengal University of Animal & Fishery Sciences, Kolkata", true, "Mogra, Hooghly, West Bengal", null, null, null, "JIS College of Veterinary and Animal Sciences, Mogra, Hooghly, West Bengal"],
];

// The place column above is the town VCI writes after the college name (it also feeds the code hash, so it
// stays as transcribed). It becomes the row's city. district is set only where VCI's name or address gives a
// district: "Town, District" or "Dist. X". These rows differ from that default, as [city, district]:
const PLACES = {
  // "Lakhimpur" is part of the college name and names both a district and (as North Lakhimpur) the town.
  R5: [null, null],
  R14: ["Balana", "Mahendergarh"], // Satnali Road, Balana, Dist. Mahendergah
  R37: ["Jalukie", "Peren"],
  R40: [null, "Gajapati"], // Gajapati is a district, not a town
  R44: ["Rampura Phul", "Bathinda"],
  R46: ["Chomu", "Jaipur"],
  R49: ["Navania", "Udaipur"],
  R52: ["Hindaun City", "Karauli"],
  R53: ["Deoli", "Tonk"],
  R65: ["Mamnoor", "Warangal"],
  R73: ["Mohanpur", "Nadia"],
  P6: ["Bhuj", "Kutch"],
  P13: ["Chailchowk", "Mandi"], // Chailchowk, Tehsil Chachyot, District Mandi
  P15: ["Murbad", "Thane"],
  P17: ["Gandheli", "Chhatrapati Sambhajinagar"],
  P22: ["Pali Dungra", "Mathura"],
  P23: ["Pohalli", "Meerut"],
  P24: ["Mogra", "Hooghly"],
};
const placeOf = (key, place) => {
  const [city, district] = PLACES[key] ?? [place, null];
  return { district, city };
};

// Hand-checked: VCI lists IVRI itself (not a constituent college) under its own deemed university.
const SAME_AS = { "R69": { scheme: "nirf", value: "U-0518" } };

const code = (state, name, town) =>
  "vci-" + createHash("sha1").update(`${state}|${name}|${town ?? ""}`.toLowerCase().replace(/\s+/g, " ")).digest("hex").slice(0, 10);

const rows = [];
for (const [serial, name, place, state, university, pvt, address, seats, quota, recognisedFrom, listedAs] of recognised) {
  const row = {
    code: code(state, name, place),
    name,
    address,
    ...placeOf(`R${serial}`, place),
    state,
    management: pvt ? "Private Sector" : null,
    ownership: pvt ? "private" : "government",
    university,
    source: "S",
    vci_list: "recognised",
    vci_serial: serial,
    listed_as: listedAs ?? name,
    recognised_from: recognisedFrom,
    vci_quota_seats: quota,
    offerings: [{ course: "bvsc-ah", seats }],
  };
  if (SAME_AS[`R${serial}`]) row.same_as = SAME_AS[`R${serial}`];
  rows.push(row);
}
for (const [serial, name, place, state, university, pvt, address, seats, seatsSource, wef, listedAs] of provisional) {
  rows.push({
    code: code(state, name, place),
    name,
    address,
    ...placeOf(`P${serial}`, place),
    state,
    management: pvt ? "Private Sector" : "Government Sector",
    ownership: pvt ? "private" : "government",
    university,
    source: seatsSource ?? "P",
    vci_list: "provisional",
    vci_serial: serial,
    listed_as: listedAs ?? name,
    lop_from_session: wef,
    offerings: [{ course: "bvsc-ah", seats }],
  });
}

const out = {
  council: "VCI",
  scheme: "vci",
  stream: "veterinary",
  academic_year: "2026-27",
  sources,
  note:
    "Every college in VCI's list of recognised veterinary colleges (First Schedule to the Indian Veterinary Council Act, 1984) and its list of provisionally recognised colleges with a Letter of Permission, both as on 22.10.2026. VCI publishes no college codes, so each college is keyed by a hash of its state, name and town. " +
      "city is the town VCI writes with the college; district is filled only where VCI's name or address gives one ('Town, District' or 'Dist. X'). " +
    "B.V.Sc. & A.H. seats for recognised colleges are the 'Seats Approved by Central Govt.' in VCI's seats list, which is undated but covers the same 73 colleges; every college's 15% VCI quota in the 2026-27 counselling bulletin (https://www.vci.dahd.gov.in/sites/default/files/News%20update/CompositIBAY2026-27.pdf, Annexure 2, 858 seats in 64 colleges) is within rounding of 15% of those seats, except Ayodhya and Meerut (100 approved seats, quota 12). That quota is kept as vci_quota_seats. " +
    "VCI prints no seats for provisionally recognised colleges: where a VCI meeting recommended the LOP for a stated number of annual admissions, that number is used and the minutes are the source; the rest stay null. " +
    "recognised_from is the date from which VCI recognises the degree ('granted on or after'). VCI publishes no college-wise M.V.Sc. list, so no M.V.Sc. intake is recorded. " +
    "College of Veterinary Science and Animal Husbandry, Jalukie is printed under Mizoram (Central Agricultural University) but is in Nagaland. same_as links the college to the NIRF record for the same institution (checked by hand); constituent colleges are not linked to their parent universities.",
  rows,
};

writeFileSync(path.join(root, "data", "councils", "vci.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`vci.json: ${rows.length} colleges`);
