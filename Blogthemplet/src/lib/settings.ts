import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logoUrl: string;
  faviconUrl: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultMetaKeywords: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  enableRegistration: boolean;
  requireEmailVerification: boolean;
  enableTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  articlesPerPage: number;
  enableComments: boolean;
  moderateComments: boolean;
  allowGuestComments: boolean;
  imagekitPublicKey: string;
  imagekitPrivateKey: string;
  imagekitUrlEndpoint: string;
}

const defaultSettings: SiteSettings = {
  siteName: 'IPTV Hub',
  siteDescription: 'Your ultimate guide to IPTV streaming, devices, and setup tutorials',
  siteUrl: 'http://localhost:3000',
  logoUrl: '',
  faviconUrl: '',
  defaultMetaTitle: 'IPTV Hub - Streaming Guides & Reviews',
  defaultMetaDescription: 'Discover the best IPTV players, streaming devices, and setup guides.',
  defaultMetaKeywords: 'IPTV, streaming, firestick, android tv, IPTV players',
  googleAnalyticsId: '',
  googleSearchConsoleId: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  fromEmail: '',
  fromName: 'IPTV Hub',
  enableRegistration: true,
  requireEmailVerification: true,
  enableTwoFactor: false,
  sessionTimeout: 24,
  maxLoginAttempts: 5,
  articlesPerPage: 12,
  enableComments: false,
  moderateComments: true,
  allowGuestComments: false,
  imagekitPublicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
  imagekitPrivateKey: '',
  imagekitUrlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
};

// Cache for settings to avoid database calls on every request
let settingsCache: SiteSettings | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to clear settings cache (used when settings are updated)
export function clearSettingsCache() {
  settingsCache = null;
  lastCacheTime = 0;
}

export async function getSettings(): Promise<SiteSettings> {
  // Return cached settings if still valid
  if (settingsCache && Date.now() - lastCacheTime < CACHE_DURATION) {
    return settingsCache;
  }

  try {
    const settings = await safeDbOperation(
      () => prisma.siteSetting.findMany(),
      []
    ) || [];
    
    // Convert array of key-value pairs to object
    const settingsObject = settings.reduce((acc, setting) => {
      let value: any = setting.value;
      
      // Parse value based on type
      switch (setting.type) {
        case 'number':
          value = parseFloat(setting.value);
          break;
        case 'boolean':
          value = setting.value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(setting.value);
          } catch {
            value = setting.value;
          }
          break;
        default:
          value = setting.value;
      }
      
      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);

    // Merge with defaults
    settingsCache = { ...defaultSettings, ...settingsObject };
    lastCacheTime = Date.now();
    
    return settingsCache;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return defaultSettings;
  }
}

export async function getSetting(key: keyof SiteSettings): Promise<any> {
  const settings = await getSettings();
  return settings[key];
}
