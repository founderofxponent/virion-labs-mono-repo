"use client"

import React, { useState, useEffect, useRef } from "react"
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
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type CampaignTemplate } from "@/lib/campaign-templates"
import { useCampaignTemplateCompleteAPI } from "@/hooks/use-campaign-template-complete-api"
import { useClients } from "@/hooks/use-clients"
import { useBotCampaignsAPI } from "@/hooks/use-bot-campaigns-api"
import { useOnboardingFieldsAPI, type OnboardingField, type UpdateOnboardingFieldData } from "@/hooks/use-onboarding-fields-api"
import { useCampaignLandingPagesApi } from "@/hooks/use-campaign-landing-pages-api"
import { OnboardingQuestionsForm } from "./OnboardingQuestionsForm"

// Import Tab Components
import { VitalsTab } from "./VitalsTab"
import { PlacementAndScheduleTab } from "./PlacementAndScheduleTab"
import { BotIdentityTab } from "./BotIdentityTab"
import { OnboardingFlowTab } from "./OnboardingFlowTab"
import { AccessAndModerationTab } from "./AccessAndModerationTab"
import { AdvancedTab } from "./AdvancedTab"
import { CampaignWizardSkeleton } from "./CampaignWizardSkeleton"

interface CampaignWizardProps {
  mode: "create" | "edit"
  campaignId?: string
}

export type OnboardingQuestion = Omit<OnboardingField, 'id' | 'campaign_id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

interface CampaignFormData {
  campaign_template: string
  campaign_type: string
  client_id: string
  campaign_name: string
  description: string
  guild_id: string
  channel_id: string
  campaign_start_date: string
  campaign_end_date: string
  bot_name: string
  bot_personality: string
  bot_response_style: string
  brand_color: string
  brand_logo_url: string
  welcome_message: string
  auto_role_assignment: boolean
  target_role_ids: string[]
  moderation_enabled: boolean
  rate_limit_per_user: number
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
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [userExplicitlyChangedTemplate, setUserExplicitlyChangedTemplate] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [localOnboardingQuestions, setLocalOnboardingQuestions] = useState<OnboardingQuestion[]>([]);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [campaignDocumentId, setCampaignDocumentId] = useState<string | null>(null);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [editCampaignLoading, setEditCampaignLoading] = useState(false);
  const fetchedCampaignId = useRef<string | null>(null);
  const [showTemplateConfirmDialog, setShowTemplateConfirmDialog] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  
  const { clients, loading: clientsLoading } = useClients()
  const { campaigns, loading: campaignsLoading, createCampaign, updateCampaign, fetchSingleCampaign } = useBotCampaignsAPI()
  
  const { 
    template: templateWithLandingPage, 
    landingPage: inheritedLandingPageTemplate, 
  } = useCampaignTemplateCompleteAPI(selectedTemplateId)

  const { pages: landingPages, loading: landingPageLoading, createPage, updatePage, fetchPages } = useCampaignLandingPagesApi()
  const landingPage = landingPages[0]

  const {
    fields: onboardingFields,
    applyTemplate: applyOnboardingTemplate,
    createField,
    updateField,
    deleteField,
    fetchFields,
    batchUpdateFields
  } = useOnboardingFieldsAPI(campaignDocumentId ?? undefined)

  useEffect(() => {
    if (campaignDocumentId) {
      fetchPages(campaignDocumentId)
    }
  }, [campaignDocumentId, fetchPages])

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
    // Handle nested template_config structure
    const template_config = templateWithLandingPage?.template_config || templateWithLandingPage;
    const template_onboarding_fields = template_config?.onboarding_fields || templateWithLandingPage?.onboarding_fields;
    
