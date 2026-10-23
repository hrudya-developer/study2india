/*
 * Official district names per state or union territory, and the variant spellings the
 * regulators' lists use for them. Used by normaliseDistrict in lib/districts.ts, which every
 * write to institutions.district goes through.
 *
 * Source, retrieved 2026-10-24:
 * - The Local Government Directory (lgdirectory.gov.in, Ministry of Panchayati Raj) could not be
 *   used: its district listing sits behind a captcha and the site was not reachable from the
 *   build environment.
 * - Base: Census of India 2011 district names, updated for the districts created or renamed since
 *   then as listed on Wikipedia's "List of districts in India" and the per-state lists (which follow
 *   the LGD), retrieved 2026-10-24.
 * - Renames checked against the state notifications reported at the time: Ramanagara to
 *   Bengaluru South (Karnataka, May 2025), Karimganj to Sribhumi (Assam, November 2024),
 *   Ahmednagar to Ahilyanagar (Maharashtra, 2024), Aurangabad to Chhatrapati Sambhajinagar and
 *   Osmanabad to Dharashiv (Maharashtra, 2023), Hoshangabad to Narmadapuram (Madhya Pradesh, 2022),
 *   Allahabad to Prayagraj and Faizabad to Ayodhya (Uttar Pradesh, 2018), Gurgaon to Gurugram and
 *   Mewat to Nuh (Haryana, 2016), Warangal Urban to Hanumakonda and Warangal Rural to Warangal
 *   (Telangana, 2021), Sikkim's East, West, South and North districts to Gangtok, Gyalshing, Namchi
 *   and Mangan (2021), Kawardha to Kabirdham (Chhattisgarh), the 2014 Karnataka spellings
 *   (Belagavi, Ballari, Vijayapura, Kalaburagi, Mysuru, Shivamogga, Tumakuru, Chikkamagaluru).
 *
 * Names are keyed by the state names in data/reference.ts. Matching ignores case, spacing,
 * punctuation and a leading or trailing "District"/"Dist.", so only real variants need an alias.
 * After editing anything here, bump DISTRICT_NORMALISER_VERSION in lib/districts.ts; existing
 * databases are rewritten once per version on the next start.
 */

export const DISTRICTS_SOURCE = {
  publisher: "Census of India 2011, updated for later official creations and renames (LGD unreachable)",
  retrieved: "2026-10-24",
};

