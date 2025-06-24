import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase clients
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    // Check user role in database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Only admin and client users can download exported files
    if (!['admin', 'client'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied. Admin or client privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');

    if (!filename) {
      return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
    }

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Check if file exists in temp directory
    const tempDir = join(process.cwd(), 'temp', 'exports');
    const filePath = join(tempDir, filename);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
    }

    try {
      // Read file content
      const fileContent = readFileSync(filePath, 'utf8');
      
      // Determine content type based on file extension
      const fileExtension = filename.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (fileExtension) {
        case 'csv':
          contentType = 'text/csv';
          break;
        case 'json':
          contentType = 'application/json';
          break;
        case 'txt':
          contentType = 'text/plain';
          break;
      }

      // Return file with appropriate headers
      return new NextResponse(fileContent, {
        status: 200,
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
      return NextResponse.json({ error: 'Failed to read export file' }, { status: 500 });
    }

  } catch (error) {
    console.error('Download export error:', error);
    return NextResponse.json(
      { error: 'Failed to download export file' },
      { status: 500 }
    );
  }
} 