import { CVData, CVTemplateType } from '../types/cv';

export const BASE_PERSONAL_INFO = [
  { id: 'pi-1', label: 'Name', value: 'Fazle Rabbi Boyati' },
  { id: 'pi-2', label: 'Date of Birth', value: '17-10-2003' },
  { id: 'pi-3', label: 'Nationality', value: 'Bangladeshi' },
  { id: 'pi-4', label: 'Sex', value: 'Male' },
  { id: 'pi-5', label: 'Marital Status', value: 'Unmarried' },
  { id: 'pi-6', label: 'National ID No', value: '4667284865' },
  { id: 'pi-7', label: 'Passport No', value: 'A14716275' },
  { id: 'pi-8', label: 'Present', value: 'Kato Paphos, Tombs of the Kings Road' },
];

export const BASE_SUPPORTING_PHOTOS = [
  {
    id: 'photo-1',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80',
    caption: 'Cocktail Mixology & Dual Bottle Pour Technique',
    included: true,
  },
  {
    id: 'photo-2',
    url: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=800&auto=format&fit=crop&q=80',
    caption: 'Luxury 5-Star Hotel Dining Room & Hospitality Uniform',
    included: true,
  },
  {
    id: 'photo-3',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    caption: 'Cyprus Residence Permit & Verified Identification',
    included: true,
  },
];

