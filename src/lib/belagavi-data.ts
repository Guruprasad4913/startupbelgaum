import { MapLocation } from "@/types";

export interface BelagaviArea {
  id: string;
  name: string;
  tagline: string;
  lat: number;
  lng: number;
  pincode: string;
  highlights: string[];
  aliases?: string[];
}

export interface BelagaviCompetitor {
  id: string;
  name: string;
  brand: string;
  sector: "food" | "education" | "healthcare" | "construction";
  sectorLabel: string;
  areaId: string;
  type: "Direct" | "Indirect";
  locality: string;
  lat: number;
  lng: number;
  address: string;
  strengths: string;
  weaknesses: string;
  ourDifferentiation: string;
  fundingOrScale: string;
  googleMapsQuery: string;
  isDirectAreaMatch?: boolean;
  distanceKm?: number;
  nearbyAreaImpactNote?: string;
}

export interface BelagaviSectorInfo {
  id: "food" | "education" | "healthcare" | "construction";
  label: string;
  tagline: string;
  marketSizeBelagavi: string;
  cagr: string;
  keyDrivers: string;
  competitors: BelagaviCompetitor[];
}

export const BELAGAVI_AREAS: BelagaviArea[] = [
  {
    id: "all",
    name: "All Belagavi (Full City)",
    tagline: "Entire Belagavi Metropolitan & Industrial Corporation Zone",
    lat: 15.8497,
    lng: 74.4977,
    pincode: "590001 - 590020",
    highlights: ["Central Belagavi", "All 4 Core Sectors", "Full District Reach"],
    aliases: ["all", "all belagavi", "belgaum", "belagavi", "full city", "entire city", "citywide"],
  },
  {
    id: "tilakwadi",
    name: "Tilakwadi / Congress Rd",
    tagline: "Premier Commercial, Retail, Coaching & Residential Hub",
    lat: 15.8415,
    lng: 74.5045,
    pincode: "590006",
    highlights: ["1st & 2nd Railway Gates", "Deshmukh Road", "Hindwadi", "Congress Road"],
    aliases: [
      "tilakwadi",
      "tilakvadi",
      "tilak wadi",
      "congress road",
      "congress rd",
      "1st gate",
      "2nd gate",
      "3rd gate",
      "deshmukh road",
      "hindwadi",
      "hindvadi",
      "rpd cross",
    ],
  },
  {
    id: "udyambag",
    name: "Udyambag & Machhe",
    tagline: "Heavy Industrial Foundry Cluster, Tech Institutes & VTU HQ",
    lat: 15.8125,
    lng: 74.4815,
    pincode: "590008",
    highlights: ["Belgaum Foundry Cluster", "KLS GIT", "VTU Jnana Sangama", "Machhe Industrial Belt"],
    aliases: [
      "udhyambhag",
      "udyambhag",
      "udhyambag",
      "udyambag",
      "udyam bagh",
      "udhyam bag",
      "udyambagh",
      "machhe",
      "mache",
      "kls git",
      "git",
      "foundry cluster",
      "khanapur road",
      "auto nagar",
      "udyambag industrial area",
      "machhe industrial area",
    ],
  },
  {
    id: "nehru-nagar",
    name: "Nehru Nagar / JNMC",
    tagline: "Major Medical Tourism Corridor & KLE University Campus",
    lat: 15.8855,
    lng: 74.5165,
    pincode: "590010",
    highlights: ["KLE Prabhakar Kore Hospital", "JNMC Medical College", "Sector 1 & 2", "Pune-Bengaluru NH48"],
    aliases: [
      "nehru nagar",
      "nehrunagar",
      "jnmc",
      "kle",
      "kle hospital",
      "prabhakar kore",
      "shivbasav nagar",
      "sector 1 nehru nagar",
      "sector 2 nehru nagar",
    ],
  },
  {
    id: "camp",
    name: "Camp & College Road",
    tagline: "Cantonment, Hospitality, Fine Dining & Turnkey Builders",
    lat: 15.8565,
    lng: 74.5035,
    pincode: "590001",
    highlights: ["Club Road", "Hotel Niyaz", "RPD Cross", "Khanapur Road Showrooms"],
    aliases: ["camp", "belgaum camp", "cantonment", "college road", "club road", "cantt", "camp belagavi"],
  },
  {
    id: "khade-bazar",
    name: "Khade Bazar & Shahapur",
    tagline: "Heritage Confectionery (Kunda), Wholesale Trading & Traditional Markets",
    lat: 15.8615,
    lng: 74.5095,
    pincode: "590001",
    highlights: ["Purohit Sweets", "Ganpat Galli", "Khasbag", "Shahapur Kapileshwar"],
    aliases: [
      "khade bazar",
      "khadebazar",
      "shahapur",
      "shahpur",
      "khasbag",
      "ganpat galli",
      "kapileshwar",
      "market",
      "main market",
    ],
  },
  {
    id: "kakati",
    name: "Kakati (NH-48 Belt)",
    tagline: "Agro-Processing, Mega Food Hubs & Highway Logistics",
    lat: 15.9325,
    lng: 74.5315,
    pincode: "591113",
    highlights: ["KIADB Industrial Area", "Dairy & Jaggery Clusters", "National Highway Logistics"],
    aliases: ["kakati", "kiadb kakati", "nh48", "nh-48", "pune-bengaluru highway", "highway belt"],
  },
  {
    id: "sadashiv-nagar",
    name: "Sadashiv Nagar / Civil Hospital",
    tagline: "Government Healthcare, Teaching Institutes & Public Infrastructure",
    lat: 15.8645,
    lng: 74.5135,
    pincode: "590001",
    highlights: ["BIMS Teaching Hospital", "Civil Hospital Compound", "Subhash Nagar", "City Corporation"],
    aliases: [
      "sadashiv nagar",
      "sadashivnagar",
      "civil hospital",
      "bims",
      "fort lake",
      "subhash nagar",
      "city corporation",
    ],
  },
];

export const BELAGAVI_LOCATION: MapLocation = {
  city: "Belagavi (Belgaum)",
  country: "India",
  region: "Karnataka",
  lat: 15.8497,
  lng: 74.4977,
  ecosystemScore: 86,
  talentIndex: "8.9/10 Engineering & Medical Powerhouse (VTU & KLE)",
  vcFundingClimate: "Active Tier-2 (₹14,500 Cr Industrial & Angel Allocations)",
  regulatoryFriendliness: "High (Karnataka Startup Policy & Belagavi Smart City Initiatives)",
  avgCustomerAcquisitionCost: "₹2,500 - ₹5,800 (High Local Word-of-Mouth Efficiency)",
  keyHubs: [
    "Tilakwadi Commercial Corridor",
    "Udyambag Foundry Cluster",
    "Nehru Nagar (KLE Medical City)",
    "Camp & College Road",
    "Khade Bazar Heritage Market",
    "Machhe (VTU Headquarters)",
  ],
};

