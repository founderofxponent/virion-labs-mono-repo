"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { X, ArrowUp, ArrowDown, Plus, AlertCircle } from 'lucide-react';
import { type OnboardingQuestion } from './CampaignWizard';

interface OnboardingQuestionsFormProps {
  questions: OnboardingQuestion[];
  onQuestionsChange: (questions: OnboardingQuestion[]) => void;
}

export function OnboardingQuestionsForm({ questions, onQuestionsChange }: OnboardingQuestionsFormProps) {
  const isLimitReached = questions.length >= 5;

  const handleAddField = () => {
    if (isLimitReached) return;
    const newQuestion: OnboardingQuestion = {
      field_label: '',
      field_key: `new_question_${Date.now()}`,
      field_type: 'text',
      is_required: true,
      is_enabled: true,
      sort_order: questions.length,
      field_options: [],
      validation_rules: {},
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const handleRemoveField = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onQuestionsChange(newQuestions.map((q, i) => ({ ...q, sort_order: i })));
  };

  const handleFieldChange = (index: number, field: keyof OnboardingQuestion, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    onQuestionsChange(newQuestions);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

    onQuestionsChange(newQuestions.map((q, i) => ({ ...q, sort_order: i })));
  };

  return (
    <div className="space-y-4">
      {isLimitReached && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Question Limit Reached</AlertTitle>
          <AlertDescription>
            Discord supports a maximum of 5 questions per onboarding form. To add a new question, please remove an existing one.
          </AlertDescription>
        </Alert>
      )}

      {questions.map((q, index) => (
          <div key={q.id || `new-${index}`} className="p-4 border rounded-lg bg-muted/50 flex gap-4 items-start">
              <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                  <Label>Question Label</Label>
                  <Input
                      value={q.field_label}
                      onChange={(e) => handleFieldChange(index, 'field_label', e.target.value)}
                      placeholder="e.g., What is your email?"
                  />
                  </div>
                  <div className="space-y-1">
                  <Label>Field Type</Label>
                  <Select
                      value={q.field_type}
                      onValueChange={(value) => handleFieldChange(index, 'field_type', value)}
                  >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      </SelectContent>
                  </Select>
                  </div>
              </div>
              <div className="flex items-center space-x-4 pt-2">
                  <div className="flex items-center space-x-2">
                  <Switch
                      id={`is_required-${index}`}
                      checked={q.is_required}
                      onCheckedChange={(checked) => handleFieldChange(index, 'is_required', checked)}
                  />
                  <Label htmlFor={`is_required-${index}`}>Required</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                  <Switch
                      id={`is_enabled-${index}`}
                      checked={q.is_enabled}
                      onCheckedChange={(checked) => handleFieldChange(index, 'is_enabled', checked)}
                  />
                  <Label htmlFor={`is_enabled-${index}`}>Enabled</Label>
                  </div>
              </div>
              </div>
              <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleMoveField(index, 'up')} disabled={index === 0}>
                      <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleMoveField(index, 'down')} disabled={index === questions.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveField(index)}>
                      <X className="h-4 w-4" />
                  </Button>
              </div>
          </div>
      ))}

      <Button variant="outline" size="sm" onClick={handleAddField} className="mt-4" disabled={isLimitReached}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
      </Button>
    </div>
  );
} 