export const BARTENDER_CV_DATA: CVData = {
  fullName: 'Fazle Rabbi',
  professionalTitle: 'Bartender',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  location: 'Cyprus, Paphos, Tombs of the Kings Road',
  email: 'Fazlerabbe905@gmail.com',
  phone: '+357-95502363',
  linkedIn: 'Fazle Rabbi - Bartender',

  additionalPhotos: BASE_SUPPORTING_PHOTOS,
  showAdditionalPhotosPage: true,

  aboutMe: {
    enabled: true,
    title: 'ABOUT ME',
    content:
      'Friendly and customer-focused Bartender & Barista with 5+ years of experience in crafting cocktails, specialty coffee, and exotic beverages. Skilled in latte art, operating multiple espresso machines, and delivering top-notch service in fast-paced pub environments. Passionate about fair trade drinks and creating memorable guest experiences.',
  },

  personalInfo: {
    enabled: true,
    title: 'PERSONAL INFORMATION',
    items: BASE_PERSONAL_INFO,
  },

  trainingSummary: {
    enabled: true,
    title: 'TRAINING SUMMARY',
    items: [
      { id: 'tr-1', text: 'Completed professional bartending course.' },
      { id: 'tr-2', text: 'Trained in mixology, cocktail preparation, and beverage pairing' },
      { id: 'tr-3', text: 'Pairing. Knowledge of bar hygiene, stock management, and responsible alco service.' },
    ],
  },

  academicQualifications: {
    enabled: true,
    title: 'ACADEMIC QUALIFICATIONS',
    items: [
      {
        id: 'ac-1',
        degree: 'Higher Secondary Certificate (H.S.C)',
        institution: 'Shariatpur Govt. College (City: Sariatpur, Bangladesh)',
        year: '2019-2021',
      },
    ],
  },

  languages: {
    enabled: true,
    title: 'Language',
    items: [
      { id: 'lang-1', language: 'Bangla', proficiency: 'Fluent' },
      { id: 'lang-2', language: 'English', proficiency: 'B2' },
      { id: 'lang-3', language: 'Hindi', proficiency: 'A2' },
    ],
  },

  workExperienceTitle: 'Work Experience',
  jobResponsibilitiesTitle: 'Job responsibilities',

  experiences: [
    {
      id: 'exp-1',
      companyName: 'Flamingo Paradise Beach Hotel',
      position: 'Senior Bartender',
      employmentType: 'Full-time',
      startDate: 'Feb 2026',
      endDate: 'Present',
      location: '9 Amphitrites Street, Protara 5296',
      responsibilities: [
        'Maintaining bar and restaurant cleanliness and hygiene.',
        'Preparing and serving drinks and food efficiently.',
        'Providing excellent customer service and handling complaints professionally.',
      ],
    },
    {
      id: 'exp-2',
      companyName: "O'Neill's Irish Bar and Grill",
      position: 'Bartender',
      employmentType: 'Full-time',
      startDate: 'May 2025',
      endDate: 'Jan 2026',
      location: 'Paphos, Tombs of the King road',
      responsibilities: [
        'Maintaining bar and restaurant cleanliness and hygiene.',
        'Preparing and serving drinks and food efficiently.',
        'Providing excellent customer service and handling complaints politely.',
        'Managing cash, POS, and billing accurately.',
      ],
    },
    {
      id: 'exp-3',
      companyName: "Sea Pearl Beach Resort & Spa Cox's Bazar",
      position: 'Bartender',
      employmentType: 'Full-time',
      startDate: 'Oct 2023',
      endDate: 'April 2025',
      location: "Jaliapalong, Cox's Bazar",
      responsibilities: [
        'Crafting classic and signature cocktails with accuracy and consistency.',
        'Maintaining bar stock levels, rotating inventory, and checking expiry dates.',
        'Engaging with customers to understand drink preferences and give recommendations.',
        'Ensuring all bar tools, glassware, and workstations are clean and ready for service.',
        'Preparing garnishes, syrups, and fresh ingredients before service.',
      ],
    },
    {
      id: 'exp-4',
      companyName: 'The Westin Dhaka',
      position: 'Bartender',
      employmentType: 'Full-time',
      startDate: 'April 2021',
      endDate: 'Oct 2023',
      location: 'Main Gulshan Avenue, Dhaka, Bangladesh',
      responsibilities: [
        'Preparing premium cocktails, mocktails, and bespoke drinks with luxury-level presentation and consistency.',
        'Maintaining full bar stock, conducting daily inventory checks, and ensuring all premium spirits and wines are available.',
        'Delivering exceptional guest service following five-star hospitality standards and personalized guest interaction.',
        'Ensuring the bar area, glassware, and equipment are sanitized and presented at luxury hotel standards.',
        'Coordinating with F&B team, room service, and lounge staff for smooth and elegant service flow.',
      ],
    },
  ],

  partTimeExperiences: [
    {
      id: 'pt-1',
      companyName: 'Lighthouse Beach Lounge',
      position: 'Bartender',
      employmentType: 'Part-time',
      startDate: 'Jun 2025',
      endDate: 'Sep 2025',
      location: 'Limassol, Cyprus',
      responsibilities: [
        'Crafting classic and sunset signature cocktails during peak beach shifts.',
        'Maintaining prompt and attentive service in a busy outdoor bar setting.',
      ],
    },
  ],

  skills: {
    enabled: true,
    title: 'SKILL',
    items: [
      'FRIENDLY CUSTOMER SERVICE',
      'SPEED & ACCURACY IN SERVICE',
      'COCKTAIL & MIXOLOGY EXPERTISE',
      'BAR INVENTORY MANAGEMENT',
      'HYGIENE & SAFETY COMPLIANCE',
      'TIME MANAGEMENT',
      'KNOWLEDGE OF COFFEE BREWS & ROASTS',
      'COFFEE MACHINE CALIBRATION',
      'BREWING COFFEE MANUALLY & AUTOMATICALLY',
      'KNOWLEDGE OF VARIETY OF DRINK RECIPES',
    ],
  },

  experienceSortOrder: 'newest-first',
};

