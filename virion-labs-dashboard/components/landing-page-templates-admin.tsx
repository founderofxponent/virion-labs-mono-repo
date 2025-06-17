"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Star, 
  StarOff,
  Wand2,
  Image as ImageIcon,
  Settings,
  Palette
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLandingPageTemplates } from "@/hooks/use-landing-page-templates"
import { LandingPageTemplate } from "@/lib/landing-page-templates"
import { useToast } from "@/hooks/use-toast"

interface TemplateFormData {
  template_id: string
  name: string
  description: string
  preview_image_url: string
  campaign_types: string[]
  category: string
  customizable_fields: string[]
  default_offer_title: string
  default_offer_description: string
  default_offer_highlights: string[]
  default_offer_value: string
  default_what_you_get: string
  default_how_it_works: string
  default_requirements: string
  default_support_info: string
  color_scheme: {
    primary?: string
    secondary?: string
    accent?: string
  }
  layout_config: {
    layout_type?: string
    sections?: string[]
  }
  is_default: boolean
  is_active: boolean
}

const DEFAULT_FORM_DATA: TemplateFormData = {
  template_id: '',
  name: '',
  description: '',
  preview_image_url: '',
  campaign_types: [],
  category: 'custom',
  customizable_fields: ['offer_title', 'offer_description', 'offer_highlights', 'offer_value'],
  default_offer_title: '',
  default_offer_description: '',
  default_offer_highlights: [],
  default_offer_value: '',
  default_what_you_get: '',
  default_how_it_works: '',
  default_requirements: '',
  default_support_info: '',
  color_scheme: {},
  layout_config: {},
  is_default: false,
  is_active: true
}

const CAMPAIGN_TYPE_OPTIONS = [
  { value: 'referral_onboarding', label: 'Referral Onboarding' },
  { value: 'product_promotion', label: 'Product Promotion' },
  { value: 'community_engagement', label: 'Community Engagement' },
  { value: 'vip_support', label: 'VIP Support' },
  { value: 'custom', label: 'Custom' }
]

const CATEGORY_OPTIONS = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'business', label: 'Business' },
  { value: 'tech', label: 'Technology' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'custom', label: 'Custom' }
]

const CUSTOMIZABLE_FIELD_OPTIONS = [
  'offer_title',
  'offer_description',
  'offer_highlights',
  'offer_value',
  'what_you_get',
  'how_it_works',
  'requirements',
  'support_info',
  'hero_image_url',
  'video_url',
  'product_images'
]

