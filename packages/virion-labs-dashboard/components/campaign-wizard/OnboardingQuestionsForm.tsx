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
import { X, ArrowUp, ArrowDown, Plus, AlertCircle, Settings } from 'lucide-react';
import { OnboardingQuestionsFormProps } from '@/schemas/campaign-wizard';
import { OnboardingQuestion } from '@/schemas/campaign-onboarding-field';
import { ValidationRulesEditor } from './ValidationRulesEditor';

export function OnboardingQuestionsForm({ questions, onQuestionsChange }: OnboardingQuestionsFormProps) {
  const [expandedValidation, setExpandedValidation] = React.useState<number | null>(null);

  // Group questions by step
  const questionsByStep = React.useMemo(() => {
    const grouped = new Map<number, OnboardingQuestion[]>();
    questions.forEach(question => {
      const step = question.step_number || 1;
      if (!grouped.has(step)) {
        grouped.set(step, []);
      }
      grouped.get(step)!.push(question);
    });
    // Sort questions within each step by sort_order
    grouped.forEach(stepQuestions => {
      stepQuestions.sort((a, b) => a.sort_order - b.sort_order);
    });
    return grouped;
  }, [questions]);

  const maxStep = questionsByStep.size > 0 ? Math.max(...questionsByStep.keys()) : 1;

  const handleAddField = (step: number = 1) => {
    const questionsInStep = questionsByStep.get(step) || [];
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
      validation_rules: [],
      branching_logic: [],
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const handleAddStep = () => {
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

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the questions in the current order
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

    // Update sort_order based on new positions
    const reorderedQuestions = newQuestions.map((q, i) => ({ 
      ...q, 
      sort_order: i 
    }));
    
    onQuestionsChange(reorderedQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Multi-Step Onboarding</h3>
          <p className="text-sm text-muted-foreground">
            Organize questions into steps. Each step will be a separate modal with up to 5 questions.
          </p>
        </div>
        <Button onClick={handleAddStep} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>

      {Array.from(questionsByStep.keys()).sort((a, b) => a - b).map((stepNumber) => {
        const stepQuestions = questionsByStep.get(stepNumber) || [];
        return (
          <div key={stepNumber} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium">Step {stepNumber}</h4>
              <div className="flex gap-2">
                <span className="text-sm text-muted-foreground">
                  {stepQuestions.length} question{stepQuestions.length !== 1 ? 's' : ''}
                </span>
                <Button 
                  onClick={() => handleAddField(stepNumber)} 
                  variant="ghost" 
                  size="sm"
                  disabled={stepQuestions.length >= 5}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>
            </div>
            
            {stepQuestions.length >= 5 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This step has 5 questions (Discord modal limit). Add new questions to a different step.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {stepQuestions.map((q, stepIndex) => {
                const globalIndex = questions.findIndex(gq => gq.field_key === q.field_key);
                return (
                  <React.Fragment key={q.id || `step-${stepNumber}-${stepIndex}`}>
                    <div className="p-4 border rounded-lg bg-muted/20 flex gap-4 items-start">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor={`question-label-${globalIndex}`}>Question Label</Label>
                            <Input
                              id={`question-label-${globalIndex}`}
                              value={q.field_label}
                              onChange={(e) => handleFieldChange(globalIndex, 'field_label', e.target.value)}
                              placeholder="e.g., What is your email?"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Field Type</Label>
                            <Select
                              value={q.field_type}
                              onValueChange={(value) => handleFieldChange(globalIndex, 'field_type', value)}
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
                          <div className="space-y-1">
                            <Label>Step Number</Label>
                            <Select
                              value={(q.step_number || 1).toString()}
                              onValueChange={(value) => handleFieldChange(globalIndex, 'step_number', parseInt(value))}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: maxStep + 1 }, (_, i) => i + 1).map(num => (
                                  <SelectItem key={num} value={num.toString()}>Step {num}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 pt-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`is_required-${globalIndex}`}
                              checked={q.is_required}
                              onCheckedChange={(checked) => handleFieldChange(globalIndex, 'is_required', checked)}
                            />
                            <Label htmlFor={`is_required-${globalIndex}`}>Required</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`is_enabled-${globalIndex}`}
                              checked={q.is_enabled}
                              onCheckedChange={(checked) => handleFieldChange(globalIndex, 'is_enabled', checked)}
                            />
                            <Label htmlFor={`is_enabled-${globalIndex}`}>Enabled</Label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Role IDs to Assign (when step completes)</Label>
                          <Input
                            value={q.step_role_ids?.join(', ') || ''}
                            onChange={(e) => handleFieldChange(globalIndex, 'step_role_ids', 
                              e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            )}
                            placeholder="role_id_1, role_id_2, role_id_3"
                          />
                          <p className="text-xs text-muted-foreground">
                            Comma-separated Discord role IDs to assign when this step is completed
                          </p>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedValidation(expandedValidation === globalIndex ? null : globalIndex)}
                            className="w-full"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {expandedValidation === globalIndex ? 'Hide' : 'Configure'} Validation Rules
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleMoveField(globalIndex, 'up')} 
                          disabled={stepIndex === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleMoveField(globalIndex, 'down')} 
                          disabled={stepIndex === stepQuestions.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveField(globalIndex)} 
                          aria-label="Delete question"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {expandedValidation === globalIndex && (
                      <div className="mt-4">
                        <ValidationRulesEditor
                          fieldKey={q.field_key}
                          fieldLabel={q.field_label}
                          validationRules={q.validation_rules || []}
                          branchingLogic={q.branching_logic || []}
                          onValidationRulesChange={(rules) => handleFieldChange(globalIndex, 'validation_rules', rules)}
                          onBranchingLogicChange={(logic) => handleFieldChange(globalIndex, 'branching_logic', logic)}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {stepQuestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No questions in this step.</p>
                <Button onClick={() => handleAddField(stepNumber)} variant="ghost" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Question
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {questionsByStep.size === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No onboarding steps configured yet.</p>
          <p className="text-sm mb-4">Get started by adding your first step and questions.</p>
          <Button onClick={() => handleAddField(1)} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Add First Question
          </Button>
        </div>
      )}
    </div>
  );
} 