export const BARISTA_CV_DATA: CVData = {
  fullName: 'Fazle Rabbi',
  professionalTitle: 'Barista',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  location: 'Cyprus, Paphos, Tombs of the Kings Road',
  email: 'Fazlerabbe905@gmail.com',
  phone: '+357-95502363',
  linkedIn: 'Fazle Rabbi - Barista',

  additionalPhotos: BASE_SUPPORTING_PHOTOS,
  showAdditionalPhotosPage: true,

  aboutMe: {
    enabled: true,
    title: 'ABOUT ME',
    content:
      'Artisan Barista and Specialty Coffee Professional with over 5 years of mastery in commercial espresso machines, grind calibration, latte art, and brewing single-origin beans. Dedicated to delivering consistent cup profiles, high-speed peak service, and cultivating warm guest loyalty with unmatched coffee knowledge.',
  },

  personalInfo: {
    enabled: true,
    title: 'PERSONAL INFORMATION',
    items: BASE_PERSONAL_INFO,
  },

  trainingSummary: {
    enabled: true,
    title: 'TRAINING SUMMARY',
    items: [
      { id: 'tr-1', text: 'Specialty Coffee Association (SCA) Barista Skills Foundation.' },
      { id: 'tr-2', text: 'Advanced Latte Art, Milk Microfoam Pitcher Techniques & Pouring.' },
      { id: 'tr-3', text: 'Espresso Extraction Science: TDS, Brew Ratios & Grinder Burr Calibration.' },
    ],
  },

  academicQualifications: {
    enabled: true,
    title: 'ACADEMIC QUALIFICATIONS',
    items: [
      {
        id: 'ac-1',
        degree: 'Higher Secondary Certificate (H.S.C)',
        institution: 'Shariatpur Govt. College (City: Sariatpur, Bangladesh)',
        year: '2019-2021',
      },
    ],
  },

  languages: {
    enabled: true,
    title: 'Language',
    items: [
      { id: 'lang-1', language: 'Bangla', proficiency: 'Fluent' },
      { id: 'lang-2', language: 'English', proficiency: 'B2' },
      { id: 'lang-3', language: 'Hindi', proficiency: 'A2' },
    ],
  },

  workExperienceTitle: 'Work Experience',
  jobResponsibilitiesTitle: 'Job responsibilities',

  experiences: [
    {
      id: 'bar-exp-1',
      companyName: 'Flamingo Paradise Beach Hotel',
      position: 'Head Barista & Lounge Specialist',
      employmentType: 'Full-time',
      startDate: 'Feb 2026',
      endDate: 'Present',
      location: '9 Amphitrites Street, Protara 5296',
      responsibilities: [
        'Operating multi-group commercial espresso machines and calibrating grinders daily.',
        'Crafting intricate latte art (rosetta, swan, tulip) for boutique hotel guests.',
        'Curating seasonal specialty coffee menu including cold brew and nitro coffee.',
      ],
    },
    {
      id: 'bar-exp-2',
      companyName: "O'Neill's Irish Bar and Grill",
      position: 'Barista & Beverage Specialist',
      employmentType: 'Full-time',
      startDate: 'May 2025',
      endDate: 'Jan 2026',
      location: 'Paphos, Tombs of the King road',
      responsibilities: [
        'Speedily serving specialty coffees, Irish coffees, and teas during busy morning & brunch rush.',
        'Performing daily backflushing, steam wand sanitation, and water filtration checks.',
        'Managing coffee bean inventory, rotating roast batches, and maintaining zero waste.',
      ],
    },
    {
      id: 'bar-exp-3',
      companyName: 'Sugar Boulangerie & Cafe',
      position: 'Senior Barista',
      employmentType: 'Full-time',
      startDate: 'Oct 2023',
      endDate: 'April 2025',
      location: 'Banani & Gulshan, Dhaka',
      responsibilities: [
        'Brewing pour-overs (V60, Chemex, Aeropress) with precise temperature and extraction ratios.',
        'Training junior baristas on espresso extraction consistency and milk texturing standards.',
        'Receiving top guest reviews for personalized coffee recommendations and warm hospitality.',
      ],
    },
    {
      id: 'bar-exp-4',
      companyName: 'The Westin Dhaka',
      position: 'Lounge Barista',
      employmentType: 'Full-time',
      startDate: 'April 2021',
      endDate: 'Oct 2023',
      location: 'Main Gulshan Avenue, Dhaka, Bangladesh',
      responsibilities: [
        'Serving gourmet coffees and signature blends to five-star hotel VIP lounge guests.',
        'Ensuring five-star beverage presentation and strict international food safety standards.',
        'Coordinating with pastry and culinary chefs for gourmet coffee and dessert pairings.',
      ],
    },
  ],

  partTimeExperiences: [
    {
      id: 'bar-pt-1',
      companyName: 'Paphos Artisan Coffee Roasters',
      position: 'Barista',
      employmentType: 'Part-time',
      startDate: 'Jun 2025',
      endDate: 'Sep 2025',
      location: 'Kato Paphos, Cyprus',
      responsibilities: [
        'Assisting roastmaster in cupping sessions, origin tasting notes, and single-origin retail.',
        'Delivering prompt and friendly specialty coffee service in a busy tourist hub.',
      ],
    },
  ],

  skills: {
    enabled: true,
    title: 'SKILL',
    items: [
      'SPECIALTY ESPRESSO EXTRACTION',
      'LATTE ART & MILK TEXTURING',
      'GRINDER CALIBRATION & DIALING IN',
      'POUR OVER (V60, CHEMEX, AEROPRESS)',
      'SINGLE-ORIGIN BEAN PROFILES',
      'PEAK RUSH SPEED & ACCURACY',
      'ESPRESSO MACHINE MAINTENANCE',
      'BAR SANITATION & HACCP STANDARDS',
      'WARM CUSTOMER ENGAGEMENT',
      'INVENTORY & ROAST ROTATION',
    ],
  },

  experienceSortOrder: 'newest-first',
};

