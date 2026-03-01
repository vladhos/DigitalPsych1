import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowUpRight, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

type DashboardData = {
    stats: {
        sent: number;
        completed: number;
        critical: number;
    };
    alerts: Array<{
        id: string;
        clientId: string;
        client: string;
        flag: string;
        severity: number;
        date: string;
    }>;
    recent: Array<{
        id: string;
        clientId: string;
        client: string;
        assessment: string;
        status: string;
        date: string;
    }>;
};

export default function PsychologistDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth(); // Získanie tokenu pre API call

    useEffect(() => {
        const fetchDashboard = async () => {
            if (!token) return;

            try {
                const response = await axios.get('http://localhost:8000/api/v1/dashboard/overview', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setData(response.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [token]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!data) {
        return <div className="text-rose-500">Failed to load dashboard data. Is the backend running?</div>
    }

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900">Psychologist Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Overview of clinical alerts and recent assessment activity.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Risk Alerts */}
                <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-medium text-slate-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                            Active Clinical Alerts
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                        {data.alerts.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No critical alerts detected.</div>
                        ) : (
                            data.alerts.map(alert => (
                                <div key={alert.id} className="p-5 flex items-start justify-between hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm">{alert.client}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
                                                {alert.flag}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {alert.date}
                                            </span>
                                        </div>
                                    </div>
                                    <Link to={`/clients/${alert.clientId}`} className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Review</Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
                    <h2 className="font-medium text-slate-800">Overview Stats</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end pb-3 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Assessments Sent</span>
                            <span className="text-xl font-semibold text-slate-900">{data.stats.sent}</span>
                        </div>
                        <div className="flex justify-between items-end pb-3 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Completed</span>
                            <span className="text-xl font-semibold text-slate-900">{data.stats.completed}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm text-slate-500">Critical Alerts</span>
                            <span className="text-xl font-semibold text-rose-600">{data.stats.critical}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mt-6">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-medium text-slate-800">Recent Assessments</h2>
                </div>
                <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-5 py-3 font-medium text-slate-500">Client</th>
                            <th className="px-5 py-3 font-medium text-slate-500">Assessment</th>
                            <th className="px-5 py-3 font-medium text-slate-500">Status</th>
                            <th className="px-5 py-3 font-medium text-slate-500">Date</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {data.recent.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No recent assessments available.</td>
                            </tr>
                        ) : (
                            data.recent.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 font-medium text-indigo-600">
                                        <Link to={`/clients/${row.clientId}`} className="hover:underline">{row.client}</Link>
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">{row.assessment}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${row.status.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{row.date}</td>
                                    <td className="px-5 py-3 text-right">
                                        <Link to={`/clients/${row.clientId}`} className="text-slate-400 hover:text-slate-600">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