export const DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", "Chittoor",
    "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool",
    "Markapuram", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Polavaram", "Prakasam",
    "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam",
    "Vizianagaram", "West Godavari", "YSR Kadapa",
  ],
  "Arunachal Pradesh": [
    "Anjaw", "Bichom", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Keyi Panyor",
    "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang",
    "Lower Subansiri", "Namsai", "Pakke-Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap",
    "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang",
  ],
  Assam: [
    "Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang",
    "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat",
    "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon",
    "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Sribhumi", "Tamulpur",
    "Tinsukia", "Udalguri", "West Karbi Anglong",
  ],
  Bihar: [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga",
    "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj",
    "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia",
    "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul",
    "Vaishali", "West Champaran",
  ],
  Chhattisgarh: [
    "Balod", "Baloda Bazar", "Balrampur-Ramanujganj", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada",
    "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker",
    "Khairagarh-Chhuikhadan-Gandai", "Kondagaon", "Korba", "Korea", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur",
    "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti",
    "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja",
  ],
  Goa: ["Kushavati", "North Goa", "South Goa"],
  Gujarat: [
    "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur",
    "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kachchh", "Kheda",
    "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot",
    "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad", "Vav-Tharad",
  ],
  Haryana: [
    "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind",
    "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari",
    "Rohtak", "Sirsa", "Sonipat", "Yamunanagar",
  ],
  "Himachal Pradesh": [
    "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla",
    "Sirmaur", "Solan", "Una",
  ],
  Jharkhand: [
    "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla",
    "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi",
    "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum",
  ],
  Karnataka: [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru South", "Bengaluru Urban", "Bidar",
    "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere",
    "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru",
    "Raichur", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir",
  ],
  Kerala: [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram",
    "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad",
  ],
  "Madhya Pradesh": [
    "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal",
    "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior",
    "Harda", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Maihar", "Mandla", "Mandsaur",
    "Mauganj", "Morena", "Narmadapuram", "Narsinghpur", "Neemuch", "Niwari", "Pandhurna", "Panna", "Raisen",
    "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur",
    "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha",
  ],
  Maharashtra: [
    "Ahilyanagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Chhatrapati Sambhajinagar",
    "Dharashiv", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City",
    "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad",
    "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal",
  ],
  Manipur: [
    "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong",
    "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul",
  ],
  Meghalaya: [
    "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills", "North Garo Hills",
    "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills",
    "West Jaintia Hills", "West Khasi Hills",
  ],
  Mizoram: [
    "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saitual",
    "Serchhip", "Siaha",
  ],
  Nagaland: [
    "Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren",
    "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto",
  ],
  Odisha: [
    "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati",
    "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar",
    "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada",
    "Sambalpur", "Subarnapur", "Sundargarh",
  ],
  Punjab: [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Firozpur", "Gurdaspur",
    "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Pathankot", "Patiala",
    "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib",
    "Tarn Taran",
  ],
  Rajasthan: [
    "Ajmer", "Alwar", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur", "Bhilwara", "Bikaner",
    "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", "Dholpur", "Didwana-Kuchaman", "Dungarpur", "Hanumangarh",
    "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Khairthal-Tijara", "Kota",
    "Kotputli-Behror", "Nagaur", "Pali", "Phalodi", "Pratapgarh", "Rajsamand", "Salumbar", "Sawai Madhopur",
    "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur",
  ],
  Sikkim: ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
  "Tamil Nadu": [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
    "Kallakurichi", "Kancheepuram", "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
    "Tenkasi", "Thanjavur", "The Nilgiris", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",
  ],
  Telangana: [
    "Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally",
    "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad",
    "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda",
    "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Sangareddy",
    "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri",
  ],
  Tripura: [
    "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura",
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat",
    "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun",
    "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad",
    "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi",
    "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi",
    "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau",
    "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Rae Bareli",
    "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti",
    "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi",
  ],
  Uttarakhand: [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal",
    "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi",
  ],
  "West Bengal": [
    "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah",
    "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas",
    "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia",
    "South 24 Parganas", "Uttar Dinajpur",
  ],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  Chandigarh: ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  Delhi: [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara",
    "South Delhi", "South East Delhi", "South West Delhi", "West Delhi",
  ],
  "Jammu and Kashmir": [
    "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam",
    "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur",
  ],
  Ladakh: ["Kargil", "Leh"],
  Lakshadweep: ["Lakshadweep"],
  Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
};

/**
 * Misspellings, older names and other spellings of a district, checked by hand against the list
 * above. Values must be names in DISTRICTS for the same state.
 */
