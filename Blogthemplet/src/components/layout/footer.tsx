"use client";

import Link from "next/link";
import { Tv } from "lucide-react";
import { useRealtime } from "@/contexts/realtime-context";
import { useState, useEffect } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: realtimeData, isInitialLoading } = useRealtime();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const footerLinks = [
    { name: "Contact", href: "/pages/contact" },
    { name: "Editorial Guidelines", href: "/pages/editorial-guidelines" },
    { name: "Terms of Service", href: "/pages/terms-of-service" },
    { name: "Disclaimer", href: "/pages/disclaimer" },
    { name: "DMCA Policy", href: "/pages/dmca-policy" },
    { name: "Advertising Disclosure", href: "/pages/advertising-disclosure" },
    { name: "Privacy Policy", href: "/pages/privacy-policy" },
  ];

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          {/* Brand */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center space-x-2">
              {!isMounted || isInitialLoading ? (
                <div className="animate-pulse bg-gray-200 rounded w-8 h-8"></div>
              ) : realtimeData.settings?.logoUrl ? (
                <img 
                  src={realtimeData.settings.logoUrl} 
                  alt={realtimeData.siteName || "IPTV Hub"} 
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <Tv className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <span className="font-bold text-xl">
                {!isMounted || isInitialLoading || !realtimeData.siteName ? (
                  <div className="animate-pulse bg-gray-200 rounded h-6 w-24"></div>
                ) : (
                  realtimeData.siteName
                )}
              </span>
            </Link>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {!isMounted || isInitialLoading || !realtimeData.siteName ? (
              <span className="inline-block animate-pulse bg-gray-200 rounded h-4 w-16"></span>
            ) : (
              realtimeData.siteName
            )}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
