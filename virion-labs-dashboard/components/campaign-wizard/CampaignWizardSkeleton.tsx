import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"

export function CampaignWizardSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        <Skeleton className="h-8 w-48" />
      </div>
      
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Fixed Left Sidebar Skeleton */}
        <nav className="flex-shrink-0 w-64">
          <div className="sticky top-0">
            <ol className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <li key={index}>
                  <div className="w-full">
                    <div className={`flex items-center gap-3 p-2.5 rounded-lg ${
                      index === 0 ? "bg-primary" : "bg-muted"
                    }`}>
                      <div className={`flex items-center justify-center h-7 w-7 rounded-full ${
                        index === 0 ? "bg-primary-foreground" : "bg-background"
                      }`}>
                        <Skeleton className="h-4 w-4" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Scrollable Right Content Skeleton */}
        <div className="flex-1 overflow-y-auto">
          <div className="pb-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-32" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-24" />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form Fields Skeleton */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-20 w-full" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" disabled>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Button disabled>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 