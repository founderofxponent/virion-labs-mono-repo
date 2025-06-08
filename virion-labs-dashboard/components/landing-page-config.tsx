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
  campaignType: string
  initialData?: LandingPageConfigData
  onChange: (data: LandingPageConfigData) => void
  onPreview?: () => void
}

export function LandingPageConfig({ campaignType, initialData, onChange, onPreview }: LandingPageConfigProps) {
  const [formData, setFormData] = useState<LandingPageConfigData>(initialData || {})
  const [newHighlight, setNewHighlight] = useState("")
  const [newProductImage, setNewProductImage] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<LandingPageTemplate | null>(null)

  const availableTemplates = getTemplatesByCampaignType(campaignType)

  useEffect(() => {
    if (formData.landing_page_template_id) {
      const template = getTemplateById(formData.landing_page_template_id)
      setSelectedTemplate(template || null)
    }
  }, [formData.landing_page_template_id])

  const handleFieldChange = (field: keyof LandingPageConfigData, value: any) => {
    const updatedData = { ...formData, [field]: value }
    setFormData(updatedData)
    onChange(updatedData)
  }

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "none") {
      setSelectedTemplate(null)
      handleFieldChange("landing_page_template_id", undefined)
      return
    }

    const template = getTemplateById(templateId)
    if (template) {
      setSelectedTemplate(template)
      // Auto-fill fields with template data
      const templateData = {
        landing_page_template_id: templateId,
        offer_title: template.fields.offer_title,
        offer_description: template.fields.offer_description,
        offer_highlights: [...template.fields.offer_highlights],
        offer_value: template.fields.offer_value,
        what_you_get: template.fields.what_you_get,
        how_it_works: template.fields.how_it_works,
        requirements: template.fields.requirements,
        support_info: template.fields.support_info,
        // Keep existing media fields
        hero_image_url: formData.hero_image_url,
        product_images: formData.product_images,
        video_url: formData.video_url,
        offer_expiry_date: formData.offer_expiry_date,
      }
      setFormData(templateData)
      onChange(templateData)
    }
  }

  const addHighlight = () => {
    if (newHighlight.trim()) {
      const highlights = [...(formData.offer_highlights || []), newHighlight.trim()]
      handleFieldChange("offer_highlights", highlights)
      setNewHighlight("")
    }
  }

  const removeHighlight = (index: number) => {
    const highlights = formData.offer_highlights?.filter((_, i) => i !== index) || []
    handleFieldChange("offer_highlights", highlights)
  }

  const addProductImage = () => {
    if (newProductImage.trim()) {
      const images = [...(formData.product_images || []), newProductImage.trim()]
      handleFieldChange("product_images", images)
      setNewProductImage("")
    }
  }

  const removeProductImage = (index: number) => {
    const images = formData.product_images?.filter((_, i) => i !== index) || []
    handleFieldChange("product_images", images)
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
            Choose a pre-built template to get started quickly, then customize as needed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={formData.landing_page_template_id || "none"}
              onValueChange={handleTemplateSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or start from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Custom (No Template)</SelectItem>
                {availableTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.description}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Template:</strong> {selectedTemplate.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>
            </div>
          )}
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
              value={formData.offer_title || ""}
              onChange={(e) => handleFieldChange("offer_title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-description">Offer Description *</Label>
            <Textarea
              id="offer-description"
              placeholder="Detailed description of what you're offering..."
              rows={3}
              value={formData.offer_description || ""}
              onChange={(e) => handleFieldChange("offer_description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-value">Offer Value</Label>
            <Input
              id="offer-value"
              placeholder="e.g., Worth $99/month - Yours FREE"
              value={formData.offer_value || ""}
              onChange={(e) => handleFieldChange("offer_value", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Offer Highlights</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a key selling point..."
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addHighlight()}
              />
              <Button type="button" onClick={addHighlight} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.offer_highlights && formData.offer_highlights.length > 0 && (
              <div className="space-y-2">
                {formData.offer_highlights.map((highlight, index) => (
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
                    !formData.offer_expiry_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.offer_expiry_date ? (
                    format(formData.offer_expiry_date, "PPP")
                  ) : (
                    <span>No expiry date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.offer_expiry_date || undefined}
                  onSelect={(date) => handleFieldChange("offer_expiry_date", date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleFieldChange("offer_expiry_date", null)}
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
              value={formData.hero_image_url || ""}
              onChange={(e) => handleFieldChange("hero_image_url", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-url">Demo Video URL</Label>
            <Input
              id="video-url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={formData.video_url || ""}
              onChange={(e) => handleFieldChange("video_url", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/product-image.jpg"
                value={newProductImage}
                onChange={(e) => setNewProductImage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addProductImage()}
              />
              <Button type="button" onClick={addProductImage} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.product_images && formData.product_images.length > 0 && (
              <div className="space-y-2">
                {formData.product_images.map((image, index) => (
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
              value={formData.what_you_get || ""}
              onChange={(e) => handleFieldChange("what_you_get", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="how-it-works">How It Works</Label>
            <Textarea
              id="how-it-works"
              placeholder="Step-by-step process (use numbered list)..."
              rows={4}
              value={formData.how_it_works || ""}
              onChange={(e) => handleFieldChange("how_it_works", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              placeholder="Any requirements or conditions for the offer..."
              rows={2}
              value={formData.requirements || ""}
              onChange={(e) => handleFieldChange("requirements", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-info">Support Information</Label>
            <Textarea
              id="support-info"
              placeholder="How users can get help or contact support..."
              rows={2}
              value={formData.support_info || ""}
              onChange={(e) => handleFieldChange("support_info", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Button */}
      {onPreview && (
        <div className="flex justify-center">
          <Button onClick={onPreview} variant="outline" size="lg">
            <Eye className="mr-2 h-4 w-4" />
            Preview Landing Page
          </Button>
        </div>
      )}
    </div>
  )
} 