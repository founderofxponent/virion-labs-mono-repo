"use client"

import { useState, useEffect, useRef } from "react"
import { Save, Eye, EyeOff, Copy, Check, Upload, RefreshCw, Trash2 } from "lucide-react"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { WebhookTester, WebhookTestResult } from "@/lib/webhook-test"

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
      </Tabs>
    </div>
  )
}

function ProfileSettings() {
  const { profile } = useAuth()
  const { settings, loading, updateSettings, uploadUserAvatar } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Debug current profile state
  useEffect(() => {
    console.log('ProfileSettings: Current profile state:', { 
      id: profile?.id, 
      full_name: profile?.full_name, 
      avatar_url: profile?.avatar_url 
    })
  }, [profile])

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('ProfileSettings: Starting avatar upload for file:', file.name)
    setUploading(true)
    try {
      const result = await uploadUserAvatar(file)
      console.log('ProfileSettings: Avatar upload result:', result)
      
      if (result.success) {
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully.",
        })
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload avatar. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('ProfileSettings: Avatar upload error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
              <AvatarImage 
                src={profile.avatar_url} 
                alt={profile?.full_name}
                onLoad={() => console.log('ProfileSettings: Avatar image loaded:', profile.avatar_url)}
                onError={() => console.log('ProfileSettings: Avatar image failed to load:', profile.avatar_url)}
              />
            )}
            <AvatarFallback>{generateInitials(profile?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload new picture
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP or GIF. Max size 5MB.
            </p>
            {profile?.avatar_url && (
              <p className="text-xs text-gray-500 truncate max-w-sm">
                Current: {profile.avatar_url}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+1 (555) 123-4567"
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
        <div className="space-y-2">
            <Label htmlFor="twitter">Twitter Handle</Label>
            <Input 
              id="twitter" 
              placeholder="@username"
              value={formData.twitter_handle}
              onChange={(e) => setFormData(prev => ({ ...prev, twitter_handle: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <Input 
              id="instagram" 
              placeholder="@username"
              value={formData.instagram_handle}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube Channel</Label>
            <Input 
              id="youtube" 
              placeholder="https://youtube.com/@channel"
              value={formData.youtube_channel}
              onChange={(e) => setFormData(prev => ({ ...prev, youtube_channel: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discord">Discord Username</Label>
            <Input 
              id="discord" 
              placeholder="username#1234"
              value={formData.discord_username}
              onChange={(e) => setFormData(prev => ({ ...prev, discord_username: e.target.value }))}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function AccountSettings() {
  const { settings, updateSettings, changePassword, deleteAccount } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const [formData, setFormData] = useState({
    theme: "system",
    language: "en",
    timezone: "UTC",
    currency: "USD",
    login_notifications: true,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [deletePassword, setDeletePassword] = useState("")

  useEffect(() => {
    if (settings) {
      setFormData({
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
        currency: settings.currency,
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

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setChangingPassword(true)
    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword)
      if (result.success) {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        })
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to change password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter your password to confirm account deletion",
        variant: "destructive",
      })
      return
    }

    setDeletingAccount(true)
    try {
      const result = await deleteAccount(deletePassword)
      if (result.success) {
        toast({
          title: "Account deleted",
          description: "Your account has been permanently deleted.",
        })
        // User will be redirected by the auth system
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingAccount(false)
      setDeletePassword("")
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
        <CardFooter>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input 
              id="current-password" 
              type="password" 
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password" 
              type="password" 
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handlePasswordChange} 
            disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="delete-password">Enter your password to confirm:</Label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Your current password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || !deletePassword.trim()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deletingAccount ? "Deleting..." : "Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        email_notifications_new_referral: settings.email_notifications_new_referral,
        email_notifications_link_clicks: settings.email_notifications_link_clicks,
        email_notifications_weekly_reports: settings.email_notifications_weekly_reports,
        email_notifications_product_updates: settings.email_notifications_product_updates,
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
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Choose what email notifications you'd like to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
            <div className="font-medium">New Referrals</div>
            <div className="text-sm text-muted-foreground">Get notified when someone signs up using your referral link</div>
            </div>
                <Switch 
                  checked={formData.email_notifications_new_referral}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications_new_referral: checked }))}
                />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Link Clicks</div>
            <div className="text-sm text-muted-foreground">Get notified when someone clicks your referral links</div>
            </div>
                <Switch 
                  checked={formData.email_notifications_link_clicks}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications_link_clicks: checked }))}
                />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Reports</div>
            <div className="text-sm text-muted-foreground">Receive weekly summaries of your referral performance</div>
            </div>
                <Switch 
                  checked={formData.email_notifications_weekly_reports}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications_weekly_reports: checked }))}
                />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Product Updates</div>
            <div className="text-sm text-muted-foreground">Stay informed about new features and improvements</div>
            </div>
                <Switch 
                  checked={formData.email_notifications_product_updates}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications_product_updates: checked }))}
                />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Notification Preferences"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function PrivacySettings() {
  const { settings, updateSettings } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<WebhookTestResult | null>(null)

  const [formData, setFormData] = useState({
    profile_visibility: "public",
    show_earnings: false,
    show_referral_count: true,
    webhook_url: "",
    webhook_events: ["signup", "click", "conversion"],
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        profile_visibility: settings.profile_visibility,
        show_earnings: settings.show_earnings,
        show_referral_count: settings.show_referral_count,
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

  const testWebhook = async () => {
    if (!formData.webhook_url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL before testing",
        variant: "destructive",
      })
      return
    }

    setTestingWebhook(true)
    setWebhookTestResult(null)

    try {
      const result = await WebhookTester.testWebhook(formData.webhook_url, formData.webhook_events)
      setWebhookTestResult(result)
      
      if (result.success) {
        toast({
          title: "Webhook test successful",
          description: `Webhook responded in ${result.responseTime}ms with status ${result.status}`,
        })
      } else {
        toast({
          title: "Webhook test failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message || "Failed to test webhook",
        variant: "destructive",
      })
    } finally {
      setTestingWebhook(false)
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
          <CardTitle>Profile Privacy</CardTitle>
          <CardDescription>Control what information is visible to others</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Profile Visibility</Label>
            <Select value={formData.profile_visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, profile_visibility: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formData.profile_visibility === "public" && "Your profile is visible to everyone"}
              {formData.profile_visibility === "private" && "Your profile is only visible to you"}
              {formData.profile_visibility === "unlisted" && "Your profile is not discoverable but accessible via direct link"}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show Earnings</div>
              <div className="text-sm text-muted-foreground">Display your total earnings on your public profile</div>
            </div>
            <Switch 
              checked={formData.show_earnings}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_earnings: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show Referral Count</div>
              <div className="text-sm text-muted-foreground">Display the number of successful referrals on your profile</div>
            </div>
            <Switch 
              checked={formData.show_referral_count}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_referral_count: checked }))}
            />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </CardFooter>
    </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Settings</CardTitle>
          <CardDescription>Configure webhook endpoints for real-time updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
            <Input 
              id="webhook-url" 
              placeholder="https://your-server.com/webhook"
              value={formData.webhook_url}
              onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={testWebhook}
                disabled={testingWebhook || !formData.webhook_url.trim()}
              >
                {testingWebhook ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test"
                )}
              </Button>
            </div>
            {webhookTestResult && (
              <div className={`p-3 rounded-lg text-sm ${
                webhookTestResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200'
              }`}>
                <div className="font-medium">
                  {webhookTestResult.success ? "✅ Test Successful" : "❌ Test Failed"}
                </div>
                <div className="mt-1">
                  {webhookTestResult.success ? (
                    <div>
                      <div>Status: {webhookTestResult.status}</div>
                      <div>Response time: {webhookTestResult.responseTime}ms</div>
                      {webhookTestResult.headers && Object.keys(webhookTestResult.headers).length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium">Response headers:</div>
                          {Object.entries(webhookTestResult.headers).map(([key, value]) => (
                            <div key={key} className="ml-2 text-xs">
                              {key}: {value}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div>Error: {webhookTestResult.error}</div>
                      {webhookTestResult.status && <div>Status: {webhookTestResult.status}</div>}
                      {webhookTestResult.responseTime && <div>Response time: {webhookTestResult.responseTime}ms</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
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
            <div className="text-sm text-muted-foreground">
              <p>Webhook payload examples:</p>
              <div className="mt-2 space-y-1">
                <div><strong>signup:</strong> Sent when a user signs up using your referral link</div>
                <div><strong>click:</strong> Sent when someone clicks your referral link</div>
                <div><strong>conversion:</strong> Sent when a referral converts to a paying customer</div>
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

function ApiSettings() {
  const { settings, updateSettings, regenerateApiKeys } = useUserSettings()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showKeys, setShowKeys] = useState({ live: false, test: false })
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [generatedKeys, setGeneratedKeys] = useState<{ liveKey: string; testKey: string } | null>(null)

  const hasApiKeys = settings?.api_key || settings?.api_key_test

  const handleRegenerateKeys = async () => {
    setRegenerating(true)
    try {
      const keys = await regenerateApiKeys()
      if (keys) {
        setGeneratedKeys(keys)
        toast({
          title: "API keys generated",
          description: "Your new API keys have been generated successfully. Make sure to copy them now as they won't be shown again.",
        })
      } else {
        throw new Error("Failed to generate API keys")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API keys. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRegenerating(false)
    }
  }

  const copyApiKey = async (key: string, type: 'live' | 'test') => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(type)
      toast({
        title: "Copied!",
        description: `${type === 'live' ? 'Live' : 'Test'} API key copied to clipboard.`,
      })
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy API key to clipboard.",
        variant: "destructive",
      })
    }
  }

  const dismissGeneratedKeys = () => {
    setGeneratedKeys(null)
  }

  if (generatedKeys) {
  return (
      <Card>
        <CardHeader>
          <CardTitle>Your New API Keys</CardTitle>
          <CardDescription>
            Copy these keys now - they won't be shown again for security reasons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Live API Key</Label>
            <div className="flex gap-2">
              <Input value={generatedKeys.liveKey} readOnly className="font-mono" />
              <Button 
                size="sm" 
                onClick={() => copyApiKey(generatedKeys.liveKey, 'live')}
              >
                {copiedKey === 'live' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
                </div>
              </div>
          <div className="space-y-2">
            <Label>Test API Key</Label>
            <div className="flex gap-2">
              <Input value={generatedKeys.testKey} readOnly className="font-mono" />
              <Button 
                size="sm" 
                onClick={() => copyApiKey(generatedKeys.testKey, 'test')}
              >
                {copiedKey === 'test' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={dismissGeneratedKeys}>
            I've saved my keys
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            {hasApiKeys 
              ? "Manage your API keys for accessing the Virion Labs API"
              : "Generate API keys to access the Virion Labs API"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasApiKeys ? (
          <div className="space-y-4">
              <div className="space-y-2">
                <Label>Live API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    value={showKeys.live ? "sk_live_********************************" : "sk_live_••••••••••••••••••••••••••••••••"} 
                    readOnly 
                    className="font-mono"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowKeys(prev => ({ ...prev, live: !prev.live }))}
                  >
                    {showKeys.live ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => copyApiKey("sk_live_********************************", 'live')}
                  >
                    {copiedKey === 'live' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
              </div>
              <div className="space-y-2">
                <Label>Test API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    value={showKeys.test ? "sk_test_********************************" : "sk_test_••••••••••••••••••••••••••••••••"} 
                    readOnly 
                    className="font-mono"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowKeys(prev => ({ ...prev, test: !prev.test }))}
                  >
                    {showKeys.test ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => copyApiKey("sk_test_********************************", 'test')}
                  >
                    {copiedKey === 'test' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You haven't generated any API keys yet. Click the button below to generate your first set of keys.
              </p>
            </div>
          )}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Use live keys for production environments</p>
            <p>• Use test keys for development and testing</p>
            <p>• Keep your API keys secure and never share them publicly</p>
            {settings?.api_key_regenerated_at && (
              <div className="text-sm text-muted-foreground">
                Last regenerated: {new Date(settings.api_key_regenerated_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRegenerateKeys} disabled={regenerating}>
            {regenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {hasApiKeys ? "Regenerate Keys" : "Generate Keys"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
