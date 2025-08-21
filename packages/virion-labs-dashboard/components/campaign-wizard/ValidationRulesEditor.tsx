'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  OnboardingFieldValidation, 
  OnboardingFieldBranching 
} from '@/schemas/campaign-onboarding-field';

interface ValidationRulesEditorProps {
  fieldKey: string;
  fieldLabel: string;
  validationRules: OnboardingFieldValidation[];
  branchingLogic: OnboardingFieldBranching[];
  onValidationRulesChange: (rules: OnboardingFieldValidation[]) => void;
  onBranchingLogicChange: (logic: OnboardingFieldBranching[]) => void;
}

const VALIDATION_TYPES = [
  { value: 'required', label: 'Required', description: 'Field must not be empty' },
  { value: 'min', label: 'Minimum Length', description: 'Minimum number of characters' },
  { value: 'max', label: 'Maximum Length', description: 'Maximum number of characters' },
  { value: 'email', label: 'Email Format', description: 'Must be valid email address' },
  { value: 'url', label: 'URL Format', description: 'Must be valid URL' },
  { value: 'numeric', label: 'Numeric', description: 'Must be a valid number' },
  { value: 'contains', label: 'Contains Text', description: 'Must contain specific text' },
  { value: 'not_contains', label: 'Does Not Contain', description: 'Must not contain specific text' },
  { value: 'greater_than', label: 'Greater Than', description: 'Number must be greater than value' },
  { value: 'less_than', label: 'Less Than', description: 'Number must be less than value' },
  { value: 'equals', label: 'Equals', description: 'Must equal specific value' },
  { value: 'not_equals', label: 'Not Equals', description: 'Must not equal specific value' },
  { value: 'regex', label: 'Regular Expression', description: 'Must match regex pattern' },
  { value: 'empty', label: 'Must Be Empty', description: 'Field must be empty' },
  { value: 'not_empty', label: 'Must Not Be Empty', description: 'Field must not be empty' }
];

const BRANCHING_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal' },
  { value: 'empty', label: 'Is Empty' },
  { value: 'not_empty', label: 'Is Not Empty' }
];

const BRANCHING_ACTIONS = [
  { value: 'show', label: 'Show Fields' },
  { value: 'hide', label: 'Hide Fields' },
  { value: 'skip_to_step', label: 'Skip to Step' }
];

