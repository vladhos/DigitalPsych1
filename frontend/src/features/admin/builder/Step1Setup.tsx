import React from 'react';

export interface QuestionDraft {
    id: string;
    text: string;
    dimension: string;
    reverseScoring: boolean;
}

export interface RuleDraft {
    id: string;
    min_score: number;
    max_score: number;
    flag: string;
    recommendation: string;
}

export interface AssessmentDraft {
    template_id: string;
    title: string;
    version: string;
    description: string;
    authors: string;
    scaleMin: number;
    scaleMax: number;
    questions: QuestionDraft[];
    rules: RuleDraft[];
}

interface Step1SetupProps {
    draft: AssessmentDraft;
    updateDraft: (updates: Partial<AssessmentDraft>) => void;
    onNext: () => void;
}

export const Step1Setup: React.FC<Step1SetupProps> = ({ draft, updateDraft, onNext }) => {

    const isValid = draft.title.trim() !== '' && draft.version.trim() !== '' && draft.scaleMax > draft.scaleMin;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Basic Empathy Scale"
                            value={draft.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDraft({ title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Version *</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. 1.0"
                            value={draft.version}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDraft({ version: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Authors</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Jolliffe D. & Farrington D.P."
                            value={draft.authors}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDraft({ authors: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Identifier (Optional)</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. bes-sk"
                            value={draft.template_id}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDraft({ template_id: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                            placeholder="Brief description of the assessment..."
                            value={draft.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateDraft({ description: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Global Scale</h3>
                <p className="text-sm text-slate-500 mb-4">Define the numeric range for answers (e.g. 1 to 5 for a Likert scale).</p>
                <div className="flex items-center space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Value *</label>
                        <input
                            type="number"
                            className="w-32 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={draft.scaleMin}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDraft({ scaleMin: Number(e.target.value) })}
                        />
                    </div>
                    <div className="pt-6 text-slate-400">to</div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Value *</label>
                        <input
                            type="number"
                            className="w-32 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={draft.scaleMax}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDraft({ scaleMax: Number(e.target.value) })}
                        />
                    </div>
                </div>
                {draft.scaleMax <= draft.scaleMin && (
                    <p className="text-red-500 text-xs mt-2">Maximum value must be greater than Minimum value.</p>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!isValid}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${isValid
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    Next: Questions
                </button>
            </div>
        </div>
    );
};
