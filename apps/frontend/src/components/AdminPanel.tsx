import React, { useState, useEffect } from 'react';
import { adminService } from '../services/admin.service';
import { User } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

export const AdminPanel: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string, email: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${email} ?`)) {
            return;
        }

        try {
            await adminService.deleteUser(id);
            await loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const handleUpdateRole = async (id: string, currentRole: 'USER' | 'ADMIN') => {
        const newRole = currentRole === 'USER' ? 'ADMIN' : 'USER';
        
        try {
            await adminService.updateUserRole(id, newRole);
            await loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la modification du rôle');
        }
    };

    const handleResetPassword = async (id: string) => {
        if (!newPassword || newPassword.length < 6) {
            alert('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ?')) {
            return;
        }

        try {
            await adminService.resetUserPassword(id, newPassword);
            setResetPasswordUserId(null);
            setNewPassword('');
            alert('Mot de passe réinitialisé avec succès');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-white">Chargement des utilisateurs...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Gestion des Utilisateurs</h2>
                <button
                    onClick={loadUsers}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    🔄 Actualiser
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-600 text-white rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Rôle</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Date de création</th>
                            <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                            {user.email[0].toUpperCase()}
                                        </span>
                                        <span className="text-white">{user.email}</span>
                                        {user.id === currentUser?.id && (
                                            <span className="text-xs text-blue-400">(Vous)</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        user.role === 'ADMIN' 
                                            ? 'bg-purple-600 text-white' 
                                            : 'bg-gray-600 text-gray-300'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-gray-400 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleUpdateRole(user.id, user.role)}
                                            disabled={user.id === currentUser?.id}
                                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                                            title="Changer le rôle"
                                        >
                                            {user.role === 'USER' ? '👑 Promouvoir Admin' : '👤 Rétrograder User'}
                                        </button>
                                        
                                        {resetPasswordUserId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Nouveau mot de passe"
                                                    className="px-3 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    minLength={6}
                                                />
                                                <button
                                                    onClick={() => handleResetPassword(user.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResetPasswordUserId(null);
                                                        setNewPassword('');
                                                    }}
                                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setResetPasswordUserId(user.id)}
                                                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                                                    title="Réinitialiser le mot de passe"
                                                >
                                                    🔒 Réinitialiser MDP
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                                    disabled={user.id === currentUser?.id}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                                                    title="Supprimer l'utilisateur"
                                                >
                                                    🗑️ Supprimer
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    Aucun utilisateur trouvé
                </div>
            )}
        </div>
    );
};


