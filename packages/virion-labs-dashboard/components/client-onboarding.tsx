"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from "lucide-react"
import { OnboardingStep } from "./onboarding/onboarding-step"
import { BusinessInfoSection } from "./onboarding/business-info-section"
import { BotBrandingSection } from "./onboarding/bot-branding-section"
// Discord sync moved to Integrations page for clients
import { CampaignConfigSection } from "./onboarding/campaign-config-section"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useClientDiscordConnections } from "@/hooks/use-client-discord-connections"

interface ClientOnboardingProps {
  clientId: string
  clientName: string
}

interface OnboardingData {
  // Step 1: Business Info
  company_name: string
  industry: string
  business_type: 'b2b' | 'b2c' | 'both'
  website: string
  campaign_name: string
  campaign_template: string
  description: string
  campaign_start_date: string
  campaign_end_date: string
  
  // Step 2: Bot Branding
  bot_name: string
  brand_color: string
  brand_logo_url: string
  bot_personality: string
  bot_response_style: string
  welcome_message: string
  
  // Step 3: Discord Sync (populated automatically)
  synced_servers: any[]
  
  // Step 4: Campaign Config
  guild_id: string
  channel_id: string
  target_role_ids: string[]
  auto_role_assignment: boolean
  moderation_enabled: boolean
  rate_limit_per_user: number
  referral_tracking_enabled: boolean
  webhook_url: string
}

export function ClientOnboarding({ clientId, clientName }: ClientOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [syncedServers, setSyncedServers] = useState<any[]>([])
  const { toast } = useToast()
  const router = useRouter()
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    // Step 1 defaults
    company_name: clientName || '',
    industry: '',
    business_type: 'b2c',
    website: '',
    campaign_name: '',
    campaign_template: '',
    description: '',
    campaign_start_date: '',
    campaign_end_date: '',
    
    // Step 2 defaults
    bot_name: `${clientName || 'Your'} Bot`,
    brand_color: '#6366f1',
    brand_logo_url: '',
    bot_personality: 'helpful',
    bot_response_style: 'friendly',
    welcome_message: '',
    
    // Step 3
    synced_servers: [],
    
    // Step 4 defaults
    guild_id: '',
    channel_id: '',
    target_role_ids: [],
    auto_role_assignment: true,
    moderation_enabled: true,
    rate_limit_per_user: 5,
    referral_tracking_enabled: true,
    webhook_url: ''
  })

  // Load synced servers from Integrations (connections API)
  const { connections } = useClientDiscordConnections()
  useEffect(() => {
    const servers = (connections || []).map(c => ({
      guild_id: c.guild_id,
      guild_name: c.guild_name || c.guild_id,
      guild_icon: c.guild_icon_url,
      member_count: 0,
      channels: c.channels || [],
      roles: c.roles || [],
    }))
    setSyncedServers(servers)
    setOnboardingData(prev => ({ ...prev, synced_servers: servers }))
  }, [connections])

  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }))
  }

  const getStepCompletion = () => {
    const step1Complete = !!(onboardingData.company_name && onboardingData.industry && onboardingData.campaign_name && onboardingData.campaign_template)
    const step2Complete = !!(onboardingData.bot_name && onboardingData.welcome_message)
    const step3Complete = !!(onboardingData.guild_id && onboardingData.channel_id)
    return { step1Complete, step2Complete, step3Complete }
  }

  const { step1Complete, step2Complete, step3Complete } = getStepCompletion()
  const completedSteps = [step1Complete, step2Complete, step3Complete].filter(Boolean).length
  const progressPercentage = (completedSteps / 3) * 100

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 1: return true
      case 2: return step1Complete
      case 3: return step1Complete && step2Complete
      default: return false
    }
  }

  const handleNext = () => {
    const nextStep = currentStep + 1
    if (nextStep <= 3 && canProceedToStep(nextStep)) {
      setCurrentStep(nextStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateCampaign = async () => {
    if (!step4Complete) {
      toast({
        title: "Incomplete Information",
        description: "Please complete all required fields before creating your campaign.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Transform onboarding data to campaign API format
      const campaignPayload = {
        client_id: clientId,
        campaign_template: onboardingData.campaign_template,
        campaign_name: onboardingData.campaign_name,
        description: onboardingData.description,
        guild_id: onboardingData.guild_id,
        channel_id: onboardingData.channel_id,
        campaign_start_date: onboardingData.campaign_start_date,
        campaign_end_date: onboardingData.campaign_end_date,
        bot_name: onboardingData.bot_name,
        bot_personality: onboardingData.bot_personality,
        bot_response_style: onboardingData.bot_response_style,
        brand_color: onboardingData.brand_color,
        brand_logo_url: onboardingData.brand_logo_url,
        welcome_message: onboardingData.welcome_message,
        auto_role_assignment: onboardingData.auto_role_assignment,
        target_role_ids: onboardingData.target_role_ids,
        moderation_enabled: onboardingData.moderation_enabled,
        rate_limit_per_user: onboardingData.rate_limit_per_user,
        referral_tracking_enabled: onboardingData.referral_tracking_enabled,
        webhook_url: onboardingData.webhook_url,
        is_active: false // Start as draft for client campaigns
      }

      const response = await fetch('/api/bot-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload)
      })

      if (response.ok) {
        toast({
          title: "Campaign Created Successfully!",
          description: "Your campaign has been created and is ready for launch."
        })
        router.push('/campaigns')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: "Failed to Create Campaign",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { 
      number: 1, 
      title: "Business & Campaign Info", 
      description: "Tell us about your business and first campaign",
      completed: step1Complete,
      disabled: !canProceedToStep(1)
    },
    { 
      number: 2, 
      title: "Bot Branding", 
      description: "Customize your Discord bot's appearance and personality",
      completed: step2Complete,
      disabled: !canProceedToStep(2)
    },
    { 
      number: 3, 
      title: "Campaign Configuration", 
      description: "Choose channels and roles for your campaign",
      completed: step3Complete,
      disabled: !canProceedToStep(3)
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Virion Labs!</h1>
        <p className="text-muted-foreground mb-4">
          Let's get you set up to run Discord campaigns in 4 simple steps.
        </p>
        <div className="max-w-md mx-auto">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {completedSteps} of 4 steps completed
          </p>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {steps.map((step) => (
          <div 
            key={step.number}
            className={`text-center cursor-pointer transition-opacity ${
              step.disabled ? 'opacity-50' : ''
            }`}
            onClick={() => {
              if (!step.disabled) {
                setCurrentStep(step.number)
              }
            }}
          >
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              currentStep === step.number
                ? 'bg-primary text-primary-foreground'
                : step.completed
                ? 'bg-green-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <span className="font-semibold">{step.number}</span>
              )}
            </div>
            <h3 className="font-medium text-sm">{step.title}</h3>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-primary font-bold">Step {currentStep}:</span>
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {steps[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <BusinessInfoSection 
              data={onboardingData}
              onUpdate={updateOnboardingData}
            />
          )}
          {currentStep === 2 && (
            <BotBrandingSection 
              data={onboardingData}
              onUpdate={updateOnboardingData}
            />
          )}
          {/* Discord sync moved to Integrations page */}
          {currentStep === 4 && (
            <CampaignConfigSection 
              data={onboardingData}
              syncedServers={syncedServers}
              onUpdate={updateOnboardingData}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedToStep(currentStep + 1) || isLoading}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateCampaign}
            disabled={!step3Complete || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Creating Campaign...' : 'Create Campaign'}
          </Button>
        )}
      </div>
    </div>
  )
} 