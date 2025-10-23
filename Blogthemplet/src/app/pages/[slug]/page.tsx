import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPage(slug: string) {
  try {
    const page = await prisma.page.findUnique({
      where: {
        slug: slug,
        isActive: true
      }
    });

    return page;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: 'Page Not Found'
    };
  }

  return {
    title: page.title,
    description: page.content.substring(0, 160).replace(/<[^>]*>/g, ''),
  };
}

export default async function PageView({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
        <div 
          className="content"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
      
      <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
        Last updated: {new Date(page.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const pages = await prisma.page.findMany({
      where: {
        isActive: true
      },
      select: {
        slug: true
      }
    });
    
    return pages.map((page) => ({
      slug: page.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
