
"use client"

import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OnboardingQuestion, BranchingLogic } from '@/schemas/campaign-onboarding-field';

interface BranchingLogicEditorProps {
  questions: OnboardingQuestion[];
  onQuestionsChange: (questions: OnboardingQuestion[]) => void;
  onAddField: (step: number) => void;
  onRemoveField: (index: number) => void;
  onFieldChange: (index: number, field: keyof OnboardingQuestion, value: any) => void;
  onAddStep: () => void;
}

function SortableQuestionItem({ question, index, onRemoveField, onFieldChange, stepNumbers, onBranchingLogicChange, maxStep }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.field_key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleOptionChange = (optionIndex: number, field: 'label' | 'value', value: string) => {
    const newOptions = [...(question.field_options?.options || [])];
    newOptions[optionIndex][field] = value;
    onFieldChange(index, 'field_options', { options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(question.field_options?.options || []), { label: '', value: '' }];
    onFieldChange(index, 'field_options', { options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = (question.field_options?.options || []).filter((_, i) => i !== optionIndex);
    onFieldChange(index, 'field_options', { options: newOptions });
  };

  const getBranchingLogicForOption = (optionValue: string) => {
    return question.branching_logic?.find(rule => rule.condition?.value === optionValue);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="p-4 border rounded-lg bg-background flex gap-4 items-start">
      <div {...listeners} className="cursor-grab p-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Question Label</Label>
            <Input
              value={question.field_label}
              onChange={(e) => onFieldChange(index, 'field_label', e.target.value)}
              placeholder="e.g., What is your email?"
            />
          </div>
          <div className="space-y-1">
            <Label>Field Type</Label>
            <Select
              value={question.field_type}
              onValueChange={(value) => onFieldChange(index, 'field_type', value)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Yes/No</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="multiselect">Multi-select</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Step Number</Label>
            <Select
              value={(question.step_number || 1).toString()}
              onValueChange={(value) => onFieldChange(index, 'step_number', parseInt(value))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxStep }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>Step {num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(question.field_type === 'select' || question.field_type === 'multiselect') && (
          <div className="space-y-2 pt-2">
            <Label>Options</Label>
            {(question.field_options?.options || []).map((option, optionIndex) => {
              const branchingRule = getBranchingLogicForOption(option.value);
              return (
                <div key={optionIndex} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => handleOptionChange(optionIndex, 'label', e.target.value)}
                    placeholder="Option Label"
                    className="flex-1"
                  />
                  <Input
                    value={option.value}
                    onChange={(e) => handleOptionChange(optionIndex, 'value', e.target.value)}
                    placeholder="Option Value"
                    className="flex-1"
                  />
                  <Select
                    value={branchingRule?.actions.set_next_step.step_number?.toString() || 'next'}
                    onValueChange={(value) => onBranchingLogicChange(index, { 
                      id: `branch_for_${option.value}`,
                      condition: { field_key: question.field_key, operator: 'equals', value: option.value },
                      actions: { set_next_step: { step_number: value === 'next' ? null : parseInt(value) } }
                    }, optionIndex)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Go to step..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="next">Continue to next step</SelectItem>
                      {stepNumbers.map(num => (
                        <SelectItem key={num} value={num.toString()}>Go to Step {num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeOption(optionIndex)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <Switch
                    checked={question.is_required}
                    onCheckedChange={(checked) => onFieldChange(index, 'is_required', checked)}
                    />
                    <Label>Required</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                    checked={question.is_enabled}
                    onCheckedChange={(checked) => onFieldChange(index, 'is_enabled', checked)}
                    />
                    <Label>Enabled</Label>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Label className="text-sm">After this question:</Label>
                <Select
                  value={question.branching_logic?.find(r => !r.condition)?.actions.set_next_step.step_number?.toString() || 'next'}
                  onValueChange={(value) => onBranchingLogicChange(index, { 
                    id: `default_branch`,
                    actions: { set_next_step: { step_number: value === 'next' ? null : parseInt(value) } }
                  })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Go to step..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next">Continue to next step</SelectItem>
                    {stepNumbers.map(num => (
                      <SelectItem key={num} value={num.toString()}>Go to Step {num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemoveField(index)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function BranchingLogicEditor({ questions, onQuestionsChange, onAddField, onRemoveField, onFieldChange, onAddStep }: BranchingLogicEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const questionsByStep = React.useMemo(() => {
    const grouped = new Map<number, OnboardingQuestion[]>();
    questions.forEach(question => {
      const step = question.step_number || 1;
      if (!grouped.has(step)) {
        grouped.set(step, []);
      }
      grouped.get(step)!.push(question);
    });
    grouped.forEach(stepQuestions => {
      stepQuestions.sort((a, b) => a.sort_order - b.sort_order);
    });
    return grouped;
  }, [questions]);

  const stepNumbers = Array.from(questionsByStep.keys()).sort((a, b) => a - b);
  const maxStep = stepNumbers.length > 0 ? Math.max(...stepNumbers) : 1;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.field_key === active.id);
      const newIndex = questions.findIndex(q => q.field_key === over.id);
      
      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      onQuestionsChange(newQuestions.map((q, i) => ({ ...q, sort_order: i })));
    }
  }

  const handleBranchingLogicChange = (questionIndex: number, rule: BranchingLogic, optionIndex?: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    if (!question.branching_logic) {
      question.branching_logic = [];
    }

    let ruleUpdated = false;
    const newBranchingLogic = question.branching_logic.map(existingRule => {
      if (optionIndex !== undefined && existingRule.condition?.value === rule.condition?.value) {
        ruleUpdated = true;
        return rule;
      } else if (optionIndex === undefined && !existingRule.condition) {
        ruleUpdated = true;
        return rule;
      }
      return existingRule;
    });

    if (!ruleUpdated) {
      newBranchingLogic.push(rule);
    }

    question.branching_logic = newBranchingLogic;
    onQuestionsChange(newQuestions);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {stepNumbers.map(stepNumber => (
          <div key={stepNumber} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Step {stepNumber}</h4>
              <Button onClick={() => onAddField(stepNumber)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
            <SortableContext items={questionsByStep.get(stepNumber)?.map(q => q.field_key) || []} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {(questionsByStep.get(stepNumber) || []).map(q => {
                  const globalIndex = questions.findIndex(gq => gq.field_key === q.field_key);
                  return (
                    <SortableQuestionItem
                      key={q.field_key}
                      question={q}
                      index={globalIndex}
                      onRemoveField={onRemoveField}
                      onFieldChange={onFieldChange}
                      stepNumbers={stepNumbers}
                      onBranchingLogicChange={handleBranchingLogicChange}
                      maxStep={maxStep}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </div>
        ))}
        <Button onClick={onAddStep} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>
    </DndContext>
  );
}
