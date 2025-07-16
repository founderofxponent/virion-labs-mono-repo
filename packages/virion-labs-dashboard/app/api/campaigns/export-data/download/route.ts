import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');

    if (!filename) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    // Security: Only allow alphanumeric characters, dots, dashes, and underscores
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const tempDir = join(process.cwd(), 'temp', 'exports');
    const filePath = join(tempDir, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
      // Read file content
      const fileContent = readFileSync(filePath, 'utf8');
      
      // Determine content type based on file extension
      const contentType = filename.endsWith('.json') ? 'application/json' : 'text/csv';
      
      // Clean up the file after reading (optional - you might want to keep files for a certain period)
      try {
        unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError);
      }

      // Return file content with appropriate headers
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 