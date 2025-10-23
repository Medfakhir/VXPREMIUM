import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, Tv, Smartphone, Monitor, Star, BookOpen } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Icon mapping for categories
const iconMap: { [key: string]: any } = {
  "Tv": Tv,
  "Monitor": Monitor,
  "Smartphone": Smartphone,
  "Star": Star,
  "BookOpen": BookOpen,
  "default": Tv
};

// Color mapping for categories
const colorMap: { [key: string]: string } = {
  "#3B82F6": "bg-blue-500",
  "#10B981": "bg-green-500", 
  "#F59E0B": "bg-orange-500",
  "#EF4444": "bg-red-500",
  "#8B5CF6": "bg-purple-500",
  "#6366F1": "bg-indigo-500",
  "#EC4899": "bg-pink-500",
  "#14B8A6": "bg-teal-500",
  "#F97316": "bg-orange-500",
  "#84CC16": "bg-lime-500",
  "default": "bg-blue-500"
};

import { prisma } from "@/lib/db";

async function getCategoryBySlug(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        icon: true,
        isActive: true
      }
    });
    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

async function getCategoryArticles(categorySlug: string) {
  try {
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        category: {
          slug: categorySlug
        }
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
      }
    });

    return articles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.excerpt || '',
      slug: article.slug,
      featuredImage: article.featuredImage || "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=400&fit=crop",
      publishedAt: article.publishedAt ? article.publishedAt.toISOString().split('T')[0] : '',
      readTime: `${article.readTime || 5} min read`,
      category: article.category.slug,
      featured: false, // You can add a featured field to your schema if needed
    }));
  } catch (error) {
    console.error('Error fetching category articles:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} - IPTV Hub`,
    description: category.description || `Articles about ${category.name}`,
    keywords: `${category.name.toLowerCase()}, IPTV, streaming, ${slug}`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category || !category.isActive) {
    notFound();
  }

  // Get real articles from database
  const categoryArticles = await getCategoryArticles(slug);
  const featuredArticles = categoryArticles.filter(article => article.featured);
  const regularArticles = categoryArticles.filter(article => !article.featured);

  // Get icon and color
  const IconComponent = iconMap[category.icon || "default"] || iconMap.default;
  const categoryColor = colorMap[category.color || "default"] || colorMap.default;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <div className="mb-12 text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 ${categoryColor} rounded-2xl mb-4`}>
          <IconComponent className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {category.description || `Discover articles about ${category.name}`}
        </p>
      </div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredArticles.map((article) => (
              <Card key={article.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <Link href={`/article/${article.slug}`}>
                  <div className="relative aspect-video overflow-hidden">
                    <OptimizedImage
                      src={article.featuredImage}
                      alt={article.title}
                      width={600}
                      height={300}
                      className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
                      quality={85}
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                        Featured
                      </Badge>
                    </div>
                  </div>
                </Link>
                <CardHeader>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    <Link href={`/article/${article.slug}`}>{article.title}</Link>
                  </CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {article.readTime}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/article/${article.slug}`}>
                        Read More
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Regular Articles */}
      {regularArticles.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">All {category.name} Articles</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularArticles.map((article) => (
              <Card key={article.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <Link href={`/article/${article.slug}`}>
                  <div className="relative aspect-video overflow-hidden">
                    <OptimizedImage
                      src={article.featuredImage}
                      alt={article.title}
                      width={400}
                      height={225}
                      className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
                      quality={85}
                      loading="lazy"
                    />
                  </div>
                </Link>
                <CardHeader>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    <Link href={`/article/${article.slug}`}>{article.title}</Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {article.readTime}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/article/${article.slug}`}>
                        Read More
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* No Articles Message */}
      {categoryArticles.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <IconComponent className="h-16 w-16 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
          <p className="text-muted-foreground mb-6">
            We're working on adding great content for {category.name}. Check back soon!
          </p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true }
    });
    
    return categories.map((category) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
