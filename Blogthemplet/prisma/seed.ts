import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'admin@iptvhub.com' },
    update: {},
    create: {
      email: 'admin@iptvhub.com',
      name: 'IPTV Hub Admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  console.log('✅ Admin user created:', adminUser.email)

  // Create IPTV categories
  const categories = [
    {
      name: 'IPTV Players',
      slug: 'iptv-players',
      description: 'Reviews and guides for the best IPTV applications',
      color: '#3B82F6',
      icon: 'Play'
    },
    {
      name: 'Android Boxes',
      slug: 'android-boxes',
      description: 'Android TV box reviews and setup guides',
      color: '#10B981',
      icon: 'Tv'
    },
    {
      name: 'Firestick',
      slug: 'firestick',
      description: 'Amazon Firestick IPTV setup and optimization',
      color: '#F59E0B',
      icon: 'Zap'
    },
    {
      name: 'Smart TV',
      slug: 'smart-tv',
      description: 'IPTV apps for Smart TVs (Samsung, LG, etc.)',
      color: '#8B5CF6',
      icon: 'Monitor'
    },
    {
      name: 'Guides',
      slug: 'guides',
      description: 'Step-by-step tutorials and how-to guides',
      color: '#06B6D4',
      icon: 'BookOpen'
    },
    {
      name: 'Reviews',
      slug: 'reviews',
      description: 'In-depth reviews of IPTV services and devices',
      color: '#EF4444',
      icon: 'Star'
    },
    {
      name: 'Troubleshooting',
      slug: 'troubleshooting',
      description: 'Fix common IPTV issues and problems',
      color: '#F97316',
      icon: 'AlertTriangle'
    },
    {
      name: 'News',
      slug: 'news',
      description: 'Latest IPTV industry news and updates',
      color: '#84CC16',
      icon: 'Newspaper'
    }
  ]

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData
    })
    console.log('✅ Category created:', category.name)
  }

  // Create tags
  const tags = [
    { name: 'Android', slug: 'android' },
    { name: 'iOS', slug: 'ios' },
    { name: 'Windows', slug: 'windows' },
    { name: 'Mac', slug: 'mac' },
    { name: 'Linux', slug: 'linux' },
    { name: 'Free', slug: 'free' },
    { name: 'Paid', slug: 'paid' },
    { name: 'Premium', slug: 'premium' },
    { name: 'Streaming', slug: 'streaming' },
    { name: 'Setup', slug: 'setup' },
    { name: 'Tutorial', slug: 'tutorial' },
    { name: 'Review', slug: 'review' },
    { name: 'Comparison', slug: 'comparison' },
    { name: 'Best', slug: 'best' },
    { name: '2024', slug: '2024' },
    { name: 'Buffering', slug: 'buffering' },
    { name: 'Quality', slug: 'quality' },
    { name: 'Performance', slug: 'performance' }
  ]

  for (const tagData of tags) {
    const tag = await prisma.tag.upsert({
      where: { slug: tagData.slug },
      update: {},
      create: tagData
    })
    console.log('✅ Tag created:', tag.name)
  }

  // Create sample articles
  const iptvPlayersCategory = await prisma.category.findUnique({
    where: { slug: 'iptv-players' }
  })

  const firestickCategory = await prisma.category.findUnique({
    where: { slug: 'firestick' }
  })

  const androidTag = await prisma.tag.findUnique({
    where: { slug: 'android' }
  })

  const freeTag = await prisma.tag.findUnique({
    where: { slug: 'free' }
  })

  const reviewTag = await prisma.tag.findUnique({
    where: { slug: 'review' }
  })

  if (iptvPlayersCategory && androidTag && freeTag && reviewTag) {
    const sampleArticle1 = await prisma.article.upsert({
      where: { slug: 'best-iptv-players-android-tv-box-2024' },
      update: {},
      create: {
        title: 'Best IPTV Players for Android TV Box in 2024',
        slug: 'best-iptv-players-android-tv-box-2024',
        excerpt: 'Discover the top IPTV applications that work perfectly with Android TV boxes. Complete comparison of features, performance, and user experience.',
        content: `# Best IPTV Players for Android TV Box in 2024

When it comes to streaming IPTV content on your Android TV box, choosing the right player can make all the difference. In this comprehensive guide, we'll explore the top IPTV players available in 2024, comparing their features, performance, and overall user experience.

## Top IPTV Players

### 1. TiviMate IPTV Player
TiviMate stands out as one of the most popular IPTV players for Android TV boxes. Its clean interface and robust feature set make it a favorite among users.

**Key Features:**
- Modern, user-friendly interface
- EPG (Electronic Program Guide) support
- Recording capabilities
- Multiple playlist support
- Catch-up TV functionality

### 2. IPTV Smarters Pro
IPTV Smarters Pro offers a professional-grade streaming experience with support for multiple formats and advanced features.

**Key Features:**
- Multi-screen support
- VOD and series support
- Parental controls
- External player integration
- Chromecast support

### 3. Perfect Player IPTV
Perfect Player IPTV is known for its reliability and extensive customization options.

**Key Features:**
- Highly customizable interface
- Multiple audio track support
- Subtitle support
- Archive/timeshift functionality
- Low resource usage

## Conclusion

Choosing the right IPTV player depends on your specific needs and preferences. TiviMate offers the best overall experience, while IPTV Smarters Pro provides professional features, and Perfect Player excels in customization options.`,
        featuredImage: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=400&fit=crop',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-10-20'),
        seoTitle: 'Best IPTV Players for Android TV Box 2024 - Complete Guide',
        seoDescription: 'Discover the top IPTV players for Android TV boxes in 2024. Compare TiviMate, IPTV Smarters Pro, Perfect Player and more. Complete feature comparison and setup guides.',
        seoKeywords: 'IPTV players, Android TV box, TiviMate, IPTV Smarters Pro, Perfect Player, streaming apps, IPTV apps 2024',
        readTime: 8,
        authorId: adminUser.id,
        categoryId: iptvPlayersCategory.id,
        tags: {
          create: [
            { tagId: androidTag.id },
            { tagId: reviewTag.id }
          ]
        }
      }
    })

    console.log('✅ Sample article created:', sampleArticle1.title)
  }

  if (firestickCategory && freeTag && reviewTag) {
    const sampleArticle2 = await prisma.article.upsert({
      where: { slug: 'firestick-iptv-setup-guide-2024' },
      update: {},
      create: {
        title: 'Complete Firestick IPTV Setup Guide 2024',
        slug: 'firestick-iptv-setup-guide-2024',
        excerpt: 'Step-by-step tutorial on how to install and configure IPTV applications on Amazon Firestick. Includes troubleshooting tips and optimization.',
        content: `# Complete Firestick IPTV Setup Guide 2024

Setting up IPTV on your Amazon Firestick is easier than you might think. This comprehensive guide will walk you through the entire process, from preparation to optimization.

## Prerequisites

Before we begin, make sure you have:
- Amazon Firestick (any generation)
- Stable internet connection (minimum 10 Mbps recommended)
- IPTV subscription or playlist
- Amazon account

## Step 1: Enable Apps from Unknown Sources

1. Go to Settings on your Firestick home screen
2. Select "My Fire TV" or "Device"
3. Choose "Developer Options"
4. Turn on "Apps from Unknown Sources"

## Step 2: Install Downloader App

1. Search for "Downloader" in the Amazon App Store
2. Install the Downloader app by AFTVnews
3. Open the app and grant necessary permissions

## Step 3: Download IPTV Player

We recommend using TiviMate for the best experience:

1. Open Downloader app
2. Enter the TiviMate APK URL
3. Download and install the application
4. Launch TiviMate from your apps

## Step 4: Configure Your IPTV Service

1. Open TiviMate
2. Add your IPTV playlist URL or Xtream Codes login
3. Wait for channels to load
4. Organize your favorite channels

## Troubleshooting Tips

- **Buffering Issues**: Check your internet speed and try a wired connection
- **App Crashes**: Clear cache and restart the application
- **No Channels**: Verify your IPTV subscription is active

## Optimization Tips

- Use a VPN for better privacy and access
- Enable hardware acceleration in player settings
- Regularly clear cache to maintain performance
- Keep your Firestick updated

## Conclusion

With this guide, you should have IPTV running smoothly on your Firestick. Remember to only use legal IPTV services and respect copyright laws.`,
        featuredImage: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&h=400&fit=crop',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-10-18'),
        seoTitle: 'Firestick IPTV Setup Guide 2024 - Complete Tutorial',
        seoDescription: 'Learn how to install and setup IPTV on Amazon Firestick. Step-by-step guide with troubleshooting tips and optimization techniques for 2024.',
        seoKeywords: 'Firestick IPTV, Amazon Firestick setup, IPTV installation, TiviMate Firestick, streaming setup, Firestick apps',
        readTime: 12,
        authorId: adminUser.id,
        categoryId: firestickCategory.id,
        tags: {
          create: [
            { tagId: freeTag.id },
            { tagId: reviewTag.id }
          ]
        }
      }
    })

    console.log('✅ Sample article created:', sampleArticle2.title)
  }

  // Create site settings
  const siteSettings = [
    { key: 'site_title', value: 'IPTV Hub - Your Ultimate Guide to IPTV Players & Devices' },
    { key: 'site_description', value: 'Discover the best IPTV players, streaming devices, and setup guides. Expert reviews, tutorials, and tips for Android boxes, Firestick, and more.' },
    { key: 'site_keywords', value: 'IPTV, streaming, Android TV box, Firestick, IPTV players, streaming devices, tutorials, reviews' },
    { key: 'articles_per_page', value: '10', type: 'number' },
    { key: 'enable_comments', value: 'false', type: 'boolean' },
    { key: 'google_analytics_id', value: '' },
    { key: 'contact_email', value: 'contact@iptvhub.com' }
  ]

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    })
  }

  console.log('✅ Site settings created')
  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
