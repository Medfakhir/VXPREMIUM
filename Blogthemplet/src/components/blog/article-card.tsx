import Link from "next/link";
import OptimizedImage from "@/components/ui/optimized-image";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string;
  category: string;
  publishedAt: string;
  readTime: string;
  author: string;
}

export default function ArticleCard({
  title,
  excerpt,
  slug,
  featuredImage,
  category,
  publishedAt,
  readTime,
  author,
}: ArticleCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <Link href={`/article/${slug}`}>
        {featuredImage && (
          <div className="relative aspect-video overflow-hidden">
            <OptimizedImage
              src={featuredImage}
              alt={title}
              width={400}
              height={225}
              className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
              quality={85}
              loading="lazy"
            />
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                {category}
              </Badge>
            </div>
          </div>
        )}
        
        <CardHeader className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm line-clamp-3">
            {excerpt}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{publishedAt}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{readTime}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{author}</span>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
