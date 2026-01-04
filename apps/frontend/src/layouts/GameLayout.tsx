import React from 'react';
import { PlayerPanel } from '../components/PlayerPanel';
import { Chat } from '../components/Chat';
import { GameInfo } from '../components/GameInfo';
import { Link } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { UserMenu } from '../components/UserMenu';
import { useAuth } from '../contexts/AuthContext';

export const GameLayout: React.FC = () => {
    const chatHook = useChat();
    const { isAdmin } = useAuth();

    // Badge de contexte
    const getContextBadge = () => {
        const { context } = chatHook;

        switch (context.type) {
            case 'character-creation':
                return (
                    <div className="flex items-center gap-2 bg-blue-600 px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-medium">📝 Création</span>
                        <span className="text-xs opacity-80">• {context.step}</span>
                    </div>
                );
            case 'exploration':
                return (
                    <div className="flex items-center gap-2 bg-green-600 px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-medium">🗺️ Exploration</span>
                    </div>
                );
            case 'combat':
                return (
                    <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-medium">⚔️ Combat</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-medium">💬 Prêt</span>
                    </div>
                );
        }
    };

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex overflow-hidden">
            {/* Panel gauche - Stats du joueur */}
            <aside className="w-1/4 h-full border-r border-gray-700 flex flex-col">
                <PlayerPanel
                    key={chatHook.characterCreated}
                    refreshTrigger={chatHook.characterCreated}
                />
            </aside>

            {/* Zone principale */}
            <main className="w-3/4 h-full flex flex-col">
                {/* Header unifié */}
                <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
                    <div className="flex items-center justify-between">
                        {/* Titre + badge de contexte */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🏴‍☠️</span>
                                <h1 className="text-xl font-bold">TaleWeaver</h1>
                            </div>
                            {getContextBadge()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Bouton Dashboard - visible uniquement pour les admins */}
                            {isAdmin && (
                                <Link
                                    to="/dashboard"
                                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <span>📊</span>
                                    <span>Stats API</span>
                                </Link>
                            )}
                            <UserMenu />
                        </div>
                    </div>
                </header>

                {/* Chat principal */}
                <div className="h-[65%] border-b border-gray-700">
                    <Chat chatHook={chatHook} />
                </div>

                {/* Informations de jeu */}
                <div className="h-[35%] overflow-hidden">
                    <GameInfo
                        sessionId={chatHook.sessionId}
                        refreshTrigger={chatHook.gameInfoRefresh}
                    />
                </div>
            </main>
        </div>
    );
};
