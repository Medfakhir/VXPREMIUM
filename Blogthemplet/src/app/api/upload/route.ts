import { NextRequest, NextResponse } from 'next/server';
import { imagekit } from '@/lib/imagekit';

export async function POST(request: NextRequest) {
  try {
    if (!imagekit) {
      return NextResponse.json({ 
        error: 'ImageKit is not properly configured on the server' 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // Validate file size (10MB limit - ImageKit can handle larger files)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: filename,
      folder: '/blog/articles', // Organize images in folders
      useUniqueFileName: true,
      tags: ['blog', 'article', 'featured-image'],
    });

    // Return the ImageKit URL and metadata
    return NextResponse.json({ 
      success: true, 
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      filename: uploadResponse.name,
      size: uploadResponse.size,
      thumbnailUrl: uploadResponse.thumbnailUrl,
    });

  } catch (error) {
    console.error('ImageKit upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file to ImageKit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
