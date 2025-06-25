import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirect to the new simplified campaign export endpoint for backward compatibility
  const { searchParams } = new URL(request.url);
  
  // Map old parameters to new format
  const newParams = new URLSearchParams();
  
  // Map export type to select mode - default to all campaigns
  newParams.set('selectMode', 'all');
  
  // Pass through other parameters
  const format = searchParams.get('format') || 'csv';
  const dateRange = searchParams.get('dateRange') || '30';
  const campaignId = searchParams.get('campaignId');
  
  newParams.set('format', format);
  newParams.set('dateRange', dateRange);
  
  if (campaignId) {
    newParams.set('selectMode', 'single');
    newParams.set('campaignIds', campaignId);
  }
  
  // Create redirect URL to new endpoint
  const baseUrl = new URL(request.url).origin;
  const redirectUrl = `${baseUrl}/api/campaigns/export-data?${newParams.toString()}`;
  
  // Return a temporary redirect
  return NextResponse.redirect(redirectUrl, 307);
} 