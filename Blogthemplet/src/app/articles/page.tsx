import { Metadata } from "next";
import ArticleCard from "@/components/blog/article-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid, List, Calendar, Clock, User, Tag } from "lucide-react";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "All Articles - IPTV Hub",
  description: "Browse all IPTV guides, reviews, and tutorials. Find everything you need to know about IPTV players, devices, and streaming.",
  keywords: "IPTV articles, IPTV guides, streaming tutorials, IPTV reviews, Android TV box, Firestick guides",
};

async function getAllArticles() {
  try {
    const articles = await prisma.article.findMany({
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
            slug: true,
            color: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    return articles.map(article => ({
      title: article.title,
      excerpt: article.excerpt || '',
      slug: article.slug,
      featuredImage: article.featuredImage || "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=400&fit=crop",
      category: article.category.name,
      categorySlug: article.category.slug,
      categoryColor: article.category.color,
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : '',
      readTime: `${article.readTime || 5} min read`,
      author: article.author.name,
      tags: article.tags.map(t => t.tag.name),
      viewCount: article.viewCount || 0
    }));
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            articles: {
              where: {
                status: 'PUBLISHED'
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      color: category.color,
      articleCount: category._count.articles
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function AllArticlesPage() {
  const [articles, categories] = await Promise.all([
    getAllArticles(),
    getCategories()
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">All Articles</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover comprehensive guides, reviews, and tutorials for IPTV streaming, devices, and applications.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Grid className="h-4 w-4 mr-1" />
              {articles.length} articles
            </div>
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              {categories.length} categories
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name} ({category.articleCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select defaultValue="newest">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Categories Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/category/${category.slug}`}
              className="group"
            >
              <div className="bg-card border rounded-lg p-3 text-center hover:shadow-md transition-shadow">
                <div 
                  className="w-8 h-8 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: category.color || '#3B82F6' }}
                />
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {category.articleCount} articles
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Latest Articles</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button variant="ghost" size="sm">
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No articles found</h3>
              <p>Check back later for new content.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <div key={article.slug} className="group">
                <ArticleCard
                  title={article.title}
                  excerpt={article.excerpt}
                  slug={article.slug}
                  featuredImage={article.featuredImage}
                  category={article.category}
                  publishedAt={article.publishedAt}
                  readTime={article.readTime}
                  author={article.author}
                />
                
                {/* Additional metadata */}
                <div className="mt-3 px-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {article.publishedAt}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {article.readTime}
                      </div>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {article.author}
                      </div>
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${article.categoryColor || '#3B82F6'}20`,
                        color: article.categoryColor || '#3B82F6',
                        borderColor: `${article.categoryColor || '#3B82F6'}40`
                      }}
                    >
                      {article.category}
                    </Badge>
                    
                    {article.viewCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {article.viewCount.toLocaleString()} views
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {articles.length > 0 && (
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Articles
          </Button>
        </div>
      )}
    </div>
  );
}
