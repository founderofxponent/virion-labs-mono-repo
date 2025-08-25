"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';
import { BranchingLogic, OnboardingQuestion } from '@/schemas/campaign-onboarding-field';

interface SimpleConditionBuilderProps {
  conditions: BranchingLogic[];
  questions: OnboardingQuestion[];
  availableSteps: number[];
  onConditionsChange: (conditions: BranchingLogic[]) => void;
}

export function SimpleConditionBuilder({
  conditions,
  questions,
  availableSteps,
  onConditionsChange,
}: SimpleConditionBuilderProps) {
  const addCondition = () => {
    const newCondition: BranchingLogic = {
      id: `condition_${Date.now()}`,
      condition: {
        field_key: '',
        operator: 'equals',
        value: ''
      },
      actions: {
        set_next_step: {
          step_number: null
        }
      }
    };
    onConditionsChange([...conditions, newCondition]);
  };

  const updateCondition = (index: number, updates: Partial<BranchingLogic>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onConditionsChange(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onConditionsChange(newConditions);
  };

  const getFieldOptions = (fieldKey: string) => {
    const question = questions.find(q => q.field_key === fieldKey);
    if (question?.field_type === 'select' || question?.field_type === 'multiselect') {
      return question.field_options?.options || [];
    }
    return [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Conditional Logic</h4>
          <p className="text-xs text-muted-foreground">
            Define conditions to control the next step based on user responses
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addCondition}>
          <Plus className="h-4 w-4 mr-1" />
          Add Condition
        </Button>
      </div>

      {conditions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              No conditions set. Users will continue to the next step automatically.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => {
            const selectedQuestion = questions.find(q => q.field_key === condition.condition?.field_key);
            const fieldOptions = getFieldOptions(condition.condition?.field_key || '');
            
            return (
              <Card key={condition.id || index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Condition {index + 1}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    {/* Field Selection */}
                    <div className="space-y-1">
                      <Label className="text-xs">If</Label>
                      <Select
                        value={condition.condition?.field_key || ''}
                        onValueChange={(value) =>
                          updateCondition(index, {
                            condition: {
                              ...condition.condition!,
                              field_key: value,
                              value: '' // Reset value when field changes
                            }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {questions.map((q) => (
                            <SelectItem key={q.field_key} value={q.field_key}>
                              {q.field_label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator Selection */}
                    <div className="space-y-1">
                      <Label className="text-xs">is</Label>
                      <Select
                        value={condition.condition?.operator || 'equals'}
                        onValueChange={(value: any) =>
                          updateCondition(index, {
                            condition: {
                              ...condition.condition!,
                              operator: value
                            }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equal to</SelectItem>
                          <SelectItem value="not_equals">Not equal to</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="not_contains">Does not contain</SelectItem>
                          <SelectItem value="empty">Empty</SelectItem>
                          <SelectItem value="not_empty">Not empty</SelectItem>
                          <SelectItem value="greater_than">Greater than</SelectItem>
                          <SelectItem value="less_than">Less than</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Value Input */}
                    <div className="space-y-1">
                      <Label className="text-xs">Value</Label>
                      {fieldOptions.length > 0 ? (
                        <Select
                          value={condition.condition?.value?.toString() || ''}
                          onValueChange={(value) =>
                            updateCondition(index, {
                              condition: {
                                ...condition.condition!,
                                value: value
                              }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option..." />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={condition.condition?.value?.toString() || ''}
                          onChange={(e) =>
                            updateCondition(index, {
                              condition: {
                                ...condition.condition!,
                                value: selectedQuestion?.field_type === 'number' ? 
                                  (e.target.value ? Number(e.target.value) : '') : 
                                  e.target.value
                              }
                            })
                          }
                          placeholder={
                            ['empty', 'not_empty'].includes(condition.condition?.operator || '') 
                              ? 'No value needed' 
                              : 'Enter value...'
                          }
                          disabled={['empty', 'not_empty'].includes(condition.condition?.operator || '')}
                          type={selectedQuestion?.field_type === 'number' ? 'number' : 'text'}
                        />
                      )}
                    </div>

                    {/* Next Step Selection */}
                    <div className="space-y-1">
                      <Label className="text-xs">then go to</Label>
                      <Select
                        value={condition.actions.set_next_step.step_number?.toString() || 'next'}
                        onValueChange={(value) =>
                          updateCondition(index, {
                            actions: {
                              set_next_step: {
                                step_number: value === 'next' ? null : parseInt(value)
                              }
                            }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="next">Next step</SelectItem>
                          {availableSteps.map((step) => (
                            <SelectItem key={step} value={step.toString()}>
                              Step {step}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {conditions.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <strong>Note:</strong> Conditions are evaluated in order. If multiple conditions match, the first one will be applied.
          If no conditions match, users will continue to the next step automatically.
        </div>
      )}
    </div>
  );
}