import type { Metadata } from "next";

/** SEO copy the admin can edit. Blank fields fall back to the defaults below. */
export interface SeoConfig {
  /** When false, public pages ask Google not to index them. */
  enabled: boolean;
  /** Browser tab + Google result title for the homepage. */
  title: string;
  /** Google result description for the homepage. */
  description: string;
  keywords: string[];
  /** Visible H1 on the homepage. */
  headline: string;
  /** Visible paragraph on the homepage. */
  intro: string;
  /** Local-language line shown under the intro (Gujarati). */
  localLine: string;
  coursesTitle: string;
  /** Visible H1 on the courses page. */
  coursesHeadline: string;
  coursesDescription: string;
  franchisesTitle: string;
  franchisesDescription: string;
  siteName: string;
  organizationName: string;
  instituteName: string;
  founderName: string;
  founderRole: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  streetAddress: string;
  phone: string;
  email: string;
  /** Path or absolute URL for social / Google image. */
  ogImage: string;
}

export const defaultSeo: SeoConfig = {
  enabled: true,
  title: "Best Computer Course in Tapi | IVESDC Eklavya Institute Songadh",
  description:
    "Yashvant Prajapati, owner of IVESDC, runs Eklavya Institute in Songadh, Tapi. Join the best computer course in Songadh — practical computer training and skill development.",
  keywords: [
    "IVESDC",
    "Yashvant Prajapati",
    "Yashvant Prajapati owner of IVESDC",
    "Eklavya Institute Songadh",
    "Eklavya Institute",
    "best computer course",
    "best computer course in Tapi",
    "best computer course in Songadh",
    "computer course Songadh",
    "computer training Tapi",
    "vocational course Songadh",
    "યશવંત પ્રજાપતિ",
    "એકલવ્ય ઇન્સ્ટિટ્યૂટ સોંગઢ",
  ],
  headline: "Best Computer Course in Songadh, Tapi",
  intro:
    "IVESDC — the Institute of Vocational Education & Skill Development Council — is led by Yashvant Prajapati, owner of IVESDC. At Eklavya Institute in Fort-Songadh, District Tapi, Gujarat, students join the best computer course in Tapi: classroom computer training, vocational courses, and skill programs built for jobs.",
  localLine:
    "સોંગઢ, જિ. તાપીમાં બેસ્ટ કમ્પ્યુટર કોર્સ — યશવંત પ્રજાપતિ, ઓનર ઓફ IVESDC, એકલવ્ય ઇન્સ્ટિટ્યૂટ.",
  coursesTitle: "Best Computer Courses in Songadh, Tapi | IVESDC",
  coursesHeadline: "Best Computer Courses in Songadh, Tapi",
  coursesDescription:
    "Computer courses at IVESDC Eklavya Institute, Songadh. Yashvant Prajapati's centre in Tapi for practical computer training and vocational skill programs.",
  franchisesTitle: "IVESDC Centres | Eklavya Institute Songadh, Tapi",
  franchisesDescription:
    "Find IVESDC training centres. Eklavya Institute, Songadh, Dist. Tapi — owned by Yashvant Prajapati — for computer courses and skill development.",
  siteName: "IVESDC",
  organizationName: "Institute of Vocational Education & Skill Development Council",
  instituteName: "Eklavya Institute",
  founderName: "Yashvant Prajapati",
  founderRole: "Owner & Managing Director",
  city: "Songadh",
  district: "Tapi",
  state: "Gujarat",
  postalCode: "394670",
  streetAddress: "Shivaji Nagar, Fort-Songadh, Dist-Tapi, Gujarat - 394670",
  phone: "9925222523",
  email: "iveskillcouncil@gmail.com",
  ogImage: "/logo/IVESDC%20LOGO-01.png",
};

function text(value: unknown, fallback: string, max = 500): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, max);
}

