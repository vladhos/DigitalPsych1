import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { Loader2, Send, Clock, User } from 'lucide-react';

interface ClinicalNote {
    id: string;
    content: string;
    created_at: string;
    author_name: string;
}

export const ClinicalNotesTab = ({ clientId }: { clientId: string }) => {
    const { token } = useAuth();
    const [notes, setNotes] = useState<ClinicalNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchNotes = async () => {
        if (!token || !clientId) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/v1/clients/${clientId}/notes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotes(res.data);
        } catch (error) {
            console.error("Failed to fetch notes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [clientId, token]);

    const handleSaveNote = async () => {
        if (!newNote.trim() || !token) return;
        setSaving(true);
        try {
            await axios.post(`${API_BASE_URL}/api/v1/clients/${clientId}/notes`, { content: newNote }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewNote('');
            fetchNotes();
        } catch (error) {
            console.error("Failed to save note", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="font-medium text-slate-800 mb-4">New Clinical Note</h3>
                <div className="relative">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Type your session notes, observations, or treatment plan here..."
                        className="w-full min-h-[120px] p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-y"
                    />
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleSaveNote}
                            disabled={!newNote.trim() || saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:bg-indigo-300"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Save Note
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-medium text-slate-800 px-1">Note History</h3>
                {notes.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                        No clinical notes recorded yet.
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-4">
                        {notes.map(note => (
                            <div key={note.id} className="relative pl-6">
                                <span className="absolute -left-[9px] top-1 bg-white border-2 border-indigo-400 w-4 h-4 rounded-full"></span>
                                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-xs font-medium text-indigo-600">
                                            <User className="w-3 h-3" />
                                            {note.author_name}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {new Date(note.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                        {note.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