export const DISTRICT_ALIASES: Record<string, Record<string, string>> = {
  "Andhra Pradesh": {
    Anantapur: "Ananthapuramu", Ananthapur: "Ananthapuramu", Anantapuram: "Ananthapuramu", Anantapuramu: "Ananthapuramu",
    Chitoor: "Chittoor", Chittor: "Chittoor",
    Nellore: "Sri Potti Sriramulu Nellore", "SPSR Nellore": "Sri Potti Sriramulu Nellore",
    Kadapa: "YSR Kadapa", Cuddapah: "YSR Kadapa", YSR: "YSR Kadapa", "Y.S.R.": "YSR Kadapa", "Y.S.R. Kadapa": "YSR Kadapa",
    Vishakhapatnam: "Visakhapatnam", Vizag: "Visakhapatnam",
    Konaseema: "Dr. B.R. Ambedkar Konaseema", "Ambedkar Konaseema": "Dr. B.R. Ambedkar Konaseema",
    Ananthapuram: "Ananthapuramu",
  },
  "Arunachal Pradesh": { "Upper Dibang Valley": "Dibang Valley" },
  Assam: {
    "Kamrup Rural": "Kamrup", "Kamrup Metro": "Kamrup Metropolitan",
    Marigaon: "Morigaon", Nagoan: "Nagaon", Sibsagar: "Sivasagar", Karimganj: "Sribhumi", "North Cachar Hills": "Dima Hasao",
  },
  Bihar: {
    Purnea: "Purnia", Bhabua: "Kaimur", "Purbi Champaran": "East Champaran", "Pashchim Champaran": "West Champaran",
    Muzzafarpur: "Muzaffarpur",
  },
  Chhattisgarh: {
    Balrampur: "Balrampur-Ramanujganj", Baster: "Bastar", Gariyaband: "Gariaband", Kawardha: "Kabirdham",
    Koria: "Korea", Koriya: "Korea", Sarguja: "Surguja", "Uttar Bastar Kanker": "Kanker", "Dakshin Bastar Dantewada": "Dantewada",
    Janjgir: "Janjgir-Champa",
  },
  Gujarat: {
    Ahmadabad: "Ahmedabad", Arvalli: "Aravalli", Aravali: "Aravalli", Chhotaudepur: "Chhota Udaipur", "Chhota Udepur": "Chhota Udaipur",
    "The Dangs": "Dang", Dangs: "Dang", Kutch: "Kachchh", Kachh: "Kachchh", Mahesana: "Mehsana", Baroda: "Vadodara",
    "Panch Mahals": "Panchmahal", Panchmahals: "Panchmahal",
    Vadodra: "Vadodara",
    Vododara: "Vadodara",
  },
  Haryana: {
    Gurgaon: "Gurugram", Hissar: "Hisar", Mahendergarh: "Mahendragarh", Maohindergarh: "Mahendragarh",
    Mahindergarh: "Mahendragarh", Mewat: "Nuh", Sonepat: "Sonipat", Sonepet: "Sonipat",
  },
  "Himachal Pradesh": { Kulu: "Kullu", Sirmour: "Sirmaur", "Lahul and Spiti": "Lahaul and Spiti" },
  Jharkhand: {
    "East Singhabhum": "East Singhbhum", "Purbi Singhbhum": "East Singhbhum", "Paschim Singhbhum": "West Singhbhum",
    "Pashchimi Singhbhum": "West Singhbhum", Hazaribag: "Hazaribagh", Sahebganj: "Sahibganj",
    Saraikela: "Seraikela Kharsawan", "Saraikela Kharsawan": "Seraikela Kharsawan", "Sareikela and Kharsawan": "Seraikela Kharsawan",
    "Seraikela and Kharsawan": "Seraikela Kharsawan",
  },
  Karnataka: {
    Bagalkote: "Bagalkot", Bellary: "Ballari", Belgaum: "Belagavi", Belagaum: "Belagavi",
    Bangalore: "Bengaluru Urban", Bengaluru: "Bengaluru Urban", "Bangalore Urban": "Bengaluru Urban", "Bangalore Rural": "Bengaluru Rural",
    Ramanagara: "Bengaluru South", Ramanagaram: "Bengaluru South",
    "Chamaraja Nagara": "Chamarajanagar", Chamarajnagar: "Chamarajanagar", Chamarajanagara: "Chamarajanagar",
    Chikaballapur: "Chikkaballapur", Chikkaballapura: "Chikkaballapur", Chickballapur: "Chikkaballapur",
    Chikmagalur: "Chikkamagaluru", Chickmagalur: "Chikkamagaluru",
    Coorg: "Kodagu", "D Kannada": "Dakshina Kannada", "Dakshin Kannada": "Dakshina Kannada", "South Canara": "Dakshina Kannada",
    Davangere: "Davanagere", Dharwar: "Dharwad", Gulbarga: "Kalaburagi", Kalaburgi: "Kalaburagi",
    Mandy: "Mandya", Mysore: "Mysuru", Shimoga: "Shivamogga", Tumkur: "Tumakuru",
    Bijapur: "Vijayapura", Vijayapur: "Vijayapura", "North Canara": "Uttara Kannada",
    Chamrajanagar: "Chamarajanagar", Chikballapur: "Chikkaballapur", Yadgiri: "Yadgir",
    Kalburagi: "Kalaburagi",
  },
  Kerala: {
    Alapuzha: "Alappuzha", Alleppey: "Alappuzha", Calicut: "Kozhikode", Eranakulam: "Ernakulam", Iddukki: "Idukki",
    Kasaragode: "Kasaragod", Kasargod: "Kasaragod", Quilon: "Kollam", Trichur: "Thrissur", Thrussur: "Thrissur",
    Trivandrum: "Thiruvananthapuram", Palghat: "Palakkad", Cannanore: "Kannur", Thodupuzhaidukki: "Idukki",
    Thiruvanthapuram: "Thiruvananthapuram",
    Malapuram: "Malappuram",
  },
  "Madhya Pradesh": { Hoshangabad: "Narmadapuram", Chhattarpur: "Chhatarpur", Narsinhgpur: "Narsinghpur" },
  Maharashtra: {
    Ahmednagar: "Ahilyanagar", Ahmdnagar: "Ahilyanagar", "Ahilya Nagar": "Ahilyanagar",
    Aurangabad: "Chhatrapati Sambhajinagar", "Chhtrapati Sambhajinagar": "Chhatrapati Sambhajinagar",
    Osmanabad: "Dharashiv", Buldana: "Buldhana", Gondiya: "Gondia", Hingloi: "Hingoli", Nasik: "Nashik",
    Parbani: "Parbhani", Prabhani: "Parbhani", Raighar: "Raigad", Satar: "Satara", Sindhudurga: "Sindhudurg",
    Sataramalkapur: "Satara",
  },
  Meghalaya: { Ribhoi: "Ri Bhoi" },
  Mizoram: { Saiha: "Siaha" },
  Nagaland: { "Chümoukedima": "Chumoukedima", "Tseminyü": "Tseminyu" },
  Odisha: {
    Anugul: "Angul", Bolangir: "Balangir", Baleshwar: "Balasore", Baleswar: "Balasore", Bauda: "Boudh",
    Debagarh: "Deogarh", Jagatsinghapur: "Jagatsinghpur", Jagatsinghpura: "Jagatsinghpur", Jajapur: "Jajpur",
    Keonjhar: "Kendujhar", Koenjhar: "Kendujhar", Khurda: "Khordha", Malkanagiri: "Malkangiri",
    Mayurbhanja: "Mayurbhanj", Nawarangapur: "Nabarangpur", Nowrangpur: "Nabarangpur", Sonepur: "Subarnapur",
    Sundergarh: "Sundargarh",
  },
  Punjab: {
    Amritser: "Amritsar", Fatehgarh: "Fatehgarh Sahib", Ferozepur: "Firozpur", Ferozpur: "Firozpur",
    Hoshiyarpur: "Hoshiarpur", Jalanadhar: "Jalandhar", Mohali: "Sahibzada Ajit Singh Nagar",
    "SAS Nagar": "Sahibzada Ajit Singh Nagar", "SAS Nagar Mohali": "Sahibzada Ajit Singh Nagar",
    Mukatsar: "Sri Muktsar Sahib", Muktsar: "Sri Muktsar Sahib", Nawanshahar: "Shahid Bhagat Singh Nagar",
    Nawanshahr: "Shahid Bhagat Singh Nagar", "SBS Nagar": "Shahid Bhagat Singh Nagar", Ropar: "Rupnagar",
    "Taran Taran": "Tarn Taran",
    Bhatinda: "Bathinda",
  },
  Rajasthan: {
    Dungapur: "Dungarpur", Ganganagar: "Sri Ganganagar", Sriganganagar: "Sri Ganganagar", Karoli: "Karauli",
    Rajasmand: "Rajsamand", "Sawai Madhovpur": "Sawai Madhopur", Dhaulpur: "Dholpur", Jalor: "Jalore",
    Chittaurgarh: "Chittorgarh",
  },
  Sikkim: {
    East: "Gangtok", "East Sikkim": "Gangtok", West: "Gyalshing", "West Sikkim": "Gyalshing", Geyzing: "Gyalshing",
    South: "Namchi", "South Sikkim": "Namchi", North: "Mangan", "North Sikkim": "Mangan",
  },
  "Tamil Nadu": {
    Kanchipuram: "Kancheepuram", Kanyakumari: "Kanniyakumari", Nammakkal: "Namakkal", Nilgiris: "The Nilgiris",
    Thanjore: "Thanjavur", Thiruvallur: "Tiruvallur", Thiruvannamalai: "Tiruvannamalai", Thiruvarur: "Tiruvarur",
    Tirupur: "Tiruppur", Villuppuram: "Viluppuram", Villupuram: "Viluppuram", Viruthunagar: "Virudhunagar",
    Thoothukkudi: "Thoothukudi", Tuticorin: "Thoothukudi", Trichy: "Tiruchirappalli", Tiruchi: "Tiruchirappalli",
    Sivagangai: "Sivaganga", Tirupattur: "Tirupathur", Tiruchirapalli: "Tiruchirappalli",
    Pudukottai: "Pudukkottai",
  },
  Telangana: {
    Bhadradri: "Bhadradri Kothagudem", Jogulamba: "Jogulamba Gadwal", Mahaboobnagar: "Mahabubnagar",
    Mahbubnagar: "Mahabubnagar", Medchal: "Medchal-Malkajgiri", Nallonda: "Nalgonda", Rajanna: "Rajanna Sircilla",
    Rangareddi: "Ranga Reddy", "Warangal Urban": "Hanumakonda", "Warangal Rural": "Warangal",
    Hanamkonda: "Hanumakonda", Yadadri: "Yadadri Bhuvanagiri", "Yadadri Bhuvangiri": "Yadadri Bhuvanagiri",
    "Komaram Bheem Asifabad": "Kumuram Bheem Asifabad", "Komaram Bheem": "Kumuram Bheem Asifabad",
    Mehboobnagar: "Mahabubnagar", "Jogulumba Gadwal": "Jogulamba Gadwal", "Kumuram Bheem Asifafabad": "Kumuram Bheem Asifabad", "R.R.": "Ranga Reddy",
    Ranareddy: "Ranga Reddy",
  },
  Tripura: { Gomti: "Gomati" },
  "Uttar Pradesh": {
    Allahabad: "Prayagraj", Pryagraj: "Prayagraj", Faizabad: "Ayodhya", "Ambedakar Nagar": "Ambedkar Nagar",
    Aurauiya: "Auraiya", Oraiya: "Auraiya", Bagpat: "Baghpat", Baahraich: "Bahraich", Baharaich: "Bahraich",
    "Buland Sahar": "Bulandshahr", Bulandsahar: "Bulandshahr", Bulandshahar: "Bulandshahr", Bulandshar: "Bulandshahr",
    Bulandhsahr: "Bulandshahr", Chitrakot: "Chitrakoot", "Gautam Budha Nagar": "Gautam Buddha Nagar",
    "Gautham Buddha Nagar": "Gautam Buddha Nagar", "Gautam Budh Nagar": "Gautam Buddha Nagar",
    "J P Nagar": "Amroha", "Jyotiba Phule Nagar": "Amroha", Almroha: "Amroha", "Kanshi Ram Nagar": "Kasganj",
    "Kashiramnagar": "Kasganj", "Manyavar Kanshiram Nagar": "Kasganj", Kashganj: "Kasganj", Kheri: "Lakhimpur Kheri",
    "Mahamaya Nagar": "Hathras", Merrut: "Meerut", Muzafarnagar: "Muzaffarnagar", Muzzafarnagar: "Muzaffarnagar",
    Pratapgrarh: "Pratapgarh", Partapgarh: "Pratapgarh", "Ramabai Nagar": "Kanpur Dehat",
    "Sant Ravidas Nagar": "Bhadohi", "Sant Ravi Das Nagar": "Bhadohi", Shahajanpur: "Shahjahanpur",
    Shahjanpur: "Shahjahanpur", "Siddarth Nagar": "Siddharthnagar", "Bhimnagar": "Sambhal", Kaushambhi: "Kaushambi",
    Badaun: "Budaun", Shrawasti: "Shravasti",
    Sonebhadra: "Sonbhadra", Varansi: "Varanasi",
  },
  Uttarakhand: { Almorah: "Almora", Pauri: "Pauri Garhwal", Tehri: "Tehri Garhwal", Hardwar: "Haridwar", Dehradum: "Dehradun" },
  "West Bengal": {
    "Koch Behar": "Cooch Behar", Coochbehar: "Cooch Behar", "Pashchim Midnapore": "Paschim Medinipur",
    "Paschim Midnapore": "Paschim Medinipur", "West Midnapore": "Paschim Medinipur", "Purba Midnapore": "Purba Medinipur",
    "East Midnapore": "Purba Medinipur", "Utter Dinajpur": "Uttar Dinajpur", "North Twenty Four Parganas": "North 24 Parganas",
    "South Twenty Four Parganas": "South 24 Parganas", Hugli: "Hooghly", Maldah: "Malda",
  },
  Chandigarh: { "UT Chandigarh": "Chandigarh", "Chandigarh UT": "Chandigarh" },
  Delhi: {
    Central: "Central Delhi", East: "East Delhi", North: "North Delhi", "North East": "North East Delhi",
    "North West": "North West Delhi", South: "South Delhi", "South East": "South East Delhi",
    "South West": "South West Delhi", West: "West Delhi",
  },
  "Jammu and Kashmir": { Badgam: "Budgam", Rajauri: "Rajouri", Bandipore: "Bandipora", Baramula: "Baramulla" },
  Ladakh: { "Leh Ladakh": "Leh" },
  Puducherry: { Pondicherry: "Puducherry" },
};

