"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Settings } from 'lucide-react';
import { BranchingLogic, OnboardingQuestion } from '@/schemas/campaign-onboarding-field';

interface BranchingLogicModalProps {
  conditions: BranchingLogic[];
  questions: OnboardingQuestion[];
  availableSteps: number[];
  onConditionsChange: (conditions: BranchingLogic[]) => void;
  trigger?: React.ReactNode;
}

interface BranchingGroup {
  id: string;
  priority?: number;
  description?: string;
  targetStep: number | null; // Where to go if conditions match (null = next step)
  conditions: Array<{
    id: string;
    field_key: string | undefined;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'in_list' | 'not_in_list' | 'array_contains' | 'array_not_contains' | 'array_length_equals' | 'array_length_greater_than' | 'array_length_less_than';
    value: any;
    logicOperator?: 'AND' | 'OR'; // Logic operator AFTER this condition (not applicable for the last condition)
  }>;
}

export function BranchingLogicModal({
  conditions,
  questions,
  availableSteps,
  onConditionsChange,
  trigger
}: BranchingLogicModalProps) {
  const [open, setOpen] = useState(false);
  const [branchingGroups, setBranchingGroups] = useState<BranchingGroup[]>(() => {
    // Convert existing conditions to groups (group them by target step)
    console.log('🔍 BranchingLogicModal: Initializing with conditions:', conditions);
    
    if (conditions.length === 0) return [];
    
    const groupsMap = new Map<string, BranchingGroup>();
    
    // Filter out any completely malformed conditions first
    const validConditions = conditions.filter((condition, index) => {
      if (!condition || typeof condition !== 'object') {
        console.warn(`Skipping invalid condition at index ${index}:`, condition);
        return false;
      }
      return true;
    });
    
    validConditions.forEach((condition, index) => {
      // Safely access the target step with comprehensive null checks
      let targetStep: number | null = null;
      
      try {
        targetStep = condition.actions?.set_next_step?.step_number ?? null;
      } catch (error) {
        console.warn(`Invalid branching logic condition at index ${index}:`, condition, error);
        targetStep = null;
      }
      
      const key = targetStep?.toString() || 'next';
      
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          id: condition.id || `group_${key}_${Date.now()}`,
          priority: condition.priority,
          description: condition.description,
          targetStep,
          conditions: []
        });
      }
      
      const group = groupsMap.get(key)!;
      
      // Handle condition_group structure (multiple conditions with OR/AND logic)
      if (condition.condition_group && condition.condition_group.conditions) {
        condition.condition_group.conditions.forEach((cond, condIndex) => {
          group.conditions.push({
            id: `${condition.id}_cond_${condIndex}` || `condition_${Date.now()}`,
            field_key: cond.field_key || undefined,
            operator: cond.operator || 'equals',
            value: cond.value || undefined,
            logicOperator: condIndex < condition.condition_group!.conditions.length - 1 ? condition.condition_group!.operator : undefined
          });
        });
      }
      // Handle single condition structure
      else if (condition.condition) {
        group.conditions.push({
          id: condition.id || `condition_${Date.now()}`,
          field_key: condition.condition.field_key || undefined,
          operator: condition.condition.operator || 'equals',
          value: condition.condition.value || undefined,
          logicOperator: 'AND' // Default for single conditions
        });
      }
    });
    
    const result = Array.from(groupsMap.values());
    console.log('🔍 BranchingLogicModal: Converted to groups:', result);
    return result;
  });

  const addGroup = () => {
    const newGroup: BranchingGroup = {
      id: `group_${Date.now()}`,
      targetStep: null,
      conditions: []
    };
    setBranchingGroups([...branchingGroups, newGroup]);
  };

  const removeGroup = (groupIndex: number) => {
    setBranchingGroups(branchingGroups.filter((_, i) => i !== groupIndex));
  };

  const updateGroup = (groupIndex: number, updates: Partial<BranchingGroup>) => {
    setBranchingGroups(branchingGroups.map((group, i) =>
      i === groupIndex ? { ...group, ...updates } : group
    ));
  };

  const addConditionToGroup = (groupIndex: number) => {
    const newCondition = {
      id: `condition_${Date.now()}`,
      field_key: undefined,
      operator: 'equals' as const,
      value: undefined,
      logicOperator: 'AND' as const
    };
    
    const updatedGroups = [...branchingGroups];
    updatedGroups[groupIndex].conditions.push(newCondition);
    setBranchingGroups(updatedGroups);
  };

  const removeConditionFromGroup = (groupIndex: number, conditionIndex: number) => {
    const updatedGroups = [...branchingGroups];
    updatedGroups[groupIndex].conditions.splice(conditionIndex, 1);
    setBranchingGroups(updatedGroups);
  };

  const updateConditionInGroup = (groupIndex: number, conditionIndex: number, updates: Partial<BranchingGroup['conditions'][0]>) => {
    const updatedGroups = [...branchingGroups];
    updatedGroups[groupIndex].conditions[conditionIndex] = {
      ...updatedGroups[groupIndex].conditions[conditionIndex],
      ...updates
    };
    setBranchingGroups(updatedGroups);
  };

  const getFieldOptions = (fieldKey: string) => {
    const question = questions.find(q => q.field_key === fieldKey);
    if (question?.field_type === 'select' || question?.field_type === 'multiselect') {
      // Handle different possible field_options structures
      if (Array.isArray(question.field_options?.options)) {
        return question.field_options.options;
      }
      if (Array.isArray(question.field_options)) {
        return question.field_options;
      }
      // Check if field_options is an object with keys that might be options
      if (question.field_options && typeof question.field_options === 'object') {
        const optionsKeys = Object.keys(question.field_options);
        if (optionsKeys.length > 0) {
          // If it looks like it has option data, convert to expected format
          return optionsKeys.map(key => ({ label: key, value: key }));
        }
      }
      return [];
    }
    return [];
  };

  const handleSave = () => {
    // Convert groups back to standard BranchingLogic format
    const cleanConditions: BranchingLogic[] = [];
    
    branchingGroups.forEach(group => {
      // Only save groups that have at least one valid condition
      const validConditions = group.conditions.filter(condition => condition.field_key && condition.operator);
      
      if (validConditions.length > 0) {
        // If there's only one condition, use the simple condition format
        if (validConditions.length === 1) {
          const condition = validConditions[0];
          cleanConditions.push({
            id: group.id,
            priority: group.priority,
            description: group.description,
            condition: {
              field_key: condition.field_key!,
              operator: condition.operator,
              value: condition.value
            },
            actions: {
              set_next_step: {
                step_number: group.targetStep
              }
            }
          });
        }
        // If there are multiple conditions, use the condition_group format
        else {
          // Determine the main logic operator (use the first condition's logic operator or default to AND)
          const mainOperator = validConditions[0].logicOperator || 'AND';
          
          cleanConditions.push({
            id: group.id,
            priority: group.priority,
            description: group.description,
            condition_group: {
              operator: mainOperator,
              conditions: validConditions.map(condition => ({
                field_key: condition.field_key!,
                operator: condition.operator,
                value: condition.value
              }))
            },
            actions: {
              set_next_step: {
                step_number: group.targetStep
              }
            }
          });
        }
      }
    });
    
    onConditionsChange(cleanConditions);
    setOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4 mr-1" />
      Branching Logic
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Branching Logic</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Create condition groups to control the flow of your onboarding process. Each group has one destination and you can set individual AND/OR logic between conditions.
          </div>

          {branchingGroups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-sm text-muted-foreground">
                  No branching logic configured. Users will continue to the next step automatically.
                  <div className="mt-2">
                    <Button onClick={addGroup} variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rule Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {branchingGroups.map((group, groupIndex) => (
                <Card key={group.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Group Header */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Rule Group {groupIndex + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGroup(groupIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Group Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Description (optional)</Label>
                            <Input
                              value={group.description || ''}
                              onChange={(e) => updateGroup(groupIndex, { description: e.target.value })}
                              placeholder="Describe what this rule does..."
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Priority (optional)</Label>
                            <Input
                              type="number"
                              value={group.priority || ''}
                              onChange={(e) => updateGroup(groupIndex, { priority: e.target.value ? parseInt(e.target.value) : undefined })}
                              placeholder="Higher numbers = higher priority"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Conditions */}
                      <div className="space-y-3">
                        {group.conditions.length === 0 ? (
                          <div className="text-center text-sm text-muted-foreground py-4 bg-muted/30 rounded-md border-dashed border">
                            No conditions in this group. Add at least one condition.
                          </div>
                        ) : (
                          group.conditions.map((condition, conditionIndex) => {
                            const selectedQuestion = questions.find(q => q.field_key === condition.field_key);
                            const fieldOptions = condition.field_key ? getFieldOptions(condition.field_key) : [];
                            const isLastCondition = conditionIndex === group.conditions.length - 1;
                            
                            return (
                              <div key={condition.id}>
                                <div className="border rounded-lg p-3 bg-muted/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium">
                                      Condition {conditionIndex + 1}
                                    </Label>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeConditionFromGroup(groupIndex, conditionIndex)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Field Selection */}
                                    <div className="space-y-1">
                                      <Label className="text-xs">If field</Label>
                                      <Select
                                        value={condition.field_key || undefined}
                                        onValueChange={(value) =>
                                          updateConditionInGroup(groupIndex, conditionIndex, {
                                            field_key: value,
                                            value: undefined
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select field..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {questions
                                            .filter((q) => q.field_key && q.field_key.trim() !== '')
                                            .map((q) => (
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
                                        value={condition.operator || undefined}
                                        onValueChange={(value: string) =>
                                          updateConditionInGroup(groupIndex, conditionIndex, {
                                            operator: value as any
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
                                          <SelectItem value="greater_than_or_equal">Greater than or equal</SelectItem>
                                          <SelectItem value="less_than_or_equal">Less than or equal</SelectItem>
                                          <SelectItem value="in_list">In list</SelectItem>
                                          <SelectItem value="not_in_list">Not in list</SelectItem>
                                          <SelectItem value="array_contains">Array contains</SelectItem>
                                          <SelectItem value="array_not_contains">Array not contains</SelectItem>
                                          <SelectItem value="array_length_equals">Array length equals</SelectItem>
                                          <SelectItem value="array_length_greater_than">Array length greater than</SelectItem>
                                          <SelectItem value="array_length_less_than">Array length less than</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Value Input */}
                                    <div className="space-y-1">
                                      <Label className="text-xs">Value</Label>
                                      {fieldOptions.length > 0 ? (
                                        <Select
                                          value={condition.value?.toString() || undefined}
                                          onValueChange={(value) =>
                                            updateConditionInGroup(groupIndex, conditionIndex, {
                                              value: value
                                            })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select option..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {fieldOptions
                                              .filter((option: any) => {
                                                // Handle both string arrays and {label, value} object arrays
                                                if (typeof option === 'string') {
                                                  return option.trim() !== '';
                                                }
                                                return option.value && option.value.trim() !== '';
                                              })
                                              .map((option: any, index: number) => {
                                                // Handle both string arrays and {label, value} object arrays
                                                if (typeof option === 'string') {
                                                  return (
                                                    <SelectItem key={`${option}-${index}`} value={option}>
                                                      {option}
                                                    </SelectItem>
                                                  );
                                                }
                                                return (
                                                  <SelectItem key={`${option.value}-${index}`} value={option.value}>
                                                    {option.label || option.value}
                                                  </SelectItem>
                                                );
                                              })}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input
                                          value={condition.value?.toString() || ''}
                                          onChange={(e) =>
                                            updateConditionInGroup(groupIndex, conditionIndex, {
                                              value: selectedQuestion?.field_type === 'number' ? 
                                                (e.target.value ? Number(e.target.value) : '') : 
                                                e.target.value
                                            })
                                          }
                                          placeholder={
                                            (condition.operator && ['empty', 'not_empty'].includes(condition.operator)) 
                                              ? 'No value needed' 
                                              : 'Enter value...'
                                          }
                                          disabled={condition.operator && ['empty', 'not_empty'].includes(condition.operator)}
                                          type={selectedQuestion?.field_type === 'number' ? 'number' : 'text'}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Logic Operator Selector - Show between conditions, not after the last one */}
                                {!isLastCondition && (
                                  <div className="flex justify-center py-2">
                                    <Select
                                      value={condition.logicOperator || 'AND'}
                                      onValueChange={(value: 'AND' | 'OR') =>
                                        updateConditionInGroup(groupIndex, conditionIndex, {
                                          logicOperator: value
                                        })
                                      }
                                    >
                                      <SelectTrigger className="w-20 h-8 bg-background border-2 border-primary/20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="AND">AND</SelectItem>
                                        <SelectItem value="OR">OR</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addConditionToGroup(groupIndex)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Condition
                        </Button>
                      </div>

                      {/* Group Footer - Action */}
                      <div className="border-t pt-4 bg-muted/10 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            When conditions match, go to:
                          </span>
                          <Select
                            value={group.targetStep?.toString() || 'next'}
                            onValueChange={(value) =>
                              updateGroup(groupIndex, { 
                                targetStep: value === 'next' ? null : parseInt(value) 
                              })
                            }
                          >
                            <SelectTrigger className="w-40 h-9">
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
                  </CardContent>
                </Card>
              ))}
              
              <div className="text-center">
                <Button onClick={addGroup} variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rule Group
                </Button>
              </div>
            </div>
          )}

          {branchingGroups.length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>How it works:</strong> Rule groups are evaluated in order. Within each group, conditions are combined using the individual AND/OR logic you set between them. 
              The first group where conditions match according to your logic will determine where to go next. If no groups match, users continue to the next step.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}