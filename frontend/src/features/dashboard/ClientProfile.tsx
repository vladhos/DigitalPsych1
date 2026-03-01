import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Download, FileText, Activity, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClinicalNotesTab } from './ClinicalNotesTab';
import AssessmentDetailModal from './AssessmentDetailModal';

export default function ClientProfile() {
    const params = useParams();
    const navigate = useNavigate();
    const id = params.clientId || params.id || Object.values(params)[0]; // robust fallback
    const { token } = useAuth();
    const [client, setClient] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [latestSynthesis, setLatestSynthesis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [assignMessage, setAssignMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'tests' | 'notes'>('tests');
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedDetailAssignmentId, setSelectedDetailAssignmentId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const calculateAge = (dob: string | null) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const fetchProfileData = async () => {
        if (!token) return;
        if (!id) {
            console.error("No valid client ID found in URL parameters:", params);
            setLoading(false);
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Fetch basic client info
            const clientRes = await axios.get(`${API_BASE_URL}/api/v1/clients/${id}`, config);
            setClient(clientRes.data);

            // Fetch full assessment history
            const assignmentsRes = await axios.get(`${API_BASE_URL}/api/v1/clients/${id}/assignments`, config);
            const history = assignmentsRes.data;
            setAssignments(history);

            // Format for chart
            const formattedChartData = history
                .filter((a: any) => a.scores && Object.keys(a.scores).length > 0)
                .map((a: any) => {
                    const dateObj = new Date(a.completedAt || a.assignedAt);
                    return {
                        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        ...a.scores
                    };
                });
            setChartData(formattedChartData);

            // Find latest synthesis
            const completed = history.filter((a: any) => a.status === 'completed' && a.flags);
            if (completed.length > 0) {
                const latest = completed[completed.length - 1];
                setLatestSynthesis({
                    flags: latest.flags || {},
                    aiNarrative: latest.aiNarrative || "No AI narrative generated yet.",
                    date: new Date(latest.completedAt).toLocaleDateString()
                });
            }
        } catch (error) {
            console.error("Failed to fetch client profile", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE_URL}/api/v1/available_templates`, config);
            setAvailableTemplates(res.data);
            if (res.data.length > 0) {
                setSelectedTemplateId(res.data[0].version_id); // default select first
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [id, token]);

    const handleOpenAssignModal = () => {
        setIsAssignModalOpen(true);
        fetchTemplates();
    };

    const handleConfirmAssign = async () => {
        if (!token || !id || !selectedTemplateId) return;
        setAssigning(true);
        setAssignMessage(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post(`${API_BASE_URL}/api/v1/assignments?client_id=${id}&version_id=${selectedTemplateId}`, {}, config);

            setAssignMessage({ type: 'success', text: `Assessment assigned! ID: ${res.data.assignment_id}` });
            fetchProfileData(); // refresh history
            setIsAssignModalOpen(false);
        } catch (error) {
            console.error("Failed to assign assessment", error);
            setAssignMessage({ type: 'error', text: 'Failed to assign assessment.' });
        } finally {
            setAssigning(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!token || !id) return;
        setDeleting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_BASE_URL}/api/v1/clients/${id}`, config);
            navigate('/clients');
        } catch (error) {
            console.error("Failed to delete client", error);
            alert("Failed to delete client. Please check console.");
            setDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-full min-h-[500px] text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p>Loading profile...</p>
                <p className="text-xs text-slate-400 mt-2">Params: {JSON.stringify(params)}</p>
            </div>
        );
    }

    if (!client) {
        return <div className="p-8 text-center text-rose-500">Client not found for ID: {id || 'undefined'}</div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <Link to="/clients" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium mb-3 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Clients List
                    </Link>
                    <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
                        {client.referenceId}
                        {client.dateOfBirth && <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{calculateAge(client.dateOfBirth)} years old</span>}
                        {client.gender && <span className="text-sm font-medium text-slate-600 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">{client.gender}</span>}
                        <span className="text-sm font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">ID: {client.id.substring(0, 8)}...</span>
                    </h1>
                </div>
                <div className="flex gap-3 relative">
                    {assignMessage && (
                        <div className={`absolute -top-12 right-0 text-sm px-4 py-2 rounded-md shadow-md flex items-center gap-2 ${assignMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                            {assignMessage.text}
                            {assignMessage.type === 'success' && assignMessage.text.includes('ID:') && (
                                <Link
                                    to={`/patient/${assignMessage.text.split('ID: ')[1]}`}
                                    className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-xs transition-colors"
                                >
                                    Open Form
                                </Link>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="bg-white border border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Download className="h-4 w-4" /> Export Report
                    </button>
                    <button
                        onClick={handleOpenAssignModal}
                        className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                        Assign Assessment
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6 flex space-x-8">
                <button
                    onClick={() => setActiveTab('tests')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'tests'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    Tests & Results
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'notes'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    Clinical Notes
                </button>
            </div>

            {activeTab === 'tests' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Graph */}
                        <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                            <h2 className="font-medium text-slate-800 mb-6 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-indigo-500" />
                                Longitudinal Score Evolution
                            </h2>
                            <div className="h-72 w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                labelStyle={{ fontWeight: '600', color: '#1E293B', marginBottom: '4px' }}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

                                            {/* Automatically generate lines for whatever scores exist in the first data point */}
                                            {Object.keys(chartData[0] || {}).filter(k => k !== 'date').map((key, index) => (
                                                <Line
                                                    key={key}
                                                    type="monotone"
                                                    dataKey={key}
                                                    stroke={['#6366F1', '#10B981', '#F59E0B', '#EF4444'][index % 4]}
                                                    strokeWidth={3}
                                                    dot={{ strokeWidth: 2, r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            ))}

                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex justify-center items-center h-full text-slate-400">
                                        No assessment data available yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Latest Synthesis */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                                <h2 className="font-medium text-slate-800 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-600" />
                                    Latest Synthesis
                                </h2>
                            </div>
                            <div className="p-5 flex-1 overflow-y-auto">
                                {latestSynthesis ? (
                                    <>
                                        <div className="mb-4">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deterministic Flags</span>
                                            <div className="mt-2 space-y-2">
                                                {(latestSynthesis.flags?.hits || []).map((flagName: string) => (
                                                    <div key={flagName} className={`flex items-start gap-2 text-sm text-slate-700 px-3 py-2 rounded-md border ${(latestSynthesis.flags?.max_severity || 0) >= 3 ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                                                        <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${(latestSynthesis.flags?.max_severity || 0) >= 3 ? 'text-rose-500' : 'text-amber-500'}`} />
                                                        <span>{flagName}</span>
                                                    </div>
                                                ))}
                                                {!(latestSynthesis.flags?.hits && latestSynthesis.flags.hits.length > 0) && (
                                                    <div className="text-sm text-slate-500 italic">No significant flags detected.</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Narrative summary</span>
                                            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                                                {latestSynthesis.aiNarrative}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-center items-center h-full text-slate-400">
                                        No completed synthesis available.
                                    </div>
                                )}
                            </div>
                            {latestSynthesis && (
                                <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500 text-center bg-slate-50">
                                    Generated {latestSynthesis.date} • Mod: Deterministic + AI
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                        <h2 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-500" />
                            Assessment History
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 font-medium rounded-tl-md">Assessment</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Assigned</th>
                                        <th className="px-4 py-3 font-medium">Completed</th>
                                        <th className="px-4 py-3 font-medium text-right rounded-tr-md">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assignments.length > 0 ? assignments.map((a: any) => (
                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-800">{a.title}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{new Date(a.assignedAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                {a.status === 'completed' && (
                                                    <button
                                                        onClick={() => setSelectedDetailAssignmentId(a.id)}
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-medium text-sm transition-colors py-1 px-2 rounded-md"
                                                    >
                                                        View detail <ArrowLeft className="w-3 h-3 rotate-180" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic bg-slate-50/50 rounded-b-md">No assessments found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl">
                    <ClinicalNotesTab clientId={id as string} />
                </div>
            )}

            {/* Assign Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="font-semibold text-slate-800">Assign New Assessment</h3>
                            <p className="text-sm text-slate-500 mt-1">Select an assessment template to assign to this client.</p>
                        </div>
                        <div className="p-6">
                            {availableTemplates.length === 0 ? (
                                <div className="text-center py-4 text-slate-500 text-sm">
                                    No templates available. Please import templates in Admin Settings.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Template</label>
                                        <select
                                            value={selectedTemplateId}
                                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                                            className="w-full border border-slate-300 rounded-md py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="" disabled>Select a template...</option>
                                            {availableTemplates.map(t => (
                                                <option key={t.version_id} value={t.version_id}>
                                                    {t.name} (v{t.version_tag})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {selectedTemplateId && (
                                        <div className="bg-indigo-50 text-indigo-800 p-3 rounded-md text-sm border border-indigo-100">
                                            {availableTemplates.find(t => t.version_id === selectedTemplateId)?.description}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                disabled={assigning}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAssign}
                                disabled={assigning || !selectedTemplateId}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-md transition-colors flex items-center gap-2"
                            >
                                {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
                                Confirm Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assessment Detail Modal */}
            <AssessmentDetailModal
                assignmentId={selectedDetailAssignmentId || ''}
                isOpen={!!selectedDetailAssignmentId}
                onClose={() => setSelectedDetailAssignmentId(null)}
            />

            {/* Delete Confirmation Modal */}
            {isDeleteDialogOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
                            <Trash2 className="h-6 w-6 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Delete Client</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to delete this client? All of their assessments, history, and clinical notes will be permanently removed. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setIsDeleteDialogOpen(false)}
                                disabled={deleting}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteClient}
                                disabled={deleting}
                                className="px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-medium hover:bg-rose-700 transition-colors flex items-center gap-2"
                            >
                                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