export const BELAGAVI_SECTORS: Record<"food" | "education" | "healthcare" | "construction", BelagaviSectorInfo> = {
  food: {
    id: "food",
    label: "Food & Beverages",
    tagline: "Specialty QSR, Confectionery, Agri-Processing & Cloud Kitchens",
    marketSizeBelagavi: "₹850 Crores / Year",
    cagr: "14.2% Annual Growth",
    keyDrivers: "Heritage sweet tourism (Belagavi Kunda), student population from VTU/KLE, and surging demand for branded dine-in & delivery.",
    competitors: [
      {
        id: "tumkur-coffee-tilakwadi",
        name: "Tumkur Coffee House & Local QSRs",
        brand: "Tumkur Coffee",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "tilakwadi",
        type: "Direct",
        locality: "Tilakwadi / Congress Rd",
        lat: 15.8398,
        lng: 74.5065,
        address: "Congress Road, Near 1st Railway Gate, Tilakwadi, Belagavi 590006",
        strengths: "Ultra-low price points (₹15–₹25 hot brews), quick counter turnarounds, strategic location near student colleges.",
        weaknesses: "Zero seating comfort, absence of work-from-cafe amenities, limited food pairings or specialty bean traceability.",
        ourDifferentiation: "Fast-casual hybrid cafe with high-speed Wi-Fi, artisanal filter bean roasts, and smart pre-order grab-and-go kiosks.",
        fundingOrScale: "High-volume independent retail franchisee network",
        googleMapsQuery: "Tumkur Coffee Tilakwadi Belagavi",
      },
      {
        id: "pai-bakery-tilakwadi",
        name: "Pai Bakery & Patisserie",
        brand: "Pai Bakery",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "tilakwadi",
        type: "Direct",
        locality: "Tilakwadi / Congress Rd",
        lat: 15.8428,
        lng: 74.5052,
        address: "Deshmukh Road, 1st Railway Gate, Tilakwadi, Belagavi 590006",
        strengths: "Decades-old bakery reputation, fresh daily artisan breads and puffs, loyal residential household customer base.",
        weaknesses: "No online pre-ordering, traditional in-store billing bottlenecks during peak evening hours.",
        ourDifferentiation: "Daily subscription bread box and smart mobile click-and-collect express counter.",
        fundingOrScale: "₹8 Cr - ₹12 Cr Annual Local Turnover",
        googleMapsQuery: "Pai Bakery Tilakwadi Belagavi",
      },
      {
        id: "grand-sweets-hindwadi",
        name: "New Grand Sweets & Darshini",
        brand: "New Grand Sweets",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "tilakwadi",
        type: "Direct",
        locality: "Tilakwadi / Hindwadi",
        lat: 15.8385,
        lng: 74.5012,
        address: "Hindwadi Main Road, Near 2nd Gate, Tilakwadi, Belagavi 590011",
        strengths: "Strong local breakfast crowd, authentic South Indian tiffins, high morning footfall.",
        weaknesses: "Limited evening dining options, crowded dining environment, no branded takeaway packaging.",
        ourDifferentiation: "Clean-label all-day health breakfast bowls and vacuum-sealed ready-to-cook batter kits.",
        fundingOrScale: "Independent legacy QSR outlet",
        googleMapsQuery: "Hindwadi Main Road Belagavi",
      },
      {
        id: "hotel-niyaz",
        name: "Hotel Niyaz Hospitality Group",
        brand: "Niyaz Restaurant",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "camp",
        type: "Direct",
        locality: "Camp & College Road",
        lat: 15.8562,
        lng: 74.5028,
        address: "Club Road, Opp. Civil Hospital, Camp, Belagavi, Karnataka 590001",
        strengths: "Market-leading dining footprint in North Karnataka, dominant weekend crowd, massive catering and banquet infrastructure.",
        weaknesses: "High fixed restaurant overheads during weekday lunch hours, limited subscription delivery options.",
        ourDifferentiation: "Lean cloud-kitchen delivery pods, AI-driven corporate bulk lunch meal-box subscriptions, and unified app loyalty rewards.",
        fundingOrScale: "₹35 Cr+ Annual Hospitality Turnover (Regional multi-unit chain)",
        googleMapsQuery: "Hotel Niyaz Club Road Belagavi",
      },
      {
        id: "camp-delicacies-cafe",
        name: "Cantonment Cafe & Bistro",
        brand: "Cantonment Bistro",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "camp",
        type: "Direct",
        locality: "Camp & College Road",
        lat: 15.8545,
        lng: 74.5015,
        address: "College Road, Camp, Belagavi 590001",
        strengths: "Picturesque heritage cantonment ambiance, premium family dining crowd.",
        weaknesses: "Expensive menu with slow table turnover, lacks quick grab-and-go options.",
        ourDifferentiation: "European-style specialty espresso bar combined with express bakery counter.",
        fundingOrScale: "Premium independent heritage cafe",
        googleMapsQuery: "College Road Camp Belagavi",
      },
      {
        id: "nehru-nagar-food-street",
        name: "Nehru Nagar Student Cafes & QSR Corridor",
        brand: "Nehru Nagar Cafe Hub",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "nehru-nagar",
        type: "Direct",
        locality: "Nehru Nagar / JNMC",
        lat: 15.884,
        lng: 74.515,
        address: "Near JNMC Gate, Nehru Nagar, Belagavi 590010",
        strengths: "High footfall from 8,000+ medical and dental students, active evening social hangout culture.",
        weaknesses: "Inconsistent food safety, noisy unorganized seating, high staff attrition rates.",
        ourDifferentiation: "Quiet student study-cafe pod network with ergonomic desks, healthy smoothies, and midnight delivery till 3 AM.",
        fundingOrScale: "Cluster of 12+ student cafes",
        googleMapsQuery: "Nehru Nagar JNMC Belagavi",
      },
      {
        id: "rolls-burger-nehru-nagar",
        name: "Campus Crave Rolls & Juice Lounge",
        brand: "Campus Crave",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "nehru-nagar",
        type: "Direct",
        locality: "Nehru Nagar / JNMC",
        lat: 15.887,
        lng: 74.5175,
        address: "Sector 2, Shivbasav Nagar, Nehru Nagar, Belagavi 590010",
        strengths: "Pocket-friendly fast food for hostel residents, late evening student hangout.",
        weaknesses: "High oil and processed ingredients, no nutritional transparency, slow kitchen during rush hours.",
        ourDifferentiation: "Air-fried healthy roll bowls, protein shakes, and zero-sugar fresh fruit boba teas.",
        fundingOrScale: "Student-focused quick-service brand",
        googleMapsQuery: "Shivbasav Nagar Nehru Nagar Belagavi",
      },
      {
        id: "purohit-sweets",
        name: "Purohit Sweets & Camp Kunda",
        brand: "Purohit Sweets",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "khade-bazar",
        type: "Direct",
        locality: "Khade Bazar / Shahapur",
        lat: 15.8615,
        lng: 74.5095,
        address: "Khade Bazar, Main Market, Belagavi, Karnataka 590001",
        strengths: "Iconic 70+ year brand recognition, heavy tourist footfall for authentic Belgaum Kunda, prime central market frontage.",
        weaknesses: "Traditional non-digitized ordering, limited healthy/sugar-free variants, lack of modern vacuum packaging for export.",
        ourDifferentiation: "Vacuum-sealed extended shelf-life, nationwide cold-chain delivery, and diabetic-safe stevia artisanal Kunda recipes.",
        fundingOrScale: "₹18 Cr - ₹25 Cr Annual Revenue (Multi-outlet family enterprise)",
        googleMapsQuery: "Purohit Sweets Khade Bazar Belagavi",
      },
      {
        id: "shahapur-mithai-bazar",
        name: "Shahapur Mithai & Farsan Consortium",
        brand: "Shahapur Sweets",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "khade-bazar",
        type: "Direct",
        locality: "Khade Bazar / Shahapur",
        lat: 15.8535,
        lng: 74.5125,
        address: "Khasbag Market, Shahapur, Belagavi 590003",
        strengths: "Traditional sweets and wholesale festive confectionery distribution across rural taluks.",
        weaknesses: "Traditional cash sales, unstandardized batch taste variations, lack of shelf-life technology.",
        ourDifferentiation: "Standardized food-tech kitchen protocols and sealed eco-friendly gift hampers for NRI exports.",
        fundingOrScale: "Regional heritage confectionery cluster",
        googleMapsQuery: "Shahapur Market Belagavi",
      },
      {
        id: "hotel-sanman-deluxe-udyambag",
        name: "Hotel Sanman Deluxe Veg & Family Dining",
        brand: "Hotel Sanman Deluxe",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.8162,
        lng: 74.4845,
        address: "Khanapur Road, Near Industrial Gate, Udyambag, Belagavi 590008",
        strengths: "Premier pure-veg AC dining corridor on Khanapur Road, massive daily corporate footfall from foundry directors and VTU visitors.",
        weaknesses: "Slow peak lunch billing, limited digital pre-ordering, standard traditional thali with high carbs.",
        ourDifferentiation: "Digital QR express seating, nutritional calorie-conscious thali options, and pre-scheduled corporate executive lunch suites.",
        fundingOrScale: "High-volume legacy highway restaurant (₹14 Cr annual turnover)",
        googleMapsQuery: "Hotel Sanman Deluxe Khanapur Road Udyambag Belagavi",
      },
      {
        id: "hotel-green-park-udyambag",
        name: "Hotel Green Park Family Restaurant & Bar",
        brand: "Hotel Green Park",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.8118,
        lng: 74.4795,
        address: "Khanapur Road, Opp. Industrial Estate, Udyambag, Belagavi 590008",
        strengths: "Expansive garden seating, North Indian & Tandoor multi-cuisine specialty, heavy evening business and family footfall.",
        weaknesses: "High alcohol-driven ambiance deterrent for midday corporate work meetings, slower daytime kitchen dispatch.",
        ourDifferentiation: "Dedicated daytime co-working cafe lounge and artisanal non-alcoholic craft brews with high-speed internet.",
        fundingOrScale: "Multi-acre hospitality property with banquet facilities",
        googleMapsQuery: "Hotel Green Park Udyambag Belagavi",
      },
      {
        id: "hotel-navaratna-udyambag",
        name: "Hotel Navaratna Pure Veg & South Indian Tiffins",
        brand: "Hotel Navaratna",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.8085,
        lng: 74.4755,
        address: "Opp. KLS GIT College Main Gate, Udyambag, Belagavi 590008",
        strengths: "Strategic campus frontage right outside GIT engineering gate, ultra-fast South Indian breakfast and budget combo meals.",
        weaknesses: "Severe overcrowding during college break hours, basic plastic seating, no healthy grab-and-go snack boxes.",
        ourDifferentiation: "App-enabled student pre-order lockers, clean-label protein smoothies, and wholesome meal subscriptions.",
        fundingOrScale: "Bustling student dining hub (2,500+ daily student footfalls)",
        googleMapsQuery: "Hotel Navaratna KLS GIT Udyambag Belagavi",
      },
      {
        id: "hotel-annapoorna-khanavali-udyambag",
        name: "Hotel Annapoorna Authentic Jolada Rotti Khanavali",
        brand: "Hotel Annapoorna Khanavali",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.8145,
        lng: 74.482,
        address: "Foundry Cluster Road, Near Auto Nagar, Udyambag, Belagavi 590008",
        strengths: "Authentic North Karnataka Jolada Rotti, Ennegai brinjal, and Shenga chutney; beloved everyday lunch spot for foundry engineers.",
        weaknesses: "Traditional cash/paper register, limited evening menu, minimal takeaway packaging capability.",
        ourDifferentiation: "Standardized eco-packaged vacuum-sealed Jolada Rotti tiffin subscription delivered to factory floor supervisors.",
        fundingOrScale: "High-density local culinary institution serving 800+ rotis daily",
        googleMapsQuery: "Foundry Cluster Road Udyambag Belagavi",
      },
      {
        id: "hotel-udyambag-darshini-tiffin",
        name: "Hotel Udyambag Darshini & Industrial Tiffin Center",
        brand: "Udyambag Darshini",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.8132,
        lng: 74.4805,
        address: "Main Road, Industrial Estate, Udyambag, Belagavi 590008",
        strengths: "Lightning-fast standing counter service, ₹20 filter coffee & fresh hot idlis starting at 6:30 AM for morning shift industrial workers.",
        weaknesses: "No seating, zero healthy low-glycemic dietary alternatives, chaotic morning counter rush.",
        ourDifferentiation: "Contactless digital kiosk ordering, dedicated corporate morning breakfast hamper deliveries to factory offices.",
        fundingOrScale: "High-frequency morning volume hub",
        googleMapsQuery: "Industrial Estate Udyambag Belagavi",
      },
      {
        id: "git-food-court-machhe",
        name: "GIT Campus Food Court & Student Cafe Lounge",
        brand: "GIT Food Court",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.8078,
        lng: 74.4742,
        address: "KLS GIT Campus Corridor, Udyambag, Belagavi 590008",
        strengths: "Direct captive student audience of 4,000+ engineering and MBA students, popular late afternoon hangouts.",
        weaknesses: "Closed during semester holidays, limited healthy organic food choices, repetitive vendor menus.",
        ourDifferentiation: "Year-round cloud kitchen delivering to nearby student hostels in Machhe with midnight order support.",
        fundingOrScale: "Campus concessionaire network",
        googleMapsQuery: "KLS Gogte Institute of Technology Udyambag Belagavi",
      },
      {
        id: "hotel-sagar-delicacy-machhe",
        name: "Hotel Sagar Delicacy & Executive Dining",
        brand: "Hotel Sagar Delicacy",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.8045,
        lng: 74.4715,
        address: "Machhe Industrial Area Road, Near VTU Cross, Udyambag, Belagavi 590014",
        strengths: "Strategically located at the confluence of VTU Headquarters and Machhe heavy engineering zone; spacious parking.",
        weaknesses: "Inconsistent weekend customer volume, dated interior decor, limited online delivery presence.",
        ourDifferentiation: "Modernized farm-to-table corporate conference dining and scheduled daily cloud lunch boxes for manufacturing executives.",
        fundingOrScale: "Independent commercial executive dining hall",
        googleMapsQuery: "Machhe Industrial Area Belagavi",
      },
      {
        id: "udyambag-industrial-canteen",
        name: "Udyambag Industrial Food Service & Cloud Kitchens",
        brand: "Udyambag Canteen Network",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "udyambag",
        type: "Indirect",
        locality: "Udyambag & Machhe",
        lat: 15.814,
        lng: 74.483,
        address: "Foundry Cluster Road, Udyambag, Belagavi 590008",
        strengths: "Established daily catering contracts with 100+ foundry units, steady industrial blue-collar volume.",
        weaknesses: "Low hygiene perception, basic repetitive menu with no nutritional tracking, manual paper coupon system.",
        ourDifferentiation: "App-enabled digital cafeteria with automated macro-balanced meal trays and scheduled shifts delivery.",
        fundingOrScale: "Multi-unit industrial food contractor (₹6 Cr/yr)",
        googleMapsQuery: "Udyambag Industrial Area Belagavi",
      },
      {
        id: "kakati-agro-foods",
        name: "Kakati Agro & Dairy Processing Cluster",
        brand: "Kakati Agro Foods",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "kakati",
        type: "Indirect",
        locality: "Kakati (NH-48 Belt)",
        lat: 15.932,
        lng: 74.5315,
        address: "KIADB Industrial Area, Kakati, Belagavi 591113",
        strengths: "Direct farmgate milk and sugarcane sourcing pipelines, bulk processing infrastructure, low raw material procurement cost.",
        weaknesses: "B2B commodity wholesaler mentality with negligible retail brand equity or direct consumer loyalty.",
        ourDifferentiation: "Direct-to-consumer farm-fresh unadulterated milk and artisanal cheese brand with daily app-based morning doorstep drop.",
        fundingOrScale: "Industrial wholesale cooperative (₹50 Cr+ bulk volume)",
        googleMapsQuery: "Kakati Industrial Area Belagavi",
      },
      {
        id: "lakeview-cafe-sadashiv",
        name: "Fort Lakeview Cafe & Garden Dining",
        brand: "Fort Lakeview Cafe",
        sector: "food",
        sectorLabel: "Food & Beverages",
        areaId: "sadashiv-nagar",
        type: "Direct",
        locality: "Sadashiv Nagar / Civil Hospital",
        lat: 15.8725,
        lng: 74.522,
        address: "Fort Lake Promenade, Subhash Nagar / Sadashiv Nagar, Belagavi 590016",
        strengths: "High scenic tourist footfall near Belgaum Fort and lake, high evening family traffic.",
        weaknesses: "Heavily weather-dependent outdoor seating, limited winter and monsoon covers.",
        ourDifferentiation: "All-weather glasshouse aesthetic dining with artisan coffee and farm-to-table salads.",
        fundingOrScale: "High-footfall scenic waterfront cafe",
        googleMapsQuery: "Fort Lake Belagavi",
      },
    ],
  },

  education: {
    id: "education",
    label: "Education",
    tagline: "Higher Education, Skill Academies, STEM Labs & EdTech",
    marketSizeBelagavi: "₹1,400 Crores / Year",
    cagr: "16.8% Annual Growth",
    keyDrivers: "Presence of VTU State Headquarters, KLE Academy of Higher Education, and 25+ colleges with over 100,000 students.",
    competitors: [
      {
        id: "allen-belagavi-tilakwadi",
        name: "Allen & Aakash Test Prep Centers Tilakwadi",
        brand: "Allen / Aakash Coaching",
        sector: "education",
        sectorLabel: "Education",
        areaId: "tilakwadi",
        type: "Direct",
        locality: "Tilakwadi / Congress Rd",
        lat: 15.8425,
        lng: 74.5018,
        address: "Deshmukh Road, Near 2nd Gate, Tilakwadi, Belagavi 590006",
        strengths: "National test prep brand equity, rigorous high-pressure testing curriculum, strong JEE/NEET results marketing.",
        weaknesses: "Rigid one-size-fits-all rote cramming, high student burnout, high fee structures (₹1 Lakh+/year).",
        ourDifferentiation: "Personalized adaptive AI tutor analyzing individual mock test mistakes with instant step-by-step doubt clearing in Kannada/Marathi/English.",
        fundingOrScale: "National corporate coaching franchise centers",
        googleMapsQuery: "Allen Career Institute Tilakwadi Belagavi",
      },
      {
        id: "rpd-ske-tilakwadi",
        name: "RPD College & SKE Society Campus",
        brand: "RPD Degree College",
        sector: "education",
        sectorLabel: "Education",
        areaId: "tilakwadi",
        type: "Indirect",
        locality: "Tilakwadi / Congress Rd",
        lat: 15.836,
        lng: 74.502,
        address: "RPD College Road, Tilakwadi, Belagavi 590006",
        strengths: "Historic 75+ year institution, massive student alumni network, premier PU and degree courses.",
        weaknesses: "Limited emerging tech industry integration, lack of modern coding bootcamps.",
        ourDifferentiation: "College-integrated full-stack AI sprint labs and remote tech internship placement engine.",
        fundingOrScale: "Autonomous educational society (6,000+ students)",
        googleMapsQuery: "RPD College Tilakwadi Belagavi",
      },
      {
        id: "kle-academy-higher-education",
        name: "KLE Academy of Higher Education & Research (KAHER)",
        brand: "KLE Society",
        sector: "education",
        sectorLabel: "Education",
        areaId: "nehru-nagar",
        type: "Direct",
        locality: "Nehru Nagar / JNMC",
        lat: 15.8862,
        lng: 74.5165,
        address: "JNMC Campus, Nehru Nagar, Belagavi, Karnataka 590010",
        strengths: "Century-old prestige, world-class medical, dental, and health sciences infrastructure, unmatched regional trust.",
        weaknesses: "Higher tuition fee bands, bureaucratic institutional approval cycles, limited agile micro-credentials for emerging AI skills.",
        ourDifferentiation: "Affordable AI & cloud-native vocational sprint certifications, practical hands-on labs, and guaranteed startup placement tracks.",
        fundingOrScale: "Premier Deemed University with 10,000+ campus students",
        googleMapsQuery: "KLE University Nehru Nagar Belagavi",
      },
      {
        id: "jnmc-medical-academy",
        name: "Jawaharlal Nehru Medical College (JNMC)",
        brand: "JNMC Belagavi",
        sector: "education",
        sectorLabel: "Education",
        areaId: "nehru-nagar",
        type: "Direct",
        locality: "Nehru Nagar / JNMC",
        lat: 15.8885,
        lng: 74.5178,
        address: "KLE Centenary Campus, Nehru Nagar, Belagavi 590010",
        strengths: "Top-ranked medical training college in India with high surgical case volume.",
        weaknesses: "Intensive offline coursework, limited simulation software for medical licensing exam prep.",
        ourDifferentiation: "Interactive 3D anatomical VR simulation software and USMLE/NEXT exam question-bank app.",
        fundingOrScale: "National top-tier medical institute",
        googleMapsQuery: "JNMC Medical College Belagavi",
      },
      {
        id: "vtu-machhe",
        name: "Visvesvaraya Technological University (VTU Headquarters)",
        brand: "VTU",
        sector: "education",
        sectorLabel: "Education",
        areaId: "udyambag",
        type: "Indirect",
        locality: "Udyambag & Machhe",
        lat: 15.8048,
        lng: 74.4695,
        address: "Jnana Sangama, Machhe, Belagavi, Karnataka 590018",
        strengths: "Apex governing university for 200+ Karnataka engineering colleges, massive state funding, extensive central research labs.",
        weaknesses: "Curriculum changes take multi-year senate approvals, predominantly theoretical semester testing rather than practical builder portfolios.",
        ourDifferentiation: "Live GitHub portfolio-building platform partnering with colleges for immediate job-ready DevOps & full-stack engineering cohorts.",
        fundingOrScale: "State Technological University headquarters",
        googleMapsQuery: "VTU Jnana Sangama Belagavi",
      },
      {
        id: "kls-git-belagavi",
        name: "KLS Gogte Institute of Technology (GIT)",
        brand: "Gogte Institute of Technology",
        sector: "education",
        sectorLabel: "Education",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.8152,
        lng: 74.486,
        address: "Jnana Ganga, Khanapur Road, Udyambag, Belagavi 590008",
        strengths: "Autonomous engineering institute with strong local alumni network across Pune, Bengaluru, and US foundry/machining corporations.",
        weaknesses: "On-campus physical attendance model with minimal hybrid or remote learning flexibility for working professionals.",
        ourDifferentiation: "Evening & weekend hybrid executive skilling academy for working engineers in Udyambag foundries to upskill in Robotics & IoT.",
        fundingOrScale: "Autonomous engineering institution with 4,500+ active students",
        googleMapsQuery: "KLS Gogte Institute of Technology Belagavi",
      },
      {
        id: "st-pauls-college-rd",
        name: "Camp & College Road Degree Colleges",
        brand: "College Road Institutions",
        sector: "education",
        sectorLabel: "Education",
        areaId: "camp",
        type: "Indirect",
        locality: "Camp & College Road",
        lat: 15.858,
        lng: 74.505,
        address: "College Road, Camp, Belagavi 590001",
        strengths: "Prime central accessibility, established reputation for Arts, Science, Commerce, and PU colleges.",
        weaknesses: "Outdated computer labs, absence of AI/data analytics specializations, traditional lecture-hall pedagogy.",
        ourDifferentiation: "Co-curricular career accelerator installing modern AI labs in campuses with industry-sponsored internships.",
        fundingOrScale: "5,000+ enrolled undergraduate students",
        googleMapsQuery: "College Road Belagavi",
      },
      {
        id: "bims-paramedical-sadashiv",
        name: "BIMS Paramedical & Nursing Institute",
        brand: "BIMS Training School",
        sector: "education",
        sectorLabel: "Education",
        areaId: "sadashiv-nagar",
        type: "Direct",
        locality: "Sadashiv Nagar / Civil Hospital",
        lat: 15.864,
        lng: 74.513,
        address: "Hospital Compound, Sadashiv Nagar, Belagavi 590001",
        strengths: "Subsidized government allied healthcare education with continuous clinical bedside exposure.",
        weaknesses: "Lack of digitized learning platforms and modern medical equipment simulators.",
        ourDifferentiation: "Digital clinical skill simulations and standardized hospital training app.",
        fundingOrScale: "Government autonomous educational institute",
        googleMapsQuery: "BIMS Sadashiv Nagar Belagavi",
      },
      {
        id: "kakati-rural-polytechnic",
        name: "Kakati Rural Skill & Technical Academy",
        brand: "Kakati Skill Academy",
        sector: "education",
        sectorLabel: "Education",
        areaId: "kakati",
        type: "Indirect",
        locality: "Kakati (NH-48 Belt)",
        lat: 15.931,
        lng: 74.53,
        address: "Industrial Corridor, Kakati, Belagavi 591113",
        strengths: "Vocational training center for industrial mechanics, welders, and logistics operators.",
        weaknesses: "Manual paper testing, no digital tracking of industrial placement records.",
        ourDifferentiation: "App-based verified apprenticeship matching connecting certified trainees with NH-48 logistics hubs.",
        fundingOrScale: "Regional vocational technical training center",
        googleMapsQuery: "Kakati Industrial Area Belagavi",
      },
      {
        id: "shahapur-commerce-academy",
        name: "Shahapur Commercial & Accounting Tutorials",
        brand: "Shahapur Commerce Hub",
        sector: "education",
        sectorLabel: "Education",
        areaId: "khade-bazar",
        type: "Direct",
        locality: "Khade Bazar / Shahapur",
        lat: 15.856,
        lng: 74.511,
        address: "Shahapur Road, Near Ganpat Galli, Belagavi 590003",
        strengths: "Dominant coaching for trade accounting, Tally, and CA foundation courses for merchant families.",
        weaknesses: "Outdated manual ledger exercises, no cloud ERP or modern FinTech modules.",
        ourDifferentiation: "Modern Cloud Accounting & GST AI certification platform with real client ledger projects.",
        fundingOrScale: "Local commerce tutorial institute (1,200+ annual students)",
        googleMapsQuery: "Shahapur Belagavi",
      },
    ],
  },

  healthcare: {
    id: "healthcare",
    label: "Healthcare & Wellness",
    tagline: "Super-Specialty Clinics, Diagnostic Labs, Ayur-Tech & Wellness",
    marketSizeBelagavi: "₹1,850 Crores / Year",
    cagr: "15.4% Annual Growth",
    keyDrivers: "Medical tourism destination for North Karnataka, South Maharashtra and Goa due to low-cost advanced surgeries.",
    competitors: [
      {
        id: "arihant-hospital",
        name: "Arihant Hospital & Research Centre",
        brand: "Arihant Hospital",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "tilakwadi",
        type: "Direct",
        locality: "Tilakwadi / Congress Rd",
        lat: 15.8378,
        lng: 74.4985,
        address: "Hindwadi / Tilakwadi, Belagavi 590011",
        strengths: "Trusted neighborhood multi-specialty facility for maternity, pediatrics, and orthopedics with loyal suburban clientele.",
        weaknesses: "Traditional paper files, lacks unified patient health portal or preventive lifestyle programs.",
        ourDifferentiation: "Subscription-based family wellness pass covering unlimited pediatric tele-consults, annual routine checkups, and discounted pharmacy.",
        fundingOrScale: "Private multi-specialty healthcare institution",
        googleMapsQuery: "Arihant Hospital Tilakwadi Belagavi",
      },
      {
        id: "dr-joshi-maternity-tilakwadi",
        name: "Dr. Joshi Maternity & Nursing Home",
        brand: "Dr. Joshi Nursing Home",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "tilakwadi",
        type: "Direct",
        locality: "Tilakwadi / Congress Rd",
        lat: 15.841,
        lng: 74.503,
        address: "Congress Road, Near 2nd Gate, Tilakwadi, Belagavi 590006",
        strengths: "Decades of maternal trust, high patient loyalty, personalized obstetric care.",
        weaknesses: "Manual appointment scheduling, long waiting room queues without live digital tokens.",
        ourDifferentiation: "Smart prenatal mobile care companion with remote fetal heart rate logs and zero-wait doctor queue tokens.",
        fundingOrScale: "Established private nursing facility",
        googleMapsQuery: "Congress Road Tilakwadi Belagavi",
      },
      {
        id: "kle-prabhakar-kore-hospital",
        name: "KLE Dr. Prabhakar Kore Charitable & Super Specialty Hospital",
        brand: "KLE Centenary Hospital",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "nehru-nagar",
        type: "Direct",
        locality: "Nehru Nagar / JNMC",
        lat: 15.8875,
        lng: 74.518,
        address: "Sector 1, Nehru Nagar, Belagavi, Karnataka 590010",
        strengths: "2,400+ bed tertiary healthcare giant, 24/7 advanced robotic surgery, organ transplant unit, oncology wing, massive patient influx.",
        weaknesses: "Intimidating hospital bureaucracy, long outpatient wait times, complex billing queues for routine minor consults.",
        ourDifferentiation: "Hyper-efficient outpatient clinic chain and home-care nursing subscription with zero-wait app scheduling and transparent flat fees.",
        fundingOrScale: "Largest private medical college hospital in South India",
        googleMapsQuery: "KLE Prabhakar Kore Hospital Belagavi",
      },
      {
        id: "kle-cancer-hospital-nehru-nagar",
        name: "KLE Centenary Oncology & Research Centre",
        brand: "KLE Oncology",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "nehru-nagar",
        type: "Direct",
        locality: "Nehru Nagar / JNMC",
        lat: 15.889,
        lng: 74.5195,
        address: "Sector 2, Nehru Nagar, Belagavi 590010",
        strengths: "Advanced linear accelerator radiation therapy, specialized pediatric and surgical oncology teams.",
        weaknesses: "High out-of-pocket costs for uninsured families, complex post-chemo tracking.",
        ourDifferentiation: "Digital remote symptom management app for chemotherapy patients with instant oncologist chat.",
        fundingOrScale: "Regional super-specialty oncology center",
        googleMapsQuery: "KLE Hospital Nehru Nagar Belagavi",
      },
      {
        id: "lakeview-hospital",
        name: "Lakeview Hospital & Heart Centre",
        brand: "Lakeview Hospital",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "sadashiv-nagar",
        type: "Direct",
        locality: "Sadashiv Nagar / Civil Hospital",
        lat: 15.871,
        lng: 74.5245,
        address: "Near Fort Lake, Gandhi Nagar, Belagavi 590016",
        strengths: "Premier private cardiac care and laparoscopic surgical center with stellar patient hospitality and central accessibility.",
        weaknesses: "Limited post-discharge remote monitoring, lacks connected wearable integration for at-home cardiology tracking.",
        ourDifferentiation: "Smart cardiac rehab program with continuous remote ECG patch monitoring and weekly doctor check-in calls.",
        fundingOrScale: "150-bed multi-specialty private medical center",
        googleMapsQuery: "Lakeview Hospital Gandhi Nagar Belagavi",
      },
      {
        id: "bims-belgaum",
        name: "Belgaum Institute of Medical Sciences (BIMS)",
        brand: "BIMS District Hospital",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "sadashiv-nagar",
        type: "Indirect",
        locality: "Sadashiv Nagar / Civil Hospital",
        lat: 15.8625,
        lng: 74.5125,
        address: "Civil Hospital Compound, Sadashiv Nagar, Belagavi 590001",
        strengths: "Subsidized government healthcare, high patient case diversity, central location.",
        weaknesses: "Overburdened infrastructure, long diagnostic backlogs, fragmented manual record keeping.",
        ourDifferentiation: "Automated digital lab reports and rapid 2-hour doorstep blood collection for senior citizens across Belagavi.",
        fundingOrScale: "Government Autonomous Medical Institute",
        googleMapsQuery: "BIMS Civil Hospital Belagavi",
      },
      {
        id: "kle-ayurvedic-shahapur",
        name: "KLE Ayurvedic Hospital & Wellness Center",
        brand: "KLE Ayurveda",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "khade-bazar",
        type: "Direct",
        locality: "Khade Bazar / Shahapur",
        lat: 15.852,
        lng: 74.514,
        address: "Khasbag, Shahapur, Belagavi 590003",
        strengths: "Authentic Panchakarma therapies, renowned Ayurvedic doctors, trusted herbal medicine manufacturing unit.",
        weaknesses: "Slow treatment cycles without modern biometric diagnostics, lack of modern digital treatment tracking apps.",
        ourDifferentiation: "Integrative health clinic combining evidence-based blood panels with customized herbal wellness regimens and mobile habit tracking.",
        fundingOrScale: "Historic charitable Ayurvedic hospital",
        googleMapsQuery: "KLE Ayurveda Hospital Shahapur Belagavi",
      },
      {
        id: "camp-cantonment-polyclinic",
        name: "Belgaum Cantonment Polyclinic & Military Hospital Annex",
        brand: "Cantonment Polyclinic",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "camp",
        type: "Indirect",
        locality: "Camp & College Road",
        lat: 15.855,
        lng: 74.503,
        address: "Club Road, Camp, Belagavi 590001",
        strengths: "Low-cost subsidized primary consultations, trusted veteran doctor cadre, serene cantonment setting.",
        weaknesses: "Strict entry protocols for general public, no online teleconsultation portal.",
        ourDifferentiation: "Civilian-friendly concierge clinic offering express consultations and door-delivered pharmacy.",
        fundingOrScale: "Government Cantonment Board facility",
        googleMapsQuery: "Club Road Camp Belagavi",
      },
      {
        id: "udyambag-industrial-health",
        name: "Udyambag Occupational Health & Trauma Clinic",
        brand: "Foundry Health Care",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.816,
        lng: 74.485,
        address: "Foundry Industrial Corridor, Udyambag, Belagavi 590008",
        strengths: "Specialized in industrial burn care, pulmonary silicosis screening, and emergency trauma for factory workers.",
        weaknesses: "Basic outpatient setup, lacks advanced CT/MRI diagnostics or inpatient recovery beds.",
        ourDifferentiation: "Mobile industrial health diagnostic van with AI spirometry and corporate annual OSHA compliance audits.",
        fundingOrScale: "Industrial corporate occupational healthcare provider",
        googleMapsQuery: "Udyambag Belagavi",
      },
      {
        id: "kakati-highway-trauma",
        name: "Kakati Highway Emergency & Primary Trauma Clinic",
        brand: "Kakati Emergency Care",
        sector: "healthcare",
        sectorLabel: "Healthcare & Wellness",
        areaId: "kakati",
        type: "Direct",
        locality: "Kakati (NH-48 Belt)",
        lat: 15.933,
        lng: 74.532,
        address: "NH-48 Highway Junction, Kakati, Belagavi 591113",
        strengths: "Immediate proximity to NH-48 highway accidents and industrial workers in Kakati KIADB.",
        weaknesses: "Small medical staff, lacks round-the-clock neurosurgical capabilities.",
        ourDifferentiation: "5G-connected smart ambulance fleet stabilizing highway trauma victims en route to tertiary hospitals.",
        fundingOrScale: "Private emergency trauma center",
        googleMapsQuery: "Kakati Belagavi",
      },
    ],
  },

  construction: {
    id: "construction",
    label: "Construction & Infrastructure",
    tagline: "Turnkey Precast, Foundry Casting, Smart Civil Works & Green Materials",
    marketSizeBelagavi: "₹2,200 Crores / Year",
    cagr: "13.6% Annual Growth",
    keyDrivers: "Belagavi Smart City urban redevelopment, NH-48 logistics expansion, and Udyambag's world-famous foundry cluster.",
    competitors: [
      {
        id: "shantai-constructions",
        name: "Shantai Constructions & Infra Developers",
        brand: "Shantai Group",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "tilakwadi",
        type: "Direct",
        locality: "Tilakwadi / Congress Rd",
        lat: 15.8445,
        lng: 74.5078,
        address: "Congress Road, Tilakwadi, Belagavi 590006",
        strengths: "Established brand for mid-to-luxury residential apartments and commercial complexes with strong local contractor relationships.",
        weaknesses: "Conventional cast-in-place concrete construction taking 18–24 months per project, frequent material price volatility.",
        ourDifferentiation: "Modular precast and dry-wall panel assembly technology slashing construction timelines by 60% with seismic rating.",
        fundingOrScale: "₹45 Cr+ Project Pipeline in Belagavi & Kolhapur",
        googleMapsQuery: "Shantai Constructions Tilakwadi Belagavi",
      },
      {
        id: "vertex-developers-tilakwadi",
        name: "Vertex Developers & Turnkey Fit-Outs",
        brand: "Vertex Builders",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "tilakwadi",
        type: "Direct",
        locality: "Tilakwadi / Hindwadi",
        lat: 15.84,
        lng: 74.504,
        address: "Deshmukh Road, Hindwadi, Tilakwadi, Belagavi 590011",
        strengths: "Bespoke architectural design and turnkey interior execution for premium villas in Tilakwadi.",
        weaknesses: "High costs per square foot, manual contractor supervision prone to schedule slippages.",
        ourDifferentiation: "App-based live 360-degree site camera progress tracking and fixed-cost milestone escrow contracts.",
        fundingOrScale: "Premium boutique residential developer",
        googleMapsQuery: "Deshmukh Road Tilakwadi Belagavi",
      },
      {
        id: "udyambag-foundry-cluster",
        name: "Belgaum Foundry Cluster & Industrial Precast",
        brand: "Belgaum Foundry Cluster",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "udyambag",
        type: "Indirect",
        locality: "Udyambag & Machhe",
        lat: 15.8118,
        lng: 74.4822,
        address: "Machhe-Udyambag Industrial Belt, Belagavi, Karnataka 590008",
        strengths: "200+ specialized foundry and machining units supplying precision cast components to Tata Motors, Mahindra, and infrastructure projects.",
        weaknesses: "Fragmented small-scale family units with legacy coal kilns, lack of unified automated digital quoting or standardized testing.",
        ourDifferentiation: "Clean-energy electric induction foundry aggregate, automated digital CAD-to-casting marketplace, and precision precast blocks.",
        fundingOrScale: "₹1,200 Cr+ Annual Cluster Output (MSME Industrial Ecosystem)",
        googleMapsQuery: "Belgaum Foundry Cluster Udyambag Belagavi",
      },
      {
        id: "machhe-precast-infra",
        name: "Machhe Modular Precast & Heavy Casting Works",
        brand: "Machhe Precast",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "udyambag",
        type: "Direct",
        locality: "Udyambag & Machhe",
        lat: 15.808,
        lng: 74.478,
        address: "Near VTU Jnana Sangama, Machhe, Belagavi 590018",
        strengths: "High-tonnage hydraulic presses for stormwater drain culverts and industrial flooring slabs.",
        weaknesses: "Heavy diesel transport dependency, limited custom architectural facade molds.",
        ourDifferentiation: "Lightweight fly-ash geopolymer precast beams offering 30% carbon reduction and automated site delivery.",
        fundingOrScale: "Mid-tier industrial precast manufacturing plant",
        googleMapsQuery: "Machhe Belagavi",
      },
      {
        id: "goyal-infrastructure",
        name: "Goyal Builders & Real Estate Consortium",
        brand: "Goyal Builders",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "camp",
        type: "Direct",
        locality: "Camp & College Road",
        lat: 15.8575,
        lng: 74.5042,
        address: "Khanapur Road, Camp, Belagavi 590001",
        strengths: "Large commercial showroom developments, institutional land banks across Belagavi fringes.",
        weaknesses: "Heavily brick-and-mortar sales channels, lack of digital BIM (Building Information Modeling) transparency for buyers.",
        ourDifferentiation: "BIM-integrated construction management with live drone progress dashboards and turnkey 90-day interior fit-outs.",
        fundingOrScale: "Large regional commercial builder",
        googleMapsQuery: "Goyal Builders Camp Belagavi",
      },
      {
        id: "nehru-nagar-smart-realty",
        name: "Nehru Nagar Commercial Realtors & Civil Tech",
        brand: "Nehru Nagar Developers",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "nehru-nagar",
        type: "Direct",
        locality: "Nehru Nagar / JNMC",
        lat: 15.885,
        lng: 74.516,
        address: "KLE Medical Corridor, Sector 1, Nehru Nagar, Belagavi 590010",
        strengths: "Specialized in clinic interior conversions, doctor residence apartments, and student hostel construction.",
        weaknesses: "Traditional subcontracting with unverified acoustic soundproofing or biomedical waste design.",
        ourDifferentiation: "Turnkey NABH-compliant clinic build-outs with medical-grade antibacterial flooring and cleanroom ventilation.",
        fundingOrScale: "Commercial healthcare realty firm",
        googleMapsQuery: "Nehru Nagar Belagavi",
      },
      {
        id: "belagavi-smart-city-spv",
        name: "Belagavi Smart City Civil Contracting Works",
        brand: "Smart City Infrastructure Works",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "sadashiv-nagar",
        type: "Indirect",
        locality: "Sadashiv Nagar / Civil Hospital",
        lat: 15.8745,
        lng: 74.5095,
        address: "City Corporation Office, Subhash Nagar, Belagavi 590016",
        strengths: "Government municipal road, stormwater drain, and public sanitation infrastructure contracts with assured public funding.",
        weaknesses: "Slow tender disbursement cycles, high vendor bureaucracy, minimal use of green recycled aggregates.",
        ourDifferentiation: "Recycled plastic-composite asphalt and eco-paver manufacturing delivering 2x lifespan at 20% lower raw material cost.",
        fundingOrScale: "Municipal public works pipeline (₹300 Cr+ city tenders)",
        googleMapsQuery: "Belagavi City Corporation",
      },
      {
        id: "khade-bazar-hardware",
        name: "Shahapur & Khade Bazar Building Material Market",
        brand: "Khade Bazar Building Materials",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "khade-bazar",
        type: "Indirect",
        locality: "Khade Bazar / Shahapur",
        lat: 15.858,
        lng: 74.512,
        address: "Shahapur Market Road, Belagavi 590003",
        strengths: "Historic high-density wholesale merchant network for steel bars, sanitary ware, tiles, and cement.",
        weaknesses: "Unorganized cash-heavy credit cycles, lack of online catalog, fragmented multi-vendor delivery.",
        ourDifferentiation: "Consolidated B2B digital procurement platform providing just-in-time bundled construction deliveries with working capital financing.",
        fundingOrScale: "Wholesale distributor cluster (₹80 Cr+ turnover)",
        googleMapsQuery: "Shahapur Hardware Market Belagavi",
      },
      {
        id: "kakati-ready-mix-precast",
        name: "Kakati Ready-Mix Concrete & Heavy Infra Works",
        brand: "Kakati RMC Plant",
        sector: "construction",
        sectorLabel: "Construction & Infrastructure",
        areaId: "kakati",
        type: "Direct",
        locality: "Kakati (NH-48 Belt)",
        lat: 15.934,
        lng: 74.533,
        address: "KIADB Industrial Phase 2, Kakati, Belagavi 591113",
        strengths: "Continuous batching plant supplying automated transit mixers for NH-48 flyovers and industrial warehouses.",
        weaknesses: "Long delivery transit delays during city traffic hours, lack of real-time transit telemetry for small contractors.",
        ourDifferentiation: "GPS-tracked on-demand RMC dispatch app with automated cube-test strength certification via WhatsApp.",
        fundingOrScale: "High-capacity automated RMC plant",
        googleMapsQuery: "Kakati Industrial Area Belagavi",
      },
    ],
  },
};

