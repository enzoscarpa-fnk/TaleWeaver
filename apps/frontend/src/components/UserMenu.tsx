import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
    const { user, logout, changePassword } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!user) {
        return null;
    }

    // Formater l'email : J..@gmail.com
    const formatEmail = (email: string): string => {
        const [localPart, domain] = email.split('@');
        if (localPart.length === 0) return email;
        const firstLetter = localPart[0].toUpperCase();
        return `${firstLetter}..@${domain}`;
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            alert('Mot de passe modifié avec succès');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {user.email[0].toUpperCase()}
                </span>
                <span>{formatEmail(user.email)}</span>
                <span className="text-gray-400">▼</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                    {showChangePassword ? (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-medium">Changer le mot de passe</h3>
                                <button
                                    onClick={() => {
                                        setShowChangePassword(false);
                                        setError('');
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleChangePassword} className="space-y-3">
                                {error && (
                                    <div className="text-red-400 text-sm">{error}</div>
                                )}
                                <input
                                    type="password"
                                    placeholder="Mot de passe actuel"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Nouveau mot de passe"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={6}
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmer le mot de passe"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
                                >
                                    {loading ? 'Changement...' : 'Changer'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowChangePassword(true)}
                                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <span>🔒</span>
                                <span>Changer le mot de passe</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <span>🚪</span>
                                <span>Déconnexion</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

