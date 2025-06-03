"use client"

import { useState, useEffect } from "react"
import { Save, Eye, EyeOff, Copy, Check } from "lucide-react"

import { generateInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserSettings } from "@/hooks/use-user-settings"
import { useToast } from "@/hooks/use-toast"

export function SettingsPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === "admin"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          {isAdmin && <TabsTrigger value="api">API Keys</TabsTrigger>}
          {isAdmin && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <PrivacySettings />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="api" className="space-y-4">
            <ApiSettings />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="team" className="space-y-4">
            <TeamSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function ProfileSettings() {
  const { profile } = useAuth()
  const { settings, loading, updateSettings } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    bio: "",
    phone_number: "",
    twitter_handle: "",
    instagram_handle: "",
    youtube_channel: "",
    discord_username: "",
    website_url: "",
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        bio: settings.bio || "",
        phone_number: settings.phone_number || "",
        twitter_handle: settings.twitter_handle || "",
        instagram_handle: settings.instagram_handle || "",
        youtube_channel: settings.youtube_channel || "",
        discord_username: settings.discord_username || "",
        website_url: settings.website_url || "",
      })
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateSettings(formData)
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved successfully.",
        })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your profile information and social media links</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile?.full_name} />
            )}
            <AvatarFallback>{generateInitials(profile?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue={profile?.full_name} disabled />
            <p className="text-xs text-muted-foreground">Contact support to change your name</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={profile?.email} disabled />
            <p className="text-xs text-muted-foreground">Contact support to change your email</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="Enter your phone number"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              type="url" 
              placeholder="https://your-website.com"
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            placeholder="Tell us about yourself" 
            className="min-h-[100px]"
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input 
              id="twitter" 
              placeholder="@username"
              value={formData.twitter_handle}
              onChange={(e) => setFormData(prev => ({ ...prev, twitter_handle: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input 
              id="instagram" 
              placeholder="@username"
              value={formData.instagram_handle}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube</Label>
            <Input 
              id="youtube" 
              placeholder="Channel URL"
              value={formData.youtube_channel}
              onChange={(e) => setFormData(prev => ({ ...prev, youtube_channel: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discord">Discord</Label>
            <Input 
              id="discord" 
              placeholder="Username#0000"
              value={formData.discord_username}
              onChange={(e) => setFormData(prev => ({ ...prev, discord_username: e.target.value }))}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function AccountSettings() {
  const { settings, updateSettings } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    theme: "system",
    language: "en",
    timezone: "UTC",
    currency: "USD",
    two_factor_enabled: false,
    login_notifications: true,
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
        currency: settings.currency,
        two_factor_enabled: settings.two_factor_enabled,
        login_notifications: settings.login_notifications,
      })
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateSettings(formData)
      if (success) {
        toast({
          title: "Account settings updated",
          description: "Your account preferences have been saved successfully.",
        })
      } else {
        throw new Error("Failed to update account settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={formData.theme} onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">Secure your account with 2FA</div>
            </div>
            <Switch 
              checked={formData.two_factor_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, two_factor_enabled: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Login Notifications</div>
              <div className="text-sm text-muted-foreground">Get notified of new login attempts</div>
            </div>
            <Switch 
              checked={formData.login_notifications}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, login_notifications: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Update Password</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="destructive">Delete Account</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function NotificationSettings() {
  const { settings, updateSettings } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    email_notifications_new_referral: true,
    email_notifications_link_clicks: false,
    email_notifications_weekly_reports: true,
    email_notifications_product_updates: true,
    push_notifications_new_referral: false,
    push_notifications_link_clicks: false,
    push_notifications_weekly_reports: false,
    push_notifications_product_updates: false,
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        email_notifications_new_referral: settings.email_notifications_new_referral,
        email_notifications_link_clicks: settings.email_notifications_link_clicks,
        email_notifications_weekly_reports: settings.email_notifications_weekly_reports,
        email_notifications_product_updates: settings.email_notifications_product_updates,
        push_notifications_new_referral: settings.push_notifications_new_referral,
        push_notifications_link_clicks: settings.push_notifications_link_clicks,
        push_notifications_weekly_reports: settings.push_notifications_weekly_reports,
        push_notifications_product_updates: settings.push_notifications_product_updates,
      })
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateSettings(formData)
      if (success) {
        toast({
          title: "Notification preferences updated",
          description: "Your notification settings have been saved successfully.",
        })
      } else {
        throw new Error("Failed to update notification settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose how you want to be notified</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">New Referral</div>
              <div className="text-sm text-muted-foreground">When someone signs up through your link</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="email-referral" 
                  checked={formData.email_notifications_new_referral}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications_new_referral: checked }))}
                />
                <Label htmlFor="email-referral">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="push-referral" 
                  checked={formData.push_notifications_new_referral}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, push_notifications_new_referral: checked }))}
                />
                <Label htmlFor="push-referral">Push</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Link Clicks</div>
              <div className="text-sm text-muted-foreground">When someone clicks on your referral link</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="email-clicks" 
                  checked={formData.email_notifications_link_clicks}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications_link_clicks: checked }))}
                />
                <Label htmlFor="email-clicks">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="push-clicks" 
                  checked={formData.push_notifications_link_clicks}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, push_notifications_link_clicks: checked }))}
                />
                <Label htmlFor="push-clicks">Push</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Reports</div>
              <div className="text-sm text-muted-foreground">Weekly summary of your referral activity</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="email-reports" 
                  checked={formData.email_notifications_weekly_reports}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications_weekly_reports: checked }))}
                />
                <Label htmlFor="email-reports">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="push-reports" 
                  checked={formData.push_notifications_weekly_reports}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, push_notifications_weekly_reports: checked }))}
                />
                <Label htmlFor="push-reports">Push</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Product Updates</div>
              <div className="text-sm text-muted-foreground">News about product and feature updates</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="email-updates" 
                  checked={formData.email_notifications_product_updates}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications_product_updates: checked }))}
                />
                <Label htmlFor="email-updates">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="push-updates" 
                  checked={formData.push_notifications_product_updates}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, push_notifications_product_updates: checked }))}
                />
                <Label htmlFor="push-updates">Push</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function PrivacySettings() {
  const { settings, updateSettings } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    profile_visibility: "public",
    show_earnings: false,
    show_referral_count: true,
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        profile_visibility: settings.profile_visibility,
        show_earnings: settings.show_earnings,
        show_referral_count: settings.show_referral_count,
      })
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateSettings(formData)
      if (success) {
        toast({
          title: "Privacy settings updated",
          description: "Your privacy preferences have been saved successfully.",
        })
      } else {
        throw new Error("Failed to update privacy settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control your privacy and what others can see</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Profile Visibility</Label>
            <Select value={formData.profile_visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, profile_visibility: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                <SelectItem value="contacts_only">Contacts Only - Only your contacts can see your profile</SelectItem>
                <SelectItem value="private">Private - Only you can see your profile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show Earnings</div>
              <div className="text-sm text-muted-foreground">Display your earnings on your public profile</div>
            </div>
            <Switch 
              checked={formData.show_earnings}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_earnings: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show Referral Count</div>
              <div className="text-sm text-muted-foreground">Display the number of referrals on your profile</div>
            </div>
            <Switch 
              checked={formData.show_referral_count}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_referral_count: checked }))}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function ApiSettings() {
  const { settings, updateSettings } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    webhook_url: "",
    webhook_events: ["signup", "click", "conversion"],
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        webhook_url: settings.webhook_url || "",
        webhook_events: settings.webhook_events || ["signup", "click", "conversion"],
      })
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateSettings(formData)
      if (success) {
        toast({
          title: "API settings updated",
          description: "Your webhook settings have been saved successfully.",
        })
      } else {
        throw new Error("Failed to update API settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update API settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText("sk_live_51Hb9ksJHMXNjV0xj3...")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "API key copied",
        description: "The API key has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy API key to clipboard.",
        variant: "destructive",
      })
    }
  }

  const toggleEventSelection = (event: string) => {
    setFormData(prev => ({
      ...prev,
      webhook_events: prev.webhook_events.includes(event)
        ? prev.webhook_events.filter(e => e !== event)
        : [...prev.webhook_events, event]
    }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API keys for external integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="font-medium">Live API Key</div>
              <div className="flex items-center gap-2">
                <Input 
                  value={showApiKey ? "sk_live_51Hb9ksJHMXNjV0xj3..." : "••••••••••••••••••••••••••••••••"} 
                  type={showApiKey ? "text" : "password"} 
                  readOnly 
                />
                <Button variant="outline" size="sm" onClick={copyApiKey}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium">Test API Key</div>
              <div className="flex items-center gap-2">
                <Input 
                  value={showApiKey ? "sk_test_51Hb9ksJHMXNjV0xj3..." : "••••••••••••••••••••••••••••••••"} 
                  type={showApiKey ? "text" : "password"} 
                  readOnly 
                />
                <Button variant="outline" size="sm" onClick={copyApiKey}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Regenerate Keys</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>Configure webhook endpoints for real-time updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input 
              id="webhook-url" 
              placeholder="https://your-server.com/webhook"
              value={formData.webhook_url}
              onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
            />
          </div>
          <div className="space-y-4">
            <div className="font-medium">Events to send</div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Switch 
                  id="event-signup" 
                  checked={formData.webhook_events.includes("signup")}
                  onCheckedChange={() => toggleEventSelection("signup")}
                />
                <Label htmlFor="event-signup">User Signup</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="event-click" 
                  checked={formData.webhook_events.includes("click")}
                  onCheckedChange={() => toggleEventSelection("click")}
                />
                <Label htmlFor="event-click">Link Click</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="event-conversion" 
                  checked={formData.webhook_events.includes("conversion")}
                  onCheckedChange={() => toggleEventSelection("conversion")}
                />
                <Label htmlFor="event-conversion">Conversion</Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Webhook Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function TeamSettings() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your team and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt="Admin User" />
                  <AvatarFallback>AU</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Admin User</div>
                  <div className="text-sm text-muted-foreground">admin@virionlabs.com</div>
                </div>
              </div>
              <div className="text-sm font-medium">Owner</div>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt="Sarah Johnson" />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Sarah Johnson</div>
                  <div className="text-sm text-muted-foreground">sarah@virionlabs.com</div>
                </div>
              </div>
              <div className="text-sm font-medium">Admin</div>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt="Mike Peterson" />
                  <AvatarFallback>MP</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Mike Peterson</div>
                  <div className="text-sm text-muted-foreground">mike@virionlabs.com</div>
                </div>
              </div>
              <div className="text-sm font-medium">Support</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt="Emma Wilson" />
                  <AvatarFallback>EW</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Emma Wilson</div>
                  <div className="text-sm text-muted-foreground">emma@virionlabs.com</div>
                </div>
              </div>
              <div className="text-sm font-medium">Support</div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Invite Team Member</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>Configure roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="font-medium">Admin</div>
                <div className="text-sm text-muted-foreground">Full access to all settings and features</div>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="font-medium">Support</div>
                <div className="text-sm text-muted-foreground">Can view and manage user data and referrals</div>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Viewer</div>
                <div className="text-sm text-muted-foreground">Can only view data, no edit permissions</div>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Create New Role</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