    if (mode === 'create' && template_onboarding_fields && template_onboarding_fields.length > 0) {
      return {
        fields: template_onboarding_fields.map((field, index) => ({
          id: `template-${field.id}`, field_label: field.question, field_type: field.type, sort_order: index,
          is_required: field.required, is_enabled: true, field_options: field.options || [], validation_rules: field.validation || {},
          field_key: field.question.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')
        })),
        source: 'template' as const, isTemplate: true
      }
    }
    return { fields: [], source: 'none' as const, isTemplate: false }
  }, [onboardingFields, mode, templateWithLandingPage, localOnboardingQuestions])

  const [formData, setFormData] = useState<CampaignFormData>({
    campaign_template: '', campaign_type: 'custom', client_id: '', campaign_name: '', guild_id: '',
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
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error("Authentication token not found.");
        }
        const response = await fetch('http://localhost:8000/api/v1/operations/campaign-template/list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.ok) {
          const data = await response.json()
          const templates = data.templates || []
          setTemplates(templates)
          if (mode === 'create' && templates.length > 0) {
            const firstTemplate = templates[0]
            const templateId = firstTemplate.documentId
            const campaignType = firstTemplate.campaign_type || 'custom'
            setSelectedTemplateId(templateId)
            setFormData(prev => ({ 
              ...prev, 
              campaign_template: templateId,
              campaign_type: campaignType  // Add campaign_type to form data
            }))
          }
        }
      } catch (error) {
        console.error('Error loading templates:', error)
        toast({ variant: "destructive", title: "Error", description: "Failed to load campaign templates" })
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

  // Fetch single campaign when in edit mode
  useEffect(() => {
    if (mode === 'edit' && campaignId && fetchSingleCampaign && fetchedCampaignId.current !== campaignId) {
      const loadCampaign = async () => {
        try {
          setEditCampaignLoading(true)
          fetchedCampaignId.current = campaignId
          const campaign = await fetchSingleCampaign(campaignId)
          setEditCampaign(campaign)
        } catch (error) {
          console.error('Failed to fetch campaign:', error)
          fetchedCampaignId.current = null // Reset on error
          toast({
            title: "Error",
            description: "Failed to load campaign details",
            variant: "destructive",
          })
        } finally {
          setEditCampaignLoading(false)
        }
      }
      loadCampaign()
    }
  }, [mode, campaignId, fetchSingleCampaign, toast])

  useEffect(() => {
    if (mode === 'edit' && editCampaign && templates.length > 0) {
      const campaign = editCampaign
      setCampaignDocumentId(campaign.documentId || null);
      // Find the correct template based on campaign.type
      let templateId = ''
      
      // The campaign.type field contains the template identifier (e.g., "referral_onboarding")
      // We need to find the template where template.campaign_type matches campaign.type
      const campaignType = campaign.type
      
      if (campaignType) {
        const matchingTemplate = templates.find(template => 
          template.campaign_type === campaignType || template.id === campaignType
        )
        if (matchingTemplate) {
          templateId = matchingTemplate.documentId || matchingTemplate.id
        }
      }
      
      // Fallback to custom template or first available template
      if (!templateId) {
        templateId = templates.find(t => t.campaign_type === 'custom')?.documentId || templates.find(t => t.campaign_type === 'custom')?.id || templates[0]?.documentId || templates[0]?.id || ''
      }
      
      setFormData({
        campaign_template: templateId, 
        campaign_type: campaign.type || 'custom',  // Use campaign.type field for campaign_type
        client_id: campaign.client_id, 
        campaign_name: campaign.name,
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
        landing_page_data: campaign.landing_page_data || {},
      })
      
      // Onboarding questions are now loaded via the useOnboardingFieldsAPI hook,
      // which is triggered by setting the campaignDocumentId.
      // This section is no longer needed.
      
      setSelectedTemplateId(templateId)
      setInitialLoadComplete(true)
    }
  }, [mode, editCampaign, templates])

  useEffect(() => {
    if (mode === 'edit' && landingPage) {
      const { id, campaign_id, created_at, updated_at, ...rest } = landingPage;
      setFormData(prev => ({
        ...prev,
        landing_page_data: {
          ...prev.landing_page_data,
          ...rest
        }
      }));
    }
  }, [mode, landingPage]);

  useEffect(() => {
    if (!templateWithLandingPage || !userExplicitlyChangedTemplate) return;

    // Handle the nested template_config structure
    const template_config = templateWithLandingPage.template_config || templateWithLandingPage;
    const { bot_config, onboarding_fields, landing_page_config } = template_config as any;
    const default_landing_page = templateWithLandingPage.default_landing_page;

    if (bot_config) {
      setFormData(prev => ({
        ...prev,
        description: bot_config.description,
        bot_name: bot_config.bot_name,
        bot_personality: bot_config.bot_personality,
        bot_response_style: bot_config.bot_response_style,
        brand_color: bot_config.brand_color,
        welcome_message: bot_config.welcome_message,
        referral_tracking_enabled: bot_config.features?.referral_tracking,
        auto_role_assignment: bot_config.features?.auto_role,
        moderation_enabled: bot_config.features?.moderation,
        rate_limit_per_user: bot_config.rate_limit_per_user || 5,
        target_role_ids: bot_config.onboarding_completion_requirements?.auto_role_on_completion ? [bot_config.onboarding_completion_requirements.auto_role_on_completion] : [],
      }));
    }

    if (onboarding_fields) {
      const templateQuestions = onboarding_fields.map((field: any, index: number) => ({
        id: `template-${field.id}`,
        field_label: field.question,
        field_type: field.type,
        sort_order: index,
        is_required: field.required,
        is_enabled: true,
        field_options: field.options || [],
        validation_rules: field.validation || {},
        field_key: field.question.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')
      }));
      setLocalOnboardingQuestions(templateQuestions as any);
    }
    
    // Handle landing page config from template_config first, then fall back to default_landing_page
    const landingPageSource = landing_page_config || default_landing_page?.fields;
    if (landingPageSource) {
        setFormData(prev => ({
            ...prev,
            landing_page_data: {
                ...prev.landing_page_data,
                ...landingPageSource,
                // Set the landing page template ID to the documentId when inheriting from campaign template
                landing_page_template_id: (default_landing_page as any)?.documentId || (default_landing_page as any)?.id
            }
        }));
    }

    setUserExplicitlyChangedTemplate(false);

  }, [templateWithLandingPage, userExplicitlyChangedTemplate, mode]);

  useEffect(() => {
    if (inheritedLandingPageTemplate && (mode === 'create' || userExplicitlyChangedTemplate)) {
      const landingPageData = {
        landing_page_template_id: (inheritedLandingPageTemplate as any).documentId || (inheritedLandingPageTemplate as any).id,
        offer_title: (inheritedLandingPageTemplate as any).fields?.offer_title || (inheritedLandingPageTemplate as any).offer_title,
        offer_description: (inheritedLandingPageTemplate as any).fields?.offer_description || (inheritedLandingPageTemplate as any).offer_description,
        offer_highlights: (inheritedLandingPageTemplate as any).fields?.offer_highlights || (inheritedLandingPageTemplate as any).offer_highlights,
        offer_value: (inheritedLandingPageTemplate as any).fields?.offer_value || (inheritedLandingPageTemplate as any).offer_value,
        what_you_get: (inheritedLandingPageTemplate as any).fields?.what_you_get || (inheritedLandingPageTemplate as any).what_you_get,
        how_it_works: (inheritedLandingPageTemplate as any).fields?.how_it_works || (inheritedLandingPageTemplate as any).how_it_works,
        requirements: (inheritedLandingPageTemplate as any).fields?.requirements || (inheritedLandingPageTemplate as any).requirements,
        support_info: (inheritedLandingPageTemplate as any).fields?.support_info || (inheritedLandingPageTemplate as any).support_info,
      }
      setFormData(prev => ({ ...prev, landing_page_data: landingPageData }))
    }
  }, [inheritedLandingPageTemplate, mode, userExplicitlyChangedTemplate])

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTemplateSelect = (templateId: string) => {
    // Check if this is the first template selection (for new campaigns) or no actual change
    if (!userExplicitlyChangedTemplate && mode === 'create' && !formData.campaign_name && !formData.description) {
      // First time selection in create mode with no data - apply immediately
      applyTemplateSelection(templateId)
      return
    }
    
    // Check if selecting the same template
    if (templateId === selectedTemplateId) {
      return
    }
    
    // Show confirmation dialog for template changes that could override existing values
    setPendingTemplateId(templateId)
    setShowTemplateConfirmDialog(true)
  }

  const applyTemplateSelection = (templateId: string) => {
    // Find the selected template to get its campaign_type
    const selectedTemplate = templates.find(t => (t.documentId || t.id) === templateId)
    const campaignType = selectedTemplate?.campaign_type || 'custom'
    
    setFormData(prev => ({ 
      ...prev, 
      campaign_template: templateId,
      campaign_type: campaignType  // Add campaign_type to form data
    }))
    setSelectedTemplateId(templateId)
    setUserExplicitlyChangedTemplate(true)
  }

  const handleConfirmTemplateChange = () => {
    if (pendingTemplateId) {
      applyTemplateSelection(pendingTemplateId)
    }
    setShowTemplateConfirmDialog(false)
    setPendingTemplateId(null)
  }

  const handleCancelTemplateChange = () => {
    setShowTemplateConfirmDialog(false)
    setPendingTemplateId(null)
  }

  const handleQuestionsChange = (questions: OnboardingQuestion[]) => {
    setLocalOnboardingQuestions(questions);
  };

  const handleSaveOnboardingQuestions = (questions: OnboardingQuestion[]) => {
    setLocalOnboardingQuestions(questions);
  };

  const applyTemplateOnboardingFields = async (templateId: string, targetCampaignId: string) => {
    if (!templateId || !targetCampaignId) return
    setApplyingTemplate(true)
    try {
      const result = await applyOnboardingTemplate(targetCampaignId, templateId)
      if (result.success) {
        toast({ title: 'Success', description: 'Template onboarding fields applied successfully' })
        await fetchFields(targetCampaignId)
      } else {
        toast({ variant: "destructive", title: 'Error', description: `Failed to apply template: ${result.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Error applying template onboarding fields:', error)
      toast({ variant: "destructive", title: 'Error', description: 'Failed to apply template onboarding fields' })
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
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields on this tab before continuing.",
      })
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSave = async () => {
    for (let i = 1; i <= TABS.length; i++) {
        if (!validateStep(i)) {
            setCurrentStep(i);
            toast({
              variant: "destructive",
              title: "Validation Error",
              description: `Please complete all required fields on the "${TABS[i-1].title}" tab.`,
            });
            return;
        }
    }

    setIsSaving(true);
    try {
      // Step 1: Create or update the campaign without onboarding questions
      let savedCampaign;
      if (mode === 'create') {
        savedCampaign = await createCampaign(formData);
      } else {
        savedCampaign = await updateCampaign(campaignId!, formData);
      }

      const targetCampaignId = savedCampaign.document_id || (savedCampaign as any).documentId;
      if (!targetCampaignId) {
        throw new Error("Failed to get campaign ID after saving.");
      }

      // Step 2: Batch update onboarding questions to prevent deadlocks
      const result = await fetchFields(targetCampaignId);
      const existingFields = (Array.isArray(result) ? result : []) as OnboardingField[];
      
      // Identify questions to delete (existed before but not in current local questions)
      const questionsToDelete = existingFields
        .filter(ef => !localOnboardingQuestions.some(lq => lq.id === ef.id))
        .map(f => f.documentId || f.id);

      // Use batch update to handle all creates, updates, and deletes in one sequential operation
      const batchResult = await batchUpdateFields(targetCampaignId, localOnboardingQuestions, questionsToDelete);
      
      if (!batchResult || !batchResult.success) {
        throw new Error(batchResult?.error || 'Failed to update onboarding questions');
      }

      toast({
        title: "Success!",
        description: `Campaign ${mode === 'create' ? 'created' : 'updated'} successfully!`,
      });
      router.push('/bot-campaigns');
      router.refresh();
    } catch (error) {
      console.error(`Error saving campaign:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const renderContent = () => {
    switch (currentStep) {
      case 1: return <VitalsTab formData={formData} handleFieldChange={handleFieldChange} handleTemplateSelect={handleTemplateSelect} clients={clients as any} templates={templates} clientsLoading={clientsLoading} templatesLoading={templatesLoading} />;
      case 2: return <PlacementAndScheduleTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 3: return <BotIdentityTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 4: return <OnboardingFlowTab formData={formData} handleFieldChange={handleFieldChange} questions={localOnboardingQuestions} onQuestionsChange={handleQuestionsChange} />;
      case 5: return <AccessAndModerationTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 6: return <AdvancedTab formData={formData} handleFieldChange={handleFieldChange} inheritedLandingPageTemplate={inheritedLandingPageTemplate} mode={mode} campaignId={campaignDocumentId ?? undefined} />;
      default: return null;
    }
  }
  
  if (!initialLoadComplete || (mode === 'edit' && editCampaignLoading)) {
    return <CampaignWizardSkeleton />;
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
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Fixed Left Sidebar */}
        <nav className="flex-shrink-0 w-64">
          <div className="sticky top-0">
            <ol className="space-y-2">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setCurrentStep(tab.id)}
                    disabled={tab.id > currentStep && !validateStep(currentStep)}
                    className="w-full text-left"
                  >
                    <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                        currentStep === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}>
                      <div className={`flex items-center justify-center h-7 w-7 rounded-full ${
                          currentStep === tab.id
                            ? "bg-primary-foreground text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                        <tab.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">{tab.title}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Scrollable Right Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="pb-6">
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
      </div>

      {/* Template Change Confirmation Dialog */}
      <AlertDialog open={showTemplateConfirmDialog} onOpenChange={setShowTemplateConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Campaign Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the campaign template will override existing values in your campaign configuration, including:
              <br /><br />
              • Bot identity and personality settings
              <br />
              • Onboarding questions and flow
              <br />
              • Landing page template and content
              <br />
              • Campaign description and settings
              <br /><br />
              {mode === 'edit' ? 
                'This action will modify your existing campaign configuration.' :
                'Any changes you\'ve made will be replaced with the template defaults.'
              }
              <br /><br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTemplateChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTemplateChange}>
              {mode === 'edit' ? 'Update Campaign' : 'Apply Template'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
