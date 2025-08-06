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
import { useCampaignTemplateCompleteAPI } from "@/hooks/use-campaign-template-complete-api"
import { useClients } from "@/hooks/use-clients"
import { useBotCampaignsAPI } from "@/hooks/use-bot-campaigns-api"
import { useOnboardingFieldsAPI } from "@/hooks/use-onboarding-fields-api"
import { useCampaignLandingPageApi } from "@/hooks/use-campaign-landing-page-api"
import { OnboardingQuestionsForm } from "./OnboardingQuestionsForm"
import { Campaign, CampaignFormData, CampaignListItem, CampaignTemplate } from "@/schemas/campaign"
import { CampaignOnboardingField, UpdateOnboardingFieldData, OnboardingQuestion } from "@/schemas/campaign-onboarding-field"

// Import Tab Components
import { TemplateSelectionTab } from "./TemplateSelectionTab"
import { VitalsTab } from "./VitalsTab"
import { PlacementAndScheduleTab } from "./PlacementAndScheduleTab"
import { BotIdentityTab } from "./BotIdentityTab"
import { OnboardingFlowTab } from "./OnboardingFlowTab"
import { AccessAndModerationTab } from "./AccessAndModerationTab"
import { AdvancedTab } from "./AdvancedTab"
import { ReviewTab } from "./ReviewTab"
import { CampaignWizardSkeleton } from "./CampaignWizardSkeleton"

interface CampaignWizardProps {
  mode: "create" | "edit"
  campaignId?: string
}


const TABS = [
  { id: 0, title: "Template Selection", icon: FileText },
  { id: 1, title: "Vitals", icon: FileText },
  { id: 2, title: "Placement & Schedule", icon: Pin },
  { id: 3, title: "Bot Identity", icon: Bot },
  { id: 4, title: "Onboarding Flow", icon: MessageCircle },
  { id: 5, title: "Access & Moderation", icon: ShieldCheck },
  { id: 6, title: "Advanced", icon: Zap },
  { id: 7, title: "Review & Save", icon: Save },
];

