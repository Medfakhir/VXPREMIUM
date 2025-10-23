import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';
import { getSettings, clearSettingsCache } from '@/lib/settings';
import { broadcastUpdate } from '@/app/api/events/route';

// GET /api/settings - Get all settings
export async function GET() {
  try {
    const settings = await safeDbOperation(
      () => prisma.siteSetting.findMany(),
      []
    ) || [];
    
    // Convert array of key-value pairs to object
    const settingsObject = settings.reduce((acc, setting) => {
      let value = setting.value;
      
      // Parse value based on type
      switch (setting.type) {
        case 'number':
          value = parseFloat(setting.value) as any;
          break;
        case 'boolean':
          value = (setting.value === 'true') as any;
          break;
        case 'json':
          try {
            value = JSON.parse(setting.value) as any;
          } catch {
            value = setting.value as any;
          }
          break;
        default:
          value = setting.value as any;
      }
      
      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);

    // Set default values if not found
    const defaultSettings = {
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

    const finalSettings = { ...defaultSettings, ...settingsObject };

    return NextResponse.json({
      success: true,
      data: finalSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

// POST /api/settings - Update multiple settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate that body is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid settings data'
      }, { status: 400 });
    }

    // Update each setting
    const updatePromises = Object.entries(body).map(async ([key, value]) => {
      // Determine type
      let type = 'string';
      let stringValue = String(value);
      
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
        stringValue = value ? 'true' : 'false';
      } else if (typeof value === 'object' && value !== null) {
        type = 'json';
        stringValue = JSON.stringify(value);
      }

      // Upsert the setting
      return prisma.siteSetting.upsert({
        where: { key },
        update: {
          value: stringValue,
          type
        },
        create: {
          key,
          value: stringValue,
          type
        }
      });
    });

    await Promise.all(updatePromises);

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Clear settings cache so new values are loaded immediately
    clearSettingsCache();

    // Broadcast real-time update
    broadcastUpdate('settings_updated', body);
    
    // Special broadcast for site name changes
    if (body.siteName) {
      broadcastUpdate('site_name_updated', { siteName: body.siteName });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update settings'
    }, { status: 500 });
  }
}
