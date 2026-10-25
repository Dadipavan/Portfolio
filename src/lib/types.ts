// Shape of the portfolio content stored in Supabase (portfolio_data, one JSON value per section).
// Optional fields exist because older records were saved before they were added.

// A role is one of the career directions the site is organised around (set up in Admin > Roles).
// Its id is a short slug such as "data-science"; "all" means "no role chosen".
export type TrackId = string;
export type RoleId = string;

// A file uploaded in the admin (an image or a PDF). It lives in the private storage bucket; the site shows it
// through /api/media/<path>, which only serves files that belong to something published.
export type MediaKind = 'screenshot' | 'chart' | 'diagram' | 'dashboard' | 'photo' | 'document';

export interface MediaFile {
  id: string;
  // storage key, for example "projects/3f2a9c1e-....webp"
  path: string;
  // the name the file had on the admin's computer, for display
  name: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  caption?: string;
  alt?: string;
  kind?: MediaKind;
}

// A profile photo and how it is cropped: the focus point is where the picture is centred
// inside its frame (0-100 %), the zoom enlarges it (1 = the whole picture fits the frame).
export interface ProfilePhoto {
  file: MediaFile;
  focusX: number;
  focusY: number;
  zoom: number;
}

// A link to another profile (Kaggle, Medium, LeetCode, ...), shown next to GitHub and LinkedIn
export interface ProfileLink {
  label: string;
  url: string;
}

export interface PersonalInfo {
  name: string;
  shortName: string;
  title: string;
  subtitle?: string;
  description: string;
  about: string;
  location: string;
  email: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  links?: ProfileLink[];
  cgpa?: string;
  graduation?: string;
  // shown by the looks that have a photo layout; the others ignore it
  photo?: ProfilePhoto;
}

export interface SkillCategory {
  category: string;
  emoji?: string;
  skills: string[];
}

export interface Metric {
  label: string;
  value: string;
}

export interface Project {
  id: number | string;
  title: string;
  subtitle?: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  year?: string;
  featured?: boolean;
  status?: string;
  // Career tracks this project demonstrates. When missing, they are inferred from the technologies.
  tracks?: TrackId[];
  // Case-study details (all optional, edited in Admin > Projects)
  problem?: string;
  approach?: string;
  keyFeatures?: string[];
  challenges?: string;
  solutions?: string;
  results?: string;
  metrics?: Metric[];
  learnings?: string;
  role?: string;
  teamSize?: number;
  startDate?: string;
  endDate?: string;
  images?: string[];
  // Show the live demo inside the page (when the app allows being embedded)
  embedLive?: boolean;
  // ---- the case study written in the admin (long texts are Markdown) ----
  // false keeps the project off the public site (a draft); missing means published
  published?: boolean;
  category?: string;
  tools?: string[];
  overview?: string;
  objectives?: string;
  dataSources?: string;
  implementation?: string;
  conclusions?: string;
  // extra sections the admin adds, each with its own heading
  sections?: CaseStudySection[];
  // images and screenshots uploaded for the project (charts, diagrams and dashboards are images too)
  media?: MediaFile[];
}

export interface CaseStudySection {
  id: string;
  title: string;
  body: string;
}

export interface Experience {
  id: number | string;
  title: string;
  company: string;
  location?: string;
  period: string;
  type?: string;
  description: string[];
}

export interface Education {
  id: number | string;
  institution: string;
  degree: string;
  location?: string;
  period: string;
  grade?: string;
  coursework?: string[];
}

export interface Certification {
  id?: number | string;
  title: string;
  issuer: string;
  year?: string;
  // the date it was issued, as typed ("2025-03" or "March 2025")
  issueDate?: string;
  credentialId?: string;
  description?: string;
  skills?: string[];
  verificationUrl?: string;
  // an address of a picture hosted elsewhere (older entries); uploads use `file`
  imageUrl?: string;
  // an image or PDF uploaded in the admin
  file?: MediaFile;
  // false hides it from the public site; missing means visible
  visible?: boolean;
}

export type AchievementCategory = 'hackathon' | 'competition' | 'award' | 'research' | 'milestone' | 'recognition' | 'other';

export interface Achievement {
  id?: number | string;
  title: string;
  description: string;
  // the story behind it
  background?: string;
  // a year or a date as typed
  date?: string;
  // who gave it or where it happened
  organization?: string;
  category?: AchievementCategory;
  // why it matters
  impact?: string;
  links?: ProfileLink[];
  // photos, certificates or other documents
  media?: MediaFile[];
  // false keeps it off the public site; missing means published
  published?: boolean;
}

export interface FocusArea {
  title: string;
  description: string;
  icon?: string;
}

export interface Recommendation {
  id: number | string;
  name: string;
  role?: string;
  relation?: string;
  quote: string;
  link?: string;
}

export interface PublicResume {
  id: string;
  name: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  uploadDate?: string;
  cloudUrl?: string;
  // The role this resume is written for (used by the "View as" switch)
  role?: RoleId;
}

// ---------------------------------------------------------------------------------------------
// Site settings (Admin > Appearance and Admin > Site settings)
// ---------------------------------------------------------------------------------------------

