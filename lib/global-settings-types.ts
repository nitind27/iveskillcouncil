/**
 * Shape of global_settings.config (JSON).
 * All sections are optional; defaults applied in UI/API.
 */
export interface GlobalSettingsConfig {
  general?: {
    appName?: string;
    tagline?: string;
    logoUrl?: string;
    faviconUrl?: string;
    supportEmail?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    website?: string;
  };
  localization?: {
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    currency?: string;
    currencySymbol?: string;
    locale?: string;
  };
  security?: {
    sessionTimeoutMinutes?: number;
    maxLoginAttempts?: number;
    passwordMinLength?: number;
    require2FA?: boolean;
    allowRegistration?: boolean;
  };
  notifications?: {
    emailEnabled?: boolean;
    defaultFromName?: string;
    defaultFromEmail?: string;
    notifyNewUser?: boolean;
    notifyNewFranchise?: boolean;
  };
  maintenance?: {
    enabled?: boolean;
    message?: string;
  };
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export const DEFAULT_GLOBAL_CONFIG: GlobalSettingsConfig = {
  general: {
    appName: "EduKit",
    tagline: "Learning Management",
    logoUrl: "",
    faviconUrl: "",
    supportEmail: "",
  },
  contact: {
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    website: "",
  },
  localization: {
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    currency: "INR",
    currencySymbol: "₹",
    locale: "en-IN",
  },
  security: {
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    require2FA: false,
    allowRegistration: false,
  },
  notifications: {
    emailEnabled: true,
    defaultFromName: "EduKit",
    defaultFromEmail: "",
    notifyNewUser: true,
    notifyNewFranchise: true,
  },
  maintenance: {
    enabled: false,
    message: "We are under maintenance. Please try again later.",
  },
  social: {
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  },
};
