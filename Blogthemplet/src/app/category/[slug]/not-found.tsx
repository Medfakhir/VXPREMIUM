import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

export default function CategoryNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The category you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>Available categories:</p>
            <div className="mt-2 space-x-2">
              <Link href="/category/iptv-players" className="text-primary hover:underline">
                IPTV Players
              </Link>
              <span>•</span>
              <Link href="/category/android-boxes" className="text-primary hover:underline">
                Android Boxes
              </Link>
              <span>•</span>
              <Link href="/category/firestick" className="text-primary hover:underline">
                Firestick
              </Link>
              <span>•</span>
              <Link href="/category/reviews" className="text-primary hover:underline">
                Reviews
              </Link>
              <span>•</span>
              <Link href="/category/guides" className="text-primary hover:underline">
                Guides
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
