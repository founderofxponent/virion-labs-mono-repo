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
import { VitalsTabProps } from "@/schemas/campaign-wizard";

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
        <Label htmlFor="name">Campaign Name</Label>
        <Input
          id="name"
          placeholder="e.g. 'Summer Kickoff Event'"
          value={formData.name}
          onChange={e => handleFieldChange("name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client">Client</Label>
        <Select
          value={formData.client}
          onValueChange={value => handleFieldChange("client", value)}
          disabled={clientsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id.toString()}>
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
              <SelectItem key={template.documentId || template.id} value={template.documentId || template.id}>
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