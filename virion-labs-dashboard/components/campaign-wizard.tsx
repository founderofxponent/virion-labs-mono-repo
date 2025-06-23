"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  ChevronLeft, 
  ChevronRight, 
  Bot, 
  Zap, 
  Users, 
  HeadphonesIcon, 
  Palette, 
  Settings, 
  Save,
  ArrowLeft,
  CheckCircle,
  Info,
  MessageSquare,
  Plus,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { type CampaignTemplate } from "@/lib/campaign-templates"
import { LandingPageConfig } from "@/components/landing-page-config"
import { useCampaignTemplateComplete } from "@/hooks/use-campaign-template-complete"
import { useClients } from "@/hooks/use-clients"
import { useBotCampaigns } from "@/hooks/use-bot-campaigns"
import { useOnboardingFields } from "@/hooks/use-onboarding-fields"
import RoleIdsInput from "@/components/role-ids-input"

interface CampaignWizardProps {
  mode: "create" | "edit"
  campaignId?: string
}

interface CampaignFormData {
  // Step 1: Template & Basic Info
  campaign_template: string
  client_id: string
  campaign_name: string
  guild_id: string
  channel_id: string
  
  // Step 2: Bot Configuration
  bot_name: string
  bot_personality: string
  bot_response_style: string
  brand_color: string
  brand_logo_url: string
  description: string
  welcome_message: string
  
  // Step 3: Features & Settings
  referral_tracking_enabled: boolean
  auto_role_assignment: boolean
  target_role_ids: string[]
  moderation_enabled: boolean
  rate_limit_per_user: number
  webhook_url: string
  campaign_start_date: string
  campaign_end_date: string
  
  // Step 4: Landing Page
  landing_page_data?: any
}

const STEP_TITLES = [
  "Template & Basic Info",
  "Bot Configuration", 
  "Features & Settings",
  "Landing Page"
]

const STEP_DESCRIPTIONS = [
  "Choose your campaign template and enter basic details",
  "Configure your bot's personality and appearance",
  "Set up advanced features and onboarding questions",
  "Optional: Configure your referral landing page"
]

