import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Circle } from "lucide-react"

interface OnboardingStepProps {
  number: number
  title: string
  description: string
  completed: boolean
  current: boolean
  disabled?: boolean
  children: React.ReactNode
}

export function OnboardingStep({
  number,
  title,
  description,
  completed,
  current,
  disabled = false,
  children
}: OnboardingStepProps) {
  return (
    <Card className={`transition-all ${current ? 'ring-2 ring-primary' : ''} ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            completed 
              ? 'bg-green-500 text-white' 
              : current 
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}>
            {completed ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="font-semibold">{number}</span>
            )}
          </div>
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {current && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  )
} 