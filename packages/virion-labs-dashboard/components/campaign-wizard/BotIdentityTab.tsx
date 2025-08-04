import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { BotIdentityTabProps } from "@/schemas/campaign-wizard";

export function BotIdentityTab({
  formData,
  handleFieldChange,
}: BotIdentityTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bot_name">Bot Name</Label>
          <Input
            id="bot_name"
            placeholder="e.g. 'Virion Bot'"
            value={formData.bot_name}
            onChange={e => handleFieldChange("bot_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand_logo_url">Bot Logo URL</Label>
          <Input
            id="brand_logo_url"
            placeholder="https://example.com/logo.png"
            value={formData.brand_logo_url}
            onChange={e => handleFieldChange("brand_logo_url", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand_color">Brand Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="brand_color"
            type="color"
            value={formData.brand_color}
            onChange={e => handleFieldChange("brand_color", e.target.value)}
            className="w-16 p-1 h-10"
          />
          <Input
            type="text"
            value={formData.brand_color}
            onChange={e => handleFieldChange("brand_color", e.target.value)}
            placeholder="#6366f1"
            className="flex-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bot_personality">Bot Personality</Label>
          <Select
            value={formData.bot_personality}
            onValueChange={value =>
              handleFieldChange("bot_personality", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a personality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="helpful">Helpful</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="witty">Witty</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bot_response_style">Bot Response Style</Label>
          <Select
            value={formData.bot_response_style}
            onValueChange={value =>
              handleFieldChange("bot_response_style", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 