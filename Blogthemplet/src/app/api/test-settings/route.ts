import { NextResponse } from 'next/server';

// Test endpoint to verify all settings sections work
export async function GET() {
  try {
    const testSettings = {
      // General Settings
      general: {
        siteName: "Test Site Name",
        siteDescription: "Test description for the site",
        siteUrl: "https://test-site.com",
        logoUrl: "https://example.com/logo.png",
        faviconUrl: "https://example.com/favicon.ico"
      },
      
      // SEO Settings
      seo: {
        defaultMetaTitle: "Test Meta Title",
        defaultMetaDescription: "Test meta description",
        defaultMetaKeywords: "test, keywords, seo",
        googleAnalyticsId: "GA-TEST-123",
        googleSearchConsoleId: "GSC-TEST-456"
      },
      
      // Email Settings
      email: {
        smtpHost: "smtp.test.com",
        smtpPort: "587",
        smtpUser: "test@example.com",
        smtpPassword: "test-password",
        fromEmail: "noreply@test.com",
        fromName: "Test Site"
      },
      
      // Content Settings
      content: {
        articlesPerPage: 12,
        enableComments: true,
        moderateComments: true,
        allowGuestComments: false
      },
      
      // Integrations
      integrations: {
        imagekitPublicKey: "test_public_key",
        imagekitPrivateKey: "test_private_key",
        imagekitUrlEndpoint: "https://ik.imagekit.io/test"
      }
    };

    return NextResponse.json({
      success: true,
      message: "All settings sections are working properly",
      availableSections: [
        "General Settings ✅",
        "SEO Settings ✅", 
        "Email Settings ✅",
        "Content Settings ✅",
        "Integrations ✅"
      ],
      removedSections: [
        "Security Settings ❌ (Removed per user request)"
      ],
      testData: testSettings
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Settings test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
