import React, { useState } from 'react';

export const PlayerPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'inventory'>('stats');

    return (
        <div className="h-full flex flex-col bg-gray-900">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
                        activeTab === 'stats'
                            ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    👤 Stats
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
                        activeTab === 'inventory'
                            ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    🎒 Bag
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'stats' && <PlayerStats />}
                {activeTab === 'inventory' && <PlayerInventory />}
            </div>
        </div>
    );
};

// Composant Stats
const PlayerStats: React.FC = () => {
    return (
        <div className="p-4 space-y-4">
            {/* Avatar + Nom */}
            <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl">
                    🧙‍♂️
                </div>
                <h3 className="font-bold text-lg">Nom du Héros</h3>
                <p className="text-sm text-gray-400">Mage • Niveau 1</p>
            </div>

            {/* Stats principales */}
            <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <h4 className="font-semibold text-sm mb-2 text-gray-300">Statistiques</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">❤️ HP</span>
                        <span className="font-medium">20 / 20</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">⚡ Mana</span>
                        <span className="font-medium text-blue-400">15 / 15</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">⭐ XP</span>
                        <span className="font-medium text-yellow-400">0 / 100</span>
                    </div>
                </div>
            </div>

            {/* Attributs */}
            <div className="bg-gray-800 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 text-gray-300">Attributs</h4>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">💪 Force</span>
                        <span>8</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">🏃 Agilité</span>
                        <span>7</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">🧠 Intelligence</span>
                        <span>12</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">🛡️ Défense</span>
                        <span>5</span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-500 text-center">(Données temporaires)</p>
        </div>
    );
};

// Composant Inventaire
const PlayerInventory: React.FC = () => {
    return (
        <div className="p-4 space-y-4">
            {/* Grille d'objets */}
            <div>
                <h4 className="font-semibold text-sm mb-3 text-gray-300">Objets</h4>
                <div className="grid grid-cols-3 gap-2">
                    {['⚔️', '🛡️', '🧪', '📜', '💎', '🔑', '🍞', '🧊', '🔥'].map((item, idx) => (
                        <div
                            key={idx}
                            className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-2xl hover:bg-gray-700 cursor-pointer transition-colors border border-gray-700"
                            title={`Item ${idx + 1}`}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Ressources */}
            <div className="bg-gray-800 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 text-gray-300">Ressources</h4>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">💰 Or</span>
                        <span className="text-yellow-400 font-bold">50</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">💎 Gemmes</span>
                        <span className="text-purple-400 font-bold">3</span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-500 text-center">(Inventaire temporaire)</p>
        </div>
    );
};
