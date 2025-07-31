import React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { OnboardingQuestionsForm } from "./OnboardingQuestionsForm"
import { OnboardingFlowTabProps } from "@/schemas/campaign-wizard";

export function OnboardingFlowTab({
  formData,
  handleFieldChange,
  questions,
  onQuestionsChange,
}: OnboardingFlowTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="welcome_message">Welcome Message</Label>
        <Textarea
          id="welcome_message"
          placeholder="Write a warm welcome message to greet users when they start an interaction."
          value={formData.welcome_message}
          onChange={e => handleFieldChange("welcome_message", e.target.value)}
          rows={4}
        />
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Onboarding Questions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Define the questions the bot will ask users to collect information
          during onboarding. Changes are saved when you save the campaign.
        </p>
        <OnboardingQuestionsForm
          questions={questions}
          onQuestionsChange={onQuestionsChange}
        />
      </div>
    </div>
  )
} 