export function calculateBelagaviDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function normalizeBelagaviAreaQuery(rawQuery?: string): string {
  if (!rawQuery) return "all";
  const clean = rawQuery.toLowerCase().trim();
  if (!clean || clean === "all" || clean.includes("all belagavi")) return "all";

  // 1. Direct ID match
  const directIdMatch = BELAGAVI_AREAS.find((a) => a.id.toLowerCase() === clean);
  if (directIdMatch) return directIdMatch.id;

  // 2. Phonetic reduction: collapse 'dh' -> 'd', 'bh' -> 'b', 'gh' -> 'g', 'w' <-> 'v', strip non-alphanumeric
  const phonetic = clean
    .replace(/dh/g, "d")
    .replace(/bh/g, "b")
    .replace(/gh/g, "g")
    .replace(/w/g, "v")
    .replace(/[^a-z0-9]/g, "");

  // 3. Match against areas, aliases, names, and highlights
  for (const area of BELAGAVI_AREAS) {
    if (area.id === "all") continue;

    const areaIdClean = area.id.replace(/[^a-z0-9]/g, "");
    const areaNameClean = area.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const areaPhonetic = area.id
      .replace(/dh/g, "d")
      .replace(/bh/g, "b")
      .replace(/gh/g, "g")
      .replace(/w/g, "v")
      .replace(/[^a-z0-9]/g, "");

    // Direct substring or phonetic match on ID or Name
    if (clean.includes(area.id) || area.id.includes(clean)) return area.id;
    if (clean.includes(area.name.toLowerCase()) || area.name.toLowerCase().includes(clean)) return area.id;
    if (phonetic === areaPhonetic || phonetic.includes(areaPhonetic) || areaPhonetic.includes(phonetic)) return area.id;
    if (phonetic.includes(areaIdClean) || areaIdClean.includes(phonetic)) return area.id;
    if (phonetic.includes(areaNameClean) || areaNameClean.includes(phonetic)) return area.id;

    // Check aliases
    if (area.aliases) {
      for (const alias of area.aliases) {
        const aliasClean = alias.toLowerCase().trim();
        const aliasPhonetic = aliasClean
          .replace(/dh/g, "d")
          .replace(/bh/g, "b")
          .replace(/gh/g, "g")
          .replace(/w/g, "v")
          .replace(/[^a-z0-9]/g, "");

        if (clean === aliasClean || clean.includes(aliasClean) || aliasClean.includes(clean)) {
          return area.id;
        }
        if (phonetic === aliasPhonetic || phonetic.includes(aliasPhonetic) || aliasPhonetic.includes(phonetic)) {
          return area.id;
        }
      }
    }

    // Check highlights
    if (area.highlights.some((h) => clean.includes(h.toLowerCase()) || h.toLowerCase().includes(clean))) {
      return area.id;
    }
  }

  return clean;
}

