
"use client"

import React from 'react';
import { OnboardingQuestionsFormProps } from '@/schemas/campaign-wizard';
import { OnboardingQuestion } from '@/schemas/campaign-onboarding-field';
import { BranchingLogicEditor } from './BranchingLogicEditor';

export function OnboardingQuestionsForm({ questions, onQuestionsChange }: OnboardingQuestionsFormProps) {
  
  const handleAddField = (step: number = 1) => {
    const questionsInStep = questions.filter(q => q.step_number === step);
    const newSortOrder = questionsInStep.length > 0 ? Math.max(...questionsInStep.map(q => q.sort_order)) + 1 : 0;
    
    const newQuestion: OnboardingQuestion = {
      field_label: '',
      field_key: `new_question_${Date.now()}`,
      field_type: 'text',
      is_required: true,
      is_enabled: true,
      sort_order: newSortOrder,
      step_number: step,
      step_role_ids: [],
      field_options: [],
      validation_rules: {},
      branching_logic: [],
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const handleAddStep = () => {
    const maxStep = questions.length > 0 ? Math.max(...questions.map(q => q.step_number || 1)) : 0;
    const newStep = maxStep + 1;
    handleAddField(newStep);
  };

  const handleRemoveField = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onQuestionsChange(newQuestions);
  };

  const handleFieldChange = (index: number, field: keyof OnboardingQuestion, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    onQuestionsChange(newQuestions);
  };

  return (
    <div className="space-y-6">
      <BranchingLogicEditor
        questions={questions}
        onQuestionsChange={onQuestionsChange}
        onAddField={handleAddField}
        onRemoveField={handleRemoveField}
        onFieldChange={handleFieldChange}
        onAddStep={handleAddStep}
      />
    </div>
  );
}

