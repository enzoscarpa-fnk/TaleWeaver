import React, { useState, useEffect } from 'react';
import { useCharacter } from '../hooks/useCharacter';
import { characterService } from '../services/character.service';

export const PlayerPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'inventory'>('stats');
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

    // Récupère le premier personnage au chargement
    useEffect(() => {
        characterService.getAll().then(characters => {
            if (characters.length > 0) {
                setSelectedCharacterId(characters[0].id);
            }
        });
    }, []);

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
                    Stats
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
                        activeTab === 'inventory'
                            ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    Bag
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'stats' && <PlayerStats characterId={selectedCharacterId} />}
                {activeTab === 'inventory' && <PlayerInventory />}
            </div>
        </div>
    );
};

// Composant Stats connecté à la DB
const PlayerStats: React.FC<{ characterId: string | null }> = ({ characterId }) => {
    const { character, loading, error } = useCharacter(characterId || undefined);

    if (loading) {
        return (
            <div className="p-4 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Chargement...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-400">
                <p>Erreur: {error.message}</p>
            </div>
        );
    }

    if (!character) {
        return (
            <div className="p-4 text-center text-gray-400">
                <p>Aucun personnage trouvé</p>
                <p className="text-xs mt-2">Créez votre premier personnage!</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Avatar + Nom */}
            <div className="text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl">
                    {character.avatar || '🧙‍♂️'}
                </div>
                <h3 className="font-bold text-lg">{character.name}</h3>
                <p className="text-sm text-gray-400">
                    {character.class} • Niveau {character.level}
                </p>
            </div>

            {/* Stats principales */}
            <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <h4 className="font-semibold text-sm mb-2 text-gray-300">Statistiques</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">HP</span>
                        <span className="font-medium">
                            {character.health} / {character.maxHealth}
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div
                            className="bg-red-500 h-2 rounded-full transition-all"
                            style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                        />
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-400">Mana</span>
                        <span className="font-medium text-blue-400">
                            {character.mana} / {character.maxMana}
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(character.mana / character.maxMana) * 100}%` }}
                        />
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-400">XP</span>
                        <span className="font-medium text-yellow-400">{character.experience} / 100</span>
                    </div>
                </div>
            </div>

            {/* Attributs */}
            <div className="bg-gray-800 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 text-gray-300">Attributs</h4>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Force</span>
                        <span>{character.strength}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Agilité</span>
                        <span>{character.agility}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Intelligence</span>
                        <span>{character.intelligence}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Composant Inventaire (inchangé pour l'instant)
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
