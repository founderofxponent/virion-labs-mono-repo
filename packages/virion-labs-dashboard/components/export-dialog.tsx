"use client"

import { useState, useEffect } from "react"
import { Download, FileText, Users, CheckCircle2, Circle } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useExportOnboardingData, CampaignExportStats } from "@/hooks/use-analytics-api"
import { OnboardingExportRequest } from "@/hooks/use-analytics-api"

interface Campaign {
  id: string
  campaign_name: string
  client_name: string
  client_industry: string
  is_active: boolean
  total_responses: number
  completed_responses: number
  unique_fields: string[]
  created_at: string
}

interface ExportDialogProps {
  trigger?: React.ReactNode
  defaultCampaignId?: string
}

export function ExportDialog({ trigger, defaultCampaignId }: ExportDialogProps) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [selectMode, setSelectMode] = useState<"single" | "multiple" | "all">("all")
  const [format, setFormat] = useState<"csv" | "json">("csv")
  const [dateRange, setDateRange] = useState<"7" | "30" | "90" | "365" | "all">("30")
  const roleName = typeof profile?.role === 'string' ? profile.role : profile?.role?.name

  const { mutate: exportData, isPending: isExporting, data: exportResponse, error: exportError } = useExportOnboardingData();

  // Set default campaign if provided
  useEffect(() => {
    if (defaultCampaignId && campaigns.length > 0) {
      setSelectMode("single")
      setSelectedCampaigns([defaultCampaignId])
    }
  }, [defaultCampaignId, campaigns])

  const handleCampaignToggle = (campaignId: string) => {
    if (selectMode === "single") {
      setSelectedCampaigns([campaignId])
    } else if (selectMode === "multiple") {
      setSelectedCampaigns(prev => 
        prev.includes(campaignId) 
          ? prev.filter(id => id !== campaignId)
          : [...prev, campaignId]
      )
    }
  }

  const handleSelectModeChange = (mode: "single" | "multiple" | "all") => {
    setSelectMode(mode)
    if (mode === "all") {
      setSelectedCampaigns([])
    } else if (mode === "single" && selectedCampaigns.length > 1) {
      setSelectedCampaigns([selectedCampaigns[0]])
    }
  }

  const handleSelectAll = () => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([])
    } else {
      setSelectedCampaigns(campaigns.map(c => c.id))
    }
  }

  const getSelectedCampaignsData = () => {
    if (selectMode === "all") {
      return {
        campaigns: campaigns,
        totalResponses: campaigns.reduce((sum, c) => sum + c.total_responses, 0),
        totalCompleted: campaigns.reduce((sum, c) => sum + c.completed_responses, 0)
      }
    } else {
      const selected = campaigns.filter(c => selectedCampaigns.includes(c.id))
      return {
        campaigns: selected,
        totalResponses: selected.reduce((sum, c) => sum + c.total_responses, 0),
        totalCompleted: selected.reduce((sum, c) => sum + c.completed_responses, 0)
      }
    }
  }

  const handleExport = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to export data.",
        variant: "destructive",
      });
      return;
    }

    if (selectMode !== "all" && selectedCampaigns.length === 0) {
      toast({
        title: "No campaigns selected",
        description: "Please select at least one campaign to export.",
        variant: "destructive",
      });
      return;
    }

    const requestData: OnboardingExportRequest = {
      select_mode: selectMode,
      campaign_ids: selectMode === "all" ? undefined : selectedCampaigns,
      file_format: format,
      date_range: dateRange,
    };

    exportData(requestData, {
      onSuccess: (data) => {
        toast({
          title: "Export successful!",
          description: `Your download will begin shortly.`,
        });
        // Trigger download
        window.location.href = data.download_url;
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Export failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const selectedData = getSelectedCampaignsData()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Campaign Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Export Campaign Onboarding Data
          </DialogTitle>
          <DialogDescription>
            Export onboarding responses and user data from your campaigns. Select specific campaigns or export all campaign data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Selection Mode */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Campaign Selection</Label>
            <div className="flex gap-4">
              <Button
                variant={selectMode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectModeChange("all")}
              >
                All Campaigns
              </Button>
              <Button
                variant={selectMode === "multiple" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectModeChange("multiple")}
              >
                Multiple Campaigns
              </Button>
              <Button
                variant={selectMode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectModeChange("single")}
              >
                Single Campaign
              </Button>
            </div>
          </div>

          {/* Campaign List */}
          {selectMode !== "all" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Select Campaigns</Label>
                {selectMode === "multiple" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedCampaigns.length === campaigns.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>
              
              <ScrollArea className="h-64 border rounded-md p-4">
                {isExporting ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading campaigns...</span>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No campaigns found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCampaigns.includes(campaign.id)
                            ? 'bg-primary/5 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleCampaignToggle(campaign.id)}
                      >
                        {selectMode === "multiple" ? (
                          <Checkbox
                            checked={selectedCampaigns.includes(campaign.id)}
                            onChange={() => {}}
                          />
                        ) : (
                          selectedCampaigns.includes(campaign.id) ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{campaign.campaign_name}</p>
                            {campaign.is_active ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {campaign.client_name} • {campaign.total_responses} responses • {campaign.completed_responses} completed
                          </p>
                          {campaign.unique_fields.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Fields: {campaign.unique_fields.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Export Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format">File Format</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as "csv" | "json")}>
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
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as "7" | "30" | "90" | "365" | "all")}>
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
          </div>

          {/* Export Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export Preview
              </CardTitle>
              <CardDescription>
                Summary of data that will be exported
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Campaigns:</span>
                  <Badge variant="outline">
                    {selectMode === "all" ? `All (${campaigns.length})` : selectedData.campaigns.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total Responses:</span>
                  <Badge variant="outline">{selectedData.totalResponses}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Completed Responses:</span>
                  <Badge variant="outline">{selectedData.totalCompleted}</Badge>
                </div>
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
                {roleName && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Access Level:</span>
                    <Badge variant="outline" className="capitalize">
                      {roleName}
                    </Badge>
                  </div>
                )}
              </div>

              {selectMode !== "all" && selectedData.campaigns.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-2">Selected Campaigns:</p>
                    <div className="space-y-1">
                      {selectedData.campaigns.map((campaign) => (
                        <div key={campaign.id} className="text-xs text-muted-foreground">
                          • {campaign.campaign_name} ({campaign.client_name}) - {campaign.total_responses} responses
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || (selectMode !== "all" && selectedCampaigns.length === 0)}
          >
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Campaign Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}