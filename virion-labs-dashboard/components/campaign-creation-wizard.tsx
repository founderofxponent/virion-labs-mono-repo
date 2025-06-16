"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import RoleIdsInput from "@/components/role-ids-input"
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
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Bot, Zap, Users, HeadphonesIcon, Palette, Settings, MessageSquare, Play, Hash, Eye } from "lucide-react"
import { type CampaignTemplate } from "@/lib/campaign-templates"

interface CampaignCreationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (campaign: any) => void
  clients: Array<{ id: string; name: string }>
}

interface CreateCampaignData {
  // Step 1: Template Selection
  campaign_template: string
  
  // Step 2: Configuration
  client_id: string
  guild_id: string
  channel_id: string
  campaign_name: string
  prefix?: string
  description?: string
  bot_name?: string
  bot_personality?: string
  bot_response_style?: string
  brand_color?: string
  brand_logo_url?: string
  welcome_message?: string
  webhook_url?: string
  referral_link_id?: string
  influencer_id?: string
  referral_tracking_enabled?: boolean
  auto_role_assignment?: boolean
  target_role_id?: string
  target_role_ids?: string[]
  moderation_enabled?: boolean
  rate_limit_per_user?: number
  campaign_start_date?: string
  campaign_end_date?: string
}

export function CampaignCreationWizard({ open, onOpenChange, onSuccess, clients }: CampaignCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  const [formData, setFormData] = useState<CreateCampaignData>({
    campaign_template: '',
    client_id: '',
    guild_id: '',
    channel_id: '',
    campaign_name: '',
    target_role_ids: [],
  })

  // Load templates from API
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
      } finally {
        setTemplatesLoading(false)
      }
    }
    
    if (open) {
      loadTemplates()
    }
  }, [open])

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setFormData(prev => ({
        ...prev,
        campaign_template: templateId,
        // Pre-fill with template defaults
        prefix: template.bot_config.prefix,
        description: template.bot_config.description,
        bot_name: template.bot_config.bot_name,
        bot_personality: template.bot_config.bot_personality,
        bot_response_style: template.bot_config.bot_response_style,
        brand_color: template.bot_config.brand_color,
        welcome_message: template.bot_config.welcome_message,
        referral_tracking_enabled: template.bot_config.features.referral_tracking,
        auto_role_assignment: template.bot_config.features.auto_role,
        moderation_enabled: template.bot_config.features.moderation,
        rate_limit_per_user: 5,
      }))
    }
  }

  const handleFieldChange = (field: keyof CreateCampaignData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep === 1 && formData.campaign_template) {
      setCurrentStep(2)
    } else if (currentStep === 2 && formData.client_id && formData.guild_id && formData.campaign_name) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const handleCreate = async () => {
    if (!formData.client_id || !formData.guild_id || !formData.campaign_name || !formData.campaign_template) {
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/bot-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Apply template onboarding fields if the template has them
        if (selectedTemplate?.onboarding_fields && selectedTemplate.onboarding_fields.length > 0) {
          try {
            const templateResponse = await fetch('/api/campaign-onboarding-fields/apply-template', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaign_id: data.campaign.id,
                template_id: selectedTemplate.id
              })
            })
            
            if (templateResponse.ok) {
              const templateData = await templateResponse.json()
              console.log(`Applied template with ${templateData.fields?.length || 0} onboarding fields`)
            }
          } catch (templateError) {
            console.warn('Failed to apply template onboarding fields:', templateError)
          }
        }
        
        onSuccess(data.campaign)
        handleClose()
      } else {
        throw new Error(data.error || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setCurrentStep(1)
    setSelectedTemplate(null)
    setFormData({
      campaign_template: '',
      client_id: '',
      guild_id: '',
      channel_id: '',
      campaign_name: '',
    })
    onOpenChange(false)
  }

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'referral': return <Users className="h-6 w-6" />
      case 'promotion': return <Zap className="h-6 w-6" />
      case 'community': return <Bot className="h-6 w-6" />
      case 'support': return <HeadphonesIcon className="h-6 w-6" />
      case 'custom': return <Settings className="h-6 w-6" />
      default: return <Bot className="h-6 w-6" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'referral': return 'bg-blue-500'
      case 'promotion': return 'bg-green-500'
      case 'community': return 'bg-purple-500'
      case 'support': return 'bg-orange-500'
      case 'custom': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create Bot Campaign - Step {currentStep} of 3
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 
              ? "Choose a campaign template that matches your goals"
              : currentStep === 2
                ? "Configure your campaign details and bot behavior"
                : "Onboarding Preview"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Template Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.campaign_template === template.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'border-border'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg text-white ${getCategoryColor(template.category)}`}>
                          {getTemplateIcon(template.category)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {template.description}
                    </p>
                    
                    {/* Show template features */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Key Features:</h5>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(template.bot_config.features)
                          .filter(([_, enabled]) => enabled)
                          .map(([feature, _]) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature.replace('_', ' ')}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>

                    {/* Show sample auto-responses */}
                    {Object.keys(template.bot_config.auto_responses).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h5 className="text-sm font-medium">Sample Response:</h5>
                        <div className="bg-muted p-2 rounded text-xs">
                          "{Object.values(template.bot_config.auto_responses)[0]}"
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Campaign Configuration */}
        {currentStep === 2 && selectedTemplate && (
          <div className="space-y-6">
            {/* Template Preview */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg text-white ${getCategoryColor(selectedTemplate.category)}`}>
                    {getTemplateIcon(selectedTemplate.category)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Configuration Form */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Settings</h3>
                
                <div>
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => handleFieldChange('client_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="campaign_name">Campaign Name *</Label>
                  <Input
                    id="campaign_name"
                    value={formData.campaign_name}
                    onChange={(e) => handleFieldChange('campaign_name', e.target.value)}
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <Label htmlFor="guild_id">Discord Server ID *</Label>
                  <Input
                    id="guild_id"
                    value={formData.guild_id}
                    onChange={(e) => handleFieldChange('guild_id', e.target.value)}
                    placeholder="123456789012345678"
                  />
                </div>

                <div>
                  <Label htmlFor="channel_id">Private Channel ID (Optional)</Label>
                  <Input
                    id="channel_id"
                    value={formData.channel_id}
                    onChange={(e) => handleFieldChange('channel_id', e.target.value)}
                    placeholder="123456789012345678"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Discord channel where only referral users can interact with the bot
                  </p>
                </div>
              </div>

              {/* Right Column - Bot Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Bot Configuration
                </h3>

                <div>
                  <Label htmlFor="bot_name">Bot Display Name</Label>
                  <Input
                    id="bot_name"
                    value={formData.bot_name}
                    onChange={(e) => handleFieldChange('bot_name', e.target.value)}
                    placeholder={selectedTemplate.bot_config.bot_name}
                  />
                </div>

                <div>
                  <Label htmlFor="prefix">Bot Prefix</Label>
                  <Input
                    id="prefix"
                    value={formData.prefix}
                    onChange={(e) => handleFieldChange('prefix', e.target.value)}
                    placeholder={selectedTemplate.bot_config.prefix}
                  />
                </div>

                <div>
                  <Label htmlFor="brand_color">Brand Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="brand_color"
                      value={formData.brand_color}
                      onChange={(e) => handleFieldChange('brand_color', e.target.value)}
                      placeholder={selectedTemplate.bot_config.brand_color}
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: formData.brand_color || selectedTemplate.bot_config.brand_color }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bot_personality">Bot Personality</Label>
                  <Select
                    value={formData.bot_personality}
                    onValueChange={(value) => handleFieldChange('bot_personality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedTemplate.bot_config.bot_personality} />
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

                <div>
                  <Label htmlFor="bot_response_style">Bot Response Style</Label>
                  <Select
                    value={formData.bot_response_style}
                    onValueChange={(value) => handleFieldChange('bot_response_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedTemplate.bot_config.bot_response_style} />
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

            {/* Advanced Settings */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Settings</h3>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder={selectedTemplate.bot_config.description}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Textarea
                  id="welcome_message"
                  value={formData.welcome_message}
                  onChange={(e) => handleFieldChange('welcome_message', e.target.value)}
                  placeholder={selectedTemplate.bot_config.welcome_message}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
                  <Input
                    id="webhook_url"
                    value={formData.webhook_url}
                    onChange={(e) => handleFieldChange('webhook_url', e.target.value)}
                    placeholder="https://your-api.com/webhook"
                  />
                </div>

                <div>
                  <Label htmlFor="rate_limit">Rate Limit (per user)</Label>
                  <Input
                    type="number"
                    id="rate_limit"
                    value={formData.rate_limit_per_user}
                    onChange={(e) => handleFieldChange('rate_limit_per_user', parseInt(e.target.value))}
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <h4 className="text-md font-medium mb-3">Bot Features</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="referral_tracking">Referral Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable tracking of referral codes and conversions
                      </p>
                    </div>
                    <Switch
                      id="referral_tracking"
                      checked={formData.referral_tracking_enabled || false}
                      onCheckedChange={(checked) => handleFieldChange('referral_tracking_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto_role">Auto Role Assignment</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign roles to verified members
                      </p>
                    </div>
                  <Switch
                      id="auto_role"
                      checked={formData.auto_role_assignment || false}
                      onCheckedChange={(checked) => handleFieldChange('auto_role_assignment', checked)}
                    />
                  </div>

                  {formData.auto_role_assignment && (
                    <div className="space-y-0.5">
                      <Label htmlFor="role_ids">Role IDs</Label>
                      <RoleIdsInput
                        id="role_ids"
                        value={formData.target_role_ids || []}
                        onChange={(ids) => handleFieldChange('target_role_ids', ids)}
                        placeholder="12345,67890"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="moderation">Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable automatic moderation and spam protection
                      </p>
                    </div>
                    <Switch
                      id="moderation"
                      checked={formData.moderation_enabled || false}
                      onCheckedChange={(checked) => handleFieldChange('moderation_enabled', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Onboarding Preview */}
        {currentStep === 3 && selectedTemplate && (
          <div className="space-y-6">
            {/* Campaign Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Campaign Preview
                </CardTitle>
                <CardDescription>
                  Review your campaign settings and onboarding flow before creating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Campaign Name</Label>
                    <p className="text-sm text-muted-foreground">{formData.campaign_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Template</Label>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Bot Name</Label>
                    <p className="text-sm text-muted-foreground">{formData.bot_name || selectedTemplate.bot_config.bot_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Discord Server ID</Label>
                    <p className="text-sm text-muted-foreground">{formData.guild_id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Preview */}
            {selectedTemplate.onboarding_fields && selectedTemplate.onboarding_fields.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Onboarding Flow Preview
                  </CardTitle>
                  <CardDescription>
                    This is how users will experience the onboarding process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bot Commands Preview */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Available Commands</h4>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4" />
                        <code className="bg-background px-2 py-1 rounded text-xs">{formData.prefix || selectedTemplate.bot_config.prefix}start</code>
                        <span className="text-muted-foreground">- Begin onboarding process</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4" />
                        <code className="bg-background px-2 py-1 rounded text-xs">{formData.prefix || selectedTemplate.bot_config.prefix}onboard</code>
                        <span className="text-muted-foreground">- Start onboarding (alternative)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4" />
                        <code className="bg-background px-2 py-1 rounded text-xs">{formData.prefix || selectedTemplate.bot_config.prefix}help</code>
                        <span className="text-muted-foreground">- Get help and commands list</span>
                      </div>
                    </div>
                  </div>

                  {/* Onboarding Questions Preview */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Onboarding Questions ({selectedTemplate.onboarding_fields.length} questions)</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedTemplate.onboarding_fields.map((field, index) => (
                        <div key={field.id} className="border-l-2 border-primary/20 pl-4 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 bg-background p-3 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">Question {index + 1}</span>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">{field.type}</Badge>
                              </div>
                              <p className="text-sm">{field.question}</p>
                              {field.description && (
                                <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                              )}
                              {field.placeholder && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-medium">Example:</span> {field.placeholder}
                                </p>
                              )}
                              {field.options && field.options.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Options:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {field.options.map((option, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {option}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Collection Summary */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Data Collection Summary</h4>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Questions:</span>
                          <span className="ml-2">{selectedTemplate.onboarding_fields.length}</span>
                        </div>
                        <div>
                          <span className="font-medium">Required Questions:</span>
                          <span className="ml-2">{selectedTemplate.onboarding_fields.filter(f => f.required).length}</span>
                        </div>
                        <div>
                          <span className="font-medium">DM Collection:</span>
                          <span className="ml-2">{selectedTemplate.onboarding_fields.filter(f => f.discord_integration.collect_in_dm).length}</span>
                        </div>
                        <div>
                          <span className="font-medium">Public Display:</span>
                          <span className="ml-2">{selectedTemplate.onboarding_fields.filter(f => f.discord_integration.show_in_embed).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Welcome Message Preview */}
                  {(formData.welcome_message || selectedTemplate.bot_config.welcome_message) && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Welcome Message</h4>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 bg-background p-3 rounded-lg border">
                          <p className="text-sm">
                            {formData.welcome_message || selectedTemplate.bot_config.welcome_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    No Onboarding Configured
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This template doesn't include onboarding questions. Users can still interact with the bot using available commands.
                  </p>
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-semibold">Available Commands</h4>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4" />
                        <code className="bg-background px-2 py-1 rounded text-xs">{formData.prefix || selectedTemplate.bot_config.prefix}help</code>
                        <span className="text-muted-foreground">- Get help and commands list</span>
                      </div>
                      {Object.entries(selectedTemplate.bot_config.auto_responses).map(([trigger, response], idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Hash className="h-4 w-4" />
                          <code className="bg-background px-2 py-1 rounded text-xs">{trigger}</code>
                          <span className="text-muted-foreground">- {response.substring(0, 50)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final Confirmation */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Ready to Create Campaign
                </CardTitle>
                <CardDescription>
                  Review the information above and click "Create Campaign" to deploy your bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>✓ Template selected and configured</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>✓ Bot settings configured</span>
                </div>
                {selectedTemplate.onboarding_fields && selectedTemplate.onboarding_fields.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>✓ Onboarding flow ready with {selectedTemplate.onboarding_fields.length} questions</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {(currentStep === 2 || currentStep === 3) && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep === 1 ? (
              <Button 
                onClick={handleNext}
                disabled={!formData.campaign_template}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : currentStep === 2 ? (
              <Button 
                onClick={handleNext}
                disabled={!formData.client_id || !formData.guild_id || !formData.campaign_name}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreate}
                disabled={!formData.client_id || !formData.guild_id || !formData.campaign_name || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 