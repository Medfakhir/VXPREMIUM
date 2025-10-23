"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Palette, Tag, RefreshCw, Eye, EyeOff, ArrowUpDown, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  showInMenu?: boolean;
  menuOrder?: number;
  isActive?: boolean;
  menuLabel?: string;
  articleCount: number;
  createdAt: string;
}

// Sortable Row Component
function SortableRow({ category, onEdit, onDelete }: { 
  category: Category; 
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'z-50' : ''}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <button
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: category.color || '#3B82F6' }}
            />
            <div>
              <div className="font-medium">{category.name}</div>
              <div className="text-sm text-muted-foreground">/{category.slug}</div>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {category.description || "No description"}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {category.articleCount} articles
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {category.showInMenu ? (
            <Badge variant="default" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              In Menu
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <EyeOff className="h-3 w-3 mr-1" />
              Hidden
            </Badge>
          )}
          {category.isActive ? (
            <Badge variant="default" className="text-xs bg-green-500">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-gray-500">
              Inactive
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#3B82F6",
    icon: "",
    showInMenu: true,
    menuOrder: 0,
    isActive: true,
    menuLabel: "",
  });

  // Mock categories data - replace with actual API call
  const mockCategories: Category[] = [
    {
      id: "1",
      name: "IPTV Players",
      slug: "iptv-players",
      description: "Best IPTV player apps for streaming live TV and on-demand content",
      color: "#3B82F6",
      icon: "Tv",
      articleCount: 12,
      createdAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "2",
      name: "Android Boxes",
      slug: "android-boxes",
      description: "Top Android TV boxes for IPTV streaming and entertainment",
      color: "#10B981",
      icon: "Monitor",
      articleCount: 8,
      createdAt: "2024-01-14T10:00:00Z"
    },
    {
      id: "3",
      name: "Firestick",
      slug: "firestick",
      description: "Amazon Fire TV Stick guides, apps, and optimization tips",
      color: "#F59E0B",
      icon: "Smartphone",
      articleCount: 15,
      createdAt: "2024-01-13T10:00:00Z"
    },
    {
      id: "4",
      name: "Reviews",
      slug: "reviews",
      description: "In-depth reviews of IPTV devices, apps, and services",
      color: "#8B5CF6",
      icon: "Star",
      articleCount: 25,
      createdAt: "2024-01-12T10:00:00Z"
    },
    {
      id: "5",
      name: "Guides",
      slug: "guides",
      description: "Step-by-step tutorials and setup guides for IPTV streaming",
      color: "#6366F1",
      icon: "BookOpen",
      articleCount: 18,
      createdAt: "2024-01-11T10:00:00Z"
    },
  ];

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const result = await response.json();
        const categoriesData = result.data || [];
        
        // Transform API data to match component interface
        const transformedCategories = categoriesData.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          color: cat.color || '#3B82F6',
          icon: cat.icon || 'Tag',
          showInMenu: cat.showInMenu ?? true,
          menuOrder: cat.menuOrder ?? 0,
          isActive: cat.isActive ?? true,
          menuLabel: cat.menuLabel || '',
          articleCount: cat._count?.articles || 0,
          createdAt: cat.createdAt || new Date().toISOString()
        }));
        
        // Sort by menuOrder for proper display
        const sortedCategories = transformedCategories.sort((a: Category, b: Category) => (a.menuOrder || 0) - (b.menuOrder || 0));
        setCategories(sortedCategories);
      } else {
        console.error('Failed to fetch categories');
        // Fallback to mock data
        setCategories(mockCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to mock data
      setCategories(mockCategories);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over?.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      
      // Update local state immediately for smooth UX
      setCategories(newCategories);

      // Update menuOrder for all categories
      const updatedCategories = newCategories.map((category, index) => ({
        ...category,
        menuOrder: index
      }));

      // Update each category's menuOrder in the database
      try {
        const updatePromises = updatedCategories.map((category) =>
          fetch(`/api/categories/${category.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: category.name,
              slug: category.slug,
              description: category.description,
              color: category.color,
              icon: category.icon,
              showInMenu: category.showInMenu,
              menuOrder: category.menuOrder,
              isActive: category.isActive,
              menuLabel: category.menuLabel,
            }),
          })
        );

        await Promise.all(updatePromises);
        
        toast.success('Categories reordered successfully!', {
          description: 'The menu order has been updated and saved.',
          duration: 3000,
        });

        // Refresh to ensure consistency
        await fetchCategories();
      } catch (error) {
        console.error('Error updating category order:', error);
        toast.error('Failed to save new order', {
          description: 'Please try again or refresh the page.',
          duration: 5000,
        });
        // Revert to original order on error
        await fetchCategories();
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue: any = value;
    
    // Handle boolean fields
    if (field === "showInMenu" || field === "isActive") {
      processedValue = value === "true";
    }
    
    // Handle number fields
    if (field === "menuOrder") {
      processedValue = parseInt(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Auto-generate slug from name
    if (field === "name") {
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

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        color: category.color || "#3B82F6",
        icon: category.icon || "",
        showInMenu: category.showInMenu ?? true,
        menuOrder: category.menuOrder ?? 0,
        isActive: category.isActive ?? true,
        menuLabel: category.menuLabel || "",
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        color: "#3B82F6",
        icon: "",
        showInMenu: true,
        menuOrder: 0,
        isActive: true,
        menuLabel: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save category');
      }

      console.log('Category saved successfully:', result);
      
      // Refresh the categories list to show the new/updated category
      await fetchCategories();
      
      // Close the dialog and reset form
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        color: "#3B82F6",
        icon: "",
        showInMenu: true,
        menuOrder: 0,
        isActive: true,
        menuLabel: "",
      });
      
      // Show success message
      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully!`, {
        description: `${formData.name} has been ${editingCategory ? 'updated' : 'created'} and is now ${formData.showInMenu ? 'visible' : 'hidden'} in the navigation menu.`,
        duration: 5000,
      });
      
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error('Failed to save category', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred while saving the category.',
        duration: 6000,
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete category');
        }

        console.log('Category deleted successfully:', result);
        
        // Refresh the categories list
        await fetchCategories();
        
        // Show success message
        toast.success('Category deleted successfully!', {
          description: 'The category has been permanently removed from your site.',
          duration: 4000,
        });
        
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error('Failed to delete category', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred while deleting the category.',
          duration: 6000,
        });
      }
    }
  };

  const colorOptions = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#6366F1", "#EC4899", "#14B8A6", "#F97316", "#84CC16"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage article categories and organization
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchCategories} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? "Update the category information below."
                  : "Add a new category to organize your articles."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Category name..."
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  placeholder="category-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL: /category/{formData.slug || "category-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the category..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <div className="flex flex-wrap gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded border-2 ${
                          formData.color === color ? "border-gray-800" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleInputChange("color", color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon Name</Label>
                <Input
                  id="icon"
                  placeholder="Lucide icon name (e.g., Tv, Monitor)"
                  value={formData.icon}
                  onChange={(e) => handleInputChange("icon", e.target.value)}
                />
              </div>

              {/* Customization Options */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium text-sm">Menu Customization</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="showInMenu">Show in Navigation</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showInMenu"
                        checked={formData.showInMenu}
                        onChange={(e) => handleInputChange("showInMenu", e.target.checked.toString())}
                        className="rounded"
                      />
                      <span className="text-sm text-muted-foreground">
                        Display in header menu
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isActive">Active Category</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked.toString())}
                        className="rounded"
                      />
                      <span className="text-sm text-muted-foreground">
                        Enable category
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menuLabel">Custom Menu Label</Label>
                  <Input
                    id="menuLabel"
                    placeholder="Leave empty to use category name"
                    value={formData.menuLabel}
                    onChange={(e) => handleInputChange("menuLabel", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom text to display in navigation menu
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menuOrder">Menu Order</Label>
                  <Input
                    id="menuOrder"
                    type="number"
                    placeholder="0"
                    value={formData.menuOrder}
                    onChange={(e) => handleInputChange("menuOrder", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first (0 = first position)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.slug}
                >
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {categories.length} categories total • Drag and drop to reorder menu items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading categories...</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext 
                  items={categories.map(cat => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {categories.map((category) => (
                      <SortableRow
                        key={category.id}
                        category={category}
                        onEdit={openDialog}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Total Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {categories.reduce((sum, cat) => sum + cat.articleCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(categories.reduce((sum, cat) => sum + cat.articleCount, 0) / categories.length) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Avg Articles/Category</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
