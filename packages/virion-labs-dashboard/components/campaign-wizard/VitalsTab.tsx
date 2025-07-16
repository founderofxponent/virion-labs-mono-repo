import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type CampaignTemplate } from "@/lib/campaign-templates"

interface VitalsTabProps {
  formData: {
    campaign_name: string
    client_id: string
    campaign_template: string
    description: string
  }
  handleFieldChange: (field: string, value: any) => void
  handleTemplateSelect: (templateId: string) => void
  clients: { id: string; name: string }[]
  templates: CampaignTemplate[]
  clientsLoading: boolean
  templatesLoading: boolean
}

export function VitalsTab({
  formData,
  handleFieldChange,
  handleTemplateSelect,
  clients,
  templates,
  clientsLoading,
  templatesLoading,
}: VitalsTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="campaign_name">Campaign Name</Label>
        <Input
          id="campaign_name"
          placeholder="e.g. 'Summer Kickoff Event'"
          value={formData.campaign_name}
          onChange={e => handleFieldChange("campaign_name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_id">Client</Label>
        <Select
          value={formData.client_id}
          onValueChange={value => handleFieldChange("client_id", value)}
          disabled={clientsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaign_template">Campaign Template</Label>
        <Select
          value={formData.campaign_template}
          onValueChange={handleTemplateSelect}
          disabled={templatesLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the campaign's main goal and what it offers."
          value={formData.description}
          onChange={e => handleFieldChange("description", e.target.value)}
        />
      </div>
    </div>
  )
} 