export type LayoutId =
  | 'dashboard'
  | 'bento'
  | 'lab'
  | 'split'
  | 'story'
  | 'portrait'
  | 'editorial'
  | 'terminal'
  | 'classic'
  | 'spotlight'
  | 'aurora'
  | 'brutal'
  | 'notebook';
export type ThemeMode = 'layout' | 'light' | 'dark' | 'system';
export type AccentId = 'blue' | 'teal' | 'violet' | 'amber';
export type WidgetId = 'kpis' | 'radar' | 'perYear' | 'techMap' | 'heatmap';

export type SectionId =
  | 'about'
  | 'insights'
  | 'projects'
  | 'skills'
  | 'timeline'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'achievements'
  | 'moments'
  | 'recommendations'
  | 'work'
  | 'contact';

export type FeatureId =
  | 'moments'
  | 'roleSwitch'
  | 'quickView'
  | 'explorer'
  | 'searchPalette'
  | 'timeline'
  | 'queryBar'
  | 'charts'
  | 'heroChart'
  | 'countUp'
  | 'pipelineMotif'
  | 'dataDownloads'
  | 'demoPreviews'
  | 'caseStudies'
  | 'workWithMe'
  | 'shareTools'
  | 'recommendations'
  | 'insights';

export interface Appearance {
  layout: LayoutId;
  theme: ThemeMode;
  allowVisitorTheme: boolean;
  accent: AccentId;
  animations: boolean;
  // Charts shown in the dashboard / insights area, in this order
  widgets: WidgetId[];
}

// Colour families for roles (each has a light and a dark version in the stylesheet)
export type PaletteId = 'teal' | 'amber' | 'blue' | 'violet' | 'rose' | 'green' | 'orange' | 'cyan';
export type RoleIconId = 'database' | 'chart' | 'flask' | 'cpu' | 'brain' | 'code' | 'cloud' | 'layers' | 'target' | 'sparkles';

// A career direction, for example "Data Engineering" / "Data Engineer"
export interface RoleDef {
  id: string;
  // The discipline: shown on cards, charts and project tags ("Data Engineering")
  label: string;
  // The job title: shown on the "View as" switch ("Data Engineer")
  title: string;
  blurb: string;
  // Where the role sits in the life of data, for the pipeline look ("Collect & clean")
  stage: string;
  palette: PaletteId;
  icon: RoleIconId;
  // Words that tie a technology or project to this role (a project can also be tagged by hand)
  keywords: string[];
  // Extra words used only to pick which skills belong to this role
  skillKeywords: string[];
  // What "View as <role>" shows: a headline and summary in the intro, and the resume to offer
  headline: string;
  summary: string;
  resumeId: string;
  // Breaks ties when several roles match equally (higher wins; the list position is used when missing)
  priority?: number;
}

export interface WorkWithMe {
  enabled: boolean;
  roles: string[];
  location: string;
  remote: string;
  startDate: string;
  contact: string;
  bookingUrl: string;
  note: string;
}

export interface Highlight {
  label: string;
  value: string;
}

export interface SectionSettings {
  // Order of the sections down the page. Empty = the order of the chosen look.
  order: SectionId[];
  // Sections that are switched off
  hidden: SectionId[];
}

export interface SiteSettings {
  // Small label above the name, for example "Data enthusiast"
  kicker: string;
  availability: { enabled: boolean; text: string };
  // Text changed in Admin > Text and labels. Only changed entries are stored; the rest use the built-in wording.
  copy: Record<string, string>;
  additionalCertifications: string[];
  // The choices in the "What is this about?" list of the contact form
  contactTopics: string[];
  appearance: Appearance;
  features: Record<FeatureId, boolean>;
  roles: RoleDef[];
  sections: SectionSettings;
  workWithMe: WorkWithMe;
  // Numbers for the highlights strip. Empty = computed from the content.
  highlights: Highlight[];
}

// A moment: a picture with a few words, shown on a strip grouped by year and, if wanted, as a popup.
export type MomentFrequency = 'once' | 'session' | 'daily';

export interface MomentPopup {
  enabled: boolean;
  // the days the popup may appear (YYYY-MM-DD, local time of the visitor); empty = no limit on that side
  start: string;
  end: string;
  // seconds after the page opened
  delay: number;
  // once = one time on each device, session = once per visit, daily = at most once a day
  frequency: MomentFrequency;
}

export interface Moment {
  id: string | number;
  title: string;
  // a few words, shown on hover and in the popup
  text: string;
  // the year it belongs to on the strip ("2026"); taken from the date when empty
  year: string;
  image?: MediaFile;
  imageAlt?: string;
  link?: ProfileLink;
  // show on the yearly strip
  strip: boolean;
  popup: MomentPopup;
  // false keeps it off the site (a draft); missing means published
  published?: boolean;
  // changes every time it is saved, so an edited popup is shown again to people who closed the old one
  updatedAt?: string;
}

export interface PortfolioContent {
  personalInfo: PersonalInfo;
  technicalSkills: SkillCategory[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  achievements: Achievement[];
  moments: Moment[];
  currentFocus: FocusArea[];
  recommendations: Recommendation[];
  quickFacts?: Record<string, string>;
  siteSettings: SiteSettings;
  resumes: PublicResume[];
  // Latest update time across all sections; used to refresh open pages after an admin save
  version: string;
}