export const HOTEL_CV_DATA: CVData = {
  fullName: 'Fazle Rabbi',
  professionalTitle: 'Hotelier',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  location: 'Cyprus, Paphos, Tombs of the Kings Road',
  email: 'Fazlerabbe905@gmail.com',
  phone: '+357-95502363',
  linkedIn: 'Fazle Rabbi - Hospitality Professional',

  additionalPhotos: BASE_SUPPORTING_PHOTOS,
  showAdditionalPhotosPage: true,

  aboutMe: {
    enabled: true,
    title: 'ABOUT ME',
    content:
      'Energetic and refined Hospitality Professional with extensive experience across luxury international hotel brands. Expert in five-star food & beverage service, banquet event management, and VIP guest relations. Committed to upholding Forbes Travel Guide service standards and creating unforgettable experiences for distinguished guests.',
  },

  personalInfo: {
    enabled: true,
    title: 'PERSONAL INFORMATION',
    items: BASE_PERSONAL_INFO,
  },

  trainingSummary: {
    enabled: true,
    title: 'TRAINING SUMMARY',
    items: [
      { id: 'tr-1', text: 'Five-Star International Luxury Hospitality & Guest Etiquette Standards.' },
      { id: 'tr-2', text: 'HACCP & International Food Safety Hygiene Certification.' },
      { id: 'tr-3', text: 'Conflict Resolution, VIP Guest Care & Upselling in Luxury Resorts.' },
    ],
  },

  academicQualifications: {
    enabled: true,
    title: 'ACADEMIC QUALIFICATIONS',
    items: [
      {
        id: 'ac-1',
        degree: 'Higher Secondary Certificate (H.S.C)',
        institution: 'Shariatpur Govt. College (City: Sariatpur, Bangladesh)',
        year: '2019-2021',
      },
    ],
  },

  languages: {
    enabled: true,
    title: 'Language',
    items: [
      { id: 'lang-1', language: 'Bangla', proficiency: 'Fluent' },
      { id: 'lang-2', language: 'English', proficiency: 'B2' },
      { id: 'lang-3', language: 'Hindi', proficiency: 'A2' },
    ],
  },

  workExperienceTitle: 'Work Experience',
  jobResponsibilitiesTitle: 'Job responsibilities',

  experiences: [
    {
      id: 'hot-exp-1',
      companyName: 'Flamingo Paradise Beach Hotel',
      position: 'Senior Food & Beverage Associate',
      employmentType: 'Full-time',
      startDate: 'Feb 2026',
      endDate: 'Present',
      location: '9 Amphitrites Street, Protara 5296',
      responsibilities: [
        'Delivering luxury hospitality services across resort restaurants, pool bar, and private events.',
        'Assisting international resort guests with menu pairings, dietary requirements, and VIP requests.',
        'Ensuring impeccably sanitized dining areas following Mediterranean resort hygiene compliance.',
      ],
    },
    {
      id: 'hot-exp-2',
      companyName: "O'Neill's Irish Bar and Grill",
      position: 'Hospitality Supervisor',
      employmentType: 'Full-time',
      startDate: 'May 2025',
      endDate: 'Jan 2026',
      location: 'Paphos, Tombs of the King road',
      responsibilities: [
        'Greeting patrons warmly, supervising floor seating, and coordinating smooth kitchen & bar communication.',
        'Resolving guest concerns with immediate courtesy and ensuring five-star satisfaction ratings.',
        'Auditing cash registers, daily end-of-day reports, and staff scheduling.',
      ],
    },
    {
      id: 'hot-exp-3',
      companyName: "Sea Pearl Beach Resort & Spa Cox's Bazar",
      position: 'Guest Service & Beverage Specialist',
      employmentType: 'Full-time',
      startDate: 'Oct 2023',
      endDate: 'April 2025',
      location: "Jaliapalong, Cox's Bazar",
      responsibilities: [
        'Serving international hotel guests across beachside dining, VIP lounge, and private banquets.',
        'Maintaining strict compliance with resort luxury service guidelines and table service standards.',
        'Assisting in large-scale corporate conferences, destination weddings, and gala dinners.',
      ],
    },
    {
      id: 'hot-exp-4',
      companyName: 'The Westin Dhaka',
      position: 'Five-Star Hospitality Associate',
      employmentType: 'Full-time',
      startDate: 'April 2021',
      endDate: 'Oct 2023',
      location: 'Main Gulshan Avenue, Dhaka, Bangladesh',
      responsibilities: [
        'Delivering premium personalized guest service in an internationally acclaimed 5-star hotel.',
        'Coordinating with front office, concierge, and culinary teams for seamless guest stay experiences.',
        'Consistently commended for professional presentation, punctuality, and cultural etiquette.',
      ],
    },
  ],

  partTimeExperiences: [
    {
      id: 'hot-pt-1',
      companyName: 'Coral Bay Resort & Events Club',
      position: 'Banquet Associate',
      employmentType: 'Part-time',
      startDate: 'Jun 2025',
      endDate: 'Sep 2025',
      location: 'Paphos, Cyprus',
      responsibilities: [
        'Supporting VIP wedding banquets, private corporate retreats, and beachfront celebrations.',
        'Ensuring swift, polite, and coordinated service across dynamic outdoor dining environments.',
      ],
    },
  ],

  skills: {
    enabled: true,
    title: 'SKILL',
    items: [
      '5-STAR HOSPITALITY PROTOCOLS',
      'VIP GUEST SERVICE EXCELLENCE',
      'BANQUET & EVENT COORDINATION',
      'MULTILINGUAL GUEST COMMUNICATION',
      'CONFLICT RESOLUTION & COURTESY',
      'LUXURY TABLE & BEVERAGE SERVICE',
      'HACCP SANITATION COMPLIANCE',
      'POS & MICROS OPERATIONS',
      'TEAM COORDINATION & LEADERSHIP',
      'FLEXIBILITY IN HIGH-PRESSURE RUSH',
    ],
  },

  experienceSortOrder: 'newest-first',
};

