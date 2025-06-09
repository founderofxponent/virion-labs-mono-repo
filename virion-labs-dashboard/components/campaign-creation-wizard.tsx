"use client"

import { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Bot, Zap, Users, HeadphonesIcon, Palette, Settings } from "lucide-react"
import { getAllCampaignTemplates, getCampaignTemplate, type CampaignTemplate } from "@/lib/campaign-templates"

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
  moderation_enabled?: boolean
  rate_limit_per_user?: number
  campaign_start_date?: string
  campaign_end_date?: string
}

export function CampaignCreationWizard({ open, onOpenChange, onSuccess, clients }: CampaignCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null)

  const [formData, setFormData] = useState<CreateCampaignData>({
    campaign_template: '',
    client_id: '',
    guild_id: '',
    channel_id: '',
    campaign_name: '',
  })

  const templates = getAllCampaignTemplates()

  const handleTemplateSelect = (templateId: string) => {
    const template = getCampaignTemplate(templateId)
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
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
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
            Create Bot Campaign - Step {currentStep} of 2
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 
              ? "Choose a campaign template that matches your goals"
              : "Configure your campaign details and bot behavior"
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
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep === 2 && (
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