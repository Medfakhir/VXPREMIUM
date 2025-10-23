import { Suspense } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Clock, User } from 'lucide-react';
import { prisma } from '@/lib/db';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

async function searchArticles(query: string) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          {
            title: {
              contains: query
            }
          },
          {
            excerpt: {
              contains: query
            }
          },
          {
            content: {
              contains: query
            }
          }
        ]
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
      take: 20
    });

    return articles;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

function SearchResults({ query }: { query: string }) {
  return (
    <Suspense fallback={<div>Searching...</div>}>
      <SearchResultsContent query={query} />
    </Suspense>
  );
}

async function SearchResultsContent({ query }: { query: string }) {
  const articles = await searchArticles(query);

  if (!query || query.trim().length < 2) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Search Articles</h2>
        <p className="text-muted-foreground">Enter at least 2 characters to search</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
        <p className="text-muted-foreground">
          No articles found for &ldquo;{query}&rdquo;. Try different keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Search Results for &ldquo;{query}&rdquo;
        </h2>
        <Badge variant="secondary">
          {articles.length} result{articles.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge variant="outline">
                    {article.category.name}
                  </Badge>
                  <CardTitle className="hover:text-primary">
                    <Link href={`/article/${article.slug}`}>
                      {article.title}
                    </Link>
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">
                {article.excerpt}
              </CardDescription>
              
              <div className="flex items-center text-sm text-muted-foreground space-x-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {article.author.name}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Draft'}
                </div>
                {article.readTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {article.readTime} min read
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query = '' } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search</h1>
          <form action="/search" method="GET" className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                name="q"
                placeholder="Search articles..."
                defaultValue={query}
                className="pl-10"
              />
            </div>
            <Button type="submit">
              Search
            </Button>
          </form>
        </div>

        {/* Search Results */}
        <SearchResults query={query} />
      </div>
    </div>
  );
}
