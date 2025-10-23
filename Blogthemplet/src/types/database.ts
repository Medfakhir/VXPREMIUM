import { Prisma } from '@prisma/client'

// Article with all relations
export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    author: {
      select: {
        id: true
        name: true
      }
    }
    category: true
    tags: {
      include: {
        tag: true
      }
    }
    media: {
      include: {
        media: true
      }
    }
  }
}>

// Article for listing (without full content)
export type ArticleListItem = Prisma.ArticleGetPayload<{
  select: {
    id: true
    title: true
    slug: true
    excerpt: true
    featuredImage: true
    status: true
    publishedAt: true
    createdAt: true
    viewCount: true
    readTime: true
    author: {
      select: {
        id: true
        name: true
      }
    }
    category: {
      select: {
        id: true
        name: true
        slug: true
        color: true
      }
    }
    tags: {
      select: {
        tag: {
          select: {
            id: true
            name: true
            slug: true
          }
        }
      }
    }
  }
}>

// Category with article count
export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: {
        articles: true
      }
    }
  }
}>

// Tag with article count
export type TagWithCount = Prisma.TagGetPayload<{
  include: {
    _count: {
      select: {
        articles: true
      }
    }
  }
}>

// Admin user without password
export type SafeAdminUser = Omit<Prisma.AdminUserGetPayload<{}>, 'password'>

// Media with usage count
export type MediaWithUsage = Prisma.MediaGetPayload<{
  include: {
    _count: {
      select: {
        articles: true
      }
    }
  }
}>

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form data types
export interface CreateArticleData {
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: string
  categoryId: string
  tagIds: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt?: Date
}

export interface UpdateArticleData extends Partial<CreateArticleData> {
  id: string
}

export interface CreateCategoryData {
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
}

export interface CreateTagData {
  name: string
  slug: string
}

export interface CreateMediaData {
  filename: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  alt?: string
  caption?: string
}
