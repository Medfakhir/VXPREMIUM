import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./fallback-fonts.css";
import ConditionalLayout from "@/components/layout/conditional-layout";
import { Toaster } from "sonner";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { getSettings } from "@/lib/settings";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    
    const metadata: Metadata = {
      title: settings.defaultMetaTitle || `${settings.siteName} - Your Ultimate Guide to IPTV Players & Devices`,
      description: settings.defaultMetaDescription || "Discover the best IPTV players, streaming devices, and setup guides. Expert reviews, tutorials, and tips for Android boxes, Firestick, and more.",
      keywords: settings.defaultMetaKeywords || "IPTV, streaming, Android TV box, Firestick, IPTV players, streaming devices, tutorials, reviews",
      authors: [{ name: `${settings.siteName} Team` }],
    };

    // Add favicon if available
    if (settings.faviconUrl) {
      metadata.icons = {
        icon: settings.faviconUrl,
        shortcut: settings.faviconUrl,
        apple: settings.faviconUrl,
      };
    }

    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    // Fallback metadata
    return {
      title: "IPTV Hub - Your Ultimate Guide to IPTV Players & Devices",
      description: "Discover the best IPTV players, streaming devices, and setup guides. Expert reviews, tutorials, and tips for Android boxes, Firestick, and more.",
      keywords: "IPTV, streaming, Android TV box, Firestick, IPTV players, streaming devices, tutorials, reviews",
      authors: [{ name: "IPTV Hub Team" }],
    };
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <RealtimeProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          {/* Real-time status and debug components removed per user request */}
        </RealtimeProvider>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}
