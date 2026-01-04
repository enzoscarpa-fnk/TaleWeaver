import React from 'react';
import { useGameInfo } from '../hooks/useGameInfo';

interface GameInfoProps {
    sessionId: string | null;
    refreshTrigger: number;
}

export const GameInfo: React.FC<GameInfoProps> = ({ sessionId, refreshTrigger }) => {
    const { gameInfo, loading } = useGameInfo(sessionId, refreshTrigger);

    if (loading) {
        return (
            <div className="h-full bg-gray-900 overflow-y-auto p-4 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Chargement des informations...</div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-900 overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                Game Information
            </h2>

            <div className="space-y-3">
                {/* Situation actuelle */}
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="font-semibold text-sm mb-2 text-blue-400">📍 Situation</h3>
                    <p className="text-sm text-gray-300">
                        Tu te trouves actuellement à : <span className="font-bold">{gameInfo.location}</span>
                    </p>
                </div>

                {/* Objectif */}
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="font-semibold text-sm mb-2 text-yellow-400">🎯 Objectif</h3>
                    {gameInfo.activeQuest ? (
                        <div>
                            <p className="text-sm font-medium text-white mb-2">
                                {gameInfo.activeQuest.name}
                            </p>
                            <p className="text-xs text-gray-400 mb-2">
                                {gameInfo.activeQuest.description}
                            </p>
                            <ul className="space-y-1">
                                {gameInfo.activeQuest.objectives.map((obj) => (
                                    <li key={obj.id} className="flex items-start gap-2 text-xs">
                                        <span>{obj.completed ? '✅' : '⏳'}</span>
                                        <span className={obj.completed ? 'line-through text-gray-500' : 'text-gray-300'}>
                                            {obj.description}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic">
                            Aucune quête active. Explore le monde pour trouver des aventures !
                        </p>
                    )}
                </div>

                {/* Événements récents */}
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="font-semibold text-sm mb-2 text-purple-400">📝 Événements récents</h3>
                    {gameInfo.recentEvents.length > 0 ? (
                        <ul className="space-y-1.5 text-sm text-gray-300">
                            {gameInfo.recentEvents.map((event, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-gray-500 text-xs mt-0.5">
                                        {event.type === 'NARRATIVE' ? '📖' : '⚡'}
                                    </span>
                                    <span className="text-xs leading-relaxed">
                                        {event.content.length > 80
                                            ? `${event.content.substring(0, 80)}...`
                                            : event.content
                                        }
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-gray-400 italic">
                            Aucun événement récent. Ton aventure commence maintenant !
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