export function ValidationRulesEditor({
  fieldKey,
  fieldLabel,
  validationRules,
  branchingLogic,
  onValidationRulesChange,
  onBranchingLogicChange
}: ValidationRulesEditorProps) {
  const [activeTab, setActiveTab] = useState<'validation' | 'branching'>('validation');

  const addValidationRule = () => {
    const newRule: OnboardingFieldValidation = {
      type: 'required',
      value: '',
      message: ''
    };
    const currentRules = Array.isArray(validationRules) ? validationRules : [];
    onValidationRulesChange([...currentRules, newRule]);
  };

  const updateValidationRule = (index: number, updates: Partial<OnboardingFieldValidation>) => {
    const currentRules = Array.isArray(validationRules) ? validationRules : [];
    const updatedRules = currentRules.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    );
    onValidationRulesChange(updatedRules);
  };

  const removeValidationRule = (index: number) => {
    const currentRules = Array.isArray(validationRules) ? validationRules : [];
    const updatedRules = currentRules.filter((_, i) => i !== index);
    onValidationRulesChange(updatedRules);
  };

  const addBranchingRule = () => {
    const newRule: OnboardingFieldBranching = {
      condition: {
        field_key: fieldKey,
        operator: 'equals',
        value: '',
        case_sensitive: false
      },
      action: 'show',
      target_fields: []
    };
    const currentLogic = Array.isArray(branchingLogic) ? branchingLogic : [];
    onBranchingLogicChange([...currentLogic, newRule]);
  };

  const updateBranchingRule = (index: number, updates: Partial<OnboardingFieldBranching>) => {
    const currentLogic = Array.isArray(branchingLogic) ? branchingLogic : [];
    const updatedRules = currentLogic.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    );
    onBranchingLogicChange(updatedRules);
  };

  const removeBranchingRule = (index: number) => {
    const currentLogic = Array.isArray(branchingLogic) ? branchingLogic : [];
    const updatedRules = currentLogic.filter((_, i) => i !== index);
    onBranchingLogicChange(updatedRules);
  };

  const getValidationTypeConfig = (type: string) => {
    return VALIDATION_TYPES.find(t => t.value === type);
  };

  const needsValueInput = (type: string) => {
    return !['required', 'email', 'url', 'numeric', 'empty', 'not_empty'].includes(type);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Field Rules: {fieldLabel}
        </CardTitle>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'validation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('validation')}
          >
            Validation Rules
            {Array.isArray(validationRules) && validationRules.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {validationRules.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'branching' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('branching')}
          >
            Branching Logic
            {Array.isArray(branchingLogic) && branchingLogic.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {branchingLogic.length}
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {activeTab === 'validation' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Validation Rules</h4>
              <Button onClick={addValidationRule} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>

            {!Array.isArray(validationRules) || validationRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No validation rules configured.</p>
                <p className="text-xs">Click "Add Rule" to create your first validation rule.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {validationRules.map((rule, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="grid gap-4">
                        <div className="flex justify-between items-start">
                          <div className="grid gap-2 flex-1">
                            <Label htmlFor={`validation-type-${index}`}>Rule Type</Label>
                            <Select
                              value={rule.type}
                              onValueChange={(value) => updateValidationRule(index, { type: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VALIDATION_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div>
                                      <div className="font-medium">{type.label}</div>
                                      <div className="text-xs text-muted-foreground">{type.description}</div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeValidationRule(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {needsValueInput(rule.type) && (
                          <div className="grid gap-2">
                            <Label htmlFor={`validation-value-${index}`}>Value</Label>
                            <Input
                              id={`validation-value-${index}`}
                              value={String(rule.value)}
                              onChange={(e) => updateValidationRule(index, { value: e.target.value })}
                              placeholder="Enter validation value..."
                            />
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor={`validation-message-${index}`}>Custom Error Message</Label>
                          <Input
                            id={`validation-message-${index}`}
                            value={rule.message || ''}
                            onChange={(e) => updateValidationRule(index, { message: e.target.value })}
                            placeholder="Optional custom error message..."
                          />
                        </div>

                        {['contains', 'not_contains', 'equals', 'not_equals'].includes(rule.type) && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`case-sensitive-${index}`}
                              checked={rule.case_sensitive || false}
                              onCheckedChange={(checked) => updateValidationRule(index, { case_sensitive: checked })}
                            />
                            <Label htmlFor={`case-sensitive-${index}`}>Case Sensitive</Label>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'branching' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Branching Logic</h4>
              <Button onClick={addBranchingRule} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>

            {!Array.isArray(branchingLogic) || branchingLogic.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No branching logic configured.</p>
                <p className="text-xs">Click "Add Rule" to create conditional field visibility.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {branchingLogic.map((rule, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="grid gap-4">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">Branching Rule {index + 1}</h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBranchingRule(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label>Source Field</Label>
                            <Input
                              value={rule.condition.field_key}
                              onChange={(e) => updateBranchingRule(index, {
                                condition: { ...rule.condition, field_key: e.target.value }
                              })}
                              placeholder="field_key"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Operator</Label>
                            <Select
                              value={rule.condition.operator}
                              onValueChange={(value) => updateBranchingRule(index, {
                                condition: { ...rule.condition, operator: value as any }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BRANCHING_OPERATORS.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {!['empty', 'not_empty'].includes(rule.condition.operator) && (
                          <div className="grid gap-2">
                            <Label>Condition Value</Label>
                            <Input
                              value={String(rule.condition.value)}
                              onChange={(e) => updateBranchingRule(index, {
                                condition: { ...rule.condition, value: e.target.value }
                              })}
                              placeholder="Value to compare against..."
                            />
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label>Action</Label>
                          <Select
                            value={rule.action}
                            onValueChange={(value) => updateBranchingRule(index, { action: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BRANCHING_ACTIONS.map((action) => (
                                <SelectItem key={action.value} value={action.value}>
                                  {action.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {rule.action === 'skip_to_step' ? (
                          <div className="grid gap-2">
                            <Label>Target Step Number</Label>
                            <Input
                              type="number"
                              value={rule.target_step || ''}
                              onChange={(e) => updateBranchingRule(index, { target_step: parseInt(e.target.value) || undefined })}
                              placeholder="Step number to skip to..."
                            />
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            <Label>Target Fields</Label>
                            <Textarea
                              value={rule.target_fields?.join(', ') || ''}
                              onChange={(e) => updateBranchingRule(index, {
                                target_fields: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              })}
                              placeholder="field_key1, field_key2, field_key3..."
                              rows={2}
                            />
                            <p className="text-xs text-muted-foreground">
                              Comma-separated list of field keys to {rule.action}
                            </p>
                          </div>
                        )}

                        {['contains', 'not_contains', 'equals', 'not_equals'].includes(rule.condition.operator) && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={rule.condition.case_sensitive || false}
                              onCheckedChange={(checked) => updateBranchingRule(index, {
                                condition: { ...rule.condition, case_sensitive: checked }
                              })}
                            />
                            <Label>Case Sensitive</Label>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}