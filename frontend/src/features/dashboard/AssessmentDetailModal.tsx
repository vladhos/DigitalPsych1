import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Loader2, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AssessmentDetailModal({
    assignmentId,
    isOpen,
    onClose
}: {
    assignmentId: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<any>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!token || !assignmentId || !isOpen) return;
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/v1/assignments/${assignmentId}/detail`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDetail(res.data);
            } catch (error) {
                console.error("Failed to fetch assessment detail", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [assignmentId, token, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-50 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {detail?.title || "Assessment Detail"}
                            {detail?.status === 'completed' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                        </h2>
                        {detail?.completed_at && (
                            <p className="text-sm text-slate-500 mt-1">
                                Completed on {new Date(detail.completed_at).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : detail ? (
                        <div className="space-y-8">

                            {/* Top Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Scores Card */}
                                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                    <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Calculated Scores</h3>
                                    <div className="space-y-3">
                                        {Object.entries(detail.scores || {}).map(([featureName, score]: [string, any]) => (
                                            <div key={featureName} className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-slate-600">{featureName}</span>
                                                <span className="text-lg font-bold text-indigo-600">{Number(score).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Clinical Flags */}
                                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                    <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Clinical Flags & Synthesis</h3>
                                    <div className="space-y-2 mb-4">
                                        {(detail.flags?.hits || []).map((flag: string) => (
                                            <div key={flag} className={`flex items-start gap-2 text-sm px-3 py-2 rounded-md border ${(detail.flags?.max_severity || 0) >= 3 ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                                                <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${(detail.flags?.max_severity || 0) >= 3 ? 'text-rose-500' : 'text-amber-500'}`} />
                                                <span>{flag}</span>
                                            </div>
                                        ))}
                                        {!(detail.flags?.hits && detail.flags.hits.length > 0) && (
                                            <div className="text-sm text-slate-500 italic">No significant flags detected.</div>
                                        )}
                                    </div>
                                    {detail.ai_narrative && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">
                                                <BrainCircuit className="h-3 w-3" /> AI Summary
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">{detail.ai_narrative}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Item Analysis (Responses) */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-semibold text-slate-800">Item-Level Analysis</h3>
                                    <p className="text-xs text-slate-500 mt-1">Patient's raw responses to individual questions.</p>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                                    {(detail.schema?.questions || []).map((q: any) => {
                                        const answerValue = detail.answers?.[q.id];
                                        return (
                                            <div key={q.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                    {q.id}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-800 mb-2 leading-relaxed">{q.text}</p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 shadow-sm">
                                                            Score: {answerValue !== undefined ? answerValue : 'N/A'}
                                                        </span>
                                                        {q.dimension && (
                                                            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                                                                {q.dimension}
                                                            </span>
                                                        )}
                                                        {detail.schema?.scoring_logic?.reverse_items?.includes(q.id) && (
                                                            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 shadow-sm">
                                                                Reversed scoring
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-64 text-slate-500">
                            Failed to load details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
