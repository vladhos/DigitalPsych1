import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Activity, Users, Settings, ClipboardList, LogOut } from 'lucide-react';
import PsychologistDashboard from './features/dashboard/PsychologistDashboard';
import ClientProfile from './features/dashboard/ClientProfile';
import AssessmentForm from './features/assessments/AssessmentForm';
import ClientsList from './features/dashboard/ClientsList';
import AdminSettings from './features/admin/AdminSettings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';

function Sidebar() {
    const { logout, user } = useAuth();

    return (
        <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 p-4 flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2 px-2 py-4 mb-8">
                    <Activity className="h-6 w-6 text-indigo-400" />
                    <span className="text-xl font-bold text-white tracking-tight">DigitalPsych</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <Activity className="h-4 w-4" /> Overview
                    </NavLink>
                    <NavLink to="/clients" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <Users className="h-4 w-4" /> Clients
                    </NavLink>
                    <NavLink to="/patient" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <ClipboardList className="h-4 w-4" /> Patient Portal
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                        <Settings className="h-4 w-4" /> Settings
                    </NavLink>
                </nav>
            </div>

            <div className="border-t border-slate-800 pt-4 pb-2">
                <div className="px-3 py-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {user?.email || 'User'}
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white text-left"
                >
                    <LogOut className="h-4 w-4" /> Sign out
                </button>
            </div>
        </div>
    );
}

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Protected routes wrapped in the Sidebar layout */}
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <Routes>
                                <Route path="/" element={<PsychologistDashboard />} />
                                <Route path="/clients/:clientId" element={<ClientProfile />} />
                                {/* Toto by v reale nemalo byt vnorene v sidebar pre psychológa, ale urobme to zatiaľ takto ako Admin View */}
                                <Route path="/patient/:assignmentId" element={<AssessmentForm />} />
                                <Route path="/clients" element={<ClientsList />} />
                                <Route path="/settings" element={<AdminSettings />} />
                            </Routes>
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
