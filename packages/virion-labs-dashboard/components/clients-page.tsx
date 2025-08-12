"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, Download, Plus, Search, User, Loader2, Zap } from "lucide-react"

import { generateInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useClients, Client } from "@/hooks/use-clients"
import { toast } from "sonner"
import { addClientSchema, AddClientData } from "@/lib/validators"

export function ClientsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { 
    clients, 
    loading, 
    error, 
    campaignCounts,
    addClient, 
    updateClient, 
    deleteClient, 
    formatDate, 
    getStats 
  } = useClients()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [showAddClient, setShowAddClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Form state for adding new client
  const [newClient, setNewClient] = useState<AddClientData>({
    name: "",
    industry: "",
    website: "",
    primary_contact: "",
    contact_email: "",
    influencers: 0
  })

  const stats = getStats()

  const filteredClients = clients
    .filter((client) => {
      if (filterStatus !== "all" && client.client_status?.toLowerCase() !== filterStatus) {
        return false
      }
      if (
        searchQuery &&
        !client.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !client.industry.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return (b.join_date ? new Date(b.join_date).getTime() : 0) - (a.join_date ? new Date(a.join_date).getTime() : 0)
      } else if (sortBy === "oldest") {
        return (a.join_date ? new Date(a.join_date).getTime() : 0) - (b.join_date ? new Date(b.join_date).getTime() : 0)
      } else if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name)
      } else if (sortBy === "most-influencers") {
        return (b.influencers || 0) - (a.influencers || 0)
      }
      return 0
    })

  const handleAddClient = async () => {
    const result = addClientSchema.safeParse(newClient)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0]] = err.message
        }
      })
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setIsSubmitting(true)
    try {
      const { error } = await addClient(result.data)

      if (error) {
        toast.error(error)
      } else {
        toast.success("Client added successfully")
        setShowAddClient(false)
        setNewClient({
          name: "",
          industry: "",
          website: "",
          primary_contact: "",
          contact_email: "",
          influencers: 0
        })
      }
    } catch (err) {
      toast.error("Failed to add client")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewClient = (client: Client) => {
    const clientId = client.documentId || client.id
    router.push(`/clients/${clientId}`)
  }

  const handleEditClient = (client: Client) => {
    const clientId = client.documentId || client.id
    router.push(`/clients/${clientId}?edit=true`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading clients</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage all your client brands and their influencers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/clients/dashboard')}>
            Open Client Dashboard
          </Button>
          <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>Add a new client brand to the platform</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name *</Label>
                  <Input 
                    id="client-name" 
                    placeholder="Enter client name"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  />
                  {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-industry">Industry *</Label>
                  <Select 
                    value={newClient.industry} 
                    onValueChange={(value) => setNewClient(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger id="client-industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gaming">Gaming</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                      <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.industry && <p className="text-red-500 text-sm">{formErrors.industry}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-website">Website</Label>
                  <Input 
                    id="client-website" 
                    placeholder="https://"
                    value={newClient.website}
                    onChange={(e) => setNewClient(prev => ({ ...prev, website: e.target.value }))}
                  />
                  {formErrors.website && <p className="text-red-500 text-sm">{formErrors.website}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-contact">Primary Contact</Label>
                  <Input 
                    id="client-contact" 
                    placeholder="Contact name"
                    value={newClient.primary_contact}
                    onChange={(e) => setNewClient(prev => ({ ...prev, primary_contact: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Contact Email</Label>
                  <Input 
                    id="client-email" 
                    type="email" 
                    placeholder="Email address"
                    value={newClient.contact_email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, contact_email: e.target.value }))}
                  />
                  {formErrors.contact_email && <p className="text-red-500 text-sm">{formErrors.contact_email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-influencers">Influencers</Label>
                  <Input 
                    id="client-influencers" 
                    type="number" 
                    min="0"
                    value={newClient.influencers}
                    onChange={(e) => setNewClient(prev => ({ ...prev, influencers: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddClient(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddClient} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="most-influencers">Most Influencers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Influencers</TableHead>
                    <TableHead>Campaigns</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => handleViewClient(client)}>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {client.logo && (
                  <AvatarImage src={client.logo.url} alt={client.name} />
                )}
                            <AvatarFallback>{generateInitials(client.name)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{client.name}</div>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleViewClient(client)}>{client.industry}</TableCell>
                      <TableCell onClick={() => handleViewClient(client)}>{client.influencers || 0}</TableCell>
                      <TableCell onClick={() => handleViewClient(client)}>
                        {campaignCounts[client.id] || 0}
                      </TableCell>
                      <TableCell onClick={() => handleViewClient(client)}>
                        <Badge
                          variant={
                            client.client_status === "active"
                              ? "default"
                              : client.client_status === "inactive"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {client.client_status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => handleViewClient(client)}>{formatDate(client.join_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewClient(client)
                            }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClient(client)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2" onClick={() => handleViewClient(client)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {client.logo && (
                  <AvatarImage src={client.logo.url} alt={client.name} />
                )}
                        <AvatarFallback>{generateInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                    </div>
                    <Badge
                      variant={
                        client.client_status === "active" ? "default" : client.client_status === "inactive" ? "secondary" : "outline"
                      }
                    >
                      {client.client_status}
                    </Badge>
                  </div>
                  <CardDescription>{client.industry}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2" onClick={() => handleViewClient(client)}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.influencers || 0} Influencers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{campaignCounts[client.id] || 0} Campaigns</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Joined {formatDate(client.join_date)}</div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewClient(client)
                      }}
                    >
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditClient(client)
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
