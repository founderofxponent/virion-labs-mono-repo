"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useReferralLinks } from "@/hooks/use-referral-links"
import { type ReferralLink, type Platform } from "@/lib/supabase"
import { toast } from "sonner"

const linkFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
  platform: z.enum(["YouTube", "Instagram", "TikTok", "Twitter", "Facebook", "LinkedIn", "Other"] as const),
  original_url: z.string().url("Please enter a valid URL"),
  thumbnail_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  expires_at: z.date().optional(),
})

type LinkFormData = z.infer<typeof linkFormSchema>

interface ReferralLinkFormProps {
  link?: ReferralLink
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReferralLinkForm({ link, onSuccess, onCancel }: ReferralLinkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addLink, updateLink } = useReferralLinks()
  const isEditing = !!link

  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      title: link?.title || "",
      description: link?.description || "",
      platform: (link?.platform as Platform) || "YouTube",
      original_url: link?.original_url || "",
      thumbnail_url: link?.thumbnail_url || "",
      is_active: link?.is_active ?? true,
      expires_at: link?.expires_at ? new Date(link.expires_at) : undefined,
    },
  })

  const onSubmit = async (data: LinkFormData) => {
    setIsSubmitting(true)
    
    try {
      const formData = {
        ...data,
        expires_at: data.expires_at?.toISOString() || null,
        thumbnail_url: data.thumbnail_url || null,
        description: data.description || null,
      }

      let result
      if (isEditing) {
        result = await updateLink(link.id, formData)
      } else {
        result = await addLink(formData)
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? "Link updated successfully!" : "Link created successfully!")
        onSuccess?.()
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Summer Collection Review"
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional description for your referral link"
            rows={3}
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              value={form.watch("platform")}
              onValueChange={(value: Platform) => form.setValue("platform", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Twitter">Twitter</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.platform && (
              <p className="text-sm text-red-500">{form.formState.errors.platform.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="original_url">Original URL *</Label>
            <Input
              id="original_url"
              type="url"
              placeholder="https://example.com/product"
              {...form.register("original_url")}
            />
            {form.formState.errors.original_url && (
              <p className="text-sm text-red-500">{form.formState.errors.original_url.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
          <Input
            id="thumbnail_url"
            type="url"
            placeholder="https://example.com/thumbnail.jpg"
            {...form.register("thumbnail_url")}
          />
          {form.formState.errors.thumbnail_url && (
            <p className="text-sm text-red-500">{form.formState.errors.thumbnail_url.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={form.watch("is_active")}
              onCheckedChange={(checked) => form.setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("expires_at") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("expires_at") ? (
                    format(form.watch("expires_at")!, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("expires_at")}
                  onSelect={(date) => form.setValue("expires_at", date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Link" : "Create Link"}
        </Button>
      </div>
    </form>
  )
} 