export function LandingPageTemplatesAdmin() {
  const { templates, loading, error, refresh } = useLandingPageTemplates()
  const { toast } = useToast()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<LandingPageTemplate | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA)
  const [isSaving, setIsSaving] = useState(false)

  const handleCreateNew = () => {
    setFormData(DEFAULT_FORM_DATA)
    setEditingTemplate(null)
    setIsCreateOpen(true)
  }

  const handleEdit = (template: LandingPageTemplate) => {
    setFormData({
      template_id: template.id,
      name: template.name,
      description: template.description,
      preview_image_url: template.preview_image || '',
      campaign_types: template.campaign_types,
      category: template.category || 'custom',
      customizable_fields: template.customizable_fields || [],
      default_offer_title: template.fields.offer_title,
      default_offer_description: template.fields.offer_description,
      default_offer_highlights: template.fields.offer_highlights,
      default_offer_value: template.fields.offer_value,
      default_what_you_get: template.fields.what_you_get,
      default_how_it_works: template.fields.how_it_works,
      default_requirements: template.fields.requirements,
      default_support_info: template.fields.support_info,
      color_scheme: template.color_scheme || {},
      layout_config: template.layout_config || {},
      is_default: template.is_default || false,
      is_active: true
    })
    setEditingTemplate(template)
    setIsEditOpen(true)
  }

  const handleSave = async () => {
    if (!formData.template_id || !formData.name || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      const method = editingTemplate ? 'PUT' : 'POST'
      const url = editingTemplate 
        ? `/api/landing-page-templates?template_id=${formData.template_id}`
        : '/api/landing-page-templates'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save template')
      }

      toast({
        title: "Success",
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`
      })

      setIsCreateOpen(false)
      setIsEditOpen(false)
      refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (template: LandingPageTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/landing-page-templates?template_id=${template.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete template')
      }

      toast({
        title: "Success",
        description: "Template deleted successfully"
      })

      refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: "destructive"
      })
    }
  }

  const handleToggleDefault = async (template: LandingPageTemplate) => {
    try {
      const response = await fetch(`/api/landing-page-templates?template_id=${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: !template.is_default })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update template')
      }

      toast({
        title: "Success",
        description: `Template ${template.is_default ? 'removed from' : 'set as'} default`
      })

      refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update template',
        variant: "destructive"
      })
    }
  }

  const handleFieldChange = (field: keyof TemplateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      default_offer_highlights: [...prev.default_offer_highlights, '']
    }))
  }

  const updateHighlight = (index: number, value: string) => {
    setFormData(prev => {
      const highlights = [...prev.default_offer_highlights]
      highlights[index] = value
      return { ...prev, default_offer_highlights: highlights }
    })
  }

  const removeHighlight = (index: number) => {
    setFormData(prev => {
      const highlights = [...prev.default_offer_highlights]
      highlights.splice(index, 1)
      return { ...prev, default_offer_highlights: highlights }
    })
  }

  const TemplateForm = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="template_id">Template ID *</Label>
            <Input
              id="template_id"
              placeholder="e.g., nike-sneaker-drop"
              value={formData.template_id}
              onChange={(e) => handleFieldChange('template_id', e.target.value)}
              disabled={!!editingTemplate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Nike Sneaker Drop"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe when and how this template should be used..."
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleFieldChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preview_image_url">Preview Image URL</Label>
            <Input
              id="preview_image_url"
              placeholder="/templates/template-preview.png"
              value={formData.preview_image_url}
              onChange={(e) => handleFieldChange('preview_image_url', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Campaign Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Campaign Compatibility</h3>
        <div className="space-y-2">
          <Label>Compatible Campaign Types</Label>
          <div className="grid grid-cols-2 gap-2">
            {CAMPAIGN_TYPE_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={option.value}
                  checked={formData.campaign_types.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFieldChange('campaign_types', [...formData.campaign_types, option.value])
                    } else {
                      handleFieldChange('campaign_types', formData.campaign_types.filter(t => t !== option.value))
                    }
                  }}
                />
                <Label htmlFor={option.value}>{option.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Default Content */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Default Content</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="default_offer_title">Default Offer Title</Label>
            <Input
              id="default_offer_title"
              placeholder="e.g., Exclusive Access to New Collection"
              value={formData.default_offer_title}
              onChange={(e) => handleFieldChange('default_offer_title', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="default_offer_description">Default Offer Description</Label>
            <Textarea
              id="default_offer_description"
              placeholder="Describe the default offer..."
              value={formData.default_offer_description}
              onChange={(e) => handleFieldChange('default_offer_description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Default Offer Highlights</Label>
            {formData.default_offer_highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Highlight point..."
                  value={highlight}
                  onChange={(e) => updateHighlight(index, e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeHighlight(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addHighlight}>
              <Plus className="h-4 w-4 mr-2" />
              Add Highlight
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_offer_value">Default Offer Value</Label>
            <Input
              id="default_offer_value"
              placeholder="e.g., Worth $99 - Yours FREE"
              value={formData.default_offer_value}
              onChange={(e) => handleFieldChange('default_offer_value', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Template Settings</h3>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.is_default}
            onCheckedChange={(checked) => handleFieldChange('is_default', checked)}
          />
          <Label>Set as default template for compatible campaign types</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
          />
          <Label>Template is active and available for use</Label>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <div>Loading templates...</div>
  }

  if (error) {
    return <div>Error loading templates: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landing Page Templates</h1>
          <p className="text-muted-foreground">
            Manage reusable landing page templates for campaigns
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Library</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? 's' : ''} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Campaign Types</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.category || 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.campaign_types.map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {template.is_default && (
                        <Badge variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleDefault(template)}
                        title={template.is_default ? "Remove as default" : "Set as default"}
                      >
                        {template.is_default ? (
                          <StarOff className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Landing Page Template</DialogTitle>
            <DialogDescription>
              Create a reusable template that can be applied to multiple campaigns
            </DialogDescription>
          </DialogHeader>
          <TemplateForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Landing Page Template</DialogTitle>
            <DialogDescription>
              Modify the template configuration and content
            </DialogDescription>
          </DialogHeader>
          <TemplateForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 