export function CampaignWizard({ mode, campaignId }: CampaignWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  
  // Hooks
  const { clients, loading: clientsLoading } = useClients()
  const { campaigns, loading: campaignsLoading } = useBotCampaigns()
  
  // Template loading hook
  const { 
    template: templateWithLandingPage, 
    landingPage: inheritedLandingPageTemplate, 
    loading: landingPageTemplateLoading 
  } = useCampaignTemplateComplete(selectedTemplateId)

  // Onboarding fields hook
  const {
    fields: onboardingFields,
    loading: onboardingFieldsLoading,
    applyTemplate: applyOnboardingTemplate,
    fetchFields
  } = useOnboardingFields(campaignId)

  const [formData, setFormData] = useState<CampaignFormData>({
    campaign_template: '',
    client_id: '',
    campaign_name: '',
    guild_id: '',
    channel_id: '',
    bot_name: 'Virion Bot',
    bot_personality: 'helpful',
    bot_response_style: 'friendly',
    brand_color: '#6366f1',
    brand_logo_url: '',
    description: '',
    welcome_message: '',
    referral_tracking_enabled: true,
    auto_role_assignment: false,
    target_role_ids: [],
    moderation_enabled: true,
    rate_limit_per_user: 5,
    webhook_url: '',
    campaign_start_date: '',
    campaign_end_date: '',
  })

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true)
        const response = await fetch('/api/campaign-templates')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates || [])
        }
      } catch (error) {
        console.error('Error loading templates:', error)
        toast.error('Failed to load campaign templates')
      } finally {
        setTemplatesLoading(false)
      }
    }
    loadTemplates()
  }, [])

  // Load existing campaign data for edit mode
  useEffect(() => {
    if (mode === 'edit' && campaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === campaignId)
      if (campaign) {
        // Use campaign_type (the correct field) instead of template
        const campaignTemplate = (campaign as any).campaign_type || (campaign as any).template || 'custom'
        
        setFormData({
          campaign_template: campaignTemplate,
          client_id: campaign.client_id,
          campaign_name: campaign.name,
          guild_id: campaign.guild_id,
          channel_id: campaign.channel_id || '',
          bot_name: campaign.display_name || 'Virion Bot',
          bot_personality: (campaign as any).bot_personality || 'helpful',
          bot_response_style: (campaign as any).bot_response_style || 'friendly',
          brand_color: (campaign as any).brand_color || '#6366f1',
          brand_logo_url: (campaign as any).brand_logo_url || '',
          description: campaign.description || '',
          welcome_message: (campaign as any).welcome_message || '',
          referral_tracking_enabled: (campaign as any).referral_tracking_enabled || false,
          auto_role_assignment: (campaign as any).auto_role_assignment || false,
          target_role_ids: (campaign as any).target_role_ids || [],
          moderation_enabled: (campaign as any).moderation_enabled || true,
          rate_limit_per_user: (campaign as any).rate_limit_per_user || 5,
          webhook_url: (campaign as any).webhook_url || '',
          campaign_start_date: (campaign as any).campaign_start_date || '',
          campaign_end_date: (campaign as any).campaign_end_date || '',
        })
        
        // Set the selected template ID for the template selection hook
        setSelectedTemplateId(campaignTemplate)
      }
    }
  }, [mode, campaignId, campaigns])

  // Handle template selection and auto-fill
  useEffect(() => {
    if (templateWithLandingPage) {
      setFormData(prev => ({
        ...prev,
        description: templateWithLandingPage.bot_config.description,
        bot_name: templateWithLandingPage.bot_config.bot_name,
        bot_personality: templateWithLandingPage.bot_config.bot_personality,
        bot_response_style: templateWithLandingPage.bot_config.bot_response_style,
        brand_color: templateWithLandingPage.bot_config.brand_color,
        welcome_message: templateWithLandingPage.bot_config.welcome_message,
        referral_tracking_enabled: templateWithLandingPage.bot_config.features.referral_tracking,
        auto_role_assignment: templateWithLandingPage.bot_config.features.auto_role,
        moderation_enabled: templateWithLandingPage.bot_config.features.moderation,
      }))
    }
  }, [templateWithLandingPage])

  // Handle inherited landing page template data
  useEffect(() => {
    if (inheritedLandingPageTemplate && mode === 'create') {
      const landingPageData = {
        landing_page_template_id: inheritedLandingPageTemplate.id,
        offer_title: inheritedLandingPageTemplate.fields.offer_title,
        offer_description: inheritedLandingPageTemplate.fields.offer_description,
        offer_highlights: inheritedLandingPageTemplate.fields.offer_highlights,
        offer_value: inheritedLandingPageTemplate.fields.offer_value,
        what_you_get: inheritedLandingPageTemplate.fields.what_you_get,
        how_it_works: inheritedLandingPageTemplate.fields.how_it_works,
        requirements: inheritedLandingPageTemplate.fields.requirements,
        support_info: inheritedLandingPageTemplate.fields.support_info,
      }
      setFormData(prev => ({ ...prev, landing_page_data: landingPageData }))
    }
  }, [inheritedLandingPageTemplate, mode])

  const handleFieldChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTemplateSelect = async (templateId: string) => {
    setFormData(prev => ({ ...prev, campaign_template: templateId }))
    setSelectedTemplateId(templateId)
    
    // Apply template onboarding fields in edit mode
    if (mode === 'edit' && campaignId) {
      await applyTemplateOnboardingFields(templateId, campaignId)
    }
  }

  // Apply template onboarding fields
  const applyTemplateOnboardingFields = async (templateId: string, targetCampaignId: string) => {
    if (!templateId || !targetCampaignId) return
    
    setApplyingTemplate(true)
    try {
      const result = await applyOnboardingTemplate(targetCampaignId, templateId)
      if (result.success) {
        toast.success('Template onboarding fields applied successfully')
        // Refresh onboarding fields
        await fetchFields(targetCampaignId)
      } else {
        // Check if template has no onboarding fields
        if (result.error?.includes('no onboarding fields')) {
          toast.success('Template applied - no onboarding fields to update')
        } else {
          toast.error(`Failed to apply template: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Error applying template onboarding fields:', error)
      toast.error('Failed to apply template onboarding fields')
    } finally {
      setApplyingTemplate(false)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.campaign_template && formData.client_id && formData.campaign_name && formData.guild_id)
      case 2:
        return !!(formData.bot_name)
      case 3:
        return true // All fields in step 3 are optional or have defaults
      case 4:
        return true // Landing page is optional
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    } else {
      toast.error('Please fill in all required fields before continuing')
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSave = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast.error('Please complete all required fields')
      return
    }

    setIsSaving(true)
    try {
      const url = mode === 'create' ? '/api/bot-campaigns' : `/api/bot-campaigns/${campaignId}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Handle template onboarding fields for both create and edit modes
        if (templateWithLandingPage?.onboarding_fields && templateWithLandingPage.onboarding_fields.length > 0) {
          try {
            const targetCampaignId = mode === 'create' ? data.campaign.id : campaignId
            await fetch('/api/campaign-onboarding-fields/apply-template', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaign_id: targetCampaignId,
                template_id: templateWithLandingPage.id
              })
            })
          } catch (templateError) {
            console.warn('Failed to apply template onboarding fields:', templateError)
          }
        }
        
        // Handle landing page data
        if (formData.landing_page_data && Object.keys(formData.landing_page_data).length > 0) {
          try {
            // Use the same endpoint for both create and edit - the API handles upserts
            await fetch('/api/campaign-landing-pages', {
              method: mode === 'create' ? 'POST' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaign_id: mode === 'create' ? data.campaign.id : campaignId,
                ...formData.landing_page_data
              })
            })
          } catch (landingPageError) {
            console.warn('Failed to save landing page configuration:', landingPageError)
          }
        }
        
        toast.success(`Campaign ${mode === 'create' ? 'created' : 'updated'} successfully`)
        router.push('/bot-campaigns')
      } else {
        throw new Error(data.error || `Failed to ${mode} campaign`)
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} campaign:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${mode} campaign`)
    } finally {
      setIsSaving(false)
    }
  }

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'referral': return <Users className="h-5 w-5" />
      case 'promotion': return <Zap className="h-5 w-5" />
      case 'community': return <Bot className="h-5 w-5" />
      case 'support': return <HeadphonesIcon className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'referral': return 'bg-blue-500'
      case 'promotion': return 'bg-green-500'
      case 'community': return 'bg-purple-500'
      case 'support': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const progressPercentage = (currentStep / 4) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/bot-campaigns')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {mode === 'create' ? 'Create' : 'Edit'} Bot Campaign
            </h1>
            <p className="text-muted-foreground">
              {STEP_DESCRIPTIONS[currentStep - 1]}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          Step {currentStep} of 4
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          {STEP_TITLES.map((title, index) => (
            <span
              key={index}
              className={`${
                index + 1 === currentStep 
                  ? 'text-primary font-medium' 
                  : index + 1 < currentStep 
                    ? 'text-green-600' 
                    : ''
              }`}
            >
              {index + 1 < currentStep && <CheckCircle className="inline h-4 w-4 mr-1" />}
              {title}
            </span>
          ))}
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="min-h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <Info className="h-5 w-5" />}
            {currentStep === 2 && <Palette className="h-5 w-5" />}
            {currentStep === 3 && <Settings className="h-5 w-5" />}
            {currentStep === 4 && <Bot className="h-5 w-5" />}
            {STEP_TITLES[currentStep - 1]}
          </CardTitle>
          <CardDescription>
            {STEP_DESCRIPTIONS[currentStep - 1]}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Template & Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Campaign Template</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose a template that matches your campaign goals
                  </p>
                </div>
                
                {templatesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-16 bg-muted rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          formData.campaign_template === template.id 
                            ? 'ring-2 ring-primary border-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg text-white ${getCategoryColor(template.category)}`}>
                              {getTemplateIcon(template.category)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{template.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {template.category}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Basic Information</Label>
                  <p className="text-sm text-muted-foreground">
                    Essential details for your campaign
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select
                      value={formData.client_id || ""}
                      onValueChange={(value) => handleFieldChange('client_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsLoading ? (
                          <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                        ) : (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign_name">Campaign Name *</Label>
                    <Input
                      id="campaign_name"
                      value={formData.campaign_name}
                      onChange={(e) => handleFieldChange('campaign_name', e.target.value)}
                      placeholder="Enter campaign name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guild_id">Discord Server ID *</Label>
                    <Input
                      id="guild_id"
                      value={formData.guild_id}
                      onChange={(e) => handleFieldChange('guild_id', e.target.value)}
                      placeholder="123456789012345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="channel_id">Private Channel ID</Label>
                    <Input
                      id="channel_id"
                      value={formData.channel_id}
                      onChange={(e) => handleFieldChange('channel_id', e.target.value)}
                      placeholder="123456789012345678 (optional)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Channel where only verified users can interact with the bot
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Bot Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Bot Identity */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Bot Identity</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure how your bot appears and behaves
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot_name">Bot Display Name *</Label>
                    <Input
                      id="bot_name"
                      value={formData.bot_name}
                      onChange={(e) => handleFieldChange('bot_name', e.target.value)}
                      placeholder="Virion Bot"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bot_personality">Bot Personality</Label>
                    <Select
                      value={formData.bot_personality || ""}
                      onValueChange={(value) => handleFieldChange('bot_personality', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select personality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="helpful">Helpful</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bot_response_style">Response Style</Label>
                    <Select
                      value={formData.bot_response_style || ""}
                      onValueChange={(value) => handleFieldChange('bot_response_style', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select response style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Branding */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Branding</Label>
                  <p className="text-sm text-muted-foreground">
                    Customize the visual appearance of your bot
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand_color">Brand Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="brand_color"
                        value={formData.brand_color}
                        onChange={(e) => handleFieldChange('brand_color', e.target.value)}
                        placeholder="#6366f1"
                      />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: formData.brand_color }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand_logo_url">Brand Logo URL</Label>
                    <Input
                      id="brand_logo_url"
                      value={formData.brand_logo_url}
                      onChange={(e) => handleFieldChange('brand_logo_url', e.target.value)}
                      placeholder="https://example.com/logo.png (optional)"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Messages */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Bot Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Customize the messages your bot will send
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Bot Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder="Describe what this bot does..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="welcome_message">Welcome Message</Label>
                    <Textarea
                      id="welcome_message"
                      value={formData.welcome_message}
                      onChange={(e) => handleFieldChange('welcome_message', e.target.value)}
                      placeholder="Welcome message for new members..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Features & Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Core Features */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Core Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable key bot functionality
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="referral_tracking">Referral Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Track referral codes and conversions
                      </p>
                    </div>
                    <Switch
                      id="referral_tracking"
                      checked={formData.referral_tracking_enabled}
                      onCheckedChange={(checked) => handleFieldChange('referral_tracking_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto_role">Auto Role Assignment</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign roles to verified members
                      </p>
                    </div>
                    <Switch
                      id="auto_role"
                      checked={formData.auto_role_assignment}
                      onCheckedChange={(checked) => handleFieldChange('auto_role_assignment', checked)}
                    />
                  </div>

                  {formData.auto_role_assignment && (
                    <div className="ml-4 space-y-2">
                      <Label htmlFor="role_ids">Role IDs (comma separated)</Label>
                      <RoleIdsInput
                        id="role_ids"
                        value={formData.target_role_ids}
                        onChange={(value) => handleFieldChange('target_role_ids', value)}
                        placeholder="12345,67890"
                      />
                      <p className="text-xs text-muted-foreground">
                        Discord role IDs to assign to verified users
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="moderation">Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable automatic moderation and spam protection
                      </p>
                    </div>
                    <Switch
                      id="moderation"
                      checked={formData.moderation_enabled}
                      onCheckedChange={(checked) => handleFieldChange('moderation_enabled', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Advanced Settings */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Advanced Settings</Label>
                  <p className="text-sm text-muted-foreground">
                    Fine-tune your bot's behavior and limits
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate_limit">Rate Limit (per user)</Label>
                    <Input
                      type="number"
                      id="rate_limit"
                      value={formData.rate_limit_per_user}
                      onChange={(e) => handleFieldChange('rate_limit_per_user', parseInt(e.target.value) || 5)}
                      placeholder="5"
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum commands per user per minute
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook_url">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      value={formData.webhook_url}
                      onChange={(e) => handleFieldChange('webhook_url', e.target.value)}
                      placeholder="https://your-api.com/webhook (optional)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Receive notifications about bot events
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Campaign Duration */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Campaign Duration</Label>
                  <p className="text-sm text-muted-foreground">
                    Set start and end dates for your campaign (optional)
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      type="datetime-local"
                      id="start_date"
                      value={formData.campaign_start_date}
                      onChange={(e) => handleFieldChange('campaign_start_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      type="datetime-local"
                      id="end_date"
                      value={formData.campaign_end_date}
                      onChange={(e) => handleFieldChange('campaign_end_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Onboarding Questions */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Onboarding Questions</Label>
                  <p className="text-sm text-muted-foreground">
                    Questions that users will answer when joining the Discord server
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 space-y-3">
                  {onboardingFieldsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading onboarding questions...</div>
                  ) : onboardingFields && onboardingFields.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {onboardingFields.length} question{onboardingFields.length !== 1 ? 's' : ''} configured
                        </span>
                        <Badge variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        {onboardingFields.slice(0, 3).map((field, index) => (
                          <div key={field.id} className="text-sm text-muted-foreground">
                            {index + 1}. {field.field_label}
                          </div>
                        ))}
                        {onboardingFields.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            ...and {onboardingFields.length - 3} more question{onboardingFields.length - 3 !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No onboarding questions configured yet
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {templateWithLandingPage?.onboarding_fields && templateWithLandingPage.onboarding_fields.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => campaignId && applyTemplateOnboardingFields(selectedTemplateId!, campaignId)}
                        disabled={applyingTemplate || !campaignId}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {applyingTemplate ? 'Applying...' : `Apply Template Questions (${templateWithLandingPage.onboarding_fields.length})`}
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (campaignId) {
                          window.open(`/onboarding-fields?campaign=${campaignId}`, '_blank')
                        }
                      }}
                      disabled={!campaignId}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Manage Questions
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Landing Page */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Landing Page Configuration</Label>
                <p className="text-sm text-muted-foreground">
                  Configure the landing page that users will see when they visit your referral links (optional)
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <LandingPageConfig
                    campaignId={mode === 'edit' && campaignId ? campaignId : null}
                    campaignType={templates.find(t => t.id === formData.campaign_template)?.campaign_type || formData.campaign_template || 'custom'}
                    initialData={formData.landing_page_data}
                    onChange={(data) => {
                      handleFieldChange('landing_page_data', data)
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/bot-campaigns')}
          >
            Cancel
          </Button>
          
          {currentStep < 4 ? (
            <Button 
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={!validateStep(1) || !validateStep(2) || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : `${mode === 'create' ? 'Create' : 'Update'} Campaign`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 