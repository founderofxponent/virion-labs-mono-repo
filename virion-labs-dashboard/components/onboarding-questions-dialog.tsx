"use client"

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { X, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { type OnboardingField } from '@/hooks/use-onboarding-fields';

export type OnboardingQuestion = Omit<OnboardingField, 'id' | 'campaign_id' | 'created_at' | 'updated_at' | 'field_key'> & {
  id?: string;
  field_key?: string;
};

interface ManageQuestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questions: OnboardingQuestion[]) => void;
  initialQuestions: OnboardingQuestion[];
  campaignId?: string;
}

export function ManageQuestionsDialog({
  isOpen,
  onClose,
  onSave,
  initialQuestions,
}: ManageQuestionsDialogProps) {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);

  useEffect(() => {
    // Deep copy to prevent modifying the original array
    setQuestions(JSON.parse(JSON.stringify(initialQuestions)));
  }, [initialQuestions]);

  const handleAddField = () => {
    const newQuestion: OnboardingQuestion = {
      field_label: '',
      field_key: `new_question_${Date.now()}`,
      field_type: 'text',
      is_required: false,
      is_enabled: true,
      sort_order: questions.length,
      field_options: [],
      validation_rules: {},
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveField = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.map((q, i) => ({ ...q, sort_order: i })));
  };

  const handleFieldChange = (index: number, field: keyof OnboardingQuestion, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

    // Update sort_order
    setQuestions(newQuestions.map((q, i) => ({ ...q, sort_order: i })));
  };

  const handleSave = () => {
    onSave(questions);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Onboarding Questions</DialogTitle>
          <DialogDescription>
            Add, edit, and reorder the questions for your campaign onboarding process.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
            {questions.map((q, index) => (
                <div key={q.id || `new-${index}`} className="p-4 border rounded-lg bg-background flex gap-4 items-start">
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
                    <div className="flex items-center space-x-4">
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

            <Button variant="outline" size="sm" onClick={handleAddField} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
            </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 