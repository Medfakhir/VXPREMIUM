import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, ArrowLeft, Share2, BookOpen, User, Tag } from "lucide-react";
import { prisma } from "@/lib/db";
import CommentSection from "@/components/comments/comment-section";

// Force dynamic rendering to avoid caching issues with settings
export const dynamic = 'force-dynamic';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getArticle(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: {
        slug: slug,
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
      }
    });

    if (!article) {
      return null;
    }

    return {
      id: article.id,
      title: article.title,
      description: article.excerpt || '',
      content: article.content,
      slug: article.slug,
      publishedAt: article.publishedAt?.toISOString() || '',
      updatedAt: article.updatedAt.toISOString(),
      readTime: `${article.readTime || 5} min read`,
      category: article.category.slug,
      categoryName: article.category.name,
      author: article.author.name,
      tags: article.tags.map(t => t.tag.name),
      featured: true,
      views: article.viewCount || 0,
      featuredImage: article.featuredImage
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// Keep mock articles as fallback
const mockArticles = {
  "best-iptv-players-android-2024": {
    id: 1,
    title: "Best IPTV Players for Android in 2024",
    description: "Discover the top IPTV player applications for Android devices with features comparison and installation guides.",
    content: `
# Best IPTV Players for Android in 2024

IPTV (Internet Protocol Television) has revolutionized how we consume television content. With the right IPTV player app, you can stream live TV channels, movies, and series directly on your Android device. In this comprehensive guide, we'll explore the best IPTV players available for Android in 2024.

## What is IPTV?

IPTV delivers television content over internet protocol networks instead of traditional terrestrial, satellite, or cable television formats. This technology allows for more flexible viewing experiences and often provides access to international content.

## Top IPTV Players for Android

### 1. IPTV Smarters Pro

**Features:**
- User-friendly interface
- Support for multiple playlists
- EPG (Electronic Program Guide) support
- Parental controls
- Multi-screen support

**Pros:**
- Easy to set up and use
- Regular updates
- Excellent customer support
- Works with most IPTV services

**Cons:**
- Premium features require subscription
- Limited customization options

### 2. TiviMate

**Features:**
- Modern Material Design interface
- Advanced EPG functionality
- Recording capabilities (premium)
- Multiple playlist support
- Catch-up TV support

**Pros:**
- Beautiful, intuitive interface
- Excellent EPG implementation
- Smooth performance
- Regular feature updates

**Cons:**
- Premium features require subscription
- Learning curve for advanced features

### 3. Perfect Player

**Features:**
- Lightweight and fast
- Customizable interface
- EPG support
- Multiple audio tracks
- Subtitle support

**Pros:**
- Completely free
- Highly customizable
- Low resource usage
- Supports various formats

**Cons:**
- Interface feels dated
- Limited customer support

### 4. GSE Smart IPTV

**Features:**
- Cross-platform availability
- Cloud synchronization
- Advanced player controls
- Chromecast support
- Multiple format support

**Pros:**
- Available on multiple platforms
- Good performance
- Regular updates
- Free version available

**Cons:**
- Some features require premium
- Interface can be overwhelming

## How to Choose the Right IPTV Player

When selecting an IPTV player for your Android device, consider these factors:

### 1. User Interface
Look for a player with an intuitive, easy-to-navigate interface that suits your preferences.

### 2. Format Support
Ensure the player supports your IPTV service's streaming format (M3U, M3U8, etc.).

### 3. EPG Support
Electronic Program Guide support enhances your viewing experience by providing schedule information.

### 4. Performance
Choose a player that runs smoothly on your device without excessive battery drain.

### 5. Additional Features
Consider features like recording, catch-up TV, and multi-screen support based on your needs.

## Installation Guide

### Step 1: Download the App
Download your chosen IPTV player from the Google Play Store or the official website.

### Step 2: Install and Launch
Install the app and launch it on your Android device.

### Step 3: Add Your Playlist
Enter your IPTV service's playlist URL or upload an M3U file.

### Step 4: Configure Settings
Adjust settings like video quality, buffer size, and interface preferences.

### Step 5: Enjoy Streaming
Start watching your favorite channels and content!

## Legal Considerations

Always ensure you're using IPTV services legally. Only use legitimate IPTV providers that have proper licensing for the content they distribute. Avoid illegal streaming services that may violate copyright laws.

## Conclusion

The IPTV landscape on Android offers numerous excellent options for streaming television content. Whether you prioritize ease of use, advanced features, or cost-effectiveness, there's an IPTV player that meets your needs. 

TiviMate and IPTV Smarters Pro lead the pack with their polished interfaces and robust feature sets, while Perfect Player offers a solid free alternative. Consider your specific requirements and try a few options to find the perfect IPTV player for your Android device.

Remember to always use legitimate IPTV services and respect content licensing agreements. Happy streaming!
    `,
    slug: "best-iptv-players-android-2024",
    publishedAt: "2024-01-15",
    updatedAt: "2024-01-15",
    readTime: "8 min read",
    category: "iptv-players",
    categoryName: "IPTV Players",
    author: "IPTV Hub Team",
    tags: ["IPTV", "Android", "Streaming", "Apps", "Reviews"],
    featured: true,
    views: 1250,
  },
  "iptv-fire-tv-stick-setup-guide": {
    id: 2,
    title: "Complete Guide to Setting Up IPTV on Fire TV Stick",
    description: "Step-by-step tutorial on how to install and configure IPTV applications on Amazon Fire TV Stick.",
    content: `
# Complete Guide to Setting Up IPTV on Fire TV Stick

The Amazon Fire TV Stick is one of the most popular streaming devices, and it's perfect for IPTV streaming. This comprehensive guide will walk you through the entire process of setting up IPTV on your Fire TV Stick.

## What You'll Need

- Amazon Fire TV Stick (any generation)
- Stable internet connection (minimum 10 Mbps recommended)
- IPTV subscription with playlist URL
- Remote control or smartphone app

## Step 1: Prepare Your Fire TV Stick

### Enable Developer Options
1. Go to **Settings** > **My Fire TV** > **Developer Options**
2. Turn on **ADB Debugging**
3. Turn on **Apps from Unknown Sources**

### Allow Installation from Unknown Sources
1. Go to **Settings** > **My Fire TV** > **Developer Options**
2. Enable **Apps from Unknown Sources**
3. Confirm the warning message

## Step 2: Install an IPTV Player

### Method 1: Using Downloader App

1. **Install Downloader:**
   - Go to Amazon App Store
   - Search for "Downloader"
   - Install the app by AFTVnews

2. **Download IPTV App:**
   - Open Downloader
   - Enter the URL for your preferred IPTV app
   - Download and install the APK file

### Method 2: Sideloading via ADB

1. **Enable ADB Debugging**
2. **Connect via ADB**
3. **Install APK file**

## Step 3: Configure Your IPTV App

### TiviMate Setup
1. **Launch TiviMate**
2. **Add Playlist:**
   - Click "Add Playlist"
   - Enter your M3U URL
   - Name your playlist
   - Click "Next"

3. **Configure EPG:**
   - Add EPG URL if provided
   - Set update frequency
   - Click "Next"

### IPTV Smarters Pro Setup
1. **Launch IPTV Smarters Pro**
2. **Add Playlist:**
   - Select "Add New User"
   - Choose "Login with Xtream Codes API"
   - Enter server details
   - Click "Add User"

## Step 4: Optimize Performance

### Network Settings
- Use 5GHz WiFi when possible
- Position Fire TV Stick away from interference
- Consider using Ethernet adapter for stable connection

### App Settings
- Adjust buffer size (recommended: 10-20 seconds)
- Set appropriate video quality for your connection
- Enable hardware acceleration if available

## Step 5: Organize Your Channels

### Create Favorites
- Mark frequently watched channels as favorites
- Organize channels by category
- Use EPG for program scheduling

### Customize Interface
- Adjust theme and layout preferences
- Set up parental controls if needed
- Configure remote control shortcuts

## Troubleshooting Common Issues

### Buffering Problems
- Check internet speed (minimum 10 Mbps for HD)
- Increase buffer size in app settings
- Try different server locations
- Use wired connection if possible

### App Crashes
- Clear app cache and data
- Restart Fire TV Stick
- Reinstall the IPTV app
- Check for app updates

### Channel Loading Issues
- Verify playlist URL is correct
- Check if IPTV service is active
- Try different IPTV player app
- Contact your IPTV provider

## Best Practices

### Security
- Only use reputable IPTV services
- Keep apps updated
- Use VPN for additional privacy
- Avoid suspicious streaming sources

### Performance
- Regularly clear cache
- Restart device weekly
- Monitor data usage
- Update Fire TV Stick firmware

## Recommended IPTV Apps for Fire TV Stick

1. **TiviMate** - Best overall experience
2. **IPTV Smarters Pro** - User-friendly interface
3. **Perfect Player** - Free and reliable
4. **GSE Smart IPTV** - Cross-platform support

## Legal Considerations

Always ensure you're using legitimate IPTV services. Verify that your IPTV provider has proper licensing for the content they offer. Avoid illegal streaming services that may violate copyright laws.

## Conclusion

Setting up IPTV on your Fire TV Stick opens up a world of entertainment possibilities. With the right app and proper configuration, you can enjoy thousands of channels and on-demand content directly on your TV.

Remember to use only legitimate IPTV services and follow all applicable laws and regulations. Enjoy your enhanced streaming experience!
    `,
    slug: "iptv-fire-tv-stick-setup-guide",
    publishedAt: "2024-01-12",
    updatedAt: "2024-01-12",
    readTime: "12 min read",
    category: "firestick",
    categoryName: "Firestick",
    author: "IPTV Hub Team",
    tags: ["Fire TV Stick", "IPTV", "Setup", "Tutorial", "Streaming"],
    featured: false,
    views: 890,
  },
  // Add more articles as needed
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: `${article.title} - IPTV Hub`,
    description: article.description,
    keywords: article.tags.join(", "),
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      tags: article.tags,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    notFound();
  }


  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href={`/category/${article.category}`} className="hover:text-foreground">
            {article.categoryName}
          </Link>
          <span>/</span>
          <span className="text-foreground">{article.title}</span>
        </div>
      </nav>

      {/* Article Header */}
      <header className="mb-8">
        <div className="mb-4">
          <Badge variant="secondary" className="mb-2">
            {article.categoryName}
          </Badge>
          {article.featured && (
            <Badge variant="default" className="ml-2">
              Featured
            </Badge>
          )}
        </div>
        
        <h1 className="text-4xl font-bold mb-4 leading-tight">
          {article.title}
        </h1>
        
        <p className="text-xl text-muted-foreground mb-6">
          {article.description}
        </p>

        {/* Article Meta */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {article.author}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(article.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {article.readTime}
          </div>
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            {article.views.toLocaleString()} views
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {article.tags.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/category/${article.category}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {article.categoryName}
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Article
          </Button>
        </div>
      </header>

      <Separator className="mb-8" />

      {/* Article Content */}
      <article className="prose prose-gray dark:prose-invert max-w-none">
        <div 
          className="article-content"
          dangerouslySetInnerHTML={{ 
            __html: article.content
              .split('\n')
              .map((line: string) => {
                if (line.startsWith('# ')) {
                  return `<h1 class="text-3xl font-bold mt-8 mb-4">${line.slice(2)}</h1>`;
                } else if (line.startsWith('## ')) {
                  return `<h2 class="text-2xl font-semibold mt-6 mb-3">${line.slice(3)}</h2>`;
                } else if (line.startsWith('### ')) {
                  return `<h3 class="text-xl font-medium mt-4 mb-2">${line.slice(4)}</h3>`;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return `<p class="font-semibold mb-2">${line.slice(2, -2)}</p>`;
                } else if (line.trim() === '') {
                  return '<br>';
                } else if (line.startsWith('- ')) {
                  return `<li class="mb-1">${line.slice(2)}</li>`;
                } else {
                  return `<p class="mb-4 leading-relaxed">${line}</p>`;
                }
              })
              .join('')
          }}
        />
      </article>

      {/* Comments Section */}
      <CommentSection articleId={article.id} />

      {/* Article Footer */}
      <footer className="mt-12 pt-8 border-t">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(article.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/category/${article.category}`}>
                More {article.categoryName} Articles
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        slug: true
      }
    });
    
    return articles.map((article) => ({
      slug: article.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
