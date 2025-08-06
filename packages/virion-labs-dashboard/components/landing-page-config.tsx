"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Plus, X, Eye, Wand2, Image, FileText, Video } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useCampaignLandingPageApi } from "@/hooks/use-campaign-landing-page-api"
import { useLandingPageTemplatesAPI, type LandingPageTemplate as ApiLandingPageTemplate } from "@/hooks/use-landing-page-templates-api"
import { CampaignLandingPageInsert } from "@/lib/supabase"

interface LandingPageConfigData {
  landing_page_template_id?: string
  inherited_from_template?: boolean
  offer_title?: string
  offer_description?: string
  offer_highlights?: string[]
  offer_value?: string
  offer_expiry_date?: Date | null
  hero_image_url?: string
  product_images?: string[]
  video_url?: string
  what_you_get?: string
  how_it_works?: string
  requirements?: string
  support_info?: string
}

interface LandingPageConfigProps {
  campaignId: string | null
  campaignType: string
  initialData?: LandingPageConfigData
  onChange: (data: LandingPageConfigData) => void
  onPreview?: () => void
}

export function LandingPageConfig({ 
  campaignId,
  campaignType, 
  initialData, 
  onChange, 
  onPreview 
}: LandingPageConfigProps) {
  console.log('📄 LandingPageConfig render:', { campaignId, campaignType, initialData, hasInitialData: !!initialData });
  
  const { page: landingPage, loading, createPage, updatePage, fetchPage } = useCampaignLandingPageApi()
  const { templates: availableTemplates, loading: templatesLoading, fetchSingleTemplate } = useLandingPageTemplatesAPI(campaignType)
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("template")
  
  const [data, setData] = useState<LandingPageConfigData>({
    landing_page_template_id: '',
    inherited_from_template: false,
    offer_title: '',
    offer_description: '',
    offer_highlights: [],
    offer_value: '',
    offer_expiry_date: null,
    hero_image_url: '',
    product_images: [],
    video_url: '',
    what_you_get: '',
    how_it_works: '',
    requirements: '',
    support_info: '',
    ...initialData
  })

  useEffect(() => {
    if (campaignId && !initialData) {
      fetchPage(campaignId)
    }
  }, [campaignId, fetchPage, initialData])

  useEffect(() => {
    if (initialData) {
        setData(prevData => ({ ...prevData, ...initialData }));
    }
  }, [initialData]);

  // State for tracking template inheritance
  const [isInherited, setIsInherited] = useState(false)
  const [inheritedTemplateName, setInheritedTemplateName] = useState<string>('')

  // Update data when landing page loads (only if no initialData was provided)
  useEffect(() => {
    if (landingPage && !initialData) {
      setData({
        landing_page_template_id: landingPage.landing_page_template?.documentId || '',
        inherited_from_template: landingPage.inherited_from_template || false,
        offer_title: Array.isArray(landingPage.offer_title) ? landingPage.offer_title[0] : landingPage.offer_title || '',
        offer_description: landingPage.offer_description || '',
        offer_highlights: landingPage.offer_highlights || [],
        offer_value: landingPage.offer_value || '',
        offer_expiry_date: landingPage.offer_expiry_date ? new Date(landingPage.offer_expiry_date) : null,
        hero_image_url: landingPage.hero_image_url || '',
        product_images: landingPage.product_images || [],
        video_url: landingPage.video_url || '',
        what_you_get: landingPage.what_you_get || '',
        how_it_works: landingPage.how_it_works || '',
        requirements: landingPage.requirements || '',
        support_info: landingPage.support_info || '',
      })
      
      // Track if this landing page was inherited from a template
      setIsInherited(landingPage.inherited_from_template || false)
      
      // Get template name if inherited
      if (landingPage.inherited_from_template && landingPage.landing_page_template) {
        const inheritedTemplate = availableTemplates.find(t => t.documentId === landingPage.landing_page_template?.documentId)
        setInheritedTemplateName(inheritedTemplate?.name || 'Unknown Template')
      }
    }
  }, [landingPage, availableTemplates, initialData])

  const updateData = (updates: Partial<LandingPageConfigData>) => {
    const newData = { ...data, ...updates }
    setData(newData)
    onChange(newData)
    
    // If this was inherited and user is making changes, mark as customized
    if (isInherited && Object.keys(updates).length > 0) {
      setIsInherited(false)
      // Note: We'll update the inherited_from_template flag when saving
    }
  }

  const handleResetToTemplate = async () => {
    if (!data.landing_page_template_id) return
    
    try {
      const template = await fetchSingleTemplate(data.landing_page_template_id)
      if (template) {
        const templateData = {
          landing_page_template_id: template.documentId, // Use documentId for Strapi v5
          inherited_from_template: true,
          offer_title: template.default_offer_title,
          offer_description: template.default_offer_description,
          offer_highlights: template.default_offer_highlights,
          offer_value: template.default_offer_value,
          offer_expiry_date: template.default_offer_expiry_date ? new Date(template.default_offer_expiry_date) : null,
          hero_image_url: template.default_hero_image_url,
          product_images: template.default_product_images || template.default_content?.product_images,
          video_url: template.default_video_url,
          what_you_get: template.default_what_you_get,
          how_it_works: template.default_how_it_works,
          requirements: template.default_requirements,
          support_info: template.default_support_info,
        }
        setData(prev => ({ ...prev, ...templateData }))
        setIsInherited(true)
        setInheritedTemplateName(template.name)
      }
    } catch (error) {
      console.error('Error resetting to template:', error)
    }
  }

  const handleTemplateSelect = async (templateId: string) => {
    if (templateId === "blank") {
      // Clear template data but keep existing form data
      updateData({
        landing_page_template_id: "",
        inherited_from_template: false
      })
      return
    }

    try {
      const template = await fetchSingleTemplate(templateId)
      if (template) {
        // Map the template's default fields to the landing page data structure
        // Only include fields that have actual values to avoid overwriting with undefined
        const templateFields: Partial<LandingPageConfigData> = {}
        
        if (template.default_offer_title) {
          templateFields.offer_title = template.default_offer_title
        }
        if (template.default_offer_description) {
          templateFields.offer_description = template.default_offer_description
        }
        if (template.default_offer_highlights && template.default_offer_highlights.length > 0) {
          templateFields.offer_highlights = template.default_offer_highlights
        }
        if (template.default_offer_value) {
          templateFields.offer_value = template.default_offer_value
        }
        if (template.default_offer_expiry_date) {
          templateFields.offer_expiry_date = new Date(template.default_offer_expiry_date)
        }
        if (template.default_hero_image_url) {
          templateFields.hero_image_url = template.default_hero_image_url
        }
        // Check both default_product_images and default_content.product_images
        const productImages = template.default_product_images || template.default_content?.product_images
        if (productImages && productImages.length > 0) {
          templateFields.product_images = productImages
        }
        if (template.default_video_url) {
          templateFields.video_url = template.default_video_url
        }
        if (template.default_what_you_get) {
          templateFields.what_you_get = template.default_what_you_get
        }
        if (template.default_how_it_works) {
          templateFields.how_it_works = template.default_how_it_works
        }
        if (template.default_requirements) {
          templateFields.requirements = template.default_requirements
        }
        if (template.default_support_info) {
          templateFields.support_info = template.default_support_info
        }
        
        updateData({
          landing_page_template_id: template.documentId, // Use documentId for Strapi v5
          inherited_from_template: true,
          ...templateFields
        })
      }
    } catch (error) {
      console.error('Error loading template:', error)
    }
  }

  const addHighlight = () => {
    updateData({
      offer_highlights: [...(data.offer_highlights || []), '']
    })
  }

  const updateHighlight = (index: number, value: string) => {
    const highlights = [...(data.offer_highlights || [])]
    highlights[index] = value
    updateData({ offer_highlights: highlights })
  }

  const removeHighlight = (index: number) => {
    const highlights = [...(data.offer_highlights || [])]
    highlights.splice(index, 1)
    updateData({ offer_highlights: highlights })
  }

  const addProductImage = () => {
    updateData({
      product_images: [...(data.product_images || []), '']
    })
  }

  const updateProductImage = (index: number, value: string) => {
    const images = [...(data.product_images || [])]
    images[index] = value
    updateData({ product_images: images })
  }

  const removeProductImage = (index: number) => {
    const images = [...(data.product_images || [])]
    images.splice(index, 1)
    updateData({ product_images: images })
  }

  // Only show loading if we're waiting for existing campaign data in edit mode and no initialData provided
  if (loading && campaignId && !initialData) {
    return (
      <div className="space-y-6">
        {/* Tabs Skeleton */}
        <div className="w-full">
          <div className="grid w-full grid-cols-4 gap-1 rounded-md bg-muted p-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 rounded-sm" />
            ))}
          </div>
        </div>

        {/* Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form Fields Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Preview Button Skeleton */}
        <div className="flex justify-start">
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Template Inheritance Status - Only show in create mode */}
      {!campaignId && isInherited && inheritedTemplateName && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Wand2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    Inherited from Template: {inheritedTemplateName}
                  </p>
                  <p className="text-sm text-blue-700">
                    This landing page content was automatically populated from your campaign template. 
                    You can customize any field below.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToTemplate}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                disabled={!!campaignId} // Disable in edit mode
              >
                Reset to Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="template" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* Template Selection Tab */}
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Landing Page Template
              </CardTitle>
              <CardDescription>
                Choose a pre-designed template or start with a blank canvas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-select">Select Template</Label>
                <Select
                  value={data.landing_page_template_id || "blank"}
                  onValueChange={handleTemplateSelect}
                  disabled={templatesLoading}
                >
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder={
                      templatesLoading 
                        ? "Loading templates..." 
                        : availableTemplates.length === 0
                        ? "No templates available"
                        : "Choose a template or start blank"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">Start from blank</SelectItem>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.documentId} value={template.documentId}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {data.landing_page_template_id && availableTemplates.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {availableTemplates.find(t => t.documentId === data.landing_page_template_id)?.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offer Details</CardTitle>
              <CardDescription>
                Main information about your product or offer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="offer-title">Offer Title *</Label>
                <Input
                  id="offer-title"
                  placeholder="e.g., Get 30 Days Free Access"
                  value={data.offer_title || ""}
                  onChange={(e) => updateData({ offer_title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-description">Offer Description *</Label>
                <Textarea
                  id="offer-description"
                  placeholder="Detailed description of what you're offering..."
                  rows={3}
                  value={data.offer_description || ""}
                  onChange={(e) => updateData({ offer_description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-value">Offer Value</Label>
                <Input
                  id="offer-value"
                  placeholder="e.g., Worth $99/month - Yours FREE"
                  value={data.offer_value || ""}
                  onChange={(e) => updateData({ offer_value: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Offer Highlights</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a key selling point..."
                    value={data.offer_highlights?.find((_, i) => i === 0) || ""}
                    onChange={(e) => updateHighlight(0, e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addHighlight()}
                  />
                  <Button type="button" onClick={addHighlight} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {data.offer_highlights && data.offer_highlights.length > 0 && (
                  <div className="space-y-2">
                    {data.offer_highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <span className="flex-1 text-sm">{highlight}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHighlight(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !data.offer_expiry_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data.offer_expiry_date ? (
                        format(data.offer_expiry_date, "PPP")
                      ) : (
                        <span>No expiry date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.offer_expiry_date || undefined}
                      onSelect={(date) => updateData({ offer_expiry_date: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => updateData({ offer_expiry_date: null })}
                      >
                        Clear Expiry
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Visual Content
              </CardTitle>
              <CardDescription>
                Add images and videos to make your landing page more engaging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-image">Hero Image URL</Label>
                <Input
                  id="hero-image"
                  type="url"
                  placeholder="https://example.com/hero-image.jpg"
                  value={data.hero_image_url || ""}
                  onChange={(e) => updateData({ hero_image_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-url">Demo Video URL</Label>
                <Input
                  id="video-url"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or Vimeo, Wistia, Loom URL"
                  value={data.video_url || ""}
                  onChange={(e) => updateData({ video_url: e.target.value })}
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Supported providers:</strong> YouTube, Vimeo, Wistia, Loom, TikTok, Twitch, Dailymotion</p>
                  <p><strong>💡 Tip:</strong> Some YouTube videos may show "Open in YouTube" overlay due to creator settings. For seamless embedding, consider Vimeo or Wistia.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/product-image.jpg"
                    value={data.product_images?.find((_, i) => i === 0) || ""}
                    onChange={(e) => updateProductImage(0, e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addProductImage()}
                  />
                  <Button type="button" onClick={addProductImage} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {data.product_images && data.product_images.length > 0 && (
                  <div className="space-y-2">
                    {data.product_images.map((image, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <span className="flex-1 text-sm font-mono">{image}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Information</CardTitle>
              <CardDescription>
                Additional details to help users understand your offer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="what-you-get">What You Get</Label>
                <Textarea
                  id="what-you-get"
                  placeholder="Detailed explanation of what's included in the offer..."
                  rows={3}
                  value={data.what_you_get || ""}
                  onChange={(e) => updateData({ what_you_get: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="how-it-works">How It Works</Label>
                <Textarea
                  id="how-it-works"
                  placeholder="Step-by-step process (use numbered list)..."
                  rows={4}
                  value={data.how_it_works || ""}
                  onChange={(e) => updateData({ how_it_works: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Any requirements or conditions for the offer..."
                  rows={2}
                  value={data.requirements || ""}
                  onChange={(e) => updateData({ requirements: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-info">Support Information</Label>
                <Textarea
                  id="support-info"
                  placeholder="How users can get help or contact support..."
                  rows={2}
                  value={data.support_info || ""}
                  onChange={(e) => updateData({ support_info: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Button (if provided) */}
      {onPreview && (
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={onPreview} className="gap-2">
            <Eye className="h-4 w-4" />
            Preview Landing Page
          </Button>
        </div>
      )}
    </div>
  )
}