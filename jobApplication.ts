export type JobMarket = 'cyprus' | 'europe';

export type JobLifeCycleStatus =
  | 'discovered'
  | 'viewed'
  | 'verified'
  | 'needs_review'
  | 'ready_to_apply'
  | 'approved'
  | 'sent'
  | 'delivery_failed'
  | 'replied'
  | 'applied';

export interface PreparedJobApplication {
  id: string;
  market?: JobMarket;
  company: string;
  position: string;
  city?: string;
  country?: string;
  location: string;
  recipientEmail: string;
  emailVerificationStatus: 'verified' | 'needs_review';
  emailVerificationReason?: string;
  jobPostingDate?: string;
  jobPostingDateVerified?: boolean;
  jobStatus?: 'verified' | 'needs_review';
  jobUrl?: string;
  applicationUrl?: string;
  subject: string;
  applicationMessage?: string;
  coverLetter: string;
  selectedCvId: string;
  cvTitle: string;
  sourceUrl?: string;
  sourceNotes?: string;
  verificationStatus: 'verified' | 'needs_review';
  reviewReason?: string;
  verifiedBy: string; // e.g. 'Gemini + OpenAI + Grok'
  isDuplicate: boolean;
  duplicateReason?: string;
  isApproved: boolean; // User manual approval flag
  status: 'pending_approval' | 'approved' | 'sent' | 'delivery_failed' | 'failed' | 'applied';
  deliveryStatus?: 'sent_accepted_by_gmail' | 'delivery_failed' | 'bounced';
  sentTimestamp?: string;
  appliedAt?: number;
  isNewVacancy?: boolean;
  firstDiscoveredAt?: number;
  lastSeenAt?: number;
  viewedAt?: number;
  lifeCycleStatus?: JobLifeCycleStatus;
  errorReason?: string;
  messageId?: string;
  threadId?: string;
  replyStatus?: 'none' | 'checked_no_reply' | 'reply_received';
  replySnippet?: string;
  replyDate?: string;
}

export interface JobFilterSettings {
  market: JobMarket;
  roles: string[];
  locations: string[];
  selectedCvId: string;
  selectedCvTitle: string;
}

export const DEFAULT_HOSPITALITY_ROLES: string[] = [
  'Bartender',
  'Barman',
  'Barista',
  'Mixologist',
  'Hotel Bar',
  'Restaurant Bar',
  'Pool Bar',
  'Lobby Bar',
  'Café',
  'Hospitality/Beverage positions',
];

export const DEFAULT_CYPRUS_LOCATIONS: string[] = [
  'Limassol Marina & City, Cyprus',
  'Paphos, Cyprus',
  'Ayia Napa & Protaras, Cyprus',
  'Larnaca, Cyprus',
  'Nicosia, Cyprus',
  'Polis Chrysochous, Cyprus',
];

export const DEFAULT_EUROPE_LOCATIONS: string[] = [
  'Greece (Athens, Santorini, Mykonos, Crete, Rhodes)',
  'Malta (Valletta, St. Julian\'s)',
  'Italy (Rome, Milan, Venice, Amalfi Coast)',
  'Spain (Barcelona, Madrid, Ibiza, Mallorca)',
  'Portugal (Lisbon, Porto, Algarve)',
  'France (Paris, French Riviera, Nice, Cannes)',
  'Germany (Berlin, Munich, Hamburg)',
  'Austria (Vienna, Salzburg, Innsbruck)',
  'Netherlands (Amsterdam, Rotterdam)',
  'Belgium (Brussels, Antwerp)',
  'Ireland (Dublin, Cork, Galway)',
  'Switzerland (Zurich, Geneva, St. Moritz)',
  'Croatia (Dubrovnik, Split, Hvar)',
  'Poland, Czechia & Central Europe',
  'Nordics (Sweden, Denmark, Norway, Finland)',
  'United Kingdom (London, Edinburgh)',
];
