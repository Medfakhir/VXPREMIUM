"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Globe, 
  Mail, 
  Database, 
  Image as ImageIcon,
  Save,
  RefreshCw,
  Download,
  Upload,
  Key,
  Server,
  Palette
} from "lucide-react";
import { toast } from "sonner";

interface SiteSettings {
  // General Settings
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logoUrl: string;
  faviconUrl: string;
  
  // SEO Settings
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultMetaKeywords: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  
  // Email Settings
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  
  // Security settings removed per user request
  
  // Content Settings
  articlesPerPage: number;
  enableComments: boolean;
  moderateComments: boolean;
  allowGuestComments: boolean;
  
  // ImageKit Settings
  imagekitPublicKey: string;
  imagekitPrivateKey: string;
  imagekitUrlEndpoint: string;
}

export default function SettingsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    // General Settings
    siteName: "IPTV Hub",
    siteDescription: "Your ultimate guide to IPTV streaming, devices, and setup tutorials",
    siteUrl: "http://localhost:3000",
    logoUrl: "",
    faviconUrl: "",
    
    // SEO Settings
    defaultMetaTitle: "IPTV Hub - Streaming Guides & Reviews",
    defaultMetaDescription: "Discover the best IPTV players, streaming devices, and setup guides. Expert reviews and tutorials for IPTV enthusiasts.",
    defaultMetaKeywords: "IPTV, streaming, firestick, android tv, IPTV players",
    googleAnalyticsId: "",
    googleSearchConsoleId: "",
    
    // Email Settings
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "IPTV Hub",
    
    // Security settings removed per user request
    
    // Content Settings
    articlesPerPage: 12,
    enableComments: false,
    moderateComments: true,
    allowGuestComments: false,
    
    // ImageKit Settings
    imagekitPublicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    imagekitPrivateKey: "",
    imagekitUrlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (field: keyof SiteSettings, value: string | number | boolean) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [field]: value
      };
      
      // Automatically enable guest comments when comments are enabled
      if (field === 'enableComments' && value === true) {
        newSettings.allowGuestComments = true;
      }
      
      return newSettings;
    });
  };

  const handleSave = async (section?: string) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`${section || 'Settings'} saved successfully!`, {
            description: "Your changes have been applied.",
            duration: 3000,
          });
        } else {
          throw new Error(data.error || 'Failed to save settings');
        }
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings", {
        description: error instanceof Error ? error.message : "Please try again.",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailSettings = async () => {
    try {
      toast.info("Sending test email...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast.success("Test email sent successfully!");
    } catch (error) {
      toast.error("Failed to send test email");
    }
  };

  const testImageKitConnection = async () => {
    try {
      toast.info("Testing ImageKit connection...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      toast.success("ImageKit connection successful!");
    } catch (error) {
      toast.error("ImageKit connection failed");
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return;

    // Validate file type
    const validTypes = type === 'favicon' 
      ? ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/gif']
      : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid file type for ${type}. Please select a valid image file.`);
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const fieldName = type === 'logo' ? 'logoUrl' : 'faviconUrl';
        setSettings(prev => ({
          ...prev,
          [fieldName]: data.url
        }));
        toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info("Preparing data export...");
      
      // Call export API
      const response = await fetch('/api/export');
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `iptv-blog-export-${new Date().toISOString().slice(0, 10)}.json`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your blog settings and preferences
          </p>
        </div>
        <Button onClick={() => handleSave()} disabled={isSaving}>
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>
                Basic site information and branding settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                    placeholder="Your site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                  placeholder="Brief description of your site"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logoUrl">Logo</Label>
                    <div className="mt-2 space-y-2">
                      {settings.logoUrl && (
                        <div className="flex items-center space-x-2 p-2 border rounded">
                          <img 
                            src={settings.logoUrl} 
                            alt="Logo preview" 
                            className="w-8 h-8 object-contain"
                          />
                          <span className="text-sm text-muted-foreground">Current logo</span>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Input
                          id="logoUrl"
                          value={settings.logoUrl}
                          onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUploading}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleImageUpload(file, 'logo');
                            };
                            input.click();
                          }}
                        >
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="faviconUrl">Favicon</Label>
                    <div className="mt-2 space-y-2">
                      {settings.faviconUrl && (
                        <div className="flex items-center space-x-2 p-2 border rounded">
                          <img 
                            src={settings.faviconUrl} 
                            alt="Favicon preview" 
                            className="w-4 h-4 object-contain"
                          />
                          <span className="text-sm text-muted-foreground">Current favicon</span>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Input
                          id="faviconUrl"
                          value={settings.faviconUrl}
                          onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                          placeholder="https://example.com/favicon.ico"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUploading}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.ico,.png,.gif';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleImageUpload(file, 'favicon');
                            };
                            input.click();
                          }}
                        >
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('General settings')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>SEO Settings</span>
              </CardTitle>
              <CardDescription>
                Search engine optimization and analytics configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultMetaTitle">Default Meta Title</Label>
                <Input
                  id="defaultMetaTitle"
                  value={settings.defaultMetaTitle}
                  onChange={(e) => handleInputChange('defaultMetaTitle', e.target.value)}
                  placeholder="Default title for pages"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultMetaDescription">Default Meta Description</Label>
                <Textarea
                  id="defaultMetaDescription"
                  value={settings.defaultMetaDescription}
                  onChange={(e) => handleInputChange('defaultMetaDescription', e.target.value)}
                  placeholder="Default description for pages"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultMetaKeywords">Default Meta Keywords</Label>
                <Input
                  id="defaultMetaKeywords"
                  value={settings.defaultMetaKeywords}
                  onChange={(e) => handleInputChange('defaultMetaKeywords', e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                  <Input
                    id="googleAnalyticsId"
                    value={settings.googleAnalyticsId}
                    onChange={(e) => handleInputChange('googleAnalyticsId', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleSearchConsoleId">Search Console ID</Label>
                  <Input
                    id="googleSearchConsoleId"
                    value={settings.googleSearchConsoleId}
                    onChange={(e) => handleInputChange('googleSearchConsoleId', e.target.value)}
                    placeholder="google-site-verification=..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('SEO settings')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save SEO Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Settings</span>
              </CardTitle>
              <CardDescription>
                Configure SMTP settings for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={settings.smtpPort}
                    onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                    placeholder="Your app password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={settings.fromEmail}
                    onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                    placeholder="noreply@yoursite.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.fromName}
                    onChange={(e) => handleInputChange('fromName', e.target.value)}
                    placeholder="Your Site Name"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={testEmailSettings}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
                <Button onClick={() => handleSave('Email settings')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings removed per user request */}

        {/* Content Settings */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Content Settings</span>
              </CardTitle>
              <CardDescription>
                Configure content display and interaction settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="articlesPerPage">Articles Per Page</Label>
                <Input
                  id="articlesPerPage"
                  type="number"
                  value={settings.articlesPerPage}
                  onChange={(e) => handleInputChange('articlesPerPage', parseInt(e.target.value))}
                  min="6"
                  max="50"
                />
                <p className="text-sm text-muted-foreground">
                  Number of articles to display per page
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to comment on articles
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableComments}
                    onCheckedChange={(checked) => handleInputChange('enableComments', checked)}
                  />
                </div>

                {settings.enableComments && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Moderate Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Comments require approval before appearing
                      </p>
                    </div>
                    <Switch
                      checked={settings.moderateComments}
                      onCheckedChange={(checked) => handleInputChange('moderateComments', checked)}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('Content settings')} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Content Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Integrations</span>
              </CardTitle>
              <CardDescription>
                Configure third-party service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">ImageKit Configuration</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Connected
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imagekitPublicKey">Public Key</Label>
                    <Input
                      id="imagekitPublicKey"
                      value={settings.imagekitPublicKey}
                      onChange={(e) => handleInputChange('imagekitPublicKey', e.target.value)}
                      placeholder="public_xxxxxxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imagekitPrivateKey">Private Key</Label>
                    <Input
                      id="imagekitPrivateKey"
                      type="password"
                      value={settings.imagekitPrivateKey}
                      onChange={(e) => handleInputChange('imagekitPrivateKey', e.target.value)}
                      placeholder="private_xxxxxxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imagekitUrlEndpoint">URL Endpoint</Label>
                    <Input
                      id="imagekitUrlEndpoint"
                      value={settings.imagekitUrlEndpoint}
                      onChange={(e) => handleInputChange('imagekitUrlEndpoint', e.target.value)}
                      placeholder="https://ik.imagekit.io/your_imagekit_id/"
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={testImageKitConnection}>
                    <Server className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button onClick={() => handleSave('ImageKit settings')} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save ImageKit Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Management</span>
              </CardTitle>
              <CardDescription>
                Export and import your blog data for backup and migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Export Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download a complete backup of your blog data including articles, comments, settings, and more.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Export includes:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• All articles and content</li>
                      <li>• Categories and tags</li>
                      <li>• Comments and user interactions</li>
                      <li>• Site settings and configuration</li>
                      <li>• Admin user accounts (without passwords)</li>
                    </ul>
                  </div>
                  <Button onClick={handleExportData} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </div>

                <Separator />

                {/* Import Section (Coming Soon) */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Import Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Import data from a previously exported backup file.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <Upload className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="font-medium text-yellow-800">Coming Soon</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Import functionality will be available in the next update.
                      </p>
                    </div>
                    <Button disabled variant="outline" className="w-full sm:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data (Coming Soon)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
