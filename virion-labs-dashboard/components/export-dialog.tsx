"use client"

import { useState } from "react"
import { Download, FileText, Database, Users, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface ExportDialogProps {
  trigger?: React.ReactNode
  defaultCampaignId?: string
}

export function ExportDialog({ trigger, defaultCampaignId }: ExportDialogProps) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [exportType, setExportType] = useState("comprehensive")
  const [format, setFormat] = useState("csv")
  const [dateRange, setDateRange] = useState("30")
  const [isExporting, setIsExporting] = useState(false)

  const isAdmin = profile?.role === "admin"
  const isClient = profile?.role === "client"

  const exportOptions = [
    {
      id: "comprehensive",
      title: "Complete Data Export",
      description: "All available data including analytics, onboarding responses, referrals, and user data",
      icon: Database,
      adminOnly: false,
      includes: [
        "Campaign analytics and performance metrics",
        "Complete onboarding responses and user data",
        "Referral links, conversions, and earnings data",
        "User interaction and engagement metrics",
        ...(isAdmin ? ["Access requests and form submissions"] : [])
      ]
    },
    {
      id: "onboarding",
      title: "Onboarding & User Data",
      description: "User responses, completion data, and onboarding analytics",
      icon: Users,
      adminOnly: false,
      includes: [
        "All user onboarding form responses",
        "Completion and start tracking data",
        "User engagement and progress metrics",
        "Campaign-specific user data"
      ]
    },
    {
      id: "referrals",
      title: "Referral System Data",
      description: "Referral links, conversions, earnings, and analytics",
      icon: TrendingUp,
      adminOnly: false,
      includes: [
        "Referral link performance and statistics",
        "User conversion and signup data",
        "Earnings and commission tracking",
        "Referral analytics and attribution data"
      ]
    },
    {
      id: "analytics",
      title: "Analytics & Reports",
      description: "Campaign performance metrics and business intelligence",
      icon: FileText,
      adminOnly: false,
      includes: [
        "Campaign performance summaries",
        "User engagement metrics",
        "Conversion rates and completion data",
        "Daily activity and trend reports"
      ]
    }
  ]

  const handleExport = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to export data.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    
    try {
      // Get Supabase session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        throw new Error('Failed to get authentication token')
      }

      const params = new URLSearchParams({
        exportType,
        format,
        dateRange,
        ...(defaultCampaignId && { campaignId: defaultCampaignId })
      })

      // Step 1: Generate the export file
      const response = await fetch(`/api/analytics/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      const result = await response.json()
      
      if (!result.success || !result.download_url) {
        throw new Error('Invalid export response')
      }

      // Step 2: Download the generated file
      const downloadResponse = await fetch(result.download_url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!downloadResponse.ok) {
        throw new Error('Failed to download generated file')
      }

      // Handle file download
      const fileContent = await downloadResponse.text()
      const blob = new Blob([fileContent], { type: result.content_type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export successful!",
        description: `Your ${exportType} data has been exported successfully.`,
      })

      setOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "There was an error exporting your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const selectedOption = exportOptions.find(opt => opt.id === exportType)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your data in various formats. Choose the type of data you want to export and configure the export settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Data Type</Label>
            <RadioGroup value={exportType} onValueChange={setExportType}>
              <div className="grid gap-4 md:grid-cols-2">
                {exportOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <Card key={option.id} className={`cursor-pointer transition-colors ${
                      exportType === option.id ? 'ring-2 ring-primary' : ''
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer flex-1">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{option.title}</span>
                            {option.adminOnly && !isAdmin && (
                              <Badge variant="secondary">Admin Only</Badge>
                            )}
                          </Label>
                        </div>
                        <CardDescription className="ml-6">
                          {option.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="ml-6">
                          <p className="text-sm font-medium mb-2">Includes:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {option.includes.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1 w-1 bg-current rounded-full flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Export Settings */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="format">File Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                  <SelectItem value="json">JSON (Developer Friendly)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Export Scope</Label>
              <div className="flex items-center h-10 px-3 py-2 border border-input bg-background rounded-md">
                <span className="text-sm">
                  {defaultCampaignId ? "Current Campaign" : "All Campaigns"}
                </span>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          {selectedOption && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <selectedOption.icon className="h-5 w-5" />
                  {selectedOption.title}
                </CardTitle>
                <CardDescription>
                  Preview of what will be included in your export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Export Format:</span>
                    <Badge variant="outline">{format.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Date Range:</span>
                    <Badge variant="outline">
                      {dateRange === 'all' ? 'All Time' : `Last ${dateRange} days`}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Scope:</span>
                    <Badge variant="outline">
                      {defaultCampaignId ? 'Single Campaign' : 'All Campaigns'}
                    </Badge>
                  </div>
                  {profile?.role && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Access Level:</span>
                      <Badge variant="outline" className="capitalize">
                        {profile.role}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedOption?.title}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 