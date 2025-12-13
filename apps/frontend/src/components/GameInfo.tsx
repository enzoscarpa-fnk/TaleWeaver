import React from 'react';

export const GameInfo: React.FC = () => {
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
                        Vous vous trouvez à l'entrée d'un vieux donjon abandonné. L'air est frais et humide.
                    </p>
                </div>

                {/* Objectif */}
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="font-semibold text-sm mb-2 text-yellow-400">🎯 Objectif</h3>
                    <p className="text-sm text-gray-300">
                        Retrouver l'artefact ancien avant que la guilde rivale ne s'en empare.
                    </p>
                </div>

                {/* Événements récents */}
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="font-semibold text-sm mb-2 text-purple-400">📝 Événements récents</h3>
                    <ul className="space-y-1 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-gray-500">•</span>
                            <span>Rencontre avec le marchand du village</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-500">•</span>
                            <span>Obtention d'une clé rouillée</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-500">•</span>
                            <span>Mise en garde d'un mystérieux mage</span>
                        </li>
                    </ul>
                </div>

                <p className="text-xs text-gray-500 text-center">
                    Cette zone sera alimentée dynamiquement par l'IA
                </p>
            </div>
        </div>
    );
};
