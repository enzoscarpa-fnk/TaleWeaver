import React from 'react';
import { PlayerPanel } from '../components/PlayerPanel';
import { Chat } from '../components/Chat';
import { GameInfo } from '../components/GameInfo';
import { Link } from 'react-router-dom';

export const GameLayout: React.FC = () => {
    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex overflow-hidden">
            <aside className="w-1/4 h-full border-r border-gray-700 flex flex-col">
                <PlayerPanel />
            </aside>

            <main className="w-3/4 h-full flex flex-col">
                <header className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚔️</span>
                        <h1 className="text-lg font-bold">TaleWeaver</h1>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex gap-2">
                        <Link
                            to="/character/create"
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
                        >
                            <span>✨</span>
                            Nouveau Perso
                        </Link>
                        <Link
                            to="/dashboard"
                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
                        >
                            <span>📊</span>
                            Stats API
                        </Link>
                    </div>
                </header>

                <div className="h-[65%] border-b border-gray-700">
                    <Chat />
                </div>

                <div className="h-[35%] overflow-hidden">
                    <GameInfo />
                </div>
            </main>
        </div>
    );
};