export function normalizeSeo(raw: unknown): SeoConfig {
  const source = raw && typeof raw === "object" ? (raw as Partial<SeoConfig>) : {};
  const keywords = Array.isArray(source.keywords)
    ? source.keywords
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, 30)
    : defaultSeo.keywords;

  return {
    enabled: source.enabled !== false,
    title: text(source.title, defaultSeo.title, 70),
    description: text(source.description, defaultSeo.description, 320),
    keywords: keywords.length > 0 ? keywords : defaultSeo.keywords,
    headline: text(source.headline, defaultSeo.headline, 120),
    intro: text(source.intro, defaultSeo.intro, 600),
    localLine: text(source.localLine, defaultSeo.localLine, 240),
    coursesTitle: text(source.coursesTitle, defaultSeo.coursesTitle, 70),
    coursesHeadline: text(source.coursesHeadline, defaultSeo.coursesHeadline, 120),
    coursesDescription: text(source.coursesDescription, defaultSeo.coursesDescription, 320),
    franchisesTitle: text(source.franchisesTitle, defaultSeo.franchisesTitle, 70),
    franchisesDescription: text(source.franchisesDescription, defaultSeo.franchisesDescription, 320),
    siteName: text(source.siteName, defaultSeo.siteName, 40),
    organizationName: text(source.organizationName, defaultSeo.organizationName, 140),
    instituteName: text(source.instituteName, defaultSeo.instituteName, 80),
    founderName: text(source.founderName, defaultSeo.founderName, 80),
    founderRole: text(source.founderRole, defaultSeo.founderRole, 80),
    city: text(source.city, defaultSeo.city, 60),
    district: text(source.district, defaultSeo.district, 60),
    state: text(source.state, defaultSeo.state, 60),
    postalCode: text(source.postalCode, defaultSeo.postalCode, 12),
    streetAddress: text(source.streetAddress, defaultSeo.streetAddress, 200),
    phone: text(source.phone, defaultSeo.phone, 20),
    email: text(source.email, defaultSeo.email, 80),
    ogImage: text(source.ogImage, defaultSeo.ogImage, 300),
  };
}

function phoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return phone;
}

export function absoluteUrl(siteUrl: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function pageMetadata(
  siteUrl: string,
  seo: SeoConfig,
  path: string,
  title: string,
  description: string
): Metadata {
  const canonical = absoluteUrl(siteUrl, path);
  const image = absoluteUrl(siteUrl, seo.ogImage);
  return {
    metadataBase: new URL(siteUrl),
    title: { absolute: title },
    description,
    keywords: seo.keywords,
    applicationName: seo.siteName,
    authors: [{ name: seo.founderName, url: absoluteUrl(siteUrl, "/userpanel") }],
    creator: seo.founderName,
    alternates: { canonical },
    robots: seo.enabled
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonical,
      siteName: seo.siteName,
      title,
      description,
      images: [{ url: image, alt: `${seo.siteName} — ${seo.instituteName}, ${seo.city}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/** Fallback for public pages that do not set their own title. */
export function brandMetadata(siteUrl: string, seo: SeoConfig): Metadata {
  const home = pageMetadata(
    siteUrl,
    seo,
    "/userpanel",
    `${seo.siteName} | ${seo.instituteName}, ${seo.city}`,
    seo.description
  );
  const { alternates: _ignored, ...rest } = home;
  return rest;
}

export function homeMetadata(siteUrl: string, seo: SeoConfig): Metadata {
  return pageMetadata(siteUrl, seo, "/userpanel", seo.title, seo.description);
}

export function coursesMetadata(siteUrl: string, seo: SeoConfig): Metadata {
  return pageMetadata(siteUrl, seo, "/userpanel/courses", seo.coursesTitle, seo.coursesDescription);
}

export function franchisesMetadata(siteUrl: string, seo: SeoConfig): Metadata {
  return pageMetadata(siteUrl, seo, "/userpanel/franchises", seo.franchisesTitle, seo.franchisesDescription);
}

export function organizationJsonLd(siteUrl: string, seo: SeoConfig): Record<string, unknown> {
  const url = absoluteUrl(siteUrl, "/userpanel");
  const logo = absoluteUrl(siteUrl, seo.ogImage);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["EducationalOrganization", "LocalBusiness"],
        "@id": `${url}#organization`,
        name: seo.siteName,
        legalName: seo.organizationName,
        alternateName: [seo.instituteName, `${seo.instituteName} ${seo.city}`, seo.organizationName],
        description: seo.description,
        url,
        logo,
        image: logo,
        telephone: phoneE164(seo.phone),
        email: seo.email,
        founder: {
          "@type": "Person",
          name: seo.founderName,
          jobTitle: seo.founderRole,
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: seo.streetAddress,
          addressLocality: seo.city,
          addressRegion: seo.state,
          postalCode: seo.postalCode,
          addressCountry: "IN",
        },
        areaServed: [seo.city, seo.district, seo.state],
        knowsAbout: seo.keywords.slice(0, 8),
      },
      {
        "@type": "Person",
        "@id": `${url}#founder`,
        name: seo.founderName,
        jobTitle: seo.founderRole,
        worksFor: { "@id": `${url}#organization` },
        description: `${seo.founderName} is the ${seo.founderRole.toLowerCase()} of ${seo.siteName} and ${seo.instituteName}, ${seo.city}.`,
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: seo.siteName,
        description: seo.description,
        publisher: { "@id": `${url}#organization` },
        inLanguage: ["en", "gu"],
      },
    ],
  };
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