/**
 * Towns that regulators put in the district column (or that NIRF and others give as the city),
 * mapped to the one district they lie in. Only towns wholly inside a single district are listed;
 * towns whose name is itself a district (a district headquarters of the same name) need no entry.
 */
export const DISTRICT_TOWNS: Record<string, Record<string, string>> = {
  "Andhra Pradesh": {
    Vijayawada: "NTR", Amalapuram: "Dr. B.R. Ambedkar Konaseema", Bhimavaram: "West Godavari",
    Tadepalligudem: "West Godavari", Gannavaram: "Krishna", Garividi: "Vizianagaram", Rajam: "Vizianagaram",
    Ongole: "Prakasam", "Prasanthi Nilayam": "Sri Sathya Sai", Puttaparthi: "Sri Sathya Sai", Proddatur: "YSR Kadapa",
    Rajahmundry: "East Godavari", Rajamahendravaram: "East Godavari", Surampalem: "Kakinada", Tekkali: "Srikakulam",
    Ibrahimpatnam: "NTR",
    Vijaywada: "NTR", Piduguralla: "Palnadu", Kuppam: "Chittoor", Paderu: "Alluri Sitharama Raju",
    Machilipatnam: "Krishna", Chinoutpalli: "Krishna", Guntakal: "Ananthapuramu", Nellimarla: "Vizianagaram",
  },
  "Arunachal Pradesh": { Itanagar: "Papum Pare", Naharlagun: "Papum Pare" },
  Assam: { Silchar: "Cachar", Tezpur: "Sonitpur", Diphu: "Karbi Anglong", Beltola: "Kamrup Metropolitan" },
  Bihar: {
    Sasaram: "Rohtas", Hajipur: "Vaishali", Motihari: "East Champaran", Bettiah: "West Champaran",
    "Laheria Sarai": "Darbhanga", Laheriasarai: "Darbhanga", Lehriasarai: "Darbhanga",
  },
  Chhattisgarh: {
    Bhilai: "Durg", "New Raipur": "Raipur", "Nava Raipur": "Raipur", Jagdalpur: "Bastar", Kunkuri: "Jashpur",
    Manendragarh: "Manendragarh-Chirmiri-Bharatpur",
  },
  Goa: {
    Ponda: "North Goa", Panaji: "North Goa", Mapusa: "North Goa", Margao: "South Goa", Madgaon: "South Goa",
    Cuncolim: "South Goa", Shiroda: "North Goa",
  },
  Gujarat: {
    Nadiad: "Kheda", Siddhpur: "Patan", Vadasma: "Mehsana", "Vallabh Vidyanagar": "Anand",
    "Vallabh Vidhyanagar": "Anand", Visnagar: "Mehsana", Himmatnagar: "Sabarkantha", Sardarkrushinagar: "Banaskantha",
    "Ganpat Vidyanagar": "Mehsana",
    Karmsad: "Anand", Godhra: "Panchmahal", Rajpipla: "Narmada", Palanpur: "Banaskantha", Bhuj: "Kachchh",
  },
  Haryana: {
    Bahadurgarh: "Jhajjar", Narnaul: "Mahendragarh", Mullana: "Ambala", Nalhar: "Nuh", Agroha: "Hisar", Sadopur: "Ambala", Koriawas: "Mahendragarh",
    Chandimandir: "Panchkula",
  },
  "Himachal Pradesh": {
    Nalagarh: "Solan", Baddi: "Solan", Palampur: "Kangra", "Paonta Sahib": "Sirmaur", "Sunder Nagar": "Mandi",
    Sundernagar: "Mandi",
    Nahan: "Sirmaur", Tanda: "Kangra",
  },
  Jharkhand: { Jamshedpur: "East Singhbhum", Jameshedpur: "East Singhbhum" },
  Karnataka: {
    Aland: "Kalaburagi", Badami: "Bagalkot", Jamkhandi: "Bagalkot", Jamakhandi: "Bagalkot", Hubballi: "Dharwad",
    Hubli: "Dharwad", Mangaluru: "Dakshina Kannada", Mangalore: "Dakshina Kannada", Manipal: "Udupi", Nitte: "Udupi",
    Surathkal: "Dakshina Kannada", Sullia: "Dakshina Kannada", Ujire: "Dakshina Kannada", Virajpet: "Kodagu",
    KGF: "Kolar", "Kolar Gold Fields": "Kolar", Athani: "Belagavi", Humnabad: "Bidar", Hosapete: "Vijayanagara",
    Hospet: "Vijayanagara", Karwar: "Uttara Kannada",
    Devanahalli: "Bengaluru Rural", Devanhalli: "Bengaluru Rural", Harohalli: "Bengaluru South",
    Moodbidri: "Dakshina Kannada", Moodabidri: "Dakshina Kannada",
  },
  Kerala: {
    Kochi: "Ernakulam", Cochin: "Ernakulam", Aluva: "Ernakulam", Kothamangalam: "Ernakulam", Muvattupuzha: "Ernakulam",
    Neyyattinkara: "Thiruvananthapuram", Pandalam: "Pathanamthitta", Thiruvalla: "Pathanamthitta",
    Kollappally: "Kottayam", Anjarakandy: "Kannur", Areekode: "Malappuram", Chalakudy: "Thrissur",
    Chalissery: "Palakkad", Kattappana: "Idukki", Kuttikanam: "Idukki", Payyanur: "Kannur",
    Perinthalmanna: "Malappuram", Pookode: "Wayanad", Pookote: "Wayanad", Taliparamba: "Kannur",
    Thamarassery: "Kozhikode", Thodupuzha: "Idukki",
    Tiruvalla: "Pathanamthitta", Kolenchery: "Ernakulam", Konni: "Pathanamthitta", Mangode: "Palakkad",
    Manjeri: "Malappuram", Perintalmanna: "Malappuram",
  },
  "Madhya Pradesh": { Lalburra: "Balaghat", Lalbarra: "Balaghat", Teonthar: "Rewa", Mhow: "Indore" },
  Maharashtra: {
    Amalner: "Jalgaon", Chalisgaon: "Jalgaon", Faizpur: "Jalgaon", Ambajogai: "Beed", Baramati: "Pune",
    Junnar: "Pune", Ghodnadi: "Pune", "Shirur Ghodnadi": "Pune", Purndar: "Pune", Purandar: "Pune",
    Chandwad: "Nashik", Dondaicha: "Dhule", Ichalkaranji: "Kolhapur", Warananagar: "Kolhapur", Jath: "Sangli",
    Miraj: "Sangli", Kamptee: "Nagpur", Kankavali: "Sindhudurg", Kopargaon: "Ahilyanagar", Kapargaon: "Ahilyanagar",
    Parner: "Ahilyanagar", Sangamner: "Ahilyanagar", Shevgaon: "Ahilyanagar", Shrigonda: "Ahilyanagar",
    Shrirampur: "Ahilyanagar", Rahuri: "Ahilyanagar", Panvel: "Raigad", Vaijapur: "Chhatrapati Sambhajinagar",
    Karad: "Satara", Udgir: "Latur", Pimpri: "Pune",
    Alibag: "Raigad", Ambernath: "Thane", Vashi: "Thane", Nerul: "Thane", Andheri: "Mumbai Suburban",
    Juhu: "Mumbai Suburban", "Vile Parle": "Mumbai Suburban", Sion: "Mumbai City",
  },
  Meghalaya: { Shillong: "East Khasi Hills" },
  Odisha: {
    Bhubaneswar: "Khordha", Berhampur: "Ganjam", Brahmapur: "Ganjam", Rourkela: "Sundargarh",
    Paralakhemundi: "Gajapati", Gunupur: "Rayagada",
    Baripada: "Mayurbhanj", Talcher: "Angul", Burla: "Sambalpur",
  },
  Punjab: {
    Abohar: "Fazilka", "New Chandigarh": "Sahibzada Ajit Singh Nagar", "Dera Bassi": "Sahibzada Ajit Singh Nagar",
    "Mandi Gobindgarh": "Fatehgarh Sahib",
    Phagwara: "Kapurthala", Sunam: "Sangrur", "Ferozepur City": "Firozpur", Hariana: "Hoshiarpur",
  },
  Rajasthan: {
    Kekri: "Ajmer", Newai: "Tonk", Pindwara: "Sirohi", Pindwada: "Sirohi", Pilani: "Jhunjhunu", Sanganer: "Jaipur",
    Kotputli: "Kotputli-Behror",
  },
  Sikkim: { Rangpo: "Pakyong" },
  "Tamil Nadu": {
    Kumbakonam: "Thanjavur", Nagercoil: "Kanniyakumari", Cheyyar: "Tiruvannamalai", Chidambaram: "Cuddalore",
    Courtallam: "Tenkasi", Gobichettipalayam: "Erode", Kalavakkam: "Chengalpattu", Kaliakkavilai: "Kanniyakumari",
    Karaikudi: "Sivaganga", Kelambakkam: "Chengalpattu", Kovilpatti: "Thoothukudi", Kulasekharam: "Kanniyakumari",
    Madhuranthagam: "Chengalpattu", Melmaruvathur: "Chengalpattu", Melvisharam: "Ranipet", Ooty: "The Nilgiris",
    Udhagamandalam: "The Nilgiris", Orthanadu: "Thanjavur", Perundurai: "Erode", Pollachi: "Coimbatore",
    Sivakasi: "Virudhunagar", Sriperumbudur: "Kancheepuram", Tiruchengode: "Namakkal", Udumalpet: "Tiruppur",
    Udumalaipettai: "Tiruppur", Uthamapalayam: "Theni", Samayapuram: "Tiruchirappalli",
    Maduranthagam: "Chengalpattu", Enathur: "Kancheepuram", Omandurar: "Chennai",
  },
  Telangana: {
    Ibrahimpatan: "Ranga Reddy", Ibrahimpatnam: "Ranga Reddy", Korutla: "Jagtial", Narsapur: "Medak",
    Peerancheru: "Ranga Reddy", Aziznagar: "Ranga Reddy", Maheshwaram: "Ranga Reddy", Yenkapally: "Ranga Reddy",
    Chevella: "Ranga Reddy", Shamshabad: "Ranga Reddy", Quthbullapur: "Medchal-Malkajgiri",
    Bachupally: "Medchal-Malkajgiri", Narsampet: "Warangal", Narketpally: "Nalgonda", Ramagundam: "Peddapalli",
    Patancheru: "Sangareddy",
  },
  Tripura: { Agartala: "West Tripura", Agratala: "West Tripura" },
  "Uttar Pradesh": {
    Kanpur: "Kanpur Nagar", Khurja: "Bulandshahr", Modinagar: "Ghaziabad", Noida: "Gautam Buddha Nagar",
    "Greater Noida": "Gautam Buddha Nagar", Barkachha: "Mirzapur", Mauranipur: "Jhansi", Noorpur: "Bijnor",
    Gajraula: "Amroha",
  },
  Uttarakhand: {
    Roorkee: "Haridwar", Kashipur: "Udham Singh Nagar", Pantnagar: "Udham Singh Nagar",
    "Srinagar Garhwal": "Pauri Garhwal",
    Haldwani: "Nainital",
  },
  "West Bengal": {
    Durgapur: "Paschim Bardhaman", Asansol: "Paschim Bardhaman", Haldia: "Purba Medinipur", Kalyani: "Nadia",
    Kharagpur: "Paschim Medinipur", Mohanpur: "Nadia", Santiniketan: "Birbhum", Shantiniketan: "Birbhum",
    Barasat: "North 24 Parganas", Raniganj: "Paschim Bardhaman", "Diamond Harbour": "South 24 Parganas",
    Raiganj: "Uttar Dinajpur", Rampurhat: "Birbhum", Bolpur: "Birbhum",
  },
  "Andaman and Nicobar Islands": { "Port Blair": "South Andaman", "Sri Vijaya Puram": "South Andaman" },
  "Dadra and Nagar Haveli and Daman and Diu": { Silvassa: "Dadra and Nagar Haveli" },
};

