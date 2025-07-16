import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Parse video URL and generate proper embed URL for server-side rendering
 */
function parseVideoUrlForEmbed(url: string): { embedUrl: string; provider: string; isValid: boolean } {
  if (!url || typeof url !== 'string') {
    return { embedUrl: '', provider: 'unknown', isValid: false }
  }

  const cleanUrl = url.trim()

  // YouTube patterns
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^"&?\/\s]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^"&?\/\s]{11})/i
  ]

  for (const pattern of youtubePatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      const params = new URLSearchParams({
        rel: '0',
        modestbranding: '1', 
        showinfo: '0',
        enablejsapi: '1',
        playsinline: '1',
        fs: '1',
        iv_load_policy: '3',
        controls: '1',
        disablekb: '0',
        color: 'white',
        cc_load_policy: '0'
      })
      return {
        embedUrl: `https://www.youtube.com/embed/${match[1]}?${params.toString()}`,
        provider: 'youtube',
        isValid: true
      }
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/i,
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/i
  ]

  for (const pattern of vimeoPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0`,
        provider: 'vimeo',
        isValid: true
      }
    }
  }

  // Wistia patterns
  const wistiaPatterns = [
    /(?:https?:\/\/)?(?:\w+\.)?wistia\.com\/medias\/([a-z0-9]{10})/i,
    /(?:https?:\/\/)?fast\.wistia\.net\/embed\/iframe\/([a-z0-9]{10})/i
  ]

  for (const pattern of wistiaPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://fast.wistia.net/embed/iframe/${match[1]}?playerColor=3B82F6&videoFoam=true`,
        provider: 'wistia',
        isValid: true
      }
    }
  }

  // Loom patterns
  const loomPatterns = [
    /(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/([a-f0-9]{32})/i
  ]

  for (const pattern of loomPatterns) {
    const match = cleanUrl.match(pattern)
    if (match && match[1]) {
      return {
        embedUrl: `https://www.loom.com/embed/${match[1]}`,
        provider: 'loom',
        isValid: true
      }
    }
  }

  // If URL already looks like an embed URL, use it directly
  if (cleanUrl.includes('embed') || cleanUrl.includes('player')) {
    return {
      embedUrl: cleanUrl,
      provider: 'direct',
      isValid: true
    }
  }

  // Fallback for unknown providers
  return { embedUrl: '', provider: 'unknown', isValid: false }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params

    // Fetch campaign data and landing page data separately
    const { data: campaignData, error: campaignError } = await supabase
      .from('discord_guild_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaignData) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Campaign Not Found</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">Campaign Not Found</h1>
            <p>The campaign you're looking for doesn't exist or has been removed.</p>
          </body>
        </html>`,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Fetch landing page data
    const { data: landingPageData } = await supabase
      .from('campaign_landing_pages')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    // Fetch client data separately
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, industry, logo')
      .eq('id', campaignData.client_id)
      .single()

    // Combine the data
    const campaign = {
      ...campaignData,
      ...landingPageData, // Merge landing page data
      clients: clientData || { name: 'Unknown Client', industry: 'Technology', logo: null }
    }

    // Generate the HTML for the landing page preview
    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview: ${campaign.offer_title || campaign.campaign_name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          .preview-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f59e0b;
            color: white;
            text-align: center;
            padding: 8px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          body { padding-top: 40px; }
          .prose { max-width: none; }
          .prose p { margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="preview-banner">
          🔍 PREVIEW MODE - This is how your landing page will look to visitors
        </div>
        
        <div class="min-h-screen py-8 px-4" style="background: linear-gradient(135deg, ${campaign.brand_color || '#3B82F6'}15, ${campaign.brand_color || '#3B82F6'}05, #f8fafc)">
          <div class="max-w-4xl mx-auto space-y-8">
            
            <!-- Header -->
            <div class="text-center space-y-6">
              ${campaign.brand_logo_url ? `
                <div class="flex justify-center">
                  <img src="${campaign.brand_logo_url}" alt="${campaign.clients?.name || 'Client'}" class="h-20 max-w-48 object-contain">
                </div>
              ` : `
                <div class="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold" style="background-color: ${campaign.brand_color || '#3B82F6'}">
                  ${(campaign.clients?.name || 'C').charAt(0)}
                </div>
              `}
              
              <div class="space-y-2">
                <div class="inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium mb-4" style="background-color: ${campaign.brand_color || '#3B82F6'}">
                  ${campaign.campaign_type?.replace('_', ' ').toUpperCase() || 'CAMPAIGN'}
                </div>
                
                <h1 class="text-4xl font-bold text-gray-900">
                  ${campaign.offer_title || campaign.campaign_name || 'Campaign Title'}
                </h1>
                <p class="text-xl text-gray-600">
                  by ${campaign.clients?.name || 'Client Name'}
                </p>
                ${campaign.offer_value ? `
                  <div class="mt-4">
                    <span class="inline-block text-lg px-4 py-2 border-2 rounded-lg font-medium" style="border-color: ${campaign.brand_color || '#3B82F6'}; color: ${campaign.brand_color || '#3B82F6'}">
                      ${campaign.offer_value}
                    </span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Hero Image -->
            ${campaign.hero_image_url ? `
              <div class="relative rounded-xl overflow-hidden shadow-lg">
                <img src="${campaign.hero_image_url}" alt="${campaign.offer_title || campaign.campaign_name}" class="w-full h-64 md:h-80 object-cover">
                <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div class="text-center text-white">
                    <h2 class="text-3xl md:text-4xl font-bold mb-2">
                      ${campaign.offer_title || campaign.campaign_name}
                    </h2>
                    ${campaign.offer_description ? `
                      <p class="text-lg md:text-xl opacity-90">
                        ${campaign.offer_description}
                      </p>
                    ` : ''}
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="grid md:grid-cols-3 gap-8">
              <!-- Main Content -->
              <div class="md:col-span-2 space-y-6">
                
                <!-- Main Campaign Card -->
                <div class="bg-white rounded-lg shadow-lg">
                  <div class="p-6 border-b">
                    <h2 class="text-2xl font-bold">
                      ${campaign.offer_title || campaign.campaign_name || 'Campaign Title'}
                    </h2>
                    ${campaign.offer_description ? `
                      <p class="text-gray-600 text-lg mt-2">
                        ${campaign.offer_description}
                      </p>
                    ` : ''}
                  </div>
                  
                  <div class="p-6 space-y-6">
                    <!-- Offer Highlights -->
                    ${campaign.offer_highlights && campaign.offer_highlights.length > 0 ? `
                      <div class="bg-gray-50 p-6 rounded-lg">
                        <h3 class="font-semibold text-lg mb-4">What's Included:</h3>
                        <ul class="space-y-2">
                                                     ${(campaign.offer_highlights as string[]).map((highlight: string) => `
                            <li class="flex items-start gap-3">
                              <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5" style="background-color: ${campaign.brand_color || '#3B82F6'}">
                                ✓
                              </div>
                              <span class="text-gray-700">${highlight}</span>
                            </li>
                          `).join('')}
                        </ul>
                      </div>
                    ` : ''}

                    <!-- Welcome Message -->
                    ${campaign.welcome_message ? `
                      <div class="p-6 rounded-lg text-white relative overflow-hidden" style="background-color: ${campaign.brand_color || '#3B82F6'}">
                        <div class="relative z-10">
                          <h3 class="font-semibold mb-2">Welcome Message</h3>
                          <p class="leading-relaxed">${campaign.welcome_message}</p>
                        </div>
                      </div>
                    ` : ''}

                    <!-- Call to Action -->
                    <div class="text-center space-y-4 p-6 bg-gray-50 rounded-lg">
                      <h3 class="text-2xl font-semibold">Ready to Join?</h3>
                      <p class="text-gray-600 text-lg">
                        Click below to join the Discord community and get started with exclusive access!
                      </p>
                      <button class="h-14 px-8 text-lg font-semibold text-white rounded-lg shadow-lg cursor-not-allowed opacity-75" style="background-color: ${campaign.brand_color || '#3B82F6'}">
                        Join Discord Server (Preview Mode)
                      </button>
                      <p class="text-sm text-gray-500">
                        🔍 This button is disabled in preview mode
                      </p>
                    </div>
                  </div>
                </div>

                <!-- What You Get Section -->
                ${campaign.what_you_get ? `
                  <div class="bg-white rounded-lg shadow-lg">
                    <div class="p-6 border-b">
                      <h2 class="text-xl font-bold">What You'll Get</h2>
                    </div>
                    <div class="p-6">
                      <div class="prose prose-gray max-w-none">
                        <p class="text-gray-700 leading-relaxed whitespace-pre-line">
                          ${campaign.what_you_get}
                        </p>
                      </div>
                    </div>
                  </div>
                ` : ''}

                <!-- How It Works Section -->
                ${campaign.how_it_works ? `
                  <div class="bg-white rounded-lg shadow-lg">
                    <div class="p-6 border-b">
                      <h2 class="text-xl font-bold">How It Works</h2>
                    </div>
                    <div class="p-6">
                      <div class="prose prose-gray max-w-none">
                        <div class="text-gray-700 leading-relaxed whitespace-pre-line">
                          ${campaign.how_it_works}
                        </div>
                      </div>
                    </div>
                  </div>
                ` : ''}

                <!-- Product Images -->
                ${campaign.product_images && campaign.product_images.length > 0 ? `
                  <div class="bg-white rounded-lg shadow-lg">
                    <div class="p-6 border-b">
                      <h2 class="text-xl font-bold">Gallery</h2>
                    </div>
                    <div class="p-6">
                      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        ${(campaign.product_images as string[]).map((image: string, index: number) => `
                          <div class="relative rounded-lg overflow-hidden shadow-md">
                            <img src="${image}" alt="Product ${index + 1}" class="w-full h-32 object-cover hover:scale-105 transition-transform cursor-pointer">
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                ` : ''}

                <!-- Video Section -->
                ${campaign.video_url ? (() => {
                  const videoInfo = parseVideoUrlForEmbed(campaign.video_url)
                  if (videoInfo.isValid) {
                    return `
                      <div class="bg-white rounded-lg shadow-lg">
                        <div class="p-6 border-b">
                          <h2 class="text-xl font-bold">Watch Demo</h2>
                          ${videoInfo.provider !== 'direct' ? `
                            <p class="text-sm text-gray-500 mt-1">
                              Video powered by ${videoInfo.provider.charAt(0).toUpperCase() + videoInfo.provider.slice(1)}
                            </p>
                          ` : ''}
                        </div>
                        <div class="p-6">
                          <div class="relative rounded-lg overflow-hidden shadow-lg">
                                                         <iframe 
                               src="${videoInfo.embedUrl}" 
                               class="w-full h-64 md:h-80" 
                               frameborder="0" 
                               allowfullscreen 
                               loading="lazy"
                               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                               referrerpolicy="strict-origin-when-cross-origin"
                               sandbox="allow-scripts allow-same-origin allow-presentation"
                               title="Demo Video">
                             </iframe>
                          </div>
                        </div>
                      </div>
                    `
                  } else {
                    return `
                      <div class="bg-white rounded-lg shadow-lg">
                        <div class="p-6 border-b">
                          <h2 class="text-xl font-bold">Watch Demo</h2>
                        </div>
                        <div class="p-6">
                          <div class="relative rounded-lg overflow-hidden shadow-lg bg-red-50 border-2 border-red-200 h-64 md:h-80 flex items-center justify-center">
                            <div class="text-center p-6">
                              <div class="text-red-500 text-4xl mb-4">⚠️</div>
                              <h3 class="font-semibold text-red-800 mb-2">Video Not Available</h3>
                              <p class="text-sm text-red-600 mb-4">
                                This video URL is not supported or the video may have been removed.
                              </p>
                              <p class="text-xs text-red-500">
                                Supported providers: YouTube, Vimeo, Wistia, Loom
                              </p>
                              <div class="mt-4">
                                <a 
                                  href="${campaign.video_url}" 
                                  target="_blank" 
                                  class="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                                >
                                  🔗 Open Original URL
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `
                  }
                })() : ''}
              </div>

              <!-- Sidebar -->
              <div class="space-y-6">
                <!-- Influencer Attribution -->
                <div class="bg-white rounded-lg shadow-lg">
                  <div class="p-6 border-b">
                    <h3 class="text-lg font-bold">Recommended by</h3>
                  </div>
                  <div class="p-6">
                    <div class="flex items-center gap-4">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg" style="background-color: ${campaign.brand_color || '#3B82F6'}">
                        P
                      </div>
                      <div>
                        <p class="font-semibold text-lg">Preview Influencer</p>
                        <p class="text-sm text-gray-500">Trusted Referrer</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Campaign Info -->
                <div class="bg-white rounded-lg shadow-lg">
                  <div class="p-6 border-b">
                    <h3 class="text-lg font-bold">Campaign Info</h3>
                  </div>
                  <div class="p-6 space-y-4">
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 text-gray-500">💬</div>
                      <div>
                        <p class="font-medium">Discord Server</p>
                        <p class="text-sm text-gray-500">Discord Community</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 text-gray-500">🏢</div>
                      <div>
                        <p class="font-medium">Industry</p>
                        <p class="text-sm text-gray-500">${campaign.clients?.industry || 'Technology'}</p>
                      </div>
                    </div>
                    <hr>
                    <button class="w-full py-2 px-4 text-white rounded-lg cursor-not-allowed opacity-75" style="background-color: ${campaign.brand_color || '#3B82F6'}">
                      Join Now (Preview)
                    </button>
                  </div>
                </div>

                <!-- Requirements -->
                ${campaign.requirements ? `
                  <div class="bg-white rounded-lg shadow-lg">
                    <div class="p-6 border-b">
                      <h3 class="text-lg font-bold">Requirements</h3>
                    </div>
                    <div class="p-6">
                      <p class="text-sm text-gray-500 whitespace-pre-line">
                        ${campaign.requirements}
                      </p>
                    </div>
                  </div>
                ` : ''}

                <!-- Support Info -->
                ${campaign.support_info ? `
                  <div class="bg-white rounded-lg shadow-lg">
                    <div class="p-6 border-b">
                      <h3 class="text-lg font-bold">Need Help?</h3>
                    </div>
                    <div class="p-6">
                      <p class="text-sm text-gray-500 whitespace-pre-line">
                        ${campaign.support_info}
                      </p>
                    </div>
                  </div>
                ` : ''}

                <!-- Trust Indicators -->
                <div class="bg-white rounded-lg shadow-lg">
                  <div class="p-6 text-center space-y-3">
                    <div class="flex justify-center">
                      <div class="w-8 h-8 text-green-500">🛡️</div>
                    </div>
                    <div>
                      <p class="font-medium">Secure & Trusted</p>
                      <p class="text-sm text-gray-500">Powered by Virion Labs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="text-center text-sm text-gray-500 border-t pt-8">
              <p>
                Powered by <span class="font-semibold">Virion Labs</span> • 
                Campaign: ${campaign.campaign_name} • 
                Preview Mode
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Error generating preview:', error)
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Preview Error</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Preview Error</h1>
          <p>There was an error generating the preview. Please try again.</p>
        </body>
      </html>`,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
} 