export function filterBelagaviCompetitors(
  sectorKey: "food" | "education" | "healthcare" | "construction",
  areaQuery: string
): { competitors: BelagaviCompetitor[]; isExactAreaMatch: boolean } {
  const allSectorComps = BELAGAVI_SECTORS[sectorKey]?.competitors || [];
  const normalizedAreaId = normalizeBelagaviAreaQuery(areaQuery);

  if (!normalizedAreaId || normalizedAreaId === "all") {
    return {
      competitors: allSectorComps.map((c) => ({
        ...c,
        isDirectAreaMatch: true,
        distanceKm: 0,
        nearbyAreaImpactNote: `Operating in ${c.locality}, Belagavi.`,
      })),
      isExactAreaMatch: true,
    };
  }

  // Find exact matching area object
  const matchedArea = BELAGAVI_AREAS.find((a) => a.id === normalizedAreaId);

  const directMatches = allSectorComps.filter((c) => {
    if (matchedArea && c.areaId === matchedArea.id) return true;
    const loc = (c.locality + " " + c.address).toLowerCase();
    return (
      loc.includes(normalizedAreaId) ||
      (matchedArea && loc.includes(matchedArea.name.toLowerCase())) ||
      (matchedArea?.aliases && matchedArea.aliases.some((al) => loc.includes(al)))
    );
  });

  if (directMatches.length > 0) {
    const directTagged = directMatches.map((c) => {
      const dist = matchedArea
        ? calculateBelagaviDistanceKm(matchedArea.lat, matchedArea.lng, c.lat, c.lng)
        : 0.4;
      return {
        ...c,
        isDirectAreaMatch: true,
        distanceKm: dist,
        nearbyAreaImpactNote: `Immediate in-locality rival located directly in ${c.locality} (~${dist} km). Direct threat for same-neighborhood walk-ins, daily footfall, and local customer base.`,
      };
    });

    const others = allSectorComps
      .filter((c) => !directMatches.some((dm) => dm.id === c.id))
      .map((c) => {
        const dist = matchedArea
          ? calculateBelagaviDistanceKm(matchedArea.lat, matchedArea.lng, c.lat, c.lng)
          : 2.5;
        return {
          ...c,
          isDirectAreaMatch: false,
          distanceKm: dist,
          nearbyAreaImpactNote: `Located in ${c.locality} (~${dist} km away). Significant destination establishment that can draw high-intent diners, weekend footfalls, or delivery orders away from ${matchedArea?.name || "your area"}.`,
        };
      })
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    return {
      competitors: [...directTagged, ...others],
      isExactAreaMatch: true,
    };
  }

  // If no direct matches in that specific street/area, return all sector competitors with distances
  return {
    competitors: allSectorComps.map((c) => {
      const dist = matchedArea
        ? calculateBelagaviDistanceKm(matchedArea.lat, matchedArea.lng, c.lat, c.lng)
        : 2.0;
      return {
        ...c,
        isDirectAreaMatch: false,
        distanceKm: dist,
        nearbyAreaImpactNote: `Located in ${c.locality} (~${dist} km away). Key destination player in Belagavi.`,
      };
    }),
    isExactAreaMatch: false,
  };
}

