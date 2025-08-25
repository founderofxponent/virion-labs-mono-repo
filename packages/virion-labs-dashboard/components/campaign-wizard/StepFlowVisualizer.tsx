"use client"

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowDown, Split, CheckCircle2 } from 'lucide-react';
import { BranchingLogic, OnboardingQuestion, StepBranchingRule } from '@/schemas/campaign-onboarding-field';

interface StepFlowVisualizerProps {
  questions: OnboardingQuestion[];
  className?: string;
}

interface StepInfo {
  stepNumber: number;
  questionCount: number;
  hasConditionalLogic: boolean;
  branchingRules: BranchingLogic[];
  nextSteps: Set<number>;
}

export function StepFlowVisualizer({ questions, className }: StepFlowVisualizerProps) {
  // Organize questions by step and analyze branching
  const stepInfo = React.useMemo(() => {
    const steps = new Map<number, StepInfo>();
    
    questions.forEach(question => {
      const stepNum = question.step_number || 1;
      
      if (!steps.has(stepNum)) {
        steps.set(stepNum, {
          stepNumber: stepNum,
          questionCount: 0,
          hasConditionalLogic: false,
          branchingRules: [],
          nextSteps: new Set()
        });
      }
      
      const step = steps.get(stepNum)!;
      step.questionCount++;
      
      // Check for branching logic
      if (question.branching_logic && question.branching_logic.length > 0) {
        step.hasConditionalLogic = true;
        step.branchingRules.push(...question.branching_logic);
        
        // Track which steps this step can branch to
        question.branching_logic.forEach(rule => {
          if (rule.actions.set_next_step.step_number) {
            step.nextSteps.add(rule.actions.set_next_step.step_number);
          }
        });
      }
      
      // Add default next step
      const nextStep = stepNum + 1;
      const maxStep = Math.max(...Array.from(steps.keys()));
      if (nextStep <= maxStep + 1) {
        step.nextSteps.add(nextStep);
      }
    });
    
    return Array.from(steps.values()).sort((a, b) => a.stepNumber - b.stepNumber);
  }, [questions]);

  const renderStepNode = (step: StepInfo, index: number) => {
    const isLast = index === stepInfo.length - 1;
    
    return (
      <div key={step.stepNumber} className="flex flex-col items-center">
        {/* Step Card */}
        <Card 
          className={`w-48 transition-all duration-200 ${
            step.hasConditionalLogic 
              ? 'border-amber-200 bg-amber-50' 
              : 'border-green-200 bg-green-50'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Step {step.stepNumber}</h4>
              {step.hasConditionalLogic && (
                <Badge variant="secondary" className="text-xs">
                  <Split className="h-3 w-3 mr-1" />
                  Branching
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {step.questionCount} question{step.questionCount !== 1 ? 's' : ''}
            </div>
            
            {step.hasConditionalLogic && (
              <div className="mt-2 space-y-1">
                <div className="text-xs font-medium">Goes to:</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(step.nextSteps).sort((a, b) => a - b).map(nextStep => (
                    <Badge key={nextStep} variant="outline" className="text-xs">
                      {nextStep > stepInfo.length ? 'End' : `Step ${nextStep}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Arrow to next step */}
        {!isLast && (
          <div className="my-3 flex flex-col items-center">
            {step.hasConditionalLogic ? (
              <div className="flex items-center text-amber-600">
                <Split className="h-4 w-4 mr-1" />
                <span className="text-xs">Conditional</span>
              </div>
            ) : (
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
        
        {/* End indicator */}
        {isLast && (
          <div className="mt-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs text-green-600 mt-1 font-medium">Complete</span>
          </div>
        )}
      </div>
    );
  };

  if (stepInfo.length === 0) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Split className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No steps configured yet</p>
            <p className="text-xs">Add questions to see the flow visualization</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Onboarding Flow</h3>
          <p className="text-sm text-muted-foreground">
            Visual representation of your onboarding steps and branching logic
          </p>
        </div>
        
        <div className="flex flex-col items-center space-y-0">
          {stepInfo.map((step, index) => renderStepNode(step, index))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-xs font-medium mb-2">Legend:</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span className="text-muted-foreground">Linear step</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
              <span className="text-muted-foreground">Conditional branching</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}