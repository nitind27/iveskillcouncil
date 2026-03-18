/**
 * User Panel (Public) – Dynamic config for institute/franchise homepage.
 * Admin can change these via API later; for now edit this file or replace with API fetch.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface StatItem {
  id: string;
  label: string;
  value: number;
  iconKey: "courses" | "enrollments" | "branches" | "events" | "offers";
  colorClass: string;
}

export interface CourseItem {
  id: string;
  title: string;
  duration: string;
  image: string;
  /** Superadmin can hide course on user side. Default: true */
  enabled?: boolean;
  /** URL slug for /userpanel/courses/[slug] */
  slug?: string;
  description?: string;
  enrolled?: number;
  lectures?: number;
  videos?: number;
  notes?: string;
}

export interface FranchiseHighlight {
  name: string;
  image: string;
  location: string;
  head: string;
  contact: string;
  email: string;
  detailsUrl?: string;
}

export interface OfferItem {
  id: string;
  title: string;
  discount: number;
  description: string;
  validUntil?: string;
}

export interface SocialLink {
  label: string;
  href: string;
  iconKey: "facebook" | "twitter" | "linkedin" | "instagram" | "youtube";
}

/** Superadmin-controlled welcome popup shown once per session on user panel. */
export interface WelcomePopupConfig {
  enabled: boolean;
  /** Image URL uploaded/set by superadmin; shown in the modal. */
  imageUrl: string | null;
  /** Modal width preset (superadmin selectable). */
  size?: "sm" | "md" | "lg" | "xl";
}

export interface UserPanelConfig {
  /** Welcome popup: show once when user opens user panel (if superadmin enables and sets image). */
  welcomePopup: WelcomePopupConfig;
  site: {
    name: string;
    logoLetter: string;
    tagline: string;
    /** Welcome message shown in header marquee (optional). */
    headerMarquee?: string;
  };
  nav: {
    links: NavLink[];
  };
  hero: {
    greetingPrefix: string;
    subtitle: string;
    backgroundImage: string;
    /** Optional: multiple images for hero slider (change every few seconds) */
    backgroundImages?: string[];
    ctaPrimary: { label: string; href: string };
    ctaSecondary: { label: string; href: string };
  };
  stats: StatItem[];
  about: {
    title: string;
    description: string;
    image: string;
    buttonLabel: string;
    buttonHref: string;
  };
  courses: {
    sectionTitle: string;
    items: CourseItem[];
  };
  franchise: {
    sectionTitle?: string;
    highlight: FranchiseHighlight | null;
  };
  offers: {
    sectionTitle: string;
    items: OfferItem[];
  };
  gallery: {
    sectionTitle: string;
    images: { src: string; alt?: string }[];
  };
  footer: {
    tagline: string;
    quickLinks: NavLink[];
    contact: {
      email: string;
      phone: string;
      address?: string;
    };
    social: SocialLink[];
    copyrightText: string;
  };
}

