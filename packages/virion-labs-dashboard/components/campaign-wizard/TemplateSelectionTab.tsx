import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Sparkles, Settings, FileText } from "lucide-react"
import { CampaignTemplate } from "@/schemas/campaign"

interface TemplateSelectionTabProps {
  templates: CampaignTemplate[]
  templatesLoading: boolean
  onTemplateSelect: (templateId: string | null) => void
  onSkipTemplate: () => void
}

interface TemplatePreview {
  botName?: string
  botPersonality?: string
  questionsCount?: number
  hasLandingPage?: boolean
  features?: string[]
}

export function TemplateSelectionTab({
  templates,
  templatesLoading,
  onTemplateSelect,
  onSkipTemplate,
}: TemplateSelectionTabProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, TemplatePreview>>({})

  const loadTemplatePreview = async (templateId: string) => {
    if (previews[templateId] || loadingPreview === templateId) return

    setLoadingPreview(templateId)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/operations/campaign-template/get/${templateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const template = data
        const config = template?.template_config || template
        
        setPreviews(prev => ({
          ...prev,
          [templateId]: {
            botName: config?.bot_config?.bot_name,
            botPersonality: config?.bot_config?.bot_personality,
            questionsCount: config?.onboarding_fields?.length || 0,
            hasLandingPage: !!(config?.landing_page_config || template?.landing_page_template),
            features: [
              config?.bot_config?.features?.referral_tracking && "Referral Tracking",
              config?.bot_config?.features?.auto_role && "Auto Role Assignment",
              config?.bot_config?.features?.moderation && "Moderation"
            ].filter(Boolean)
          }
        }))
      }
    } catch (error) {
      console.error('Error loading template preview:', error)
    } finally {
      setLoadingPreview(null)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    loadTemplatePreview(templateId)
  }

  const handleConfirmSelection = () => {
    onTemplateSelect(selectedTemplateId)
  }

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Starting Point</h2>
        <p className="text-muted-foreground">
          Templates will populate initial values for bot settings, onboarding questions, and landing pages.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Start from Scratch Option */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedTemplateId === null ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
          }`}
          onClick={() => setSelectedTemplateId(null)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle className="text-lg">Start from Scratch</CardTitle>
            </div>
            <CardDescription>
              Create a custom campaign with default settings
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Template Options */}
        {templates.map((template) => {
          const templateId = template.documentId || template.id
          const preview = previews[templateId]
          const isSelected = selectedTemplateId === templateId
          const isLoadingPreview = loadingPreview === templateId

          return (
            <Card 
              key={templateId}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => handleTemplateSelect(templateId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    {template.category || 'Template'}
                  </Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>

              {/* Template Preview */}
              {isSelected && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      This template will populate:
                    </h4>
                    
                    {isLoadingPreview ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading preview...
                      </div>
                    ) : preview ? (
                      <div className="space-y-3">
                        <div className="grid gap-2 text-sm">
                          {preview.botName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bot Name:</span>
                              <span className="font-medium">{preview.botName}</span>
                            </div>
                          )}
                          {preview.botPersonality && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bot Style:</span>
                              <span className="font-medium capitalize">{preview.botPersonality}</span>
                            </div>
                          )}
                          {preview.questionsCount !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Onboarding Questions:</span>
                              <span className="font-medium">{preview.questionsCount} questions</span>
                            </div>
                          )}
                          {preview.hasLandingPage && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Landing Page:</span>
                              <span className="font-medium">Included</span>
                            </div>
                          )}
                          {preview.features && preview.features.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-muted-foreground">Features:</span>
                              <div className="flex flex-wrap gap-1">
                                {preview.features.map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Use This Template Button */}
                        <div className="pt-3 border-t">
                          <Button 
                            onClick={handleConfirmSelection}
                            className="w-full"
                          >
                            Use This Template
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Click to load preview...
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <div /> {/* Spacer */}
        <div className="space-x-2">
          {selectedTemplateId === null && (
            <Button onClick={onSkipTemplate}>
              Continue without Template
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}