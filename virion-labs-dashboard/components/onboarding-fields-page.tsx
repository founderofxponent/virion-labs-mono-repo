"use client"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, Edit, Grip, Plus, Save, Trash, MessageSquare, Bot, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useOnboardingFields } from "@/hooks/use-onboarding-fields"
import { useDiscordCampaigns } from "@/hooks/use-discord-campaigns"

interface OnboardingFieldsPageProps {
  campaignId?: string
}

export function OnboardingFieldsPage({ campaignId }: OnboardingFieldsPageProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("fields")
  const [showAddField, setShowAddField] = useState(false)
  const [editingField, setEditingField] = useState<any>(null)
  const [selectedCampaign, setSelectedCampaign] = useState(campaignId || "")
  
  const { campaigns } = useDiscordCampaigns()
  const {
    fields,
    templates,
    loading,
    error,
    createField,
    updateField,
    deleteField,
    applyTemplate,
    reorderFields,
  } = useOnboardingFields(selectedCampaign)

  const [newField, setNewField] = useState({
    field_key: "",
    field_label: "",
    field_type: "text" as const,
    field_placeholder: "",
    field_description: "",
    field_options: [] as string[],
    is_required: false,
    is_enabled: true,
    sort_order: 0,
  })

  const handleMoveUp = async (index: number) => {
    if (index > 0) {
      const newFields = [...fields]
      const temp = newFields[index]
      newFields[index] = newFields[index - 1]
      newFields[index - 1] = temp
      
      // Update sort_order for both fields
      newFields[index].sort_order = index
      newFields[index - 1].sort_order = index - 1
      
      await reorderFields(newFields)
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index < fields.length - 1) {
      const newFields = [...fields]
      const temp = newFields[index]
      newFields[index] = newFields[index + 1]
      newFields[index + 1] = temp
      
      // Update sort_order for both fields
      newFields[index].sort_order = index
      newFields[index + 1].sort_order = index + 1
      
      await reorderFields(newFields)
    }
  }

  const handleToggleRequired = async (index: number) => {
    const field = fields[index]
    const result = await updateField({
      id: field.id,
      is_required: !field.is_required
    })
    
    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    }
  }

  const handleToggleEnabled = async (index: number) => {
    const field = fields[index]
    const result = await updateField({
      id: field.id,
      is_enabled: !field.is_enabled
    })
    
    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    }
  }

  const handleEditField = (field: any) => {
    setEditingField(field)
    setNewField({
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      field_placeholder: field.field_placeholder || "",
      field_description: field.field_description || "",
      field_options: field.field_options || [],
      is_required: field.is_required,
      is_enabled: field.is_enabled,
      sort_order: field.sort_order,
    })
    setShowAddField(true)
  }

  const handleDeleteField = async (index: number) => {
    const field = fields[index]
    if (!confirm(`Are you sure you want to delete the field "${field.field_label}"?`)) return
    
    const result = await deleteField(field.id)
    
    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Field deleted successfully",
      })
    }
  }

  const handleSaveField = async () => {
    if (!selectedCampaign) {
      toast({
        title: "Error",
        description: "Please select a campaign first",
        variant: "destructive"
      })
      return
    }

    if (!newField.field_key || !newField.field_label) {
      toast({
        title: "Error",
        description: "Please fill in the required fields",
        variant: "destructive"
      })
      return
    }

    const fieldData = {
      ...newField,
      campaign_id: selectedCampaign,
      sort_order: editingField ? newField.sort_order : fields.length,
    }

    const result = editingField 
      ? await updateField({ id: editingField.id, ...fieldData })
      : await createField(fieldData)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: editingField ? "Field updated successfully" : "Field created successfully",
      })
      setShowAddField(false)
      setEditingField(null)
      setNewField({
        field_key: "",
        field_label: "",
        field_type: "text",
        field_placeholder: "",
        field_description: "",
        field_options: [],
        is_required: false,
        is_enabled: true,
        sort_order: 0,
      })
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    if (!selectedCampaign) {
      toast({
        title: "Error",
        description: "Please select a campaign first",
        variant: "destructive"
      })
      return
    }

    const result = await applyTemplate(selectedCampaign, templateId)
    
    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Template applied successfully",
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bot Onboarding Questions</h1>
          <p className="text-muted-foreground">Configure the questions Discord bots will ask during user onboarding</p>
        </div>
        <div className="flex gap-2">
          {!campaignId && (
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {campaign.campaign_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={showAddField} onOpenChange={setShowAddField}>
            <DialogTrigger asChild>
              <Button disabled={!selectedCampaign}>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingField ? "Edit Question" : "Add New Question"}</DialogTitle>
                <DialogDescription>
                  {editingField
                    ? "Edit this question that the bot will ask during onboarding"
                    : "Add a new question for the bot to ask during user onboarding"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="field-label">Question Text</Label>
                  <Input
                    id="field-label"
                    placeholder="e.g., What is your Discord username?"
                    value={newField.field_label}
                    onChange={(e) => setNewField(prev => ({ ...prev, field_label: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-key">Data Key</Label>
                  <Input 
                    id="field-key" 
                    placeholder="e.g., discord_username" 
                    value={newField.field_key}
                    onChange={(e) => setNewField(prev => ({ ...prev, field_key: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Used to store the user's response in the database</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-type">Response Type</Label>
                  <Select value={newField.field_type} onValueChange={(value: any) => setNewField(prev => ({ ...prev, field_type: value }))}>
                    <SelectTrigger id="field-type">
                      <SelectValue placeholder="Select response type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="select">Multiple Choice</SelectItem>
                      <SelectItem value="checkbox">Yes/No</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-placeholder">Example Response</Label>
                  <Input
                    id="field-placeholder"
                    placeholder="e.g., username#1234"
                    value={newField.field_placeholder}
                    onChange={(e) => setNewField(prev => ({ ...prev, field_placeholder: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">The bot will show this as an example of what to enter</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-description">Follow-up Text (Optional)</Label>
                  <Input
                    id="field-description"
                    placeholder="e.g., Make sure to include the # and numbers"
                    value={newField.field_description}
                    onChange={(e) => setNewField(prev => ({ ...prev, field_description: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    The bot will send this as a follow-up message after asking the question
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="field-required" 
                      checked={newField.is_required}
                      onCheckedChange={(checked) => setNewField(prev => ({ ...prev, is_required: !!checked }))}
                    />
                    <Label htmlFor="field-required">Required Question</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="field-enabled" 
                      checked={newField.is_enabled}
                      onCheckedChange={(checked) => setNewField(prev => ({ ...prev, is_enabled: !!checked }))}
                    />
                    <Label htmlFor="field-enabled">Enabled</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddField(false)
                    setEditingField(null)
                    setNewField({
                      field_key: "",
                      field_label: "",
                      field_type: "text",
                      field_placeholder: "",
                      field_description: "",
                      field_options: [],
                      is_required: false,
                      is_enabled: true,
                      sort_order: 0,
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveField}>
                  {editingField ? "Save Changes" : "Add Question"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="fields">Questions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Bot Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Onboarding Questions</CardTitle>
              <CardDescription>Configure the questions your Discord bot will ask during onboarding</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCampaign ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a campaign to view and manage onboarding fields.
                </div>
              ) : fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No onboarding fields configured for this campaign yet.
                  <br />
                  Add your first question or apply a template to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`flex items-center gap-4 p-3 border rounded-md ${!field.is_enabled ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <Grip className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{field.field_label}</div>
                          <div className="text-sm text-muted-foreground truncate">{field.field_key}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <Badge variant={field.field_type === "text" ? "default" : "secondary"}>{field.field_type}</Badge>
                        {field.is_required && <Badge variant="outline">Required</Badge>}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === fields.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleRequired(index)}>
                            {field.is_required ? (
                              <span className="font-bold text-xs">REQ</span>
                            ) : (
                              <span className="font-bold text-xs text-muted-foreground">OPT</span>
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleEnabled(index)}>
                            {field.is_enabled ? (
                              <span className="font-bold text-xs">ON</span>
                            ) : (
                              <span className="font-bold text-xs text-muted-foreground">OFF</span>
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditField(field)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteField(index)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setShowAddField(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discord Bot Preview</CardTitle>
              <CardDescription>Preview how the bot conversation will look to users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/30 max-w-md mx-auto">
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 bg-background p-3 rounded-lg shadow-sm">
                      <p className="text-sm font-medium">Welcome to our community! 👋</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        I'll need to ask you a few questions to complete your onboarding.
                      </p>
                    </div>
                  </div>

                  {fields
                    .filter((field) => field.is_enabled)
                    .slice(0, 3)
                    .map((field, index) => (
                      <div key={field.id} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 bg-background p-3 rounded-lg shadow-sm">
                            <p className="text-sm">
                              {field.field_label}
                              {field.is_required && <span className="text-destructive ml-1">*</span>}
                            </p>
                            {field.field_placeholder && (
                              <p className="text-xs text-muted-foreground mt-1">Example: {field.field_placeholder}</p>
                            )}
                          </div>
                        </div>

                        {field.field_description && (
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 bg-background p-3 rounded-lg shadow-sm">
                              <p className="text-xs text-muted-foreground">{field.field_description}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3 ml-12">
                          <div className="flex-1 bg-primary/10 p-3 rounded-lg shadow-sm">
                            <p className="text-sm">
                              {field.field_type === "select"
                                ? "Option 1"
                                : field.field_type === "checkbox"
                                  ? "Yes"
                                  : field.field_placeholder || "User response"}
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}

                  {fields.filter((field) => field.is_enabled).length > 3 && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 bg-background p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          ...and {fields.filter((field) => field.is_enabled).length - 3} more questions
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 bg-background p-3 rounded-lg shadow-sm">
                      <p className="text-sm font-medium">Thank you for completing the onboarding process! 🎉</p>
                      <p className="text-sm text-muted-foreground mt-1">You now have access to all channels.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Question Templates</CardTitle>
              <CardDescription>Predefined sets of questions for different use cases</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates available.
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template, index) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{template.template_name}</div>
                        <div className="text-sm text-muted-foreground">{template.template_description}</div>
                        {template.is_default && <Badge variant="secondary" className="mt-1">Default</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{template.field_config.length} questions</Badge>
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleApplyTemplate(template.id)}
                          disabled={!selectedCampaign}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Onboarding Settings</CardTitle>
              <CardDescription>Configure general settings for the bot onboarding process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Multi-step Onboarding</div>
                    <div className="text-sm text-muted-foreground">
                      Split onboarding into multiple messages for better user experience
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Save Progress</div>
                    <div className="text-sm text-muted-foreground">
                      Allow users to pause and resume the onboarding process
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Verification</div>
                    <div className="text-sm text-muted-foreground">
                      Send verification code to email before completing onboarding
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-assign Roles</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically assign Discord roles after successful onboarding
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <Input
                    id="welcome-message"
                    placeholder="Enter welcome message"
                    defaultValue="Welcome to our community! I'll need to ask you a few questions to complete your onboarding."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completion-message">Completion Message</Label>
                  <Input
                    id="completion-message"
                    placeholder="Enter completion message"
                    defaultValue="Thank you for completing the onboarding process! You now have access to all channels."
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Storage</CardTitle>
              <CardDescription>Configure how user data is stored and processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Database Storage</div>
                    <div className="text-sm text-muted-foreground">Store user responses in the database</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Discord Role Integration</div>
                    <div className="text-sm text-muted-foreground">
                      Use responses to determine Discord role assignment
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Export to CSV</div>
                    <div className="text-sm text-muted-foreground">Automatically export new user data to CSV daily</div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Data Retention</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically delete user data after 1 year of inactivity
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