export function CampaignWizard({ mode, campaignId }: CampaignWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(mode === 'create' ? 0 : 1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateApplied, setTemplateApplied] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [localOnboardingQuestions, setLocalOnboardingQuestions] = useState<OnboardingQuestion[]>([]);
  const [campaignDocumentId, setCampaignDocumentId] = useState<string | null>(null);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [editCampaignLoading, setEditCampaignLoading] = useState(false);
  const fetchedCampaignId = useRef<string | null>(null);
  
  const { clients, loading: clientsLoading } = useClients()
  const { campaigns, loading: campaignsLoading, createCampaign, updateCampaign, fetchSingleCampaign } = useBotCampaignsAPI()
  
  const { 
    template: templateWithLandingPage, 
    landingPage: inheritedLandingPageTemplate, 
  } = useCampaignTemplateCompleteAPI(selectedTemplateId)

  const { page: landingPage, loading: landingPageLoading, createPage, updatePage, fetchPage } = useCampaignLandingPageApi()

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
      console.log('🔍 Fetching page for campaignDocumentId:', campaignDocumentId)
      fetchPage(campaignDocumentId)
      // fetchFields is handled automatically by the hook when campaignDocumentId changes
    }
  }, [campaignDocumentId, fetchPage])

  useEffect(() => {
    console.log('📋 onboardingFields updated:', { onboardingFields, length: onboardingFields?.length, campaignDocumentId })
    if (onboardingFields && onboardingFields.length > 0) {
      console.log('✅ Setting localOnboardingQuestions from API data:', onboardingFields)
      setLocalOnboardingQuestions(onboardingFields.map(f => ({
        ...f,
        id: f.documentId,
        is_required: f.is_required ?? false,
        is_enabled: f.is_enabled ?? true,
        sort_order: f.sort_order ?? 0,
      })));
    }
  }, [onboardingFields, campaignDocumentId]);

  const effectiveOnboardingFields = React.useMemo(() => {
    console.log('🎯 effectiveOnboardingFields recalculating:', { 
      mode, 
      localOnboardingQuestions: localOnboardingQuestions.length, 
      onboardingFields: onboardingFields?.length,
      campaignDocumentId 
    })
    
    // In edit mode, prioritize database fields first, then local modifications
    if (mode === 'edit') {
      if (localOnboardingQuestions.length > 0) {
        console.log('🟢 Using localOnboardingQuestions:', localOnboardingQuestions)
        return { fields: localOnboardingQuestions, source: 'local' as const, isTemplate: false }
      }
      if (onboardingFields && onboardingFields.length > 0) {
        console.log('🟡 Using onboardingFields:', onboardingFields)
        return { fields: onboardingFields, source: 'database' as const, isTemplate: false }
      }
      console.log('🔴 No fields found, returning empty')
      return { fields: [], source: 'none' as const, isTemplate: false }
    }
    
    // In create mode, prioritize local modifications first, then template
    if (localOnboardingQuestions.length > 0) {
      return { fields: localOnboardingQuestions, source: 'local' as const, isTemplate: false }
    }
    
    // Handle nested template_config structure
    const template_config = templateWithLandingPage?.template_config || templateWithLandingPage;
    const template_onboarding_fields = template_config?.onboarding_fields || templateWithLandingPage?.onboarding_fields;
    
    if (template_onboarding_fields && template_onboarding_fields.length > 0) {
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
    campaign_template: '', campaign_type: 'custom', client: '', name: '', guild_id: '',
    channel_id: '', bot_name: 'Virion Bot', bot_personality: 'helpful',
    bot_response_style: 'friendly', brand_color: '#6366f1', brand_logo_url: '',
    description: '', welcome_message: '', referral_tracking_enabled: true,
    auto_role_assignment: false, target_role_ids: [], moderation_enabled: true,
    rate_limit_per_user: 5, webhook_url: '', start_date: '', end_date: '',
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
          // Don't auto-select first template - let user choose
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

  // Fetch single campaign when in edit mode - no template logic
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

  // Edit mode: Load campaign data directly (no template logic)
  useEffect(() => {
    if (mode === 'edit' && editCampaign) {
      const campaign = editCampaign
      console.log('🏗️ Setting campaignDocumentId from editCampaign:', campaign.documentId)
      setCampaignDocumentId(campaign.documentId || null);
      
      setFormData({
        campaign_template: '', // Clear template reference in edit mode
        campaign_type: campaign.campaign_type || 'custom',
        client: campaign.client?.documentId || campaign.client_id,
        name: campaign.name,
        guild_id: campaign.guild_id, 
        channel_id: campaign.channel_id || '',
        bot_name: campaign.bot_name || 'Virion Bot',
        bot_personality: campaign.bot_personality || 'helpful',
        bot_response_style: campaign.bot_response_style || 'friendly',
        brand_color: campaign.brand_color || '#6366f1', 
        brand_logo_url: campaign.brand_logo_url || '',
        description: campaign.description || '', 
        welcome_message: campaign.welcome_message || '',
        referral_tracking_enabled: campaign.referral_tracking_enabled || false,
        auto_role_assignment: campaign.auto_role_assignment || false,
        target_role_ids: campaign.target_role_ids || [],
        moderation_enabled: campaign.moderation_enabled || true,
        rate_limit_per_user: campaign.rate_limit_per_user || 5,
        webhook_url: campaign.webhook_url || '',
        start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
        end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : '',
        landing_page_data: campaign.landing_page_data || {},
      })
      
      setTemplateApplied(true) // Skip template logic entirely in edit mode
      setInitialLoadComplete(true)
    }
  }, [mode, editCampaign])

  useEffect(() => {
    console.log('🏠 Landing page data effect triggered:', { mode, landingPage, hasLandingPage: !!landingPage });
    if (mode === 'edit' && landingPage) {
      console.log('🏠 Processing landing page data:', landingPage);
      const { id, campaign, createdAt, updatedAt, publishedAt, documentId, ...rest } = landingPage;
      console.log('🏠 Extracted rest data:', rest);
      setFormData(prev => {
        const newFormData = {
          ...prev,
          landing_page_data: {
            ...prev.landing_page_data,
            ...rest
          }
        };
        console.log('🏠 Setting formData.landing_page_data:', newFormData.landing_page_data);
        return newFormData;
      });
    }
  }, [mode, landingPage, setFormData]);

  // Simple one-time template application
  useEffect(() => {
    if (!templateWithLandingPage || templateApplied) return;

    console.log('📋 Applying template as initial values:', templateWithLandingPage.name);

    // Handle the nested template_config structure
    const template_config = templateWithLandingPage.template_config || templateWithLandingPage;
    const { bot_config, onboarding_fields, landing_page_config } = template_config as any;
    const default_landing_page = templateWithLandingPage.default_landing_page;

    if (bot_config) {
      setFormData(prev => ({
        ...prev,
        description: bot_config.description || prev.description,
        bot_name: bot_config.bot_name || prev.bot_name,
        bot_personality: bot_config.bot_personality || prev.bot_personality,
        bot_response_style: bot_config.bot_response_style || prev.bot_response_style,
        brand_color: bot_config.brand_color || prev.brand_color,
        welcome_message: bot_config.welcome_message || prev.welcome_message,
        referral_tracking_enabled: bot_config.features?.referral_tracking ?? prev.referral_tracking_enabled,
        auto_role_assignment: bot_config.features?.auto_role ?? prev.auto_role_assignment,
        moderation_enabled: bot_config.features?.moderation ?? prev.moderation_enabled,
        rate_limit_per_user: bot_config.rate_limit_per_user || prev.rate_limit_per_user,
        target_role_ids: bot_config.onboarding_completion_requirements?.auto_role_on_completion ? [bot_config.onboarding_completion_requirements.auto_role_on_completion] : prev.target_role_ids,
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
    
    // Handle landing page config
    const landingPageSource = landing_page_config || default_landing_page?.fields;
    if (landingPageSource) {
        setFormData(prev => ({
            ...prev,
            landing_page_data: {
                ...prev.landing_page_data,
                ...landingPageSource,
                landing_page_template: (default_landing_page as any)?.documentId || (default_landing_page as any)?.id
            }
        }));
    }

    setTemplateApplied(true);
    // Only show toast when user explicitly selects a template, not on auto-load

  }, [templateWithLandingPage, templateApplied]);


  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // New simplified template handlers
  const handleTemplateSelect = (templateId: string | null) => {
    if (templateId) {
      const selectedTemplate = templates.find(t => (t.documentId || t.id) === templateId)
      const campaignType = selectedTemplate?.campaign_type || 'custom'
      
      setFormData(prev => ({ 
        ...prev, 
        campaign_template: templateId,
        campaign_type: campaignType
      }))
      setSelectedTemplateId(templateId)
      
      // Show success toast when user explicitly selects a template
      toast({
        title: "Template Applied",
        description: `"${selectedTemplate?.name}" template has been applied as initial values.`,
      });
    } else {
      // Start from scratch - clear any template reference
      setFormData(prev => ({ 
        ...prev, 
        campaign_template: '',
        campaign_type: 'custom'
      }))
      setSelectedTemplateId(null)
      setTemplateApplied(true) // Skip template application
    }
    
    setCurrentStep(1) // Move to Vitals tab
  }

  const handleSkipTemplate = () => {
    setSelectedTemplateId(null)
    setTemplateApplied(true)
    setCurrentStep(1) // Move to Vitals tab
  }

  const handleQuestionsChange = (questions: OnboardingQuestion[]) => {
    setLocalOnboardingQuestions(questions);
  };

  const handleSaveOnboardingQuestions = (questions: OnboardingQuestion[]) => {
    setLocalOnboardingQuestions(questions);
  };


  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: return true; // Template selection always valid
      case 1: return !!(formData.client && formData.name);
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
    const minStep = mode === 'create' ? 0 : 1
    setCurrentStep(prev => Math.max(prev - 1, minStep))
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
      const { landing_page_data, campaign_template, ...campaignSubmitData } = formData;
      let savedCampaign;

      if (mode === 'create') {
        savedCampaign = await createCampaign(campaignSubmitData);
      } else {
        savedCampaign = await updateCampaign(campaignId!, campaignSubmitData);
      }

      const targetCampaignId = savedCampaign.documentId || savedCampaign.id?.toString();
      if (!targetCampaignId) {
        throw new Error("Failed to get campaign ID after saving.");
      }

      // Step 2: Save landing page data separately
      if (landing_page_data) {
        const { landing_page_template_id, ...cleanLandingPageData } = landing_page_data;
        const campaignDocumentId = savedCampaign.documentId;
        if (!campaignDocumentId) {
          throw new Error("Failed to get campaign documentId after saving.");
        }

        // Map landing_page_template_id to landing_page_template for API compatibility
        const apiPayload = {
          ...cleanLandingPageData,
          campaign: campaignDocumentId,
          ...(landing_page_template_id && { landing_page_template: landing_page_template_id })
        };

        if (mode === 'edit') {
          // Ensure we have the latest landing page data before deciding
          const currentLandingPage = await fetchPage(campaignDocumentId);
          
          if (currentLandingPage && currentLandingPage.documentId) {
            await updatePage(currentLandingPage.documentId, apiPayload);
          } else {
            // In edit mode but no existing landing page - still need to create one
            await createPage(campaignDocumentId, apiPayload);
          }
        } else {
          // Create mode
          await createPage(campaignDocumentId, apiPayload);
        }
      }

      // Step 3: Batch update onboarding questions to prevent deadlocks
      const result = await fetchFields(targetCampaignId);
      const existingFields = (Array.isArray(result) ? result : []) as CampaignOnboardingField[];
      
      // Identify questions to delete (existed before but not in current local questions)
      const questionsToDelete = existingFields
        .filter(ef => !localOnboardingQuestions.some(lq => lq.id === ef.documentId))
        .map(f => f.documentId);

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
      case 0: return <TemplateSelectionTab templates={templates} templatesLoading={templatesLoading} onTemplateSelect={handleTemplateSelect} onSkipTemplate={handleSkipTemplate} />;
      case 1: return <VitalsTab formData={formData} handleFieldChange={handleFieldChange} clients={clients as any} />;
      case 2: return <PlacementAndScheduleTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 3: return <BotIdentityTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 4: return <OnboardingFlowTab formData={formData} handleFieldChange={handleFieldChange} questions={effectiveOnboardingFields.fields as OnboardingQuestion[]} onQuestionsChange={handleQuestionsChange} />;
      case 5: return <AccessAndModerationTab formData={formData} handleFieldChange={handleFieldChange} />;
      case 6: return <AdvancedTab formData={formData} handleFieldChange={handleFieldChange} inheritedLandingPageTemplate={inheritedLandingPageTemplate} mode={mode} campaignId={campaignDocumentId ?? undefined} />;
      case 7: return <ReviewTab formData={formData} questions={effectiveOnboardingFields.fields as OnboardingQuestion[]} clients={clients as any} onSave={handleSave} isSaving={isSaving} onBack={handleBack} />;
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
              {TABS.filter(tab => mode === 'edit' ? tab.id > 0 : true).map((tab) => (
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
                <CardTitle>{TABS[currentStep]?.title || 'Step'}</CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {TABS.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>

            {/* Don't show navigation buttons on template selection step and review step */}
            {currentStep !== 0 && currentStep !== TABS.length - 1 && (
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === (mode === 'create' ? 0 : 1) || isSaving}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                
                <Button onClick={handleNext} disabled={isSaving}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  )
}
