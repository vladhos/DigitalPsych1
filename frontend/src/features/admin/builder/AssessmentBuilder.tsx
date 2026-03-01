import React, { useState } from 'react';
import { AssessmentDraft, Step1Setup } from './Step1Setup';
import { Step2Questions } from './Step2Questions';
import { Step3Scoring } from './Step3Scoring';
import { CheckCircle, Circle, Dot } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

interface AssessmentBuilderProps {
    onSuccess: () => void;
}

const INITIAL_DRAFT: AssessmentDraft = {
    template_id: '',
    title: '',
    version: '1.0',
    description: '',
    authors: '',
    scaleMin: 1,
    scaleMax: 5,
    questions: [],
    rules: []
};

const STEPS = [
    { id: 1, name: 'Setup', description: 'Metadata & Scale' },
    { id: 2, name: 'Questions', description: 'Item Bank' },
    { id: 3, name: 'Scoring', description: 'Logic & Interpretation' }
];

export const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({ onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [draft, setDraft] = useState<AssessmentDraft>(INITIAL_DRAFT);
    const [error, setError] = useState<string | null>(null);

    const updateDraft = (updates: Partial<AssessmentDraft>) => {
        setDraft(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSave = async () => {
        setError(null);

        // Convert Draft to TemplateImportRequest schema format defined in Phase 5
        const payload = {
            template_metadata: {
                template_id: draft.template_id || undefined,
                title: draft.title,
                name: draft.title, // Send both for compatibility
                version: draft.version,
                description: draft.description,
                authors: draft.authors,
                author: draft.authors
            },
            scoring_logic: {
                scale: { min: draft.scaleMin, max: draft.scaleMax },
                reverse_items: draft.questions.filter((q) => q.reverseScoring).map((q) => q.id),
                dimensions: draft.questions.reduce((acc: Record<string, string[]>, q) => {
                    if (q.dimension) {
                        if (!acc[q.dimension]) acc[q.dimension] = [];
                        acc[q.dimension].push(q.id);
                    }
                    return acc;
                }, {} as Record<string, string[]>),
                interpretations: draft.rules.map((r) => ({
                    min_score: r.min_score,
                    max_score: r.max_score,
                    flag: r.flag,
                    recommendation: r.recommendation
                }))
            },
            questions: draft.questions.map((q) => ({
                id: q.id,
                text: q.text,
                type: 'likert'
            }))
        };

        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_BASE_URL}/api/v1/admin/templates/import`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDraft(INITIAL_DRAFT);
            setCurrentStep(1);
            onSuccess();
        } catch (err: any) {
            console.error("Failed to save template", err);
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map((d: any) => `${d.loc?.join('.')} - ${d.msg}`).join('; '));
            } else if (typeof detail === 'object' && detail !== null) {
                setError(JSON.stringify(detail));
            } else {
                setError(detail || "Failed to save template. Please check the console for details.");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Assessment Builder</h2>
                <p className="text-sm text-slate-500 mt-1">Design a new psychological assessment dynamically.</p>
            </div>

            {/* Stepper */}
            <div className="mb-8">
                <ol className="flex items-center w-full">
                    {STEPS.map((step, index) => (
                        <li key={step.id} className={`flex items-center ${index !== STEPS.length - 1 ? 'w-full' : ''}`}>
                            <div className="flex items-center">
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full lg:h-10 lg:w-10 shrink-0
                                    ${currentStep > step.id ? 'bg-indigo-100 text-indigo-600' :
                                        currentStep === step.id ? 'bg-indigo-600 text-white' :
                                            'bg-slate-100 text-slate-500'}`}
                                >
                                    {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                                </span>
                                <div className="hidden lg:block ml-3 min-w-[120px]">
                                    <h4 className={`text-sm font-semibold ${currentStep === step.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                                        {step.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">{step.description}</p>
                                </div>
                            </div>
                            {index !== STEPS.length - 1 && (
                                <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ml-4 mr-4
                                    ${currentStep > step.id ? 'border-indigo-600' : 'border-slate-200'}`}
                                ></div>
                            )}
                        </li>
                    ))}
                </ol>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm whitespace-pre-wrap">
                    {error}
                </div>
            )}

            {/* Step Content */}
            <div className="mt-8 transition-all duration-300">
                {currentStep === 1 && (
                    <Step1Setup
                        draft={draft}
                        updateDraft={updateDraft}
                        onNext={handleNext}
                    />
                )}
                {currentStep === 2 && (
                    <Step2Questions
                        draft={draft}
                        updateDraft={updateDraft}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {currentStep === 3 && (
                    <Step3Scoring
                        draft={draft}
                        updateDraft={updateDraft}
                        onBack={handleBack}
                        onSave={handleSave}
                        isSaving={false}
                    />
                )}
            </div>
        </div>
    );
};
