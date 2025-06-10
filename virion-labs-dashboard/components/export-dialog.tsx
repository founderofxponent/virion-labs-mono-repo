"use client"

import { useState } from "react"
import { Download, FileText, Database, Printer, CheckCircle2 } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { AnalyticsService, AnalyticsData, ExportOptions } from "@/lib/analytics-service"

interface ExportDialogProps {
  analyticsData: AnalyticsData
  dateRange: string
  trigger?: React.ReactNode
}

export function ExportDialog({ analyticsData, dateRange, trigger }: ExportDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv')
  const [selectedSections, setSelectedSections] = useState<Array<'overview' | 'clients' | 'campaigns' | 'performance' | 'activity'>>([
    'overview', 'clients', 'campaigns', 'performance', 'activity'
  ])

  const handleSectionToggle = (section: 'overview' | 'clients' | 'campaigns' | 'performance' | 'activity', checked: boolean) => {
    if (checked) {
      setSelectedSections(prev => [...prev, section])
    } else {
      setSelectedSections(prev => prev.filter(s => s !== section))
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const exportOptions: ExportOptions = {
        format: exportFormat,
        dateRange,
        sections: selectedSections
      }

      await AnalyticsService.exportAnalytics(analyticsData, exportOptions)
      
      // Show success notification
      toast({
        title: "Export successful!",
        description: `Analytics report exported as ${exportFormat.toUpperCase()}`,
      })
      
      // Close dialog after successful export
      setTimeout(() => {
        setIsOpen(false)
        setIsExporting(false)
      }, 1000)
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your analytics report. Please try again.",
        variant: "destructive",
      })
      setIsExporting(false)
    }
  }

  const formatOptions = [
    {
      value: 'csv' as const,
      label: 'CSV Format',
      description: 'Comma-separated values for spreadsheet applications',
      icon: Database,
      recommended: true
    },
    {
      value: 'json' as const,
      label: 'JSON Format',
      description: 'Machine-readable format for developers',
      icon: FileText,
      recommended: false
    },
    {
      value: 'pdf' as const,
      label: 'PDF Report',
      description: 'Formatted report ready for presentation',
      icon: Printer,
      recommended: false
    }
  ]

  const sectionOptions = [
    {
      id: 'overview' as const,
      label: 'Overview Metrics',
      description: 'Total clients, campaigns, responses, and completion rates',
      enabled: true
    },
    {
      id: 'performance' as const,
      label: 'Performance Over Time',
      description: 'Daily/weekly performance trends',
      enabled: analyticsData.performanceData.length > 0
    },
    {
      id: 'clients' as const,
      label: 'Client Distribution',
      description: 'Client status and industry breakdown',
      enabled: analyticsData.clientData.length > 0 || analyticsData.industryData.length > 0
    },
    {
      id: 'campaigns' as const,
      label: 'Campaign Performance',
      description: 'Individual campaign metrics and completion rates',
      enabled: analyticsData.campaignData.length > 0
    },
    {
      id: 'activity' as const,
      label: 'Recent Activity',
      description: 'Latest actions and events on the platform',
      enabled: analyticsData.recentActivity.length > 0
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics Report
          </DialogTitle>
          <DialogDescription>
            Choose the format and sections to include in your analytics export. 
            Report covers the period: <strong>{dateRange.replace('-', ' ')}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
              {formatOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={option.value} 
                      className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                      {option.recommended && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Recommended
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Section Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Include Sections</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allAvailableSections = sectionOptions
                    .filter(option => option.enabled)
                    .map(option => option.id)
                  setSelectedSections(allAvailableSections)
                }}
              >
                Select All
              </Button>
            </div>
            <div className="space-y-2">
              {sectionOptions.map((option) => (
                <div key={option.id} className="flex items-start space-x-3 rounded-lg border p-3">
                  <Checkbox
                    id={option.id}
                    checked={selectedSections.includes(option.id)}
                    onCheckedChange={(checked) => handleSectionToggle(option.id, checked as boolean)}
                    disabled={!option.enabled}
                  />
                  <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={option.id} 
                      className={`text-sm font-medium cursor-pointer ${!option.enabled ? 'text-muted-foreground' : ''}`}
                    >
                      {option.label}
                      {selectedSections.includes(option.id) && option.enabled && (
                        <CheckCircle2 className="inline-block ml-2 h-3 w-3 text-green-600" />
                      )}
                    </Label>
                    <p className={`text-xs ${!option.enabled ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {option.description}
                      {!option.enabled && ' (No data available)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedSections.length === 0}
            className="min-w-[100px]"
          >
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 