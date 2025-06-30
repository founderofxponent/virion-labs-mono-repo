"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ChevronLeft,
  ChevronRight,
  Save,
  ArrowLeft,
  FileText,
  Pin,
  Bot,
  MessageCircle,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { type CampaignTemplate } from "@/lib/campaign-templates"
import { useCampaignTemplateComplete } from "@/hooks/use-campaign-template-complete"
import { useClients } from "@/hooks/use-clients"
import { useBotCampaigns } from "@/hooks/use-bot-campaigns"
import { useOnboardingFields } from "@/hooks/use-onboarding-fields"
import { ManageQuestionsDialog, type OnboardingQuestion } from '../onboarding-questions-dialog';

// Import Tab Components
import { VitalsTab } from "./VitalsTab"
import { PlacementAndScheduleTab } from "./PlacementAndScheduleTab"
import { BotIdentityTab } from "./BotIdentityTab"
import { OnboardingFlowTab } from "./OnboardingFlowTab"
import { AccessAndModerationTab } from "./AccessAndModerationTab"
import { AdvancedTab } from "./AdvancedTab"

interface CampaignWizardProps {
  mode: "create" | "edit"
  campaignId?: string
}

interface CampaignFormData {
  // Tab 1: Vitals
  campaign_template: string
  client_id: string
  campaign_name: string
  description: string

  // Tab 2: Placement & Schedule
  guild_id: string
  channel_id: string
  campaign_start_date: string
  campaign_end_date: string

  // Tab 3: Bot Identity
  bot_name: string
  bot_personality: string
  bot_response_style: string
  brand_color: string
  brand_logo_url: string
  
  // Tab 4: Onboarding Flow
  welcome_message: string

  // Tab 5: Access & Moderation
  auto_role_assignment: boolean
  target_role_ids: string[]
  moderation_enabled: boolean
  rate_limit_per_user: number

  // Tab 6: Advanced
  referral_tracking_enabled: boolean
  webhook_url: string
  landing_page_data?: any
}

const TABS = [
  { id: 1, title: "Vitals", icon: FileText },
  { id: 2, title: "Placement & Schedule", icon: Pin },
  { id: 3, title: "Bot Identity", icon: Bot },
  { id: 4, title: "Onboarding Flow", icon: MessageCircle },
  { id: 5, title: "Access & Moderation", icon: ShieldCheck },
  { id: 6, title: "Advanced", icon: Zap },
];

