import { useEffect, useState } from 'react';
import { Users, Search, Filter, Loader2, FileText, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import AddClientModal from './AddClientModal';
import { API_BASE_URL } from '../../config/api';

type ClientItem = {
    id: string;
    referenceId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    lastActive: string;
    status: string;
    alerts: number;
};

export default function ClientsList() {
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { token } = useAuth();

    const fetchClients = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/v1/clients/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setClients(response.data);
        } catch (error) {
            console.error("Failed to load clients", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [token]);

    return (
        <div className="space-y-6 flex flex-col h-full">
            <header className="flex justify-between items-end pb-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your patients and review their clinical assessment histories.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    Register Client
                </button>
            </header>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by reference ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        <Filter className="h-4 w-4" /> Filter
                    </button>
                </div>

                {/* Table implementation */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-48 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-500">Reference ID</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">Last Assessment</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">Alerts</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {clients.filter(c => {
                                    const query = searchQuery.toLowerCase();
                                    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
                                    return c.referenceId.toLowerCase().includes(query) ||
                                        fullName.includes(query) ||
                                        (c.email && c.email.toLowerCase().includes(query));
                                }).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <Users className="h-10 w-10 text-slate-300" />
                                                <p>No clients found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    clients.filter(c => {
                                        const query = searchQuery.toLowerCase();
                                        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
                                        return c.referenceId.toLowerCase().includes(query) ||
                                            fullName.includes(query) ||
                                            (c.email && c.email.toLowerCase().includes(query));
                                    }).map(client => (
                                        <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-semibold border border-indigo-100">
                                                        {client.referenceId.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <Link to={`/clients/${client.id}`} className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                            {client.referenceId}
                                                        </Link>
                                                        {(client.firstName || client.lastName) && (
                                                            <span className="text-xs text-slate-500">{client.firstName} {client.lastName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {client.lastActive}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${client.status.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                                                    client.status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' :
                                                        'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10'
                                                    }`}>
                                                    {client.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {client.alerts > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {client.alerts} Critical
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link to={`/clients/${client.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm">
                                                    <FileText className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" /> View Profile
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <AddClientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    fetchClients();
                }}
            />
        </div>
    );
}