/**
 * Values that cannot be placed in one district, so they stay out of the district filter: a
 * district since split in two, or a town or region that spans several districts.
 */
export const AMBIGUOUS_DISTRICTS: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Andaman", "Andamans"],
  Maharashtra: ["Mumbai", "Bombay", "Navi Mumbai", "Malkapur", "Khed", "Ashti", "Loni"],
  "West Bengal": ["Bardhaman", "Burdwan", "Midnapore", "Medinipur", "Purba", "Siliguri", "24 Parganas"],
  Meghalaya: ["Jaintia Hills", "Khasi Hills", "Garo Hills"],
  Manipur: ["Imphal"],
  Assam: ["Guwahati"],
  Telangana: ["Secunderabad"],
  "Uttar Pradesh": ["Phoolpur", "Akbarpur"],
  Uttarakhand: ["Rishikesh"],
};

/**
 * Cities given in a city field (NIRF and some council lists) that share a district's name but
 * whose colleges lie across several districts: Hyderabad's sprawl into Ranga Reddy and Medchal,
 * Chennai's into Chengalpattu and Tiruvallur, and so on. As a city these are not mapped; as a
 * value in a district column they are the district of that name.
 */
export const CITIES_SPANNING_DISTRICTS: Record<string, string[]> = {
  Telangana: ["Hyderabad"],
  "Tamil Nadu": ["Chennai"],
  "West Bengal": ["Kolkata"],
  Karnataka: ["Bangalore", "Bengaluru", "Bangalroe"],
  Delhi: ["Delhi", "New Delhi"],
};