export const BLANK_CV_DATA: CVData = {
  fullName: 'Fazle Rabbi',
  professionalTitle: 'Hospitality Specialist',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  location: 'Cyprus, Paphos, Tombs of the Kings Road',
  email: 'Fazlerabbe905@gmail.com',
  phone: '+357-95502363',
  linkedIn: 'Fazle Rabbi',

  additionalPhotos: BASE_SUPPORTING_PHOTOS,
  showAdditionalPhotosPage: true,

  aboutMe: {
    enabled: true,
    title: 'ABOUT ME',
    content:
      'Passionate and experienced hospitality professional with a track record of excellence in guest service, beverage craftsmanship, and international teamwork.',
  },

  personalInfo: {
    enabled: true,
    title: 'PERSONAL INFORMATION',
    items: BASE_PERSONAL_INFO,
  },

  trainingSummary: {
    enabled: true,
    title: 'TRAINING SUMMARY',
    items: [
      { id: 'tr-1', text: 'Professional Hospitality & Service Training Certification.' },
    ],
  },

  academicQualifications: {
    enabled: true,
    title: 'ACADEMIC QUALIFICATIONS',
    items: [
      {
        id: 'ac-1',
        degree: 'Higher Secondary Certificate (H.S.C)',
        institution: 'Shariatpur Govt. College (City: Sariatpur, Bangladesh)',
        year: '2019-2021',
      },
    ],
  },

  languages: {
    enabled: true,
    title: 'Language',
    items: [
      { id: 'lang-1', language: 'Bangla', proficiency: 'Fluent' },
      { id: 'lang-2', language: 'English', proficiency: 'B2' },
      { id: 'lang-3', language: 'Hindi', proficiency: 'A2' },
    ],
  },

  workExperienceTitle: 'Work Experience',
  jobResponsibilitiesTitle: 'Job responsibilities',

  experiences: [
    {
      id: 'blank-exp-1',
      companyName: 'Flamingo Paradise Beach Hotel',
      position: 'Hospitality Professional',
      employmentType: 'Full-time',
      startDate: 'Feb 2026',
      endDate: 'Present',
      location: 'Cyprus',
      responsibilities: [
        'Providing excellent customer service.',
        'Preparing and serving food & beverages efficiently.',
        'Maintaining hygiene and sanitation standards.',
      ],
    },
  ],

  partTimeExperiences: [],

  skills: {
    enabled: true,
    title: 'SKILL',
    items: [
      'CUSTOMER SERVICE',
      'COMMUNICATION SKILLS',
      'TIME MANAGEMENT',
      'TEAMWORK & RELIABILITY',
    ],
  },

  experienceSortOrder: 'newest-first',
};

export function getTemplateData(type: CVTemplateType): { title: string; subtitle: string; data: CVData } {
  switch (type) {
    case 'barista':
      return {
        title: 'Fazle Rabbi — Barista CV',
        subtitle: 'Head Barista & Specialty Coffee Artisan',
        data: JSON.parse(JSON.stringify(BARISTA_CV_DATA)),
      };
    case 'hotel':
      return {
        title: 'Fazle Rabbi — Hotel CV',
        subtitle: 'Luxury 5-Star Hotel Hospitality & F&B Specialist',
        data: JSON.parse(JSON.stringify(HOTEL_CV_DATA)),
      };
    case 'blank':
      return {
        title: 'Fazle Rabbi — Custom CV',
        subtitle: 'Hospitality Specialist',
        data: JSON.parse(JSON.stringify(BLANK_CV_DATA)),
      };
    case 'bartender':
    default:
      return {
        title: 'Fazle Rabbi — Bartender CV',
        subtitle: 'Senior Bartender & Mixologist',
        data: JSON.parse(JSON.stringify(BARTENDER_CV_DATA)),
      };
  }
}
