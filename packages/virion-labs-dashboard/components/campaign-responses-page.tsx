"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Clock,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  AlertCircle,
  Circle,
  BarChart3,
  FileText
} from 'lucide-react'
import { useCampaignResponses, UserResponse, OnboardingField } from '@/hooks/use-campaign-responses'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface CampaignResponsesPageProps {
  campaignId: string
  campaignName?: string
}

export function CampaignResponsesPage({ campaignId, campaignName }: CampaignResponsesPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const {
    loading,
    error,
    fields,
    userResponses,
    fieldAnalysis,
    stats,
    refetch
  } = useCampaignResponses(campaignId)

  // Initialize selected fields when fields load
  React.useEffect(() => {
    if (fields.length > 0 && selectedFields.length === 0) {
      setSelectedFields(fields.filter(f => f.is_enabled).map(f => f.field_key))
    }
  }, [fields])

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    let filtered = userResponses

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.discord_username.toLowerCase().includes(query) ||
        user.discord_user_id.includes(query) ||
        Object.values(user.responses).some(value =>
          value.toLowerCase().includes(query)
        )
      )
    }

    return filtered
  }, [userResponses, searchQuery])

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    )
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.discord_user_id))
    }
  }

  const exportCSV = (exportType: 'all' | 'selected' | 'filtered' = 'all') => {
    let usersToExport: UserResponse[]

    switch (exportType) {
      case 'selected':
        if (selectedUsers.length === 0) {
          toast({
            title: "No Users Selected",
            description: "Please select users to export",
            variant: "destructive",
          })
          return
        }
        usersToExport = userResponses.filter(u => selectedUsers.includes(u.discord_user_id))
        break
      case 'filtered':
        usersToExport = filteredUsers
        break
      default:
        usersToExport = userResponses
    }

    // Create CSV headers
    const enabledFields = fields.filter(f => f.is_enabled && selectedFields.includes(f.field_key))
    const headers = ['Discord Username', 'Discord User ID', 'Completion Status', 'Completed Fields']
      .concat(enabledFields.map(f => f.field_label))

    // Create CSV rows
    const rows = usersToExport.map(user => {
      const baseData = [
        user.discord_username,
        user.discord_user_id,
        user.completion_status,
        `${user.completed_fields}/${user.total_fields}`
      ]
      
      const fieldData = enabledFields.map(field => 
        user.responses[field.field_key] || ''
      )

      return baseData.concat(fieldData)
    })

    // Generate CSV content
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaignName || 'campaign'}-responses-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Successful",
      description: `Exported ${usersToExport.length} user responses to CSV`,
    })
  }

  const getCompletionIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'partial': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default: return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getCompletionBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Complete</Badge>
      case 'partial':
        return <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50">Partial</Badge>
      default:
        return <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">Started</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{campaignName || 'Campaign'}</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-500 mb-2">Error loading campaign responses</div>
              <div className="text-sm text-muted-foreground mb-4">{error}</div>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{campaignName || 'Campaign'}</h1>
          <p className="text-muted-foreground">
            {stats.totalResponses} user{stats.totalResponses !== 1 ? 's' : ''} responded
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalResponses}</div>
                <div className="text-sm text-muted-foreground">Total Responses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(stats.completionRate)}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalFields}</div>
                <div className="text-sm text-muted-foreground">Fields per User</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="responses" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="responses">Response Data</TabsTrigger>
            <TabsTrigger value="analysis">Field Analysis</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportCSV('all')}>
                  Export All ({stats.totalResponses} users)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => exportCSV('filtered')}
                  disabled={filteredUsers.length === 0}
                >
                  Export Filtered ({filteredUsers.length} users)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => exportCSV('selected')}
                  disabled={selectedUsers.length === 0}
                >
                  Export Selected ({selectedUsers.length} users)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="responses" className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Field Filters Sidebar */}
            <div className="lg:w-64 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Field Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fields.filter(f => f.is_enabled).map(field => {
                    const fieldStats = fieldAnalysis.get(field.field_key)
                    return (
                      <div key={field.field_key} className="flex items-start space-x-2">
                        <Checkbox
                          id={field.field_key}
                          checked={selectedFields.includes(field.field_key)}
                          onCheckedChange={() => handleFieldToggle(field.field_key)}
                        />
                        <div className="space-y-1">
                          <Label
                            htmlFor={field.field_key}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {field.field_label}
                          </Label>
                          <div className="text-xs text-muted-foreground">
                            {fieldStats?.totalResponses || 0} responses
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFields(fields.filter(f => f.is_enabled).map(f => f.field_key))}
                    className="w-full"
                  >
                    Select All
                  </Button>
                </CardContent>
              </Card>

              {/* Search */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users or responses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Response Table */}
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      User Responses
                      <Badge variant="outline">{filteredUsers.length} users</Badge>
                    </CardTitle>
                    {selectedUsers.length > 0 && (
                      <Badge variant="outline">
                        {selectedUsers.length} selected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={handleSelectAllUsers}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        {fields.filter(f => f.is_enabled && selectedFields.includes(f.field_key)).map(field => (
                          <TableHead key={field.field_key}>{field.field_label}</TableHead>
                        ))}
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell 
                            colSpan={4 + selectedFields.length} 
                            className="text-center py-8 text-muted-foreground"
                          >
                            No responses found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map(user => (
                          <TableRow key={user.discord_user_id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(user.discord_user_id)}
                                onCheckedChange={() => handleSelectUser(user.discord_user_id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.discord_username}</div>
                                <div className="text-xs text-muted-foreground">
                                  {user.discord_user_id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getCompletionIcon(user.completion_status)}
                                {getCompletionBadge(user.completion_status)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {user.completed_fields}/{user.total_fields} fields
                              </div>
                            </TableCell>
                            {fields.filter(f => f.is_enabled && selectedFields.includes(f.field_key)).map(field => (
                              <TableCell key={field.field_key}>
                                <div className="max-w-32 truncate" title={user.responses[field.field_key] || ''}>
                                  {user.responses[field.field_key] || (
                                    <span className="text-muted-foreground italic">No response</span>
                                  )}
                                </div>
                              </TableCell>
                            ))}
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => exportCSV('selected')}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-6">
            {Array.from(fieldAnalysis.entries()).map(([fieldKey, analysis]) => (
              <Card key={fieldKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {analysis.field.field_label}
                    <Badge variant="outline" className="text-xs">
                      {analysis.field.field_type}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {analysis.totalResponses} responses • {Math.round(analysis.responseRate)}% response rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.responses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No responses for this field
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysis.responses.map((response, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <div className="font-medium">{response.value}</div>
                            <div className="text-sm text-muted-foreground">
                              {response.users.join(', ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{response.count}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((response.count / analysis.totalResponses) * 100)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show unused options for multiselect fields */}
                  {analysis.field.field_type === 'multiselect' && analysis.field.field_options?.options && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Unused Options:</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.field.field_options.options
                          .filter(option => !analysis.responses.some(r => r.value === option))
                          .map(option => (
                            <Badge key={option} variant="outline" className="text-muted-foreground">
                              {option}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}