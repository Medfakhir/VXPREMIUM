"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Eye, Plus, X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import RichTextEditor from "@/components/editor/rich-text-editor";

interface EditArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const router = useRouter();
  const [articleId, setArticleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingArticle, setIsLoadingArticle] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    categoryId: "",
    status: "DRAFT",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>("");

  const [categories, setCategories] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [adminUserId, setAdminUserId] = useState<string>("");

  // Get article ID from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setArticleId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Fetch article data, categories and admin user
  useEffect(() => {
    if (!articleId) return;

    const fetchData = async () => {
      try {
        setIsLoadingArticle(true);

        // Fetch the article to edit
        const articleResponse = await fetch(`/api/articles/${articleId}`);
        if (articleResponse.ok) {
          const articleResult = await articleResponse.json();
          const article = articleResult.data;
          
          if (article) {
            setFormData({
              title: article.title || "",
              slug: article.slug || "",
              excerpt: article.excerpt || "",
              content: article.content || "",
              featuredImage: article.featuredImage || "",
              categoryId: article.categoryId || "",
              status: article.status || "DRAFT",
              seoTitle: article.seoTitle || "",
              seoDescription: article.seoDescription || "",
              seoKeywords: article.seoKeywords || "",
            });

            if (article.featuredImage) {
              setFeaturedImagePreview(article.featuredImage);
            }

            // Set tags if available
            if (article.tags) {
              setTags(article.tags.map((t: any) => t.tag.name));
            }
          }
        }

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesResult = await categoriesResponse.json();
          setCategories(categoriesResult.data || []);
        }

        // Fetch admin user
        const userResponse = await fetch('/api/admin/user');
        if (userResponse.ok) {
          const userResult = await userResponse.json();
          setAdminUserId(userResult.data?.id || "");
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load article', {
          description: 'Unable to load article data. Please try refreshing the page.',
          duration: 5000,
        });
      } finally {
        setIsLoadingArticle(false);
      }
    };

    fetchData();
  }, [articleId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from title (only if slug is empty)
    if (field === "title" && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFeaturedImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFeaturedImagePreview(previewUrl);

      // Upload to server and get permanent URL
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          // Store the permanent URL in database
          setFormData(prev => ({
            ...prev,
            featuredImage: result.url // Permanent URL for database
          }));
          
          toast.success('Image uploaded to ImageKit successfully!', {
            description: `Image uploaded: ${result.filename} (${Math.round(result.size / 1024)}KB)`,
            duration: 4000,
          });
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload image', {
          description: 'Please try again or choose a different image.',
          duration: 5000,
        });
        
        // Fallback to preview URL for now
        setFormData(prev => ({
          ...prev,
          featuredImage: previewUrl
        }));
      }
    }
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    setIsLoading(true);
    
    // Validate required fields
    if (!formData.title || !formData.content || !formData.categoryId || !adminUserId) {
      toast.error('Missing required fields', {
        description: 'Please fill in all required fields: Title, Content, and Category.',
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Prepare article data
      const articleData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featuredImage: formData.featuredImage,
        categoryId: formData.categoryId,
        tagIds: [], // TODO: Implement tag IDs mapping
        seoTitle: formData.seoTitle || formData.title,
        seoDescription: formData.seoDescription || formData.excerpt,
        seoKeywords: formData.seoKeywords,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : null,
        authorId: adminUserId
      };

      // Call the API to update the article
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update article');
      }

      console.log('Article updated successfully:', result);
      
      // Show success message
      toast.success(`Article ${status === 'PUBLISHED' ? 'published' : 'updated'} successfully!`, {
        description: `"${formData.title}" has been ${status === 'PUBLISHED' ? 'published and is now live' : 'updated with your changes'}.`,
        duration: 5000,
      });
      
      // Redirect to articles list
      router.push("/admin/articles");
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error('Failed to update article', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred while updating the article.',
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingArticle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/articles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Article</h1>
            <p className="text-muted-foreground">Update your blog article</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit("DRAFT")}
            disabled={isLoading || !formData.title || !formData.content}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit("PUBLISHED")}
            disabled={isLoading || !formData.title || !formData.content || !formData.categoryId}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
            Update & Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
              <CardDescription>
                Update the main content and details for your article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter article title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  placeholder="article-url-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL: /article/{formData.slug || "your-article-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of the article..."
                  rows={3}
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange("excerpt", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => handleInputChange("content", content)}
                  placeholder="Write your article content here..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {featuredImagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={featuredImagePreview}
                        alt="Featured image preview"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('featured-image-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change Image
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFeaturedImageFile(null);
                            setFeaturedImagePreview("");
                            setFormData(prev => ({ ...prev, featuredImage: "" }));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          Upload a featured image for your article
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('featured-image-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    id="featured-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFeaturedImageUpload}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your article for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  placeholder="SEO optimized title..."
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  placeholder="SEO meta description..."
                  rows={2}
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange("seoDescription", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">SEO Keywords</Label>
                <Input
                  id="seoKeywords"
                  placeholder="keyword1, keyword2, keyword3"
                  value={formData.seoKeywords}
                  onChange={(e) => handleInputChange("seoKeywords", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleInputChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help categorize your article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                />
                <Button size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Article Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold line-clamp-2">
                  {formData.title || "Article Title"}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {formData.excerpt || "Article excerpt will appear here..."}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {categories.find(c => c.id === formData.categoryId)?.name || "Category"}
                  </span>
                  <span>{Math.ceil(formData.content.split(' ').length / 200)} min read</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
