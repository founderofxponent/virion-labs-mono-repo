"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useEmailTemplatesApi, type EmailTemplate, type EmailTemplateCreate, type EmailTemplateUpdate } from "@/hooks/use-email-templates-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Search,
  Play
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useToast } from "@/hooks/use-toast"

interface TemplateFormData {
  template_id: string
  subject: string
  body: string
  description?: string
  is_active: boolean
  variables: string[]
}

export function EmailTemplatesAdmin() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const { 
    loading, 
    error, 
    fetchTemplates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    renderTemplate 
  } = useEmailTemplatesApi()

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState<TemplateFormData>({
    template_id: "",
    subject: "",
    body: "",
    description: "",
    is_active: true,
    variables: []
  })
  const [variablesInput, setVariablesInput] = useState("")
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({})
  const [renderedPreview, setRenderedPreview] = useState<{ subject: string; body: string } | null>(null)

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const templatesData = await fetchTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error("Failed to load templates:", error)
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      })
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const variables = variablesInput.split(',').map(v => v.trim()).filter(Boolean)
      const templateData: EmailTemplateCreate = {
        ...formData,
        variables: variables.length > 0 ? variables : undefined
      }
      
      await createTemplate(templateData)
      toast({
        title: "Success",
        description: "Email template created successfully",
      })
      setShowCreateDialog(false)
      resetForm()
      loadTemplates()
    } catch (error) {
      console.error("Failed to create template:", error)
      toast({
        title: "Error",
        description: "Failed to create email template",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return
    
    try {
      const variables = variablesInput.split(',').map(v => v.trim()).filter(Boolean)
      const updateData: EmailTemplateUpdate = {
        ...formData,
        variables: variables.length > 0 ? variables : undefined
      }
      
      await updateTemplate(selectedTemplate.documentId!, updateData)
      toast({
        title: "Success",
        description: "Email template updated successfully",
      })
      setShowEditDialog(false)
      resetForm()
      loadTemplates()
    } catch (error) {
      console.error("Failed to update template:", error)
      toast({
        title: "Error",
        description: "Failed to update email template",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return
    
    try {
      await deleteTemplate(selectedTemplate.documentId!)
      toast({
        title: "Success",
        description: "Email template deleted successfully",
      })
      setShowDeleteDialog(false)
      setSelectedTemplate(null)
      loadTemplates()
    } catch (error) {
      console.error("Failed to delete template:", error)
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive",
      })
    }
  }

  const handlePreviewTemplate = async () => {
    if (!selectedTemplate) return
    
    try {
      const rendered = await renderTemplate({
        template_id: selectedTemplate.template_id,
        variables: previewVariables
      })
      setRenderedPreview(rendered)
    } catch (error) {
      console.error("Failed to render template:", error)
      toast({
        title: "Error",
        description: "Failed to render template preview",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      template_id: "",
      subject: "",
      body: "",
      description: "",
      is_active: true,
      variables: []
    })
    setVariablesInput("")
    setSelectedTemplate(null)
  }

  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      template_id: template.template_id,
      subject: template.subject,
      body: template.body,
      description: template.description || "",
      is_active: template.is_active,
      variables: template.variables || []
    })
    setVariablesInput(template.variables?.join(', ') || "")
    setShowEditDialog(true)
  }

  const openPreviewDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setRenderedPreview(null)
    // Initialize preview variables
    const initialVariables: Record<string, string> = {}
    template.variables?.forEach(variable => {
      initialVariables[variable] = `{${variable}}`
    })
    setPreviewVariables(initialVariables)
    setShowPreviewDialog(true)
  }

  const filteredTemplates = templates.filter(template => 
    template.template_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!profile || profile.role?.name !== "Platform Administrator") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Email Template Management</h1>
          <p className="text-muted-foreground">Manage email templates used throughout the platform</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No templates found</div>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.template_id}</CardTitle>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{template.subject}</p>
                    {template.description && (
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPreviewDialog(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {template.variables && template.variables.length > 0 && (
                    <span>Variables: {template.variables.join(', ')}</span>
                  )}
                  <span>Updated: {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template that can be used throughout the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template_id">Template ID</Label>
              <Input
                id="template_id"
                value={formData.template_id}
                onChange={(e) => setFormData({...formData, template_id: e.target.value})}
                placeholder="e.g., welcome-email, password-reset"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Email subject line"
              />
            </div>
            <div>
              <Label htmlFor="body">Body (HTML)</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                placeholder="HTML email content"
                className="min-h-[200px]"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this template"
              />
            </div>
            <div>
              <Label htmlFor="variables">Variables (Optional)</Label>
              <Input
                id="variables"
                value={variablesInput}
                onChange={(e) => setVariablesInput(e.target.value)}
                placeholder="e.g., username, reset_link (comma-separated)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update the email template settings and content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_template_id">Template ID</Label>
              <Input
                id="edit_template_id"
                value={formData.template_id}
                onChange={(e) => setFormData({...formData, template_id: e.target.value})}
                placeholder="e.g., welcome-email, password-reset"
              />
            </div>
            <div>
              <Label htmlFor="edit_subject">Subject</Label>
              <Input
                id="edit_subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Email subject line"
              />
            </div>
            <div>
              <Label htmlFor="edit_body">Body (HTML)</Label>
              <Textarea
                id="edit_body"
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                placeholder="HTML email content"
                className="min-h-[200px]"
              />
            </div>
            <div>
              <Label htmlFor="edit_description">Description (Optional)</Label>
              <Input
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this template"
              />
            </div>
            <div>
              <Label htmlFor="edit_variables">Variables (Optional)</Label>
              <Input
                id="edit_variables"
                value={variablesInput}
                onChange={(e) => setVariablesInput(e.target.value)}
                placeholder="e.g., username, reset_link (comma-separated)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>Update Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Email Template</DialogTitle>
            <DialogDescription>
              Preview how the email template will look with sample variables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Template Variables</Label>
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable} className="flex items-center gap-2">
                    <Label className="min-w-[100px] text-sm">{variable}:</Label>
                    <Input
                      value={previewVariables[variable] || ''}
                      onChange={(e) => setPreviewVariables({
                        ...previewVariables,
                        [variable]: e.target.value
                      })}
                      placeholder={`Value for {${variable}}`}
                    />
                  </div>
                ))}
                <Button onClick={handlePreviewTemplate} className="mt-2">
                  <Play className="w-4 h-4 mr-2" />
                  Render Preview
                </Button>
              </div>
            )}
            
            {renderedPreview && (
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject:</Label>
                  <div className="p-2 bg-muted rounded mt-1">{renderedPreview.subject}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Body Preview:</Label>
                  <div 
                    className="p-4 bg-white border rounded mt-1 min-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: renderedPreview.body }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{selectedTemplate?.template_id}"? 
              This action cannot be undone and may break email functionality if the template is in use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}