const defaultConfig: UserPanelConfig = {
  welcomePopup: {
    enabled: false,
    imageUrl: null,
    size: "lg",
  },
  site: {
    name: "Edu Institute",
    logoLetter: "E",
    tagline: "Quality education for everyone. Courses, certifications, and franchise opportunities.",
    headerMarquee: "Welcome to Edu Institute — Explore courses, offers, and franchise opportunities. We're glad you're here!",
  },
  nav: {
    links: [
      { label: "Home", href: "/userpanel" },
      { label: "Courses", href: "/userpanel/courses" },
      { label: "Offers", href: "/userpanel#offers" },
      { label: "Franchise", href: "/userpanel#franchise" },
      { label: "Gallery", href: "/userpanel#gallery" },
      { label: "Contact", href: "/userpanel#contact" },
    ],
  },
  hero: {
    greetingPrefix: "Welcome Back",
    subtitle: "Your gateway to quality education. Explore courses, grab offers, and grow with our institute & franchise network.",
    backgroundImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80",
    backgroundImages: [
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1920&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80",
    ],
    ctaPrimary: { label: "View Courses", href: "/userpanel/courses" },
    ctaSecondary: { label: "Explore Offers", href: "/userpanel#offers" },
  },
  stats: [
    { id: "courses", label: "Total Courses", value: 24, iconKey: "courses", colorClass: "from-indigo-500 to-blue-600" },
    { id: "enrollments", label: "Active Enrollments", value: 1847, iconKey: "enrollments", colorClass: "from-emerald-500 to-teal-600" },
    { id: "branches", label: "Franchise Branches", value: 12, iconKey: "branches", colorClass: "from-amber-500 to-orange-600" },
    { id: "events", label: "Upcoming Events", value: 8, iconKey: "events", colorClass: "from-rose-500 to-pink-600" },
    { id: "offers", label: "Available Offers", value: 5, iconKey: "offers", colorClass: "from-violet-500 to-purple-600" },
  ],
  about: {
    title: "About Our Institute",
    description: "We are committed to delivering world-class education through industry-aligned courses, experienced faculty, and a strong franchise network. Join thousands of learners who have transformed their careers with us.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop",
    buttonLabel: "Learn More",
    buttonHref: "/userpanel#contact",
  },
  courses: {
    sectionTitle: "Featured Courses",
    items: [
      { id: "1", title: "Full Stack Development", duration: "6 Months", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=240&fit=crop", slug: "full-stack-development", description: "Master frontend and backend development with hands-on projects.", enrolled: 1240, lectures: 48, videos: 120, notes: "PDF notes per module" },
      { id: "2", title: "Data Science & AI", duration: "8 Months", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=240&fit=crop", slug: "data-science-ai", description: "From statistics to ML models and deployment.", enrolled: 890, lectures: 64, videos: 180, notes: "Jupyter notebooks + PDF" },
      { id: "3", title: "Digital Marketing", duration: "4 Months", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=240&fit=crop", slug: "digital-marketing", description: "SEO, SEM, social media and analytics.", enrolled: 2100, lectures: 32, videos: 80, notes: "Templates & checklists" },
      { id: "4", title: "UI/UX Design", duration: "5 Months", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=240&fit=crop", slug: "ui-ux-design", description: "User research, wireframes, and high-fidelity design.", enrolled: 756, lectures: 40, videos: 95, notes: "Figma files & guides" },
    ],
  },
  franchise: {
    sectionTitle: "Featured Branch",
    highlight: {
      name: "Downtown Learning Center",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
      location: "123 Education Ave, Downtown",
      head: "Dr. Sarah Williams",
      contact: "+1 234 567 890",
      email: "downtown@institute.com",
    },
  },
  offers: {
    sectionTitle: "Current Offers",
    items: [
      { id: "1", title: "Summer Special", discount: 25, description: "Enroll in any course this summer" },
      { id: "2", title: "Refer & Earn", discount: 15, description: "Refer a friend, get discount" },
      { id: "3", title: "Early Bird", discount: 20, description: "Book 2 months in advance" },
    ],
  },
  gallery: {
    sectionTitle: "Gallery",
    images: [
      { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop", alt: "Campus" },
      { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop", alt: "Learning" },
      { src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop", alt: "Workshop" },
      { src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop", alt: "Students" },
      { src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=300&fit=crop", alt: "Event" },
      { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop", alt: "Graduation" },
    ],
  },
  footer: {
    tagline: "Quality education for everyone. Courses, certifications, and franchise opportunities.",
    quickLinks: [
      { label: "Home", href: "/userpanel" },
      { label: "Courses", href: "/userpanel/courses" },
      { label: "Offers", href: "/userpanel#offers" },
      { label: "Franchise", href: "/userpanel#franchise" },
      { label: "Gallery", href: "/userpanel#gallery" },
      { label: "Contact", href: "/userpanel#contact" },
    ],
    contact: {
      email: "contact@edu-institute.com",
      phone: "+1 800 123 4567",
    },
    social: [
      { label: "Facebook", href: "#", iconKey: "facebook" },
      { label: "Twitter", href: "#", iconKey: "twitter" },
      { label: "LinkedIn", href: "#", iconKey: "linkedin" },
      { label: "Instagram", href: "#", iconKey: "instagram" },
    ],
    copyrightText: "All rights reserved.",
  },
};

export { defaultConfig };
