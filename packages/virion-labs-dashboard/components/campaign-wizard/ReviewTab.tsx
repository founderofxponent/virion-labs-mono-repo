import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Bot, 
  MessageCircle, 
  ShieldCheck, 
  Calendar,
  Globe,
  Zap,
  Save,
  ChevronLeft
} from "lucide-react"
import { CampaignFormData } from "@/schemas/campaign"
import { OnboardingQuestion } from "@/schemas/campaign-onboarding-field"

interface ReviewTabProps {
  formData: CampaignFormData
  questions: OnboardingQuestion[]
  clients: any[]
  onSave: () => void
  isSaving: boolean
  onBack: () => void
}

export function ReviewTab({ formData, questions, clients, onSave, isSaving, onBack }: ReviewTabProps) {
  const selectedClient = clients.find(c => 
    (c.documentId && c.documentId === formData.client) || 
    c.id.toString() === formData.client
  )
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Campaign</h2>
        <p className="text-muted-foreground">
          Review all settings before saving your campaign.
        </p>
      </div>

      {/* Campaign Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Campaign Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Campaign Name</span>
              <p className="font-medium break-words mt-1">{formData.name || 'Untitled Campaign'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Client</span>
              <p className="font-medium break-words mt-1">{selectedClient?.name || 'No client selected'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Campaign Type</span>
              <div className="mt-1">
                <Badge variant="secondary" className="capitalize">
                  {formData.campaign_type}
                </Badge>
              </div>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-muted-foreground">Description</span>
              <p className="text-sm break-words mt-1">{formData.description || 'No description provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bot Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Bot Name</span>
              <p className="font-medium break-words mt-1">{formData.bot_name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Personality</span>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  {formData.bot_personality}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Response Style</span>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  {formData.bot_response_style}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Brand Color</span>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-4 h-4 rounded border flex-shrink-0"
                  style={{ backgroundColor: formData.brand_color }}
                />
                <span className="font-mono text-sm break-all">{formData.brand_color}</span>
              </div>
            </div>
          </div>
          {formData.welcome_message && (
            <div className="mt-4">
              <span className="text-sm font-medium text-muted-foreground">Welcome Message</span>
              <p className="text-sm bg-muted p-3 rounded mt-1 break-words">{formData.welcome_message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Onboarding Questions
            <Badge variant="secondary" className="ml-auto">
              {questions.length} questions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id || `question-${index}`} className="border rounded p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <span className="font-medium">Question {index + 1}</span>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={question.is_required ? "default" : "secondary"} className="text-xs">
                        {question.is_required ? "Required" : "Optional"}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {question.field_type}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm break-words mb-3">{question.field_label}</p>
                  {question.field_options && question.field_options.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Options:</span>
                      <div className="flex flex-wrap gap-1">
                        {question.field_options.map((option, idx) => (
                          <Badge key={`${question.id || index}-option-${idx}`} variant="outline" className="text-xs break-words">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No onboarding questions configured</p>
          )}
        </CardContent>
      </Card>

      {/* Placement & Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Features & Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Discord Server</span>
              <p className="font-mono text-sm break-all mt-1">{formData.guild_id || 'Not configured'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Channel</span>
              <p className="font-mono text-sm break-all mt-1">{formData.channel_id || 'Not configured'}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <span className="text-sm font-medium text-muted-foreground">Enabled Features</span>
            <div className="flex flex-wrap gap-2">
              {formData.referral_tracking_enabled && (
                <Badge variant="default">Referral Tracking</Badge>
              )}
              {formData.auto_role_assignment && (
                <Badge variant="default">Auto Role Assignment</Badge>
              )}
              {formData.moderation_enabled && (
                <Badge variant="default">Moderation</Badge>
              )}
              {!formData.referral_tracking_enabled && !formData.auto_role_assignment && !formData.moderation_enabled && (
                <span className="text-muted-foreground text-sm">No additional features enabled</span>
              )}
            </div>
          </div>

          {formData.rate_limit_per_user && formData.rate_limit_per_user > 0 && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Rate Limit</span>
              <p className="text-sm">{formData.rate_limit_per_user} messages per user</p>
            </div>
          )}

          {(formData.start_date || formData.end_date) && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Schedule</span>
              <div className="text-sm space-y-1">
                {formData.start_date && <p>Start: {new Date(formData.start_date).toLocaleDateString()}</p>}
                {formData.end_date && <p>End: {new Date(formData.end_date).toLocaleDateString()}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button onClick={onSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Campaign'}
        </Button>
      </div>
    </div>
  )
}