export function CampaignWizard({ mode, campaignId }: CampaignWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [userExplicitlyChangedTemplate, setUserExplicitlyChangedTemplate] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [isManageQuestionsOpen, setIsManageQuestionsOpen] = useState(false);
  const [localOnboardingQuestions, setLocalOnboardingQuestions] = useState<OnboardingQuestion[]>([]);
  
  const { clients, loading: clientsLoading } = useClients()
  const { campaigns, loading: campaignsLoading } = useBotCampaigns()
  
  const { 
    template: templateWithLandingPage, 
    landingPage: inheritedLandingPageTemplate, 
  } = useCampaignTemplateComplete(selectedTemplateId)

  const {
    fields: onboardingFields,
    applyTemplate: applyOnboardingTemplate,
    createField,
    updateField,
    deleteField,
    fetchFields
  } = useOnboardingFields(campaignId)

  useEffect(() => {
    if (onboardingFields && onboardingFields.length > 0) {
      setLocalOnboardingQuestions(onboardingFields.map(f => ({...f})));
    }
  }, [onboardingFields]);

  const effectiveOnboardingFields = React.useMemo(() => {
    if (localOnboardingQuestions.length > 0) {
      return { fields: localOnboardingQuestions, source: 'local' as const, isTemplate: false }
    }
    if (onboardingFields && onboardingFields.length > 0) {
      return { fields: onboardingFields, source: 'database' as const, isTemplate: false }
    }
    if (mode === 'create' && templateWithLandingPage?.onboarding_fields && templateWithLandingPage.onboarding_fields.length > 0) {
      return {
        fields: templateWithLandingPage.onboarding_fields.map((field, index) => ({
          id: `template-${field.id}`, field_label: field.question, field_type: field.type, sort_order: index,
          is_required: field.required, is_enabled: true, field_options: [], validation_rules: {},
          field_key: field.question.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')
        })),
        source: 'template' as const, isTemplate: true
      }
    }
    return { fields: [], source: 'none' as const, isTemplate: false }
  }, [onboardingFields, mode, templateWithLandingPage, localOnboardingQuestions])

  const [formData, setFormData] = useState<CampaignFormData>({
    campaign_template: '', client_id: '', campaign_name: '', guild_id: '',
    channel_id: '', bot_name: 'Virion Bot', bot_personality: 'helpful',
    bot_response_style: 'friendly', brand_color: '#6366f1', brand_logo_url: '',
    description: '', welcome_message: '', referral_tracking_enabled: true,
    auto_role_assignment: false, target_role_ids: [], moderation_enabled: true,
    rate_limit_per_user: 5, webhook_url: '', campaign_start_date: '', campaign_end_date: '',
  })

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

  useEffect(() => {
    if (mode === 'create') {
      setInitialLoadComplete(true)
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'edit' && campaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === campaignId)
      if (campaign) {
        const campaignTemplate = (campaign as any).campaign_type || (campaign as any).template || 'custom'
        setFormData({
          campaign_template: campaignTemplate, client_id: campaign.client_id, campaign_name: campaign.name,
          guild_id: campaign.guild_id, channel_id: campaign.channel_id || '',
          bot_name: campaign.bot_name || campaign.display_name || 'Virion Bot',
          bot_personality: campaign.bot_personality || 'helpful',
          bot_response_style: campaign.bot_response_style || 'friendly',
          brand_color: campaign.brand_color || '#6366f1', brand_logo_url: campaign.brand_logo_url || '',
          description: campaign.description || '', welcome_message: campaign.welcome_message || '',
          referral_tracking_enabled: campaign.referral_tracking_enabled || false,
          auto_role_assignment: campaign.auto_role_assignment || false,
          target_role_ids: campaign.target_role_ids || [],
          moderation_enabled: campaign.moderation_enabled || true,
          rate_limit_per_user: campaign.rate_limit_per_user || 5,
          webhook_url: campaign.webhook_url || '',
          campaign_start_date: campaign.campaign_start_date ? new Date(campaign.campaign_start_date).toISOString().split('T')[0] : '',
          campaign_end_date: campaign.campaign_end_date ? new Date(campaign.campaign_end_date).toISOString().split('T')[0] : '',
        })
        setSelectedTemplateId(campaignTemplate)
        setInitialLoadComplete(true)
      }
    }
  }, [mode, campaignId, campaigns])

  useEffect(() => {
    if (templateWithLandingPage) {
      const shouldApplyTemplateOverrides = mode === 'create' || 
        (mode === 'edit' && userExplicitlyChangedTemplate && initialLoadComplete)

      if (shouldApplyTemplateOverrides) {
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
        
        if (mode === 'create' && templateWithLandingPage.onboarding_fields) {
            const templateQuestions = templateWithLandingPage.onboarding_fields.map((field, index) => ({
                id: `template-${field.id}`, field_label: field.question, field_type: field.type,
                sort_order: index, is_required: field.required, is_enabled: true,
                field_options: [], validation_rules: {},
                field_key: field.question.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')
            }));
            setLocalOnboardingQuestions(templateQuestions);
        }
        
        if (userExplicitlyChangedTemplate) {
          setUserExplicitlyChangedTemplate(false)
        }
      }
    }
  }, [templateWithLandingPage, mode, userExplicitlyChangedTemplate, initialLoadComplete])

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
    setUserExplicitlyChangedTemplate(true)
    
    if (mode === 'edit' && campaignId) {
      await applyTemplateOnboardingFields(templateId, campaignId)
    }
  }

  const handleSaveOnboardingQuestions = (questions: OnboardingQuestion[]) => {
    setLocalOnboardingQuestions(questions);
  };

  const applyTemplateOnboardingFields = async (templateId: string, targetCampaignId: string) => {
    if (!templateId || !targetCampaignId) return
    setApplyingTemplate(true)
    try {
      const result = await applyOnboardingTemplate(targetCampaignId, templateId)
      if (result.success) {
        toast.success('Template onboarding fields applied successfully')
        await fetchFields(targetCampaignId)
      } else {
        toast.error(`Failed to apply template: ${result.error || 'Unknown error'}`)
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
      case 1: return !!(formData.campaign_template && formData.client_id && formData.campaign_name);
      case 2: return !!(formData.guild_id);
      case 3: return !!(formData.bot_name);
      default: return true;
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, TABS.length))
    } else {
      toast.error('Please fill in all required fields on this tab before continuing.')
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSave = async () => {
    for (let i = 1; i <= TABS.length; i++) {
        if (!validateStep(i)) {
            setCurrentStep(i);
            toast.error(`Please complete all required fields on the "${TABS[i-1].title}" tab.`);
            return;
        }
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
        const targetCampaignId = mode === 'create' ? data.campaign.id : campaignId!;

        let questionsToSync = localOnboardingQuestions;
        if (questionsToSync.length === 0 && mode === 'create' && templateWithLandingPage?.onboarding_fields) {
            questionsToSync = effectiveOnboardingFields.fields.map(f => ({...f}));
        }

        if (questionsToSync.length > 0) {
          const existingIds = onboardingFields.map(f => f.id);
          const currentIds = questionsToSync.map(q => q.id).filter(id => id && !id.startsWith('template-'));
          const toDelete = existingIds.filter(id => !currentIds.includes(id));
          for (const id of toDelete) { await deleteField(id); }

          for (const [index, question] of questionsToSync.entries()) {
            const fieldData = { ...question, sort_order: index, field_key: question.field_key || question.field_label.toLowerCase().replace(/\s/g, '_'), };
            if (question.id && !question.id.startsWith('template-')) {
              await updateField({ id: question.id, ...fieldData });
            } else {
              const { id, ...newFieldData } = fieldData;
              await createField({ campaign_id: targetCampaignId, ...newFieldData });
            }
          }
        } else if (mode === 'edit' && onboardingFields.length > 0) {
          for (const field of onboardingFields) { await deleteField(field.id); }
        }
        
        if (formData.landing_page_data && Object.keys(formData.landing_page_data).length > 0) {
          await fetch('/api/campaign-landing-pages', {
            method: 'POST', // API route handles upsert logic
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_id: targetCampaignId,
              ...formData.landing_page_data
            })
          });
        }
        
        toast.success(`Campaign ${mode === 'create' ? 'created' : 'updated'} successfully!`)
        router.push('/bot-campaigns')
        router.refresh()
      } else {
        toast.error(`Failed to ${mode} campaign: ${data.error || 'An unexpected error occurred.'}`)
      }
    } catch (error) {
      console.error(`Error saving campaign:`, error)
      toast.error('An unexpected error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderContent = () => {
    switch (currentStep) {
      case 1: return <VitalsTab formData={formData} handleFieldChange={handleFieldChange} handleTemplateSelect={handleTemplateSelect} clients={clients} templates={templates} clientsLoading={clientsLoading} templatesLoading={templatesLoading} />;
      case 2: return <PlacementAndScheduleTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 3: return <BotIdentityTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 4: return <OnboardingFlowTab formData={formData} handleFieldChange={handleFieldChange} openManageQuestions={() => setIsManageQuestionsOpen(true)} questionCount={effectiveOnboardingFields.fields.length} />;
      case 5: return <AccessAndModerationTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 6: return <AdvancedTab formData={formData} handleFieldChange={handleFieldChange} inheritedLandingPageTemplate={inheritedLandingPageTemplate} mode={mode} campaignId={campaignId} />;
      default: return null;
    }
  }
  
  if (!initialLoadComplete || (mode === 'edit' && campaignsLoading)) {
    return <div>Loading campaign configuration...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Create New Campaign' : 'Edit Campaign'}
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <nav className="lg:col-span-1">
          <ol className="space-y-4">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setCurrentStep(tab.id)}
                  disabled={tab.id > currentStep && !validateStep(currentStep)}
                  className="w-full text-left"
                >
                  <div className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                      currentStep === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}>
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                        currentStep === tab.id
                          ? "bg-primary-foreground text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                      <tab.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{tab.title}</span>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{TABS[currentStep - 1].title}</CardTitle>
              <CardDescription>
                Step {currentStep} of {TABS.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSaving}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentStep < TABS.length ? (
              <Button onClick={handleNext} disabled={isSaving}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Campaign'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <ManageQuestionsDialog
        isOpen={isManageQuestionsOpen}
        onClose={() => setIsManageQuestionsOpen(false)}
        onSave={handleSaveOnboardingQuestions}
        initialQuestions={effectiveOnboardingFields.fields}
        isTemplate={effectiveOnboardingFields.isTemplate}
      />
    </>
  )
}
