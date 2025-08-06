import React from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface RoleIdsInputProps {
  id?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export default function RoleIdsInput({ id, value, onChange, placeholder }: RoleIdsInputProps) {
  const [inputValue, setInputValue] = React.useState("")

  const addIds = (ids: string[]) => {
    const newIds = ids
      .map((v) => v.trim())
      .filter((v) => v && !value.includes(v))
    if (newIds.length > 0) {
      onChange([...value, ...newIds])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.includes(",")) {
      const parts = val.split(",")
      addIds(parts)
      setInputValue("")
    } else {
      setInputValue(val)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (inputValue.trim()) {
        addIds([inputValue])
        setInputValue("")
      }
    }
  }

  const removeId = (idx: number) => {
    const newValues = value.filter((_, i) => i !== idx)
    onChange(newValues)
  }

  return (
    <div>
      <div className="flex items-center flex-wrap gap-2 rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((idVal, idx) => (
          <Badge key={idx} variant="secondary" className="flex items-center gap-1">
            <span>{idVal}</span>
            <button
              type="button"
              onClick={() => removeId(idx)}
              className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addIds([inputValue]);
              setInputValue("");
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 h-auto min-w-[80px] bg-transparent p-0 border-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Type an ID and press Enter, or paste a comma-separated list. The input will grow as you add more IDs.
      </p>
    </div>
  )
}
