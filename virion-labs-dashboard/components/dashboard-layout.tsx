"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Settings, Menu } from "lucide-react"

import { generateInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { DebugInfo } from "@/components/debug-info"

interface DashboardLayoutProps {
  children: ReactNode
  debugData?: {
    loading?: boolean
    error?: string | null
  }
}

export function DashboardLayout({ children, debugData }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const getDashboardTitle = () => {
    switch (profile?.role) {
      case "admin":
        return "Admin Dashboard"
      case "client":
        return "Client Dashboard"
      case "influencer":
      default:
        return "Influencer Dashboard"
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 lg:px-6 bg-background">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar />
              </SheetContent>
            </Sheet>

            <span className="font-medium">
              {getDashboardTitle()}
            </span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile?.full_name} />
                    )}
                    <AvatarFallback>{generateInitials(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="flex flex-col">
                    <span className="font-medium">{profile?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{profile?.email}</span>
                    <span className="text-xs text-muted-foreground capitalize">{profile?.role}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 w-full max-w-none">{children}</main>
      </div>
      
      <PerformanceMonitor />
      <DebugInfo dataLoading={debugData?.loading} error={debugData?.error} />
    </div>
  )
}
