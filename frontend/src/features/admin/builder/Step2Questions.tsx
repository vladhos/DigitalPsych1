import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { AssessmentDraft, QuestionDraft } from './Step1Setup';

interface StepProps {
    draft: AssessmentDraft;
    updateDraft: (updates: Partial<AssessmentDraft>) => void;
    onNext: () => void;
    onBack: () => void;
}

export const Step2Questions: React.FC<StepProps> = ({ draft, updateDraft, onNext, onBack }) => {

    const addQuestion = () => {
        const newId = String(draft.questions.length + 1);
        const newQuestion: QuestionDraft = {
            id: newId,
            text: '',
            dimension: '',
            reverseScoring: false
        };
        updateDraft({ questions: [...draft.questions, newQuestion] });
    };

    const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
        const newQuestions = [...draft.questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        updateDraft({ questions: newQuestions });
    };

    const deleteQuestion = (index: number) => {
        const newQuestions = [...draft.questions];
        newQuestions.splice(index, 1);
        // Re-index remaining questions
        newQuestions.forEach((q, i) => { q.id = String(i + 1); });
        updateDraft({ questions: newQuestions });
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === draft.questions.length - 1) return;

        const newQuestions = [...draft.questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        const temp = newQuestions[index];
        newQuestions[index] = newQuestions[targetIndex];
        newQuestions[targetIndex] = temp;

        // Re-index
        newQuestions.forEach((q, i) => { q.id = String(i + 1); });
        updateDraft({ questions: newQuestions });
    };

    // Validácia: aspoň jedna otázka a žiadna otázka nesmie mať prázdny text
    const isValid = draft.questions.length > 0 && draft.questions.every(q => q.text.trim() !== '');

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-slate-800">Question Editor</h3>
                        <p className="text-sm text-slate-500">Add questions and assign them to dimensions (e.g., 'Extraversion', 'Depression').</p>
                    </div>
                </div>

                {draft.questions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center">
                        <p className="text-slate-500 font-medium mb-4">No questions added yet.</p>
                        <button
                            onClick={addQuestion}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-6 py-3 rounded-md text-sm font-medium flex items-center gap-2 border border-indigo-200 transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" /> Add First Question
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {draft.questions.map((q, index) => (
                            <div key={`${q.id}-${index}`} className="flex gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                                {/* Order Controls */}
                                <div className="flex flex-col gap-1 text-slate-400 pt-1 shrink-0">
                                    <button
                                        onClick={() => moveQuestion(index, 'up')}
                                        disabled={index === 0}
                                        className="hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5 rounded"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <div className="text-xs text-center font-bold text-slate-300 select-none">{q.id}</div>
                                    <button
                                        onClick={() => moveQuestion(index, 'down')}
                                        disabled={index === draft.questions.length - 1}
                                        className="hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5 rounded"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Form Fields */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-12">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Question Text</label>
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => updateQuestion(index, { text: e.target.value })}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="What is your question?"
                                        />
                                    </div>
                                    <div className="md:col-span-6">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dimension / Subscale</label>
                                        <input
                                            type="text"
                                            value={q.dimension}
                                            onChange={(e) => updateQuestion(index, { dimension: e.target.value })}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. Anxiety"
                                        />
                                    </div>
                                    <div className="md:col-span-6 flex items-end pb-1">
                                        <label className="flex items-center gap-2 cursor-pointer group/toggle">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={q.reverseScoring}
                                                    onChange={(e) => updateQuestion(index, { reverseScoring: e.target.checked })}
                                                />
                                                <div className={`block w-10 h-6 rounded-full transition-colors ${q.reverseScoring ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${q.reverseScoring ? 'transform translate-x-4' : ''}`}></div>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 select-none group-hover/toggle:text-amber-700 transition-colors">
                                                Reverse Scoring
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <div className="shrink-0 pt-6 pr-2">
                                    <button
                                        onClick={() => deleteQuestion(index)}
                                        className="text-slate-400 hover:text-rose-500 p-2 rounded-md hover:bg-rose-50 transition-colors"
                                        title="Delete Question"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {draft.questions.length > 0 && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={addQuestion}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-6 py-3 rounded-md text-sm font-medium flex items-center gap-2 border border-indigo-200 transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" /> Add Another Question
                        </button>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                <button
                    onClick={onBack}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                    Back to Setup
                </button>
                <div className="flex items-center gap-4">
                    {!isValid && draft.questions.length > 0 && (
                        <span className="text-sm text-red-500 font-medium">All questions must have text.</span>
                    )}
                    <button
                        onClick={onNext}
                        disabled={!isValid}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isValid
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Next: Scoring Logic
                    </button>
                </div>
            </div>
        </div>
    );
};
