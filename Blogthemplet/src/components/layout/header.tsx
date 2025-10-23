"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X, Search, Tv } from "lucide-react";
import { useRealtime } from "@/contexts/realtime-context";
import { useRouter } from "next/navigation";

interface NavigationItem {
  name: string;
  href: string;
}

export default function Header() {
  const { data: realtimeData, isConnected, isInitialLoading, updateData } = useRealtime();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState(""); // Start empty to avoid flash
  const [logoUrl, setLogoUrl] = useState("");
  const [navigation, setNavigation] = useState<NavigationItem[]>([
    { name: "Home", href: "/" },
  ]);
  const [isMounted, setIsMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update site name and logo from real-time data
  useEffect(() => {
    // Always update site name when we have data
    if (realtimeData.siteName) {
      setSiteName(realtimeData.siteName);
    }
    
    // Update logo URL from settings
    if (realtimeData.settings && realtimeData.settings.logoUrl) {
      setLogoUrl(realtimeData.settings.logoUrl);
    } else if (realtimeData.settings) {
      // Clear logo if no logoUrl in settings
      setLogoUrl("");
    }
  }, [realtimeData.siteName, realtimeData.settings]);

  // Update navigation from real-time categories - only when we have real data
  useEffect(() => {
    if (realtimeData.categories && realtimeData.categories.length > 0) {
      const menuCategories = realtimeData.categories
        .filter((cat: any) => cat.showInMenu && cat.isActive)
        .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0))
        .map((cat: any) => ({
          name: cat.menuLabel || cat.name,
          href: `/category/${cat.slug}`
        }));
      
      setNavigation([
        { name: "Home", href: "/" },
        ...menuCategories
      ]);
    }
  }, [realtimeData.categories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // No need to fetch data here anymore - the context handles it

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {!isMounted || isInitialLoading ? (
              <div className="animate-pulse bg-gray-200 rounded w-8 h-8"></div>
            ) : logoUrl ? (
              <img 
                src={logoUrl} 
                alt={siteName} 
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Tv className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-xl">
              {!isMounted || isInitialLoading || !siteName ? (
                <div className="animate-pulse bg-gray-200 rounded h-6 w-24"></div>
              ) : (
                siteName
              )}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {!isMounted || isInitialLoading ? (
              <>
                <div className="animate-pulse bg-gray-200 rounded h-4 w-12"></div>
                <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>
                <div className="animate-pulse bg-gray-200 rounded h-4 w-14"></div>
              </>
            ) : (
              navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))
            )}
          </nav>

          {/* Search & Mobile Menu */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden sm:flex"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Search Overlay */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={!searchQuery.trim()}>
                  Search
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
