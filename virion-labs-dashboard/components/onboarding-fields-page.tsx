"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Edit, Grip, Plus, Save, Trash, MessageSquare, Bot } from "lucide-react"

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

export function OnboardingFieldsPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("fields")
  const [showAddField, setShowAddField] = useState(false)
  const [editingField, setEditingField] = useState<any>(null)
  const [fields, setFields] = useState(defaultFields)

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newFields = [...fields]
      const temp = newFields[index]
      newFields[index] = newFields[index - 1]
      newFields[index - 1] = temp
      setFields(newFields)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      const newFields = [...fields]
      const temp = newFields[index]
      newFields[index] = newFields[index + 1]
      newFields[index + 1] = temp
      setFields(newFields)
    }
  }

  const handleToggleRequired = (index: number) => {
    const newFields = [...fields]
    newFields[index].required = !newFields[index].required
    setFields(newFields)
  }

  const handleToggleEnabled = (index: number) => {
    const newFields = [...fields]
    newFields[index].enabled = !newFields[index].enabled
    setFields(newFields)
  }

  const handleEditField = (field: any) => {
    setEditingField(field)
    setShowAddField(true)
  }

  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    setFields(newFields)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bot Onboarding Questions</h1>
          <p className="text-muted-foreground">Configure the questions Discord bots will ask during user onboarding</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddField} onOpenChange={setShowAddField}>
            <DialogTrigger asChild>
              <Button>
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
                    defaultValue={editingField?.label || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-key">Data Key</Label>
                  <Input id="field-key" placeholder="e.g., discord_username" defaultValue={editingField?.key || ""} />
                  <p className="text-xs text-muted-foreground">Used to store the user's response in the database</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-type">Response Type</Label>
                  <Select defaultValue={editingField?.type || "text"}>
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
                    defaultValue={editingField?.placeholder || ""}
                  />
                  <p className="text-xs text-muted-foreground">The bot will show this as an example of what to enter</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-description">Follow-up Text (Optional)</Label>
                  <Input
                    id="field-description"
                    placeholder="e.g., Make sure to include the # and numbers"
                    defaultValue={editingField?.description || ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    The bot will send this as a follow-up message after asking the question
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="field-required" defaultChecked={editingField?.required || false} />
                    <Label htmlFor="field-required">Required Question</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="field-enabled" defaultChecked={editingField?.enabled !== false} />
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
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowAddField(false)
                    setEditingField(null)
                  }}
                >
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
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-3 border rounded-md ${!field.enabled ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <Grip className="h-4 w-4 text-muted-foreground cursor-move" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{field.label}</div>
                        <div className="text-sm text-muted-foreground truncate">{field.key}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <Badge variant={field.type === "text" ? "default" : "secondary"}>{field.type}</Badge>
                      {field.required && <Badge variant="outline">Required</Badge>}
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
                          {field.required ? (
                            <span className="font-bold text-xs">REQ</span>
                          ) : (
                            <span className="font-bold text-xs text-muted-foreground">OPT</span>
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleEnabled(index)}>
                          {field.enabled ? (
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
                    .filter((field) => field.enabled)
                    .slice(0, 3)
                    .map((field, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 bg-background p-3 rounded-lg shadow-sm">
                            <p className="text-sm">
                              {field.label}
                              {field.required && <span className="text-destructive ml-1">*</span>}
                            </p>
                            {field.placeholder && (
                              <p className="text-xs text-muted-foreground mt-1">Example: {field.placeholder}</p>
                            )}
                          </div>
                        </div>

                        {field.description && (
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 bg-background p-3 rounded-lg shadow-sm">
                              <p className="text-xs text-muted-foreground">{field.description}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3 ml-12">
                          <div className="flex-1 bg-primary/10 p-3 rounded-lg shadow-sm">
                            <p className="text-sm">
                              {field.type === "select"
                                ? "Option 1"
                                : field.type === "checkbox"
                                  ? "Yes"
                                  : field.placeholder || "User response"}
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}

                  {fields.filter((field) => field.enabled).length > 3 && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 bg-background p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          ...and {fields.filter((field) => field.enabled).length - 3} more questions
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
              <div className="space-y-4">
                {templates.map((template, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{template.fields.length} questions</Badge>
                      <Button variant="outline" size="sm">
                        Preview
                      </Button>
                      <Button size="sm">Apply</Button>
                    </div>
                  </div>
                ))}
              </div>
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

const defaultFields = [
  {
    label: "What is your email address?",
    key: "email",
    type: "email",
    placeholder: "example@email.com",
    description: "I'll use this to send you important updates about our community",
    required: true,
    enabled: true,
  },
  {
    label: "What is your full name?",
    key: "name",
    type: "text",
    placeholder: "John Smith",
    description: null,
    required: true,
    enabled: true,
  },
  {
    label: "What is your Discord username?",
    key: "discord_username",
    type: "text",
    placeholder: "username#1234",
    description: "Make sure to include the # and numbers",
    required: true,
    enabled: true,
  },
  {
    label: "How old are you?",
    key: "age",
    type: "number",
    placeholder: "25",
    description: "You must be at least 13 years old to join",
    required: true,
    enabled: true,
  },
  {
    label: "Which country are you from?",
    key: "country",
    type: "select",
    placeholder: "United States",
    description: null,
    required: false,
    enabled: true,
  },
  {
    label: "How did you hear about us?",
    key: "referral_source",
    type: "select",
    placeholder: "YouTube",
    description: null,
    required: false,
    enabled: true,
  },
  {
    label: "Would you like to subscribe to our newsletter?",
    key: "newsletter",
    type: "checkbox",
    placeholder: "Yes",
    description: "You can unsubscribe at any time",
    required: false,
    enabled: true,
  },
  {
    label: "Do you agree to our community guidelines and terms of service?",
    key: "terms",
    type: "checkbox",
    placeholder: "Yes",
    description: "You must agree to continue",
    required: true,
    enabled: true,
  },
]

const templates = [
  {
    name: "Basic",
    description: "Essential questions only (email, name, discord)",
    fields: ["email", "name", "discord_username", "terms"],
  },
  {
    name: "Standard",
    description: "Recommended set of questions for most communities",
    fields: ["email", "name", "discord_username", "age", "country", "terms"],
  },
  {
    name: "Comprehensive",
    description: "All available questions for detailed user profiles",
    fields: ["email", "name", "discord_username", "age", "country", "referral_source", "newsletter", "terms"],
  },
  {
    name: "Gaming Community",
    description: "Tailored for gaming communities with game-specific questions",
    fields: ["email", "name", "discord_username", "age", "gaming_platform", "favorite_games", "terms"],
  },
]
