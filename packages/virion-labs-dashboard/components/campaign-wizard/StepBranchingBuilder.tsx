"use client"

import React, { useCallback, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverEvent, Active, Over, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X, Settings, ChevronDown, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingQuestion, BranchingLogic } from '@/schemas/campaign-onboarding-field';
import { BranchingLogicModal } from './BranchingLogicModal';

// Debounce utility for performance optimization
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  
  return React.useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}

interface StepBranchingBuilderProps {
  questions: OnboardingQuestion[];
  onQuestionsChange: (questions: OnboardingQuestion[]) => void;
  onAddField: (step: number) => void;
  onRemoveField: (index: number) => void;
  onFieldChange: (index: number, field: keyof OnboardingQuestion, value: unknown) => void;
  onAddStep: () => void;
}

// Global registry for flush functions - simple approach for handling pending updates
const flushRegistry = new Set<() => void>();

// Export function to flush all pending updates before save operations
export const flushAllPendingUpdates = () => {
  flushRegistry.forEach(flushFn => flushFn());
};

interface StepHeaderProps {
  stepNumber: number;
  questions: OnboardingQuestion[];
  availableSteps: number[];
  onAddField: (step: number) => void;
  onStepBranchingChange: (stepNumber: number, branchingLogic: BranchingLogic[]) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function StepHeader({ 
  stepNumber, 
  questions, 
  availableSteps, 
  onAddField, 
  onStepBranchingChange,
  isCollapsed,
  onToggleCollapse
}: StepHeaderProps) {
  // Get the first question's branching logic as the step's branching logic
  // We'll store it on the first question of each step for simplicity
  const firstQuestion = questions.find(q => q.step_number === stepNumber);
  const stepBranchingLogic = firstQuestion?.branching_logic || [];

  const handleStepBranchingLogicChange = (newBranchingLogic: BranchingLogic[]) => {
    onStepBranchingChange(stepNumber, newBranchingLogic);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-1"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <CardTitle className="text-lg">Step {stepNumber}</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        <BranchingLogicModal
          conditions={stepBranchingLogic}
          questions={questions}
          availableSteps={availableSteps}
          onConditionsChange={handleStepBranchingLogicChange}
          trigger={
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Branching Logic
              {stepBranchingLogic && stepBranchingLogic.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {stepBranchingLogic.length}
                </Badge>
              )}
            </Button>
          }
        />
        <Button onClick={() => onAddField(stepNumber)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
    </div>
  );
}

function StepPreview({ questions }: { questions: OnboardingQuestion[] }) {
  if (questions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No questions added yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-2">
        {questions.length} question{questions.length !== 1 ? 's' : ''}:
      </div>
      <div className="grid gap-2">
        {questions.map((question, index) => (
          <div key={question.field_key} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              {question.field_type}
            </Badge>
            <span className="truncate">
              {question.field_label || 'Untitled Question'}
            </span>
            {question.is_required && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DroppableStepContainer({ 
  stepNumber, 
  children, 
  isDropping 
}: { 
  stepNumber: number; 
  children: React.ReactNode; 
  isDropping?: boolean 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `step-${stepNumber}`,
    data: {
      type: 'step',
      stepNumber,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`relative transition-all duration-200 ${
        isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg' : ''
      } ${isDropping ? 'opacity-50' : ''}`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 border-2 border-blue-300 border-dashed rounded-lg">
          <div className="text-blue-600 font-medium bg-white px-4 py-2 rounded-md shadow-sm">
            Drop question here for Step {stepNumber}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableQuestionItem({ 
  question, 
  index, 
  onRemoveField, 
  onFieldChange, 
  maxStep
}: {
  question: OnboardingQuestion;
  index: number;
  onRemoveField: (index: number) => void;
  onFieldChange: (index: number, field: keyof OnboardingQuestion, value: unknown) => void;
  maxStep: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.field_key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Local state for option values to enable fast typing
  const [localOptions, setLocalOptions] = React.useState<{ label: string; value: string }[]>(() => 
    question.field_options?.options || []
  );

  // Sync local state with props when question changes
  React.useEffect(() => {
    const propsOptions = question.field_options?.options || [];
    setLocalOptions(propsOptions);
  }, [question.field_options?.options]);

  // Ref to track if we have pending updates
  const hasPendingUpdates = React.useRef(false);
  const pendingOptions = React.useRef<{ label: string; value: string }[]>([]);

  // Debounced update to parent component
  const debouncedUpdateOptions = useDebounce((newOptions: { label: string; value: string }[]) => {
    onFieldChange(index, 'field_options', { options: newOptions });
    hasPendingUpdates.current = false;
  }, 300);

  // Immediate update function for critical situations (like before save)
  const flushPendingUpdates = useCallback(() => {
    if (hasPendingUpdates.current && pendingOptions.current.length > 0) {
      onFieldChange(index, 'field_options', { options: pendingOptions.current });
      hasPendingUpdates.current = false;
    }
  }, [onFieldChange, index]);

  // Register/unregister flush function with global registry
  React.useEffect(() => {
    flushRegistry.add(flushPendingUpdates);
    return () => {
      flushPendingUpdates(); // Flush on unmount
      flushRegistry.delete(flushPendingUpdates);
    };
  }, [flushPendingUpdates]);

  React.useEffect(() => {
    flushPendingUpdates();
  }, [question.field_key, flushPendingUpdates]);

  const handleOptionChange = useCallback((optionIndex: number, value: string) => {
    const newOptions = [...localOptions];
    if (newOptions[optionIndex]) {
      newOptions[optionIndex].value = value;
      newOptions[optionIndex].label = value;
    }
    setLocalOptions(newOptions);
    hasPendingUpdates.current = true;
    pendingOptions.current = newOptions;
    debouncedUpdateOptions(newOptions);
  }, [localOptions, debouncedUpdateOptions]);

  const addOption = useCallback(() => {
    const nextOptionNumber = localOptions.length + 1;
    const newOptions = [...localOptions, { label: `Option ${nextOptionNumber}`, value: `option_${nextOptionNumber}` }];
    setLocalOptions(newOptions);
    // Immediate update for add/remove operations
    onFieldChange(index, 'field_options', { options: newOptions });
    hasPendingUpdates.current = false; // Clear pending since we just updated
  }, [localOptions, onFieldChange, index]);

  const removeOption = useCallback((optionIndex: number) => {
    const newOptions = localOptions.filter((_option: any, i: number) => i !== optionIndex);
    setLocalOptions(newOptions);
    // Immediate update for add/remove operations
    onFieldChange(index, 'field_options', { options: newOptions });
    hasPendingUpdates.current = false; // Clear pending since we just updated
  }, [localOptions, onFieldChange, index]);

  // Ensure select/multiselect fields have an initial option with a placeholder value
  React.useEffect(() => {
    if ((question.field_type === 'select' || question.field_type === 'multiselect')) {
      const hasValidOptions = localOptions.length > 0;
      
      if (!hasValidOptions) {
        const initialOptions = [{ label: 'Option 1', value: 'option_1' }];
        setLocalOptions(initialOptions);
        onFieldChange(index, 'field_options', { options: initialOptions });
      }
    }
  }, [question.field_type, localOptions.length, onFieldChange, index]);

  const moveToStep = (newStep: number) => {
    onFieldChange(index, 'step_number', newStep);
  };



  return (
    <div ref={setNodeRef} style={style} {...attributes} className="border rounded-lg bg-background transition-all duration-200 hover:shadow-md">
      <div className="p-4">
        <div className="space-y-4">
          {/* Basic Question Fields with drag handle and dropdown in same row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Question Label</Label>
              <div className="flex items-center gap-2">
                <div {...listeners} className="cursor-grab p-2 hover:bg-muted rounded transition-colors flex-shrink-0">
                  <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </div>
                <Input
                  value={question.field_label}
                  onChange={(e) => onFieldChange(index, 'field_label', e.target.value)}
                  placeholder="e.g., What is your email?"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Field Type</Label>
              <div className="flex items-center gap-2">
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
                
                {/* Question Settings Dropdown - Same row as fields */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onFieldChange(index, 'is_required', !question.is_required)}
                      className="flex items-center justify-between"
                    >
                      <span>Required</span>
                      <Switch
                        checked={question.is_required}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onFieldChange(index, 'is_enabled', !question.is_enabled)}
                      className="flex items-center justify-between"
                    >
                      <span>Enabled</span>
                      <Switch
                        checked={question.is_enabled}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs font-medium text-muted-foreground px-2 py-1">
                      Move to Step
                    </DropdownMenuItem>
                    {Array.from({ length: maxStep }, (_, i) => i + 1).map(stepNum => (
                      <DropdownMenuItem
                        key={stepNum}
                        onClick={() => moveToStep(stepNum)}
                        className={stepNum === question.step_number ? "bg-muted" : ""}
                      >
                        Step {stepNum}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onRemoveField(index)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Question
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Options for select/multiselect */}
          {(question.field_type === 'select' || question.field_type === 'multiselect') && (
            <div className="space-y-2">
              <Label>Options</Label>
              {localOptions.map((option: { label: string; value: string }, optionIndex: number) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <Input
                    value={option.value || ''}
                    onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                    placeholder="Enter option value"
                    className="flex-1"
                  />
                  {localOptions.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(optionIndex)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export function StepBranchingBuilder({ 
  questions, 
  onQuestionsChange, 
  onAddField, 
  onRemoveField, 
  onFieldChange, 
  onAddStep 
}: StepBranchingBuilderProps) {
  const [collapsedSteps, setCollapsedSteps] = React.useState<Set<number>>(new Set());
  const [draggedQuestionId, setDraggedQuestionId] = React.useState<string | null>(null);
  
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

  const handleDragStart = (event: any) => {
    setDraggedQuestionId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedQuestionId(null);

    if (!over || active.id === over.id) return;

    const draggedQuestion = questions.find(q => q.field_key === active.id);
    if (!draggedQuestion) return;

    // Check if dropping on a step container
    if (over.data.current?.type === 'step') {
      const targetStepNumber = over.data.current.stepNumber;
      const sourceStepNumber = draggedQuestion.step_number;

      if (targetStepNumber !== sourceStepNumber) {
        // Moving to a different step
        const targetStepQuestions = questions.filter(q => q.step_number === targetStepNumber);
        const newSortOrder = targetStepQuestions.length > 0 ? Math.max(...targetStepQuestions.map(q => q.sort_order)) + 1 : 0;
        
        const updatedQuestions = questions.map(q => 
          q.field_key === active.id 
            ? { ...q, step_number: targetStepNumber, sort_order: newSortOrder }
            : q
        );
        
        onQuestionsChange(updatedQuestions);
        return;
      }
    }

    // Check if dropping on another question (for reordering within the same step or between steps)
    const targetQuestion = questions.find(q => q.field_key === over.id);
    if (targetQuestion) {
      const sourceIndex = questions.findIndex(q => q.field_key === active.id);
      const targetIndex = questions.findIndex(q => q.field_key === over.id);
      
      if (draggedQuestion.step_number === targetQuestion.step_number) {
        // Reordering within the same step
        const reorderedQuestions = arrayMove(questions, sourceIndex, targetIndex);
        onQuestionsChange(reorderedQuestions);
      } else {
        // Moving to a different step by dropping on a question in that step
        const targetStepNumber = targetQuestion.step_number;
        const targetStepQuestions = questions.filter(q => q.step_number === targetStepNumber);
        const targetQuestionSortOrder = targetQuestion.sort_order;
        
        // Insert at the position of the target question
        const updatedQuestions = questions.map(q => {
          if (q.field_key === active.id) {
            return { ...q, step_number: targetStepNumber, sort_order: targetQuestionSortOrder };
          }
          // Adjust sort orders in the target step
          if (q.step_number === targetStepNumber && q.sort_order >= targetQuestionSortOrder && q.field_key !== active.id) {
            return { ...q, sort_order: q.sort_order + 1 };
          }
          return q;
        });
        
        onQuestionsChange(updatedQuestions);
      }
    }
  };

  const handleStepBranchingChange = (stepNumber: number, branchingLogic: BranchingLogic[]) => {
    const newQuestions = questions.map(question => {
      if (question.step_number === stepNumber) {
        return { ...question, branching_logic: branchingLogic };
      }
      return question;
    });
    onQuestionsChange(newQuestions);
  };

  const toggleStepCollapse = (stepNumber: number) => {
    setCollapsedSteps(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(stepNumber)) {
        newCollapsed.delete(stepNumber);
      } else {
        newCollapsed.add(stepNumber);
      }
      return newCollapsed;
    });
  };

  return (
    <div className="space-y-6">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={questions.map(q => q.field_key)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {stepNumbers.map(stepNumber => {
              const isCollapsed = collapsedSteps.has(stepNumber);
              const stepQuestions = questionsByStep.get(stepNumber) || [];
              const isCurrentStepBeingDraggedTo = !!draggedQuestionId && stepQuestions.some(q => q.field_key === draggedQuestionId);
              
              return (
                <DroppableStepContainer 
                  key={stepNumber} 
                  stepNumber={stepNumber}
                  isDropping={isCurrentStepBeingDraggedTo}
                >
                  <Card>
                    <CardHeader>
                      <StepHeader
                        stepNumber={stepNumber}
                        questions={stepQuestions}
                        availableSteps={stepNumbers.filter(s => s !== stepNumber)}
                        onAddField={onAddField}
                        onStepBranchingChange={handleStepBranchingChange}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => toggleStepCollapse(stepNumber)}
                      />
                    </CardHeader>
                    <CardContent>
                      {isCollapsed ? (
                        <StepPreview questions={stepQuestions} />
                      ) : (
                        <div className="space-y-4">
                          {stepQuestions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                              No questions in this step yet. Drag questions here or click "Add Question" above.
                            </div>
                          ) : (
                            stepQuestions.map(q => {
                              const globalIndex = questions.findIndex(gq => gq.field_key === q.field_key);
                              return (
                                <SortableQuestionItem
                                  key={q.field_key}
                                  question={q}
                                  index={globalIndex}
                                  onRemoveField={onRemoveField}
                                  onFieldChange={onFieldChange}
                                  maxStep={maxStep}
                                />
                              );
                            })
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </DroppableStepContainer>
              );
            })}
            
            <div className="text-center">
              <Button onClick={onAddStep} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New Step
              </Button>
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}