export function resolveSectorKey(
  domainStr?: string,
  bizTypeStr?: string,
  tags?: string[]
): "food" | "education" | "healthcare" | "construction" {
  const d = (domainStr || "").toLowerCase().trim();

  // 1. Primary domain check first for highest classification priority
  if (
    d.includes("food") ||
    d.includes("beverage") ||
    d.includes("restaurant") ||
    d.includes("cafe") ||
    d.includes("dining") ||
    d.includes("kitchen") ||
    d.includes("catering") ||
    d.includes("tiffin") ||
    d.includes("darshini") ||
    d.includes("bakery") ||
    d.includes("sweet") ||
    d.includes("snack")
  ) {
    return "food";
  }

  if (
    d.includes("health") ||
    d.includes("wellness") ||
    d.includes("clinic") ||
    d.includes("hospital") ||
    d.includes("medical") ||
    d.includes("pharma") ||
    d.includes("doctor") ||
    d.includes("care") ||
    d.includes("fitness") ||
    d.includes("therapy")
  ) {
    return "healthcare";
  }

  if (
    d.includes("education") ||
    d.includes("edtech") ||
    d.includes("school") ||
    d.includes("college") ||
    d.includes("academy") ||
    d.includes("coaching") ||
    d.includes("tuition") ||
    d.includes("learning") ||
    d.includes("training")
  ) {
    return "education";
  }

  if (
    d.includes("construct") ||
    d.includes("infra") ||
    d.includes("building") ||
    d.includes("real estate") ||
    d.includes("precast") ||
    d.includes("civil") ||
    d.includes("builder") ||
    d.includes("developer") ||
    d.includes("turnkey")
  ) {
    return "construction";
  }

  // 2. Fallback to combined text
  const text = `${domainStr || ""} ${bizTypeStr || ""} ${(tags || []).join(" ")}`.toLowerCase();

  if (
    text.includes("food") ||
    text.includes("beverage") ||
    text.includes("cafe") ||
    text.includes("dining") ||
    text.includes("kitchen") ||
    text.includes("sweet") ||
    text.includes("kunda") ||
    text.includes("bakery") ||
    text.includes("restaurant") ||
    text.includes("qsr") ||
    text.includes("snack") ||
    text.includes("coffee") ||
    text.includes("tea") ||
    text.includes("brew") ||
    text.includes("catering") ||
    text.includes("tiffin") ||
    text.includes("darshini") ||
    text.includes("meal") ||
    text.includes("bistro") ||
    text.includes("dairy") ||
    text.includes("agro")
  ) {
    return "food";
  }

  if (
    text.includes("health") ||
    text.includes("wellness") ||
    text.includes("clinic") ||
    text.includes("hospital") ||
    text.includes("medical") ||
    text.includes("diagnostic") ||
    text.includes("pharma") ||
    text.includes("doctor") ||
    text.includes("nurse") ||
    text.includes("ayurved") ||
    text.includes("therapy") ||
    text.includes("patient") ||
    text.includes("care") ||
    text.includes("fitness") ||
    text.includes("maternity") ||
    text.includes("pediatric") ||
    text.includes("orthopedic") ||
    text.includes("surgery") ||
    text.includes("cancer") ||
    text.includes("dental")
  ) {
    return "healthcare";
  }

  if (
    text.includes("education") ||
    text.includes("edtech") ||
    text.includes("school") ||
    text.includes("college") ||
    text.includes("academy") ||
    text.includes("coaching") ||
    text.includes("learning") ||
    text.includes("teach") ||
    text.includes("student") ||
    text.includes("tuition") ||
    text.includes("vtu") ||
    text.includes("stem") ||
    text.includes("course") ||
    text.includes("training") ||
    text.includes("class") ||
    text.includes("institute") ||
    text.includes("degree")
  ) {
    return "education";
  }

  if (
    text.includes("construct") ||
    text.includes("infra") ||
    text.includes("building") ||
    text.includes("manufactur") ||
    text.includes("real estate") ||
    text.includes("civil") ||
    text.includes("contract") ||
    text.includes("foundry") ||
    text.includes("precast") ||
    text.includes("cement") ||
    text.includes("architect") ||
    text.includes("interior") ||
    text.includes("fit-out") ||
    text.includes("hardware") ||
    text.includes("steel") ||
    text.includes("tile") ||
    text.includes("housing") ||
    text.includes("property") ||
    text.includes("builder") ||
    text.includes("developer") ||
    text.includes("concrete") ||
    text.includes("turnkey")
  ) {
    return "construction";
  }

  return "food";
}

export function getBelagaviCompetitorsBySector(sector: string, areaQuery?: string): BelagaviCompetitor[] {
  const key = resolveSectorKey(sector);
  return filterBelagaviCompetitors(key, areaQuery || "all").competitors;
}
