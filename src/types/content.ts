/** Name of an icon in the icon registry (see components/icon-registry.tsx). */
export type IconName = string;

export interface LinkItem {
  label: string;
  href: string;
  /** Hidden from visitors (only buttons marked with editHide can be hidden). */
  hidden?: boolean;
}

export type NavItem = LinkItem;
export type FooterLink = LinkItem;

/** A form option with an icon (dropdowns in the booking and contact forms). */
export interface IconOption {
  label: string;
  icon: IconName;
}

export interface SocialLink extends LinkItem {
  icon: IconName;
}

export interface ServiceCard {
  title: string;
  price: string;
  image: string;
  /** Optional muted looping video for the card front (MP4). `image` is its poster and the card back. */
  video?: string;
}

export interface PortfolioItem {
  title: string;
  category: string;
  image: string;
  href: string;
  /** Filter tags used on the Our Works page. */
  tags?: string[];
  /** Content path of the project ("projects.3"), for the in-page editor. */
  editPath?: string;
}

export interface Project {
  /** Stable identity (set on save), so an address change can be told apart from a new project. */
  id?: string;
  slug: string;
  title: string;
  category: string;
  /** Card image used in the portfolio grids. */
  image: string;
  /** Full-size cover photo behind the project title. */
  hero: string;
  tags: string[];
  /** Slugs shown under "Other works". */
  related: string[];
  /** Photos on the project page. Missing on older saved content: filled from projectPage.gallery. */
  gallery?: GalleryImage[];
  /** Text and Client / Where / When of this project's page. Missing on older saved content: filled from projectPage. */
  intro?: string;
  meta?: { label: string; value: string }[];
  /** Hand-written Google title/description for this project; empty = automatic (title, coverage, city). */
  seoTitle?: string;
  seoDescription?: string;
  /** When not false, the page address follows the title (set on save). */
  autoSlug?: boolean;
  /** Previous addresses of this project; they redirect to the current one. */
  oldSlugs?: string[];
}

export interface GalleryImage {
  src: string;
  width: number;
  height: number;
  /** Logos strip only: extra size factor for logos that look small (1 = automatic size). */
  scale?: number;
}

export interface Testimonial {
  quote: string;
  name: string;
  company: string;
  companyHref: string;
  avatar: string;
}

export interface ServiceRow {
  number: string;
  title: string;
  items: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export interface AboutFeature {
  title: string;
  text: string;
  image: string;
  width: number;
  height: number;
  /** Optional button under the text; shown when it has a label. */
  cta?: LinkItem;
}

export interface FilterTab {
  label: string;
  value: string;
}

/** Pages whose address (slug) can be changed in the editor. */
export type PageKey = "works" | "about" | "contact";

/** Everything the admin editor can change. Stored as JSON and merged over the defaults. */
export interface SiteContent {
  site: { title: string; description: string };
  /** Hand-written Google title/description per page; empty = the automatic text from lib/seo.ts. */
  seo: Record<"home" | PageKey, { title: string; description: string }>;
  /** Address of each page, without slashes ("our-works" → /our-works). */
  pages: Record<PageKey, string>;
  /** Earlier addresses of each page; they redirect to the current one. */
  oldPages: Record<PageKey, string[]>;
  brand: { logoHero: string; logoBar: string; logoFooter: string };
  nav: { items: NavItem[]; contact: LinkItem };
  home: {
    slides: string[];
    /** Optional photos for phones (vertical). When set, they replace `slides` below 768px. */
    slidesMobile: string[];
    /** Client logos in the strip under the slides (shown in grayscale). */
    logos: GalleryImage[];
    quote: string;
    /** Words of the quote that get the brush-stroke underline. */
    quoteHighlight: string;
    quoteCta: LinkItem;
    serviceCards: ServiceCard[];
    serviceCta: LinkItem;
    worksTitle: string;
    works: string[];
    worksCta: LinkItem;
    testimonials: Testimonial[];
    whatWeDoTitle: string;
    serviceRows: ServiceRow[];
    whatWeDoCta: LinkItem;
  };
  appointment: {
    title: string;
    subtitle: string;
    image: string;
    serviceLabel: string;
    servicePlaceholder: IconOption;
    services: IconOption[];
    locationLabel: string;
    locationAny: IconOption;
    locations: IconOption[];
    employeeLabel: string;
    employeeAny: IconOption;
    employees: IconOption[];
    submitLabel: string;
    /** Step 2: contact details. */
    detailsNameLabel: string;
    detailsEmailLabel: string;
    detailsPhoneLabel: string;
    detailsMessageLabel: string;
    backLabel: string;
    sendLabel: string;
    /** Shown for a moment after the form is sent. */
    sendingMessage: string;
    successMessage: string;
    newReservationLabel: string;
  };
  /** filters = the categories; the "show everything" tab is added in front with allLabel. */
  works: { title: string; allLabel: string; filters: FilterTab[] };
  projects: Project[];
  projectPage: { intro: string; meta: { label: string; value: string }[]; gallery: GalleryImage[]; otherTitle: string };
  about: {
    heroTitle: string;
    heroImage: string;
    intro: string;
    features: AboutFeature[];
    /** Hides the whole team section (title + people). */
    teamHidden?: boolean;
    teamTitle: string;
    team: TeamMember[];
  };
  contact: {
    formTitle: string;
    nameLabel: string;
    emailLabel: string;
    sessionLabel: string;
    sessionTypes: IconOption[];
    referralLabel: string;
    referrals: IconOption[];
    messageLabel: string;
    submitLabel: string;
    addressTitle: string;
    directions: LinkItem;
    image: string;
  };
  footer: {
    contactTitle: string;
    address: string;
    phone: string;
    email: string;
    menuTitle: string;
    links: FooterLink[];
    followTitle: string;
    socials: SocialLink[];
  };
}
