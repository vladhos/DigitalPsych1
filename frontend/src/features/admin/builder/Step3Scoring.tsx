import React from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { AssessmentDraft, RuleDraft } from './Step1Setup';

interface StepProps {
    draft: AssessmentDraft;
    updateDraft: (updates: Partial<AssessmentDraft>) => void;
    onBack: () => void;
    onSave: () => void;
    isSaving: boolean;
}

export const Step3Scoring: React.FC<StepProps> = ({ draft, updateDraft, onBack, onSave, isSaving }) => {

    const addRule = () => {
        const newRule: RuleDraft = {
            min_score: draft.scaleMin,
            max_score: draft.scaleMax,
            flag: 'Normal',
            recommendation: ''
        };
        updateDraft({ rules: [...draft.rules, newRule] });
    };

    const updateRule = (index: number, updates: Partial<RuleDraft>) => {
        const newRules = [...draft.rules];
        newRules[index] = { ...newRules[index], ...updates };
        updateDraft({ rules: newRules });
    };

    const deleteRule = (index: number) => {
        const newRules = [...draft.rules];
        newRules.splice(index, 1);
        updateDraft({ rules: newRules });
    };

    // Validation: All rules must have valid min/max logic (min <= max) and non-empty flag name
    const isValid = draft.rules.every(r => r.min_score <= r.max_score && r.flag.trim() !== '');

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-slate-800">Scoring & Interpretations</h3>
                        <p className="text-sm text-slate-500">Define how the total score is interpreted. Set score ranges and clinical flags.</p>
                    </div>
                    <button
                        onClick={addRule}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 border border-indigo-200 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Rule
                    </button>
                </div>

                {draft.rules.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-slate-500 font-medium">No scoring rules defined.</p>
                        <p className="text-slate-400 text-sm mt-1">If no rules are added, only the raw total score will be calculated.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {draft.rules.map((rule, index) => (
                            <div key={index} className="flex gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Score Range</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={rule.min_score}
                                                onChange={(e) => updateRule(index, { min_score: Number(e.target.value) })}
                                                className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                                placeholder="Min"
                                            />
                                            <span className="text-slate-400 font-medium">-</span>
                                            <input
                                                type="number"
                                                value={rule.max_score}
                                                onChange={(e) => updateRule(index, { max_score: Number(e.target.value) })}
                                                className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Clinical Flag</label>
                                        <input
                                            type="text"
                                            value={rule.flag}
                                            onChange={(e) => updateRule(index, { flag: e.target.value })}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                            placeholder="e.g. Severe Depression"
                                        />
                                    </div>

                                    <div className="md:col-span-5">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommendation (Optional)</label>
                                        <input
                                            type="text"
                                            value={rule.recommendation}
                                            onChange={(e) => updateRule(index, { recommendation: e.target.value })}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. Consider immediate psychiatric evaluation"
                                        />
                                    </div>
                                </div>

                                <div className="shrink-0 pt-6 pr-2">
                                    <button
                                        onClick={() => deleteRule(index)}
                                        className="text-slate-400 hover:text-rose-500 p-2 rounded-md hover:bg-rose-50 transition-colors"
                                        title="Delete Rule"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 mt-8">
                <button
                    onClick={onBack}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                    disabled={isSaving}
                >
                    Back to Questions
                </button>
                <div className="flex items-center gap-4">
                    {!isValid && draft.rules.length > 0 && (
                        <span className="text-sm text-red-500 font-medium">Check ranges (Min &le; Max) and ensure all flags have names.</span>
                    )}
                    <button
                        onClick={onSave}
                        disabled={!isValid || isSaving}
                        className={`px-6 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm ${isValid && !isSaving
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-indigo-300 text-white cursor-not-allowed'
                            }`}
                    >
                        {isSaving ? (
                            <>Saving Template...</>
                        ) : (
                            <><CheckCircle className="w-4 h-4" /> Publish Template</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
