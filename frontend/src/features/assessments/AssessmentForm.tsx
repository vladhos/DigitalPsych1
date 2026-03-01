import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type AssessmentItem = {
    id: string;
    text: string;
    type: string;
    options?: { value: number; label: string }[];
};

export default function AssessmentForm() {
    const { assignmentId } = useParams();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [assignmentDetail, setAssignmentDetail] = useState<{
        assignment_id: string;
        title: string;
        description: string;
        status: string;
        schema: { scales?: any[], items?: AssessmentItem[], questions?: AssessmentItem[], scoring_logic?: any };
    } | null>(null);

    const [answers, setAnswers] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchAssignment = async () => {
            if (!assignmentId || !token) return;
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`http://localhost:8000/api/v1/assignments/${assignmentId}`, config);
                setAssignmentDetail(res.data);

                // Ak uz to bolo vyplnene minule (status je completed)
                if (res.data.status === 'completed') {
                    setSuccess(true);
                }
            } catch (err) {
                console.error("Failed to fetch assignment", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [assignmentId, token]);

    const handleChange = (itemId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [itemId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentDetail) return;

        // Validation: Ensure all items answered
        const itemsToAnswer = Array.isArray(assignmentDetail.schema.items) ? assignmentDetail.schema.items
            : Array.isArray(assignmentDetail.schema.questions) ? assignmentDetail.schema.questions
                : [];
        const allAnswered = itemsToAnswer.every(item => answers[item.id] !== undefined);
        if (!allAnswered) {
            alert("Please answer all questions before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`http://localhost:8000/api/v1/assignments/${assignmentDetail.assignment_id}/submit`, {
                assignment_id: assignmentDetail.assignment_id,
                answers: answers
            }, config);
            setSuccess(true);
        } catch (err) {
            console.error("Failed to submit", err);
            alert("Submission failed. The assignment might already be completed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!assignmentId) {
        return <div className="p-8 text-center">Missing Assignment ID in URL.</div>;
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading assessment...</p>
            </div>
        );
    }

    if (!assignmentDetail) {
        return (
            <div className="text-center py-12 text-rose-500 font-medium">
                Failed to load the assessment. Is the backend running?
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
                <h2 className="text-2xl font-bold text-slate-900">Assessment Complete</h2>
                <p className="text-slate-600">Your responses have been successfully recorded and securely analyzed.</p>
                <div className="pt-6">
                    <Link to="/" className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-indigo-700 transition">
                        Return to Dashboard
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-indigo-600 px-8 py-6 text-white text-center">
                    <h1 className="text-2xl font-bold">{assignmentDetail.title}</h1>
                    <p className="text-indigo-100 mt-2">{assignmentDetail.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-8">
                        {(Array.isArray(assignmentDetail.schema.items) ? assignmentDetail.schema.items :
                            Array.isArray(assignmentDetail.schema.questions) ? assignmentDetail.schema.questions : []).map((item, index) => {

                                // Determine options from item directly or from global scale
                                let options = item.options;
                                if (!options && assignmentDetail.schema.scoring_logic?.scale) {
                                    const scale = assignmentDetail.schema.scoring_logic.scale;
                                    if (typeof scale === 'object' && scale.min !== undefined && scale.max !== undefined) {
                                        options = [];
                                        for (let i = scale.min; i <= scale.max; i++) {
                                            options.push({ value: i, label: String(i) });
                                        }
                                    } else if (typeof scale === 'string') {
                                        // handle "1-5" format
                                        const parts = scale.split('-');
                                        if (parts.length === 2) {
                                            const [minV, maxV] = parts.map(Number);
                                            options = [];
                                            for (let i = minV; i <= maxV; i++) {
                                                options.push({ value: i, label: String(i) });
                                            }
                                        }
                                    }
                                }

                                return (
                                    <div key={String(item.id)} className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                                        <p className="font-medium text-slate-900 mb-4 text-lg">
                                            <span className="text-indigo-500 mr-2">{index + 1}.</span>
                                            {item.text}
                                        </p>

                                        {options && (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                                {options.map((opt: { value: number, label: string }) => (
                                                    <label
                                                        key={opt.value}
                                                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[String(item.id)] === opt.value
                                                            ? 'bg-indigo-50 border-indigo-500 ring-4 ring-indigo-500/20 shadow-md'
                                                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={String(item.id)}
                                                            value={opt.value}
                                                            checked={answers[String(item.id)] === opt.value}
                                                            onChange={() => handleChange(String(item.id), opt.value)}
                                                            className="sr-only"
                                                        />
                                                        <span className={`text-xl font-semibold mb-1 ${answers[String(item.id)] === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                            {opt.value}
                                                        </span>
                                                        {(opt.label && opt.label !== String(opt.value)) && (
                                                            <span className={`text-xs text-center ${answers[String(item.id)] === opt.value ? 'text-indigo-900 font-medium' : 'text-slate-500'}`}>
                                                                {opt.label}
                                                            </span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>

                    <div className="mt-10 pt-6 border-t border-slate-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`inline-flex items-center gap-2 px-8 py-3 rounded-md font-medium text-white transition-colors ${submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Responses'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
