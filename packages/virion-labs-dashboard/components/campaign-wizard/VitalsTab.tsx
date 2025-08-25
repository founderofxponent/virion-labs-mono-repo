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
  clients,
  isClient = false,
}: {
  formData: any
  handleFieldChange: (field: string, value: any) => void
  clients: any[]
  isClient?: boolean
}) {
  // If user is a client, set their client ID automatically
  React.useEffect(() => {
    if (isClient && clients.length > 0 && !formData.client) {
      // For client users, automatically select the first (and likely only) client
      const clientData = clients[0]
      if (clientData) {
        // Use the document ID for API calls, not numeric ID
        handleFieldChange("client", clientData.documentId || clientData.id)
      }
    }
  }, [isClient, clients, formData.client, handleFieldChange])
  
  // Debug logging for client selection
  React.useEffect(() => {
    console.log('📦 VitalsTab - formData.client:', formData.client)
    console.log('📦 VitalsTab - available clients:', clients.map(c => ({ id: c.id, documentId: c.documentId, name: c.name })))
    console.log('📦 VitalsTab - isClient:', isClient)
  }, [formData.client, clients, isClient])
  


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
      
      {/* Only show client selector for admins */}
      {!isClient && (
        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Select
            value={formData.client}
            onValueChange={value => handleFieldChange("client", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.documentId || client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
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