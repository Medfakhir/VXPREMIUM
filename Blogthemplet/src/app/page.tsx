import HeroSection from "@/components/blog/hero-section";
import ArticleCard from "@/components/blog/article-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { safeDbOperation } from "@/lib/db-utils";

async function getFeaturedArticles() {
  try {
    const articles = await safeDbOperation(
      () => prisma.article.findMany({
      where: {
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 6 // Get latest 6 articles
    }),
    []
  ) || [];

    return articles.map(article => ({
      title: article.title,
      excerpt: article.excerpt || '',
      slug: article.slug,
      featuredImage: article.featuredImage || "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=400&fit=crop",
      category: article.category.name,
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : '',
      readTime: `${article.readTime || 5} min read`,
      author: article.author.name
    }));
  } catch (error) {
    console.error('Error fetching articles:', error);
    // Fallback to empty array
    return [];
  }
}

export default async function Home() {
  const featuredArticles = await getFeaturedArticles();
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Articles */}
      <section className="container mx-auto px-4">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Latest IPTV Guides & Reviews</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don&apos;t miss out on the latest IPTV trends, reviews, and comprehensive setup guides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.slug} {...article} />
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/articles">
                Browse All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground">
              Find exactly what you're looking for with our organized content categories.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: "IPTV Players", count: "Featured articles", href: "/category/iptv-players" },
              { name: "Android Boxes", count: "Coming soon", href: "/category/android-boxes" },
              { name: "Firestick", count: "Featured articles", href: "/category/firestick" },
              { name: "Reviews", count: "Coming soon", href: "/category/reviews" },
              { name: "Guides", count: "Coming soon", href: "/category/guides" },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group p-6 bg-card rounded-lg border hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{category.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
