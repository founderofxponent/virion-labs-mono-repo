import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { PlacementAndScheduleTabProps } from "@/schemas/campaign-wizard";

export function PlacementAndScheduleTab({
  formData,
  handleFieldChange,
}: PlacementAndScheduleTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="guild_id">Discord Server ID (Guild ID)</Label>
        <Input
          id="guild_id"
          placeholder="Enter the ID of your Discord server"
          value={formData.guild_id}
          onChange={e => handleFieldChange("guild_id", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="channel_id">Primary Channel ID</Label>
        <Input
          id="channel_id"
          placeholder="Enter the ID of the channel for the bot"
          value={formData.channel_id}
          onChange={e => handleFieldChange("channel_id", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="start_date">Campaign Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={e =>
              handleFieldChange("start_date", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Campaign End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={e =>
              handleFieldChange("end_date", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  )
} 