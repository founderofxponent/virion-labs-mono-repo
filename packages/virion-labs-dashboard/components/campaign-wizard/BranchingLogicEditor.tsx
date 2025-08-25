"use client"

import React from 'react';
import { StepBranchingBuilder } from './StepBranchingBuilder';
import { OnboardingQuestion } from '@/schemas/campaign-onboarding-field';

interface BranchingLogicEditorProps {
  questions: OnboardingQuestion[];
  onQuestionsChange: (questions: OnboardingQuestion[]) => void;
  onAddField: (step: number) => void;
  onRemoveField: (index: number) => void;
  onFieldChange: (index: number, field: keyof OnboardingQuestion, value: any) => void;
  onAddStep: () => void;
}

/**
 * BranchingLogicEditor - Simplified version that uses the new StepBranchingBuilder
 * This provides an intuitive per-step branching approach instead of complex per-option branching
 */
export function BranchingLogicEditor({ 
  questions, 
  onQuestionsChange, 
  onAddField, 
  onRemoveField, 
  onFieldChange, 
  onAddStep 
}: BranchingLogicEditorProps) {
  return (
    <StepBranchingBuilder
      questions={questions}
      onQuestionsChange={onQuestionsChange}
      onAddField={onAddField}
      onRemoveField={onRemoveField}
      onFieldChange={onFieldChange}
      onAddStep={onAddStep}
    />
  );
}