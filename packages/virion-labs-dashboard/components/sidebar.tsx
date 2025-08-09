"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LinkIcon,
  Users,
  Settings,
  LayoutDashboard,
  Bot,
  Target,
  UserCheck,
  BarChart3,
  Mail,
  Box,
} from "lucide-react"
import { cn, generateInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useAccessRequestsApi } from "@/hooks/use-access-requests-api"

export function Sidebar() {
  const { profile } = useAuth()
  const pathname = usePathname()
  const userRole = (typeof profile?.role === 'string' ? profile.role : profile?.role?.name)?.toLowerCase()
  const isAdmin = userRole === "admin" || userRole === "platform administrator"
  const isClient = userRole === "client"
  const { requests } = useAccessRequestsApi()
  const pendingCount = requests.filter(r => r.request_status === 'pending').length

  const influencerNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      title: "Available Campaigns",
      href: "/campaigns",
      icon: Target,
      active: pathname === "/campaigns",
    },
    {
      title: "My Links",
      href: "/links",
      icon: LinkIcon,
      active: pathname === "/links",
    },
    {
      title: "Referrals",
      href: "/referrals",
      icon: Users,
      active: pathname === "/referrals",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  const adminNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      title: "Clients",
      href: "/clients",
      icon: Users,
      active: pathname === "/clients",
    },
    {
      title: "Campaigns",
      href: "/bot-campaigns",
      icon: Bot,
      active: pathname === "/bot-campaigns" || pathname.startsWith("/bot-campaigns"),
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      active: pathname === "/analytics",
    },
    {
      title: "Access Requests",
      href: "/admin/access-requests",
      icon: UserCheck,
      active: pathname === "/admin/access-requests",
    },
    {
      title: "Email Templates",
      href: "/email-templates",
      icon: Mail,
      active: pathname === "/email-templates",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  const clientNavItems = [
    {
      title: "Dashboard",
      href: "/clients/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/clients/dashboard",
    },
    {
      title: "Products",
      href: "/clients/products",
      icon: Box,
      active: pathname === "/clients/products",
    },
    {
      title: "Campaigns",
      href: "/clients/campaigns",
      icon: Target,
      active: pathname === "/clients/campaigns" || pathname.startsWith("/clients/campaigns"),
    },
    {
      title: "Create Campaign",
      href: "/onboarding",
      icon: Target,
      active: pathname === "/onboarding",
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      active: pathname === "/analytics",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  const getNavItems = () => {
    if (isAdmin) return adminNavItems
    if (isClient) return clientNavItems
    return influencerNavItems
  }

  const navItems = getNavItems()

  return (
    <div className="h-screen flex flex-col border-r bg-background">
      {/* Logo and Brand */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="rounded-md p-1 flex items-center justify-center">
            <Image 
              src="/virion-labs-logo-black.png" 
              alt="Virion Labs" 
              width={32} 
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
          <span className="font-bold text-xl">Virion Labs</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-6 px-3">
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors relative",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.title}</span>
                {/* Show badge for Access Requests if there are pending requests */}
                {isAdmin && item.title === "Access Requests" && pendingCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1.5 animate-pulse">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile?.full_name} />
            )}
            <AvatarFallback>{generateInitials(profile?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left min-w-0 flex-1">
            <span className="font-medium text-sm truncate">{profile?.full_name}</span>
            <span className="text-xs text-muted-foreground capitalize">{(typeof profile?.role === 'string' ? profile.role : profile?.role?.name) || ''}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
