"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { CalendarIcon, Plus, X, Eye, Wand2, Image } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { LANDING_PAGE_TEMPLATES, getTemplatesByCampaignType, getTemplateById, type LandingPageTemplate } from "@/lib/landing-page-templates"
import { useCampaignLandingPage } from "@/hooks/use-campaign-landing-pages"
import { CampaignLandingPageInsert } from "@/lib/supabase"

interface LandingPageConfigData {
  landing_page_template_id?: string
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
  campaignId: string
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
  const { landingPage, loading, createOrUpdateLandingPage, refresh } = useCampaignLandingPage(campaignId)
  
  const [data, setData] = useState<LandingPageConfigData>({
    landing_page_template_id: '',
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

  // Update data when landing page loads
  useEffect(() => {
    if (landingPage) {
      setData({
        landing_page_template_id: landingPage.landing_page_template_id || '',
        offer_title: landingPage.offer_title || '',
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
    }
  }, [landingPage])

  const updateData = (updates: Partial<LandingPageConfigData>) => {
    const newData = { ...data, ...updates }
    setData(newData)
    onChange(newData)
  }

  const availableTemplates = getTemplatesByCampaignType(campaignType)

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId)
    if (template) {
      updateData({
        landing_page_template_id: templateId,
        ...template.fields
      })
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

  const handleSave = async () => {
    try {
      const saveData: Omit<CampaignLandingPageInsert, 'campaign_id'> = {
        landing_page_template_id: data.landing_page_template_id || null,
        offer_title: data.offer_title || null,
        offer_description: data.offer_description || null,
        offer_highlights: data.offer_highlights || null,
        offer_value: data.offer_value || null,
        offer_expiry_date: data.offer_expiry_date?.toISOString() || null,
        hero_image_url: data.hero_image_url || null,
        product_images: data.product_images || null,
        video_url: data.video_url || null,
        what_you_get: data.what_you_get || null,
        how_it_works: data.how_it_works || null,
        requirements: data.requirements || null,
        support_info: data.support_info || null,
      }
      
      await createOrUpdateLandingPage(saveData)
      refresh()
    } catch (error) {
      console.error('Failed to save landing page:', error)
    }
  }

  if (loading) {
    return <div>Loading landing page configuration...</div>
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTemplates.map((template) => (
              <div
                key={template.id}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-colors",
                  data.landing_page_template_id === template.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="flex gap-1 mt-2">
                      {template.campaign_types.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Offer Details */}
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

      {/* Visual Content */}
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
              placeholder="https://youtube.com/watch?v=..."
              value={data.video_url || ""}
              onChange={(e) => updateData({ video_url: e.target.value })}
            />
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

      {/* Detailed Information */}
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

      {/* Save Button */}
      <div className="flex justify-between">
        <div>
          {onPreview && (
            <Button type="button" variant="outline" onClick={onPreview} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview Landing Page
            </Button>
          )}
        </div>
        <Button onClick={handleSave} className="gap-2">
          Save Landing Page Configuration
        </Button>
      </div>
    </div>
  )
} 