import React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { LandingPageConfig } from "@/components/landing-page-config"

interface AdvancedTabProps {
  formData: {
    referral_tracking_enabled: boolean
    webhook_url: string
    landing_page_data?: any
    campaign_template: string
  }
  handleFieldChange: (field: string, value: any) => void
  inheritedLandingPageTemplate: any
  mode: "create" | "edit"
  campaignId?: string
}

export function AdvancedTab({
  formData,
  handleFieldChange,
  inheritedLandingPageTemplate,
  mode,
  campaignId,
}: AdvancedTabProps) {
  console.log('🔧 AdvancedTab render:', { 
    mode, 
    campaignId, 
    'formData.landing_page_data': formData.landing_page_data,
    inheritedLandingPageTemplate: inheritedLandingPageTemplate?.fields
  });

  const handleLandingPageDataChange = (data: any) => {
    console.log('🔧 AdvancedTab handleLandingPageDataChange:', data);
    handleFieldChange("landing_page_data", {
      ...formData.landing_page_data,
      ...data,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="referral_tracking_enabled" className="text-base">
            Enable Referral System
          </Label>
          <p className="text-sm text-muted-foreground">
            Turn on referral tracking and landing pages for this campaign.
          </p>
        </div>
        <Switch
          id="referral_tracking_enabled"
          checked={formData.referral_tracking_enabled}
          onCheckedChange={value =>
            handleFieldChange("referral_tracking_enabled", value)
          }
        />
      </div>

      {formData.referral_tracking_enabled && (
        <div className="space-y-4">
          <div className="pl-4">
            <h3 className="text-lg font-semibold mb-2">Landing Page Configuration</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure how your referral landing pages will look and what content they'll display.
            </p>
            <LandingPageConfig
              initialData={
                formData.landing_page_data ||
                inheritedLandingPageTemplate?.fields
              }
              onChange={handleLandingPageDataChange}
              campaignId={campaignId || null}
              campaignType={formData.campaign_template}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="webhook_url">Webhook URL</Label>
        <Input
          id="webhook_url"
          placeholder="https://api.example.com/webhook"
          value={formData.webhook_url}
          onChange={e => handleFieldChange("webhook_url", e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Send campaign events to an external URL.
        </p>
      </div>
    </div>
  )
} 