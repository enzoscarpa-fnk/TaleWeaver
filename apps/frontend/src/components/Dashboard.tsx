import React, { useState, useMemo } from 'react';
import { useUsageStats } from '../hooks/useUsageStats';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminPanel } from './AdminPanel';

export const Dashboard: React.FC = () => {
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
    const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const { start, end } = useMemo(() => {
        const endDate = new Date();
        let startDate = new Date();

        switch (dateRange) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'all':
                return { start: undefined, end: undefined };
        }

        return { start: startDate, end: endDate };
    }, [dateRange]);

    const { totalStats, modelStats, dailyStats, loading, error } = useUsageStats(start, end);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-white text-xl">Chargement des statistiques...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="bg-red-600 text-white p-6 rounded-lg">
                    Erreur: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Panneau d'Administration</h1>
                    <p className="text-sm text-gray-400">Gérez les statistiques et les utilisateurs</p>
                    {user && (
                        <p className="text-xs text-gray-500 mt-1">
                            Connecté en tant que : {user.email} ({user.role})
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <span>💬</span>
                        Chat
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Déconnexion
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-800 border-b border-gray-700 px-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                            activeTab === 'stats'
                                ? 'text-blue-400 border-blue-400'
                                : 'text-gray-400 border-transparent hover:text-gray-300'
                        }`}
                    >
                        📊 Statistiques API
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                            activeTab === 'users'
                                ? 'text-blue-400 border-blue-400'
                                : 'text-gray-400 border-transparent hover:text-gray-300'
                        }`}
                    >
                        👥 Gestion des Utilisateurs
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'users' ? (
                    <AdminPanel />
                ) : (
                    <>
                {/* Date Range Selector */}
                <div className="flex gap-2 mb-8">
                    {(['today', 'week', 'month', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                dateRange === range
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {range === 'today' && "Aujourd'hui"}
                            {range === 'week' && '7 jours'}
                            {range === 'month' && '30 jours'}
                            {range === 'all' && 'Tout'}
                        </button>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Cost */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-400 text-sm font-medium">Coût Total</h3>
                            <span className="text-2xl">💰</span>
                        </div>
                        <div className="text-3xl font-bold text-green-400">
                            ${totalStats?.totalCost.toFixed(4) || '0.0000'}
                        </div>
                    </div>

                    {/* Total Tokens */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-400 text-sm font-medium">Tokens Utilisés</h3>
                            <span className="text-2xl">🔢</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-400">
                            {totalStats?.totalTokens.toLocaleString() || '0'}
                        </div>
                    </div>

                    {/* Total Requests */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-400 text-sm font-medium">Requêtes</h3>
                            <span className="text-2xl">📊</span>
                        </div>
                        <div className="text-3xl font-bold text-purple-400">
                            {totalStats?.totalRequests || '0'}
                        </div>
                    </div>
                </div>

                {/* Cost by Model */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
                    <h2 className="text-xl font-bold mb-4">Coût par Modèle</h2>
                    <div className="space-y-4">
                        {modelStats.length > 0 ? (
                            modelStats.map((stat) => (
                                <div key={stat.model} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium">{stat.model}</div>
                                        <div className="text-sm text-gray-400">
                                            {stat._count} requêtes • {stat._sum.totalTokens.toLocaleString()} tokens
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-green-400">
                                            ${(stat._sum.totalCost || 0).toFixed(4)}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            ${((stat._sum.totalCost || 0) / stat._count).toFixed(6)} / req
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-8">
                                Aucune donnée disponible
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Stats Table */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h2 className="text-xl font-bold mb-4">Statistiques Quotidiennes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-medium">Modèle</th>
                                <th className="text-right py-3 px-4 text-gray-400 font-medium">Requêtes</th>
                                <th className="text-right py-3 px-4 text-gray-400 font-medium">Tokens</th>
                                <th className="text-right py-3 px-4 text-gray-400 font-medium">Coût</th>
                            </tr>
                            </thead>
                            <tbody>
                            {dailyStats.length > 0 ? (
                                dailyStats.map((stat) => (
                                    <tr key={stat.id} className="border-b border-gray-700 hover:bg-gray-750">
                                        <td className="py-3 px-4">
                                            {new Date(stat.date).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300">
                                            {stat.model.split('/')[1]}
                                        </td>
                                        <td className="py-3 px-4 text-right">{stat.totalRequests}</td>
                                        <td className="py-3 px-4 text-right">
                                            {stat.totalTokens.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-green-400 font-medium">
                                            ${stat.totalCost.toFixed(4)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-400 py-8">
                                        Aucune donnée disponible
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
                    </>
                )}
            </div>
        </div>
    );
};
