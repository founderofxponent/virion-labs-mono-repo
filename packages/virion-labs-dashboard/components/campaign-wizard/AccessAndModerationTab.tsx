import React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import RoleIdsInput from "@/components/role-ids-input"

import { AccessAndModerationTabProps } from "@/schemas/campaign-wizard";

export function AccessAndModerationTab({
  formData,
  handleFieldChange,
}: AccessAndModerationTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="auto_role_assignment" className="text-base">
            Auto Role Assignment
          </Label>
          <p className="text-sm text-muted-foreground">
            Automatically assign roles to users upon successful onboarding.
          </p>
        </div>
        <Switch
          id="auto_role_assignment"
          checked={formData.auto_role_assignment}
          onCheckedChange={value =>
            handleFieldChange("auto_role_assignment", value)
          }
        />
      </div>
      {formData.auto_role_assignment && (
        <div className="space-y-2 ml-4">
          <Label htmlFor="target_role_ids">Target Role IDs</Label>
          <RoleIdsInput
            value={formData.target_role_ids}
            onChange={value => handleFieldChange("target_role_ids", value)}
          />
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="moderation_enabled" className="text-base">
            Enable Moderation
          </Label>
          <p className="text-sm text-muted-foreground">
            Limit how frequently a single user can interact with the bot.
          </p>
        </div>
        <Switch
          id="moderation_enabled"
          checked={formData.moderation_enabled}
          onCheckedChange={value =>
            handleFieldChange("moderation_enabled", value)
          }
        />
      </div>
      {formData.moderation_enabled && (
        <div className="space-y-2 ml-4">
          <Label htmlFor="rate_limit_per_user">
            Interactions per User (per hour)
          </Label>
          <Input
            id="rate_limit_per_user"
            type="number"
            value={formData.rate_limit_per_user}
            onChange={e =>
              handleFieldChange("rate_limit_per_user", Number(e.target.value))
            }
            placeholder="e.g. 5"
            className="max-w-xs"
          />
        </div>
      )}
    </div>
  )
} 