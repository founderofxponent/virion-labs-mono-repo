"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  LinkIcon,
  Users,
  Settings,
  LayoutDashboard,
  Activity,
  Bot,
  Database,
} from "lucide-react"
import { cn, generateInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"

export function Sidebar() {
  const { profile } = useAuth()
  const pathname = usePathname()
  const isAdmin = profile?.role === "admin"
  const isClient = profile?.role === "client"

  const influencerNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
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
      title: "Bots",
      href: "/bots",
      icon: Bot,
      active: pathname === "/bots",
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: Activity,
      active: pathname === "/analytics",
    },
    {
      title: "Onboarding Fields",
      href: "/onboarding",
      icon: Database,
      active: pathname === "/onboarding",
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
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: Activity,
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
          <div className="bg-black rounded-md p-2 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
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
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
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
            <span className="text-xs text-muted-foreground capitalize